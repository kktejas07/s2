"""The provider register.

Mirrors the shape of modules/equipment deliberately: both answer "may this be
relied on right now", both compute that from a date rather than storing a
flag, and both refuse the work rather than warning about it. An inspector who
gets a warning proceeds; an inspector who gets a refusal asks.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import HTTPException

from core import audit
from core.audit import AuditAction
from core.sequences import next_identifier
from modules.providers.models import (
    TRACEABILITY_CRITICAL,
    USABLE_STATUSES,
    Accreditation,
    EvaluationOutcome,
    EvaluationRecord,
    ExternalProvider,
    PerformanceRecord,
    ProviderCategory,
    ProviderStatus,
    SubcontractConsent,
)

#: How long an approval stands before it has to be revisited. Not a legal
#: number - it is the interval at which "we approved them once" stops being
#: evidence of monitoring.
DEFAULT_REVIEW_MONTHS = 12

VALID_OUTCOMES = {o.value for o in EvaluationOutcome}


def approval_state(p: ExternalProvider, at: Optional[datetime] = None) -> dict:
    """Derived, never stored. Same reasoning as equipment calibration."""
    now = at or datetime.now()
    due = p.next_review_on
    if p.status == ProviderStatus.PENDING_EVALUATION:
        return {"current": False, "reason": "never evaluated",
                "days_remaining": None, "review_due_on": None}
    if due is None:
        return {"current": False, "reason": "no review date set",
                "days_remaining": None, "review_due_on": None}
    days = (due - now).days
    return {
        "current": due >= now,
        "reason": None if due >= now else f"approval review overdue since {due:%Y-%m-%d}",
        "days_remaining": days,
        "review_due_on": due,
    }


def accreditation_state(p: ExternalProvider, at: Optional[datetime] = None) -> dict:
    """The provider's own accreditation, which is a separate question from
    whether IQE approves them.

    For a calibration or testing laboratory this is the traceability chain
    behind every measurement IQE certifies. A lapse there is not the
    provider's paperwork problem; it reaches back into results already issued.
    """
    now = at or datetime.now()
    critical = p.category in TRACEABILITY_CRITICAL
    acc = p.accreditation
    if acc is None:
        return {
            "held": False,
            "valid": not critical,
            "critical": critical,
            "reason": (
                "no accreditation on record, and this provider's output feeds "
                "a measurement IQE certifies"
                if critical else "no accreditation on record"
            ),
            "valid_until": None,
            "days_remaining": None,
        }
    if acc.valid_until is None:
        return {"held": True, "valid": not critical, "critical": critical,
                "reason": "accreditation has no expiry on record",
                "valid_until": None, "days_remaining": None}
    days = (acc.valid_until - now).days
    valid = acc.valid_until >= now
    return {
        "held": True,
        "valid": valid,
        "critical": critical,
        "reason": None if valid else f"accreditation lapsed on {acc.valid_until:%Y-%m-%d}",
        "valid_until": acc.valid_until,
        "days_remaining": days,
    }


def is_usable(
    p: ExternalProvider, service: Optional[str] = None, at: Optional[datetime] = None
) -> tuple[bool, Optional[str]]:
    """Whether this provider may be relied on for work right now."""
    if not p.is_active:
        return False, "provider is not active"
    if p.status not in USABLE_STATUSES:
        return False, f"provider is {p.status.replace('_', ' ').lower()}"

    approval = approval_state(p, at)
    if not approval["current"]:
        return False, approval["reason"]

    acc = accreditation_state(p, at)
    if acc["critical"] and not acc["valid"]:
        return False, acc["reason"]

    if service and p.approved_services and service not in p.approved_services:
        approved = ", ".join(p.approved_services)
        return False, (
            f"{p.name} is approved for {approved}, not {service}"
        )
    return True, None


class ProviderService:
    # ------------------------------------------------------------- reading

    @staticmethod
    async def list(
        site_id: str = "SITE-01",
        category: str = "",
        status: str = "",
        usable_only: bool = False,
    ) -> dict:
        query: dict[str, Any] = {"site_id": site_id}
        if category:
            query["category"] = category
        if status:
            query["status"] = status
        items = await ExternalProvider.find(query).to_list()
        rows = []
        for p in items:
            usable, reason = is_usable(p)
            if usable_only and not usable:
                continue
            rows.append({
                **p.model_dump(exclude={"id"}),
                "approval": approval_state(p),
                "accreditation_state": accreditation_state(p),
                "usable": usable,
                "blocked_because": reason,
            })
        return {"total": len(rows), "data": rows}

    @staticmethod
    async def get(provider_id: str, site_id: str = "SITE-01") -> ExternalProvider:
        p = await ExternalProvider.find_one(
            ExternalProvider.provider_id == provider_id,
            ExternalProvider.site_id == site_id,
        )
        if not p:
            raise HTTPException(404, f"Provider {provider_id} not found")
        return p

    @staticmethod
    async def detail(provider_id: str, site_id: str = "SITE-01") -> dict:
        p = await ProviderService.get(provider_id, site_id)
        evaluations = (
            await EvaluationRecord.find(
                EvaluationRecord.provider_id == provider_id,
                EvaluationRecord.site_id == site_id,
            ).sort(-EvaluationRecord.sequence).to_list()
        )
        performance = (
            await PerformanceRecord.find(
                PerformanceRecord.provider_id == provider_id,
                PerformanceRecord.site_id == site_id,
            ).sort(-PerformanceRecord.observed_on).to_list()
        )
        usable, reason = is_usable(p)
        return {
            "provider": p.model_dump(exclude={"id"}),
            "approval": approval_state(p),
            "accreditation_state": accreditation_state(p),
            "usable": usable,
            "blocked_because": reason,
            "evaluations": [e.model_dump(exclude={"id"}) for e in evaluations],
            "performance": [r.model_dump(exclude={"id"}) for r in performance],
        }

    @staticmethod
    async def due_for_review(site_id: str = "SITE-01", horizon_days: int = 60) -> dict:
        """The two different problems a technical manager has: what is already
        unusable, and what becomes unusable soon."""
        items = await ExternalProvider.find(
            ExternalProvider.site_id == site_id,
            ExternalProvider.is_active == True,  # noqa: E712
        ).to_list()
        now = datetime.now()
        overdue, soon, never, lapsed_accreditation = [], [], [], []
        for p in items:
            if p.status == ProviderStatus.REMOVED:
                continue
            row = {"provider_id": p.provider_id, "name": p.name,
                   "category": p.category, "status": p.status}
            state = approval_state(p, now)
            if p.status == ProviderStatus.PENDING_EVALUATION:
                never.append({**row, **state})
            elif not state["current"]:
                overdue.append({**row, **state})
            elif (state["days_remaining"] or 999) <= horizon_days:
                soon.append({**row, **state})

            acc = accreditation_state(p, now)
            if acc["critical"] and not acc["valid"]:
                lapsed_accreditation.append({**row, **acc})

        return {
            "overdue_review": overdue,
            "due_within_horizon": soon,
            "never_evaluated": never,
            "lapsed_accreditation": lapsed_accreditation,
            "horizon_days": horizon_days,
        }

    # ------------------------------------------------------------- writing

    @staticmethod
    async def register(data: dict, site_id: str, user_id: str) -> dict:
        data = dict(data)
        name = (data.get("name") or "").strip()
        if not name:
            raise HTTPException(400, "A provider needs a name")
        category = data.get("category") or ProviderCategory.OTHER.value
        if category not in {c.value for c in ProviderCategory}:
            raise HTTPException(400, f"Unknown category '{category}'")

        acc = data.get("accreditation")
        p = ExternalProvider(
            provider_id=await next_identifier(
                ExternalProvider, "provider_id", site_id, "PRV"
            ),
            site_id=site_id,
            name=name,
            category=category,
            contact_person=data.get("contact_person"),
            email=data.get("email"),
            phone=data.get("phone"),
            address=data.get("address"),
            accreditation=Accreditation(**acc) if acc else None,
            associate_id=data.get("associate_id"),
            # Registering is not approving. A provider enters the register
            # unusable and stays that way until someone evaluates them.
            status=ProviderStatus.PENDING_EVALUATION.value,
            created_by=user_id,
        )
        await p.insert()
        await audit.record(
            "provider", p.provider_id, AuditAction.CREATE,
            actor={"user_id": user_id}, site_id=site_id,
            note=f"{name} added to the register, pending evaluation",
            context={"category": category},
        )
        return p.model_dump(exclude={"id"})

    @staticmethod
    async def evaluate(
        provider_id: str, payload: dict, site_id: str, user_id: str
    ) -> dict:
        """Record an evaluation and move the provider's standing with it."""
        p = await ProviderService.get(provider_id, site_id)

        outcome = payload.get("outcome") or EvaluationOutcome.APPROVED.value
        if outcome not in VALID_OUTCOMES:
            raise HTTPException(
                400, f"outcome must be one of: {', '.join(sorted(VALID_OUTCOMES))}"
            )
        rationale = (payload.get("rationale") or "").strip()
        if not rationale:
            raise HTTPException(
                400,
                "An evaluation needs its reasoning. An outcome on its own is a "
                "signature, not an assessment.",
            )
        conditions = (payload.get("conditions") or "").strip() or None
        if outcome == EvaluationOutcome.APPROVED_WITH_CONDITIONS and not conditions:
            raise HTTPException(
                400, "Approving with conditions means saying what the conditions are."
            )

        services = list(payload.get("approved_services") or [])
        if outcome != EvaluationOutcome.REJECTED and not services:
            raise HTTPException(
                400,
                "Say what this provider is approved for. An unscoped approval "
                "approves everything, which is never what was meant.",
            )

        months = int(payload.get("review_months") or DEFAULT_REVIEW_MONTHS)
        next_review = payload.get("next_review_on") or (
            datetime.now() + timedelta(days=months * 30)
        )

        prior = await EvaluationRecord.find(
            EvaluationRecord.provider_id == provider_id,
            EvaluationRecord.site_id == site_id,
        ).count()

        record = EvaluationRecord(
            evaluation_id=await next_identifier(
                EvaluationRecord, "evaluation_id", site_id, "PEV"
            ),
            provider_id=provider_id,
            site_id=site_id,
            sequence=prior + 1,
            evaluated_by=user_id,
            criteria_assessed=list(payload.get("criteria_assessed") or []),
            outcome=outcome,
            conditions=conditions,
            rationale=rationale,
            approved_services=services,
            next_review_on=next_review if outcome != EvaluationOutcome.REJECTED else None,
        )
        await record.insert()

        before = p.status
        if outcome == EvaluationOutcome.REJECTED:
            p.status = ProviderStatus.SUSPENDED.value
            p.status_reason = rationale
            p.next_review_on = None
            p.approved_services = []
        else:
            p.status = (
                ProviderStatus.CONDITIONAL.value
                if outcome == EvaluationOutcome.APPROVED_WITH_CONDITIONS
                else ProviderStatus.APPROVED.value
            )
            p.status_reason = None
            p.approved_on = datetime.now()
            p.next_review_on = next_review
            p.approved_services = services
            p.conditions = conditions
        p.updated_at = datetime.now()
        await p.save()

        await audit.record(
            "provider", provider_id, AuditAction.AUTHORIZE,
            actor={"user_id": user_id}, site_id=site_id, note=rationale,
            changes=[{"field": "status", "before": before, "after": p.status}],
            context={
                "evaluation_id": record.evaluation_id,
                "outcome": outcome,
                "approved_services": services,
            },
        )
        return record.model_dump(exclude={"id"})

    @staticmethod
    async def record_performance(
        provider_id: str, payload: dict, site_id: str, user_id: str
    ) -> dict:
        """Monitoring between evaluations."""
        await ProviderService.get(provider_id, site_id)
        note = (payload.get("note") or "").strip()
        if not note:
            raise HTTPException(400, "Say what was observed")
        rating = int(payload.get("rating") or 0)
        if not -2 <= rating <= 2:
            raise HTTPException(400, "rating runs from -2 to +2")

        record = PerformanceRecord(
            record_id=await next_identifier(
                PerformanceRecord, "record_id", site_id, "PMR"
            ),
            provider_id=provider_id,
            site_id=site_id,
            observed_by=user_id,
            job_id=payload.get("job_id"),
            work_package_id=payload.get("work_package_id"),
            rating=rating,
            note=note,
            triggers_review=bool(payload.get("triggers_review")),
        )
        await record.insert()

        if record.triggers_review:
            # Bring the review forward rather than merely flagging it: an
            # observation serious enough to trigger a review should not wait
            # for someone to notice a flag.
            p = await ProviderService.get(provider_id, site_id)
            p.next_review_on = datetime.now()
            p.updated_at = datetime.now()
            await p.save()

        await audit.record(
            "provider", provider_id, AuditAction.UPDATE,
            actor={"user_id": user_id}, site_id=site_id, note=note,
            context={"rating": rating, "triggers_review": record.triggers_review,
                     "job_id": record.job_id},
        )
        return record.model_dump(exclude={"id"})

    @staticmethod
    async def set_status(
        provider_id: str, status: str, reason: str, site_id: str, user_id: str
    ) -> dict:
        """Suspend, restore or remove. Never delete - a removed provider's
        past work still has to be explicable."""
        if status not in {s.value for s in ProviderStatus}:
            raise HTTPException(400, f"Unknown status '{status}'")
        if not (reason or "").strip():
            raise HTTPException(400, "Changing a provider's standing needs a reason")

        p = await ProviderService.get(provider_id, site_id)
        before = p.status
        p.status = status
        p.status_reason = reason
        p.updated_at = datetime.now()
        await p.save()

        affected = await ProviderService._work_since(provider_id, site_id)
        await audit.record(
            "provider", provider_id, AuditAction.STATUS_CHANGE,
            actor={"user_id": user_id}, site_id=site_id, note=reason,
            changes=[{"field": "status", "before": before, "after": status}],
            context={"affected_jobs": affected},
        )
        return {
            **p.model_dump(exclude={"id"}),
            # Same reasoning as quarantining an instrument: the question that
            # follows a suspension is always "what does this touch".
            "affected_jobs": affected,
        }

    @staticmethod
    async def _work_since(provider_id: str, site_id: str) -> list[str]:
        """Jobs this provider has been consented onto, newest first."""
        consents = await SubcontractConsent.find(
            SubcontractConsent.provider_id == provider_id,
            SubcontractConsent.site_id == site_id,
        ).to_list()
        return sorted({c.job_id for c in consents})

    # -------------------------------------------------------- consent

    @staticmethod
    async def record_consent(
        payload: dict, site_id: str, user_id: str
    ) -> dict:
        """The client's agreement to subcontracted inspection on a job."""
        job_id = (payload.get("job_id") or "").strip()
        provider_id = (payload.get("provider_id") or "").strip()
        granted_by = (payload.get("granted_by") or "").strip()
        if not (job_id and provider_id and granted_by):
            raise HTTPException(
                400, "job_id, provider_id and granted_by are all required"
            )
        await ProviderService.get(provider_id, site_id)

        consent = SubcontractConsent(
            consent_id=await next_identifier(
                SubcontractConsent, "consent_id", site_id, "PSC"
            ),
            site_id=site_id,
            job_id=job_id,
            provider_id=provider_id,
            granted=bool(payload.get("granted", True)),
            granted_by=granted_by,
            scope=payload.get("scope"),
            reference=payload.get("reference"),
            recorded_by=user_id,
        )
        await consent.insert()
        await audit.record(
            "job", job_id, AuditAction.AUTHORIZE,
            actor={"user_id": user_id}, site_id=site_id,
            note=f"Client consented to subcontracting to {provider_id}",
            context={"provider_id": provider_id, "granted_by": granted_by,
                     "reference": consent.reference},
        )
        return consent.model_dump(exclude={"id"})

    @staticmethod
    async def check_may_subcontract(
        job_id: str, provider_id: str, site_id: str = "SITE-01",
        service: Optional[str] = None,
    ) -> dict:
        """Both questions at once: is the provider usable, and did the client
        agree to this one on this job.

        Returned rather than raised so a screen can show why before someone
        commits to the work; the caller that actually records subcontracted
        work raises on it.
        """
        p = await ProviderService.get(provider_id, site_id)
        usable, reason = is_usable(p, service=service)

        consents = await SubcontractConsent.find(
            SubcontractConsent.job_id == job_id,
            SubcontractConsent.provider_id == provider_id,
            SubcontractConsent.site_id == site_id,
        ).to_list()
        live = [c for c in consents if c.granted and c.withdrawn_on is None]

        blockers = []
        if not usable:
            blockers.append(reason)
        if not live:
            blockers.append(
                f"the client has not agreed to subcontracting to {p.name} on {job_id}"
            )
        return {
            "may_subcontract": not blockers,
            "provider_usable": usable,
            "has_consent": bool(live),
            "blockers": blockers,
            "provider": {"provider_id": p.provider_id, "name": p.name,
                         "status": p.status, "category": p.category},
        }
