"""Risk and opportunity register, and the audit plan that falls out of it.

The two 2026 changes - risk management replacing preventive action, and
risk-based auditing - are really one change, so they live in one service.
`propose_audit_plan` reads the register and says what to audit next. If the
register is neglected the plan degrades visibly, which is the point: a
register nobody maintains should produce an obviously useless plan rather than
a plausible one.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import HTTPException

from core import audit as trail
from core.audit import AuditAction
from core.sequences import next_identifier
from modules.risk.models import (
    IMPARTIALITY_TOLERANCE,
    MATERIAL_THRESHOLD,
    AuditStatus,
    Control,
    InternalAudit,
    Risk,
    RiskCategory,
    RiskReview,
    RiskStatus,
    Treatment,
)

DEFAULT_REVIEW_DAYS = 180
#: A material risk not looked at within this long is stale regardless of its
#: nominal review date.
STALE_AFTER_DAYS = 365

VALID_CATEGORIES = {c.value for c in RiskCategory}
VALID_TREATMENTS = {t.value for t in Treatment}


def score(likelihood: int, impact: int) -> int:
    return int(likelihood) * int(impact)


def review_state(r: Risk, at: Optional[datetime] = None) -> dict:
    """Computed, never stored - the same rule as equipment and providers."""
    now = at or datetime.now()
    due = r.next_review_on
    if due is None:
        return {"current": False, "reason": "no review date set",
                "days_remaining": None, "review_due_on": None}
    days = (due - now).days
    return {
        "current": due >= now,
        "reason": None if due >= now else f"review overdue since {due:%Y-%m-%d}",
        "days_remaining": days,
        "review_due_on": due,
    }


def _summarise(r: Risk, at: Optional[datetime] = None) -> dict:
    inherent = score(r.inherent_likelihood, r.inherent_impact)
    residual = score(r.residual_likelihood, r.residual_impact)
    return {
        **r.model_dump(exclude={"id"}),
        "inherent_score": inherent,
        "residual_score": residual,
        "material": residual >= MATERIAL_THRESHOLD,
        "review": review_state(r, at),
    }


class RiskService:
    # ------------------------------------------------------------- reading

    @staticmethod
    async def list(
        site_id: str = "SITE-01",
        category: str = "",
        status: str = "",
        material_only: bool = False,
    ) -> dict:
        query: dict[str, Any] = {"site_id": site_id}
        if category:
            query["category"] = category
        if status:
            query["status"] = status
        items = await Risk.find(query).to_list()
        rows = [_summarise(r) for r in items]
        if material_only:
            rows = [r for r in rows if r["material"]]
        rows.sort(key=lambda r: -r["residual_score"])
        return {"total": len(rows), "data": rows}

    @staticmethod
    async def get(risk_id: str, site_id: str = "SITE-01") -> Risk:
        r = await Risk.find_one(Risk.risk_id == risk_id, Risk.site_id == site_id)
        if not r:
            raise HTTPException(404, f"Risk {risk_id} not found")
        return r

    @staticmethod
    async def detail(risk_id: str, site_id: str = "SITE-01") -> dict:
        r = await RiskService.get(risk_id, site_id)
        reviews = (
            await RiskReview.find(
                RiskReview.risk_id == risk_id, RiskReview.site_id == site_id
            ).sort(-RiskReview.sequence).to_list()
        )
        audits = await InternalAudit.find(
            InternalAudit.site_id == site_id
        ).to_list()
        touching = [
            a.model_dump(exclude={"id"})
            for a in audits
            if risk_id in a.risks_covered
        ]
        return {
            "risk": _summarise(r),
            "reviews": [v.model_dump(exclude={"id"}) for v in reviews],
            "audits": touching,
        }

    # ------------------------------------------------------------- writing

    @staticmethod
    def _validate(payload: dict, category: str, treatment: str) -> None:
        if category not in VALID_CATEGORIES:
            raise HTTPException(400, f"Unknown category '{category}'")
        if treatment not in VALID_TREATMENTS:
            raise HTTPException(400, f"Unknown treatment '{treatment}'")
        for field in ("inherent_likelihood", "inherent_impact",
                      "residual_likelihood", "residual_impact"):
            v = payload.get(field)
            if v is not None and not 1 <= int(v) <= 5:
                raise HTTPException(400, f"{field} runs from 1 to 5")

    @staticmethod
    def _check_treatment(
        category: str, treatment: str, residual: int, inherent: int,
        rationale: Optional[str],
    ) -> None:
        """The rules that make the register mean something."""
        if residual > inherent:
            raise HTTPException(
                400,
                f"Residual score ({residual}) is above the inherent score "
                f"({inherent}). Controls that leave a risk worse than they "
                f"found it are not a treatment - record what the controls "
                f"actually achieve.",
            )
        if category == RiskCategory.IMPARTIALITY and treatment == Treatment.ACCEPT:
            if residual >= IMPARTIALITY_TOLERANCE:
                raise HTTPException(
                    409,
                    f"An impartiality risk scoring {residual} cannot be "
                    f"accepted. ISO/IEC 17020 requires threats to "
                    f"impartiality to be eliminated or minimised; where they "
                    f"cannot be brought within tolerance, the inspection is "
                    f"not performed. Reduce it, transfer it, or avoid the "
                    f"work.",
                )
        if treatment == Treatment.ACCEPT and residual >= MATERIAL_THRESHOLD:
            if not (rationale or "").strip():
                raise HTTPException(
                    400,
                    f"Accepting a risk scoring {residual} needs a rationale "
                    f"and a named acceptor. Without them nobody owns the "
                    f"decision when it matures.",
                )

    @staticmethod
    async def create(data: dict, site_id: str, user_id: str) -> dict:
        data = dict(data)
        title = (data.get("title") or "").strip()
        description = (data.get("description") or "").strip()
        owner = (data.get("owner") or "").strip()
        if not (title and description):
            raise HTTPException(400, "A risk needs a title and a description")
        if not owner:
            raise HTTPException(
                400, "A risk needs an owner. One with no owner is nobody's."
            )

        category = data.get("category") or RiskCategory.OPERATIONAL.value
        treatment = data.get("treatment") or Treatment.MITIGATE.value
        RiskService._validate(data, category, treatment)

        il = int(data.get("inherent_likelihood") or 3)
        ii = int(data.get("inherent_impact") or 3)
        rl = int(data.get("residual_likelihood") or il)
        ri = int(data.get("residual_impact") or ii)
        RiskService._check_treatment(
            category, treatment, score(rl, ri), score(il, ii),
            data.get("acceptance_rationale"),
        )

        r = Risk(
            risk_id=await next_identifier(Risk, "risk_id", site_id, "RSK"),
            site_id=site_id,
            title=title,
            description=description,
            category=category,
            source=data.get("source"),
            inherent_likelihood=il,
            inherent_impact=ii,
            treatment=treatment,
            controls=[Control(**c) for c in (data.get("controls") or [])],
            residual_likelihood=rl,
            residual_impact=ri,
            owner=owner,
            status=(
                RiskStatus.ACCEPTED.value
                if treatment == Treatment.ACCEPT
                else RiskStatus.OPEN.value
            ),
            acceptance_rationale=data.get("acceptance_rationale"),
            accepted_by=user_id if treatment == Treatment.ACCEPT else None,
            next_review_on=data.get("next_review_on")
            or datetime.now() + timedelta(days=DEFAULT_REVIEW_DAYS),
            related_entity_type=data.get("related_entity_type"),
            related_entity_id=data.get("related_entity_id"),
            created_by=user_id,
        )
        await r.insert()
        await trail.record(
            "risk", r.risk_id, AuditAction.CREATE,
            actor={"user_id": user_id}, site_id=site_id, note=title,
            context={"category": category, "treatment": treatment,
                     "inherent_score": score(il, ii),
                     "residual_score": score(rl, ri), "owner": owner},
        )
        return _summarise(r)

    @staticmethod
    async def review(risk_id: str, payload: dict, site_id: str, user_id: str) -> dict:
        """Record a review, which is the only way the assessment moves."""
        r = await RiskService.get(risk_id, site_id)
        note = (payload.get("note") or "").strip()
        if not note:
            raise HTTPException(
                400, "A review needs its reasoning. One that records none is a date."
            )

        rl = int(payload.get("residual_likelihood") or r.residual_likelihood)
        ri = int(payload.get("residual_impact") or r.residual_impact)
        for v, name in ((rl, "residual_likelihood"), (ri, "residual_impact")):
            if not 1 <= v <= 5:
                raise HTTPException(400, f"{name} runs from 1 to 5")

        treatment = payload.get("treatment") or r.treatment
        if treatment not in VALID_TREATMENTS:
            raise HTTPException(400, f"Unknown treatment '{treatment}'")
        rationale = payload.get("acceptance_rationale") or r.acceptance_rationale
        RiskService._check_treatment(
            r.category, treatment, score(rl, ri),
            score(r.inherent_likelihood, r.inherent_impact), rationale,
        )

        status = payload.get("status") or r.status
        if status not in {s.value for s in RiskStatus}:
            raise HTTPException(400, f"Unknown status '{status}'")

        prior = await RiskReview.find(
            RiskReview.risk_id == risk_id, RiskReview.site_id == site_id
        ).count()
        next_review = payload.get("next_review_on") or (
            datetime.now() + timedelta(days=DEFAULT_REVIEW_DAYS)
        )

        record = RiskReview(
            review_id=await next_identifier(RiskReview, "review_id", site_id, "RVW"),
            risk_id=risk_id,
            site_id=site_id,
            sequence=prior + 1,
            reviewed_by=user_id,
            note=note,
            residual_likelihood=rl,
            residual_impact=ri,
            status_after=status,
            next_review_on=next_review,
        )
        await record.insert()

        before = score(r.residual_likelihood, r.residual_impact)
        r.residual_likelihood = rl
        r.residual_impact = ri
        r.treatment = treatment
        r.status = status
        r.acceptance_rationale = rationale
        if treatment == Treatment.ACCEPT:
            r.accepted_by = user_id
        if payload.get("controls"):
            r.controls = [Control(**c) for c in payload["controls"]]
        r.next_review_on = next_review
        r.updated_at = datetime.now()
        await r.save()

        await trail.record(
            "risk", risk_id, AuditAction.UPDATE,
            actor={"user_id": user_id}, site_id=site_id, note=note,
            changes=[{"field": "residual_score",
                      "before": str(before), "after": str(score(rl, ri))}],
            context={"review_id": record.review_id, "treatment": treatment,
                     "status": status},
        )
        return _summarise(r)

    @staticmethod
    async def overdue(site_id: str = "SITE-01") -> dict:
        """What the register itself is failing at."""
        items = await Risk.find(
            Risk.site_id == site_id, Risk.is_active == True  # noqa: E712
        ).to_list()
        now = datetime.now()
        overdue, never_audited, stale_material = [], [], []
        for r in items:
            if r.status == RiskStatus.CLOSED:
                continue
            row = _summarise(r, now)
            if not row["review"]["current"]:
                overdue.append(row)
            if row["material"]:
                if r.last_audited_on is None:
                    never_audited.append(row)
                elif (now - r.last_audited_on).days > STALE_AFTER_DAYS:
                    stale_material.append(row)
        return {
            "overdue_review": sorted(overdue, key=lambda r: -r["residual_score"]),
            "material_never_audited": never_audited,
            "material_not_audited_recently": stale_material,
        }


class AuditPlanService:
    """Risk-based internal auditing."""

    @staticmethod
    async def propose_plan(site_id: str = "SITE-01", slots: int = 4) -> dict:
        """What to audit next, and why.

        Ranked by residual score first and then by how long since the area was
        last audited, so a high risk audited last month does not crowd out a
        moderate one nobody has looked at in two years.
        """
        risks = await Risk.find(
            Risk.site_id == site_id, Risk.is_active == True  # noqa: E712
        ).to_list()
        live = [r for r in risks if r.status != RiskStatus.CLOSED]
        if not live:
            return {
                "proposed": [],
                "note": (
                    "The register is empty, so there is nothing to base an "
                    "audit plan on. A plan built without one is a tour of the "
                    "quality manual."
                ),
            }

        now = datetime.now()

        def staleness(r: Risk) -> int:
            if r.last_audited_on is None:
                return 10_000          # never audited outranks everything
            return (now - r.last_audited_on).days

        by_category: dict[str, list[Risk]] = {}
        for r in live:
            by_category.setdefault(r.category, []).append(r)

        ranked = []
        for category, rs in by_category.items():
            top = max(score(r.residual_likelihood, r.residual_impact) for r in rs)
            oldest = max(staleness(r) for r in rs)
            material = [r for r in rs
                        if score(r.residual_likelihood, r.residual_impact)
                        >= MATERIAL_THRESHOLD]
            ranked.append({
                "category": category,
                "highest_residual_score": top,
                "days_since_audited": None if oldest == 10_000 else oldest,
                "never_audited": oldest == 10_000,
                "risk_count": len(rs),
                "material_risk_count": len(material),
                "risks": [r.risk_id for r in sorted(
                    rs,
                    key=lambda x: -score(x.residual_likelihood, x.residual_impact),
                )],
                "why": (
                    f"{len(material)} material risk"
                    f"{'' if len(material) == 1 else 's'}, highest scoring {top}"
                    + (", never audited" if oldest == 10_000
                       else f", last audited {oldest} days ago")
                ),
            })

        ranked.sort(
            key=lambda r: (-r["highest_residual_score"],
                           -(r["days_since_audited"] or 10_000))
        )
        return {
            "proposed": ranked[:slots],
            "deferred": ranked[slots:],
            "note": (
                "Ranked by residual score, then by time since the area was "
                "last audited - so a high risk audited last month does not "
                "crowd out a moderate one nobody has looked at in two years."
            ),
        }

    @staticmethod
    async def plan_audit(payload: dict, site_id: str, user_id: str) -> dict:
        """Plan one audit, refusing an auditor who would be auditing their
        own work."""
        title = (payload.get("title") or "").strip()
        auditor = (payload.get("auditor") or "").strip()
        if not (title and auditor):
            raise HTTPException(400, "An audit needs a title and an auditor")

        risks_covered = list(payload.get("risks_covered") or [])
        categories = list(payload.get("scope_categories") or [])
        if not (risks_covered or categories):
            raise HTTPException(
                400,
                "Say what this audit tests - either the risks it covers or "
                "the areas in scope. An audit with neither is a visit.",
            )

        owned = await AuditPlanService._areas_owned_by(auditor, site_id)
        clash = sorted(set(categories) & owned)
        if risks_covered:
            theirs = await Risk.find(
                Risk.site_id == site_id, Risk.owner == auditor
            ).to_list()
            clash += sorted({r.risk_id for r in theirs} & set(risks_covered))
        if clash:
            raise HTTPException(
                409,
                f"{auditor} owns {', '.join(clash)} and cannot audit it. An "
                f"auditor reviewing their own work is the same failure as an "
                f"appeal reviewed by the person who made the decision.",
            )

        a = InternalAudit(
            audit_id=await next_identifier(InternalAudit, "audit_id", site_id, "IAU"),
            site_id=site_id,
            title=title,
            scope_categories=categories,
            risks_covered=risks_covered,
            auditor=auditor,
            auditor_excluded_from=sorted(owned),
            planned_for=payload.get("planned_for"),
            created_by=user_id,
        )
        await a.insert()
        await trail.record(
            "internal_audit", a.audit_id, AuditAction.CREATE,
            actor={"user_id": user_id}, site_id=site_id, note=title,
            context={"auditor": auditor, "risks_covered": risks_covered,
                     "scope_categories": categories},
        )
        return a.model_dump(exclude={"id"})

    @staticmethod
    async def _areas_owned_by(person: str, site_id: str) -> set[str]:
        theirs = await Risk.find(
            Risk.site_id == site_id, Risk.owner == person
        ).to_list()
        return {r.category for r in theirs}

    @staticmethod
    async def complete_audit(
        audit_id: str, payload: dict, site_id: str, user_id: str
    ) -> dict:
        a = await InternalAudit.find_one(
            InternalAudit.audit_id == audit_id, InternalAudit.site_id == site_id
        )
        if not a:
            raise HTTPException(404, f"Audit {audit_id} not found")
        if a.status == AuditStatus.COMPLETED:
            raise HTTPException(409, f"{audit_id} is already completed")

        conclusion = (payload.get("conclusion") or "").strip()
        if not conclusion:
            raise HTTPException(400, "An audit needs a conclusion")

        a.findings = list(payload.get("findings") or [])
        a.conclusion = conclusion
        a.conducted_on = payload.get("conducted_on") or datetime.now()
        a.status = AuditStatus.COMPLETED.value
        a.updated_at = datetime.now()
        await a.save()

        # Stamp the risks this audit tested, so the next plan knows.
        stamped = 0
        for risk_id in a.risks_covered:
            r = await Risk.find_one(Risk.risk_id == risk_id, Risk.site_id == site_id)
            if r:
                r.last_audited_on = a.conducted_on
                r.updated_at = datetime.now()
                await r.save()
                stamped += 1

        await trail.record(
            "internal_audit", audit_id, AuditAction.UPDATE,
            actor={"user_id": user_id}, site_id=site_id, note=conclusion,
            context={"findings": len(a.findings), "risks_stamped": stamped},
        )
        return {**a.model_dump(exclude={"id"}), "risks_stamped": stamped}
