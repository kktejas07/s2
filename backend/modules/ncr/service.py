"""Raising, dispositioning, verifying and closing nonconformities.

The refusals here are the module. Each one exists because the alternative is
a nonconformity that was closed without being fixed, and a certificate that
says otherwise.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Optional

from fastapi import HTTPException

from core import audit
from core.audit import AuditAction
from core.sequences import next_identifier
from modules.ncr.models import (
    ALLOWED_TRANSITIONS,
    BLOCKS_CERTIFICATION,
    NEEDS_CLIENT_CONCESSION,
    OPEN_STATUSES,
    NCR,
    NCREvent,
    NCRStatus,
    Disposition,
    Severity,
    target_due,
)

logger = logging.getLogger(__name__)

SEVERITIES = {s.value for s in Severity}
DISPOSITIONS = {d.value for d in Disposition}


class NCRService:
    @staticmethod
    async def get(ncr_id: str, site_id: str) -> NCR:
        found = await NCR.find_one(NCR.ncr_id == ncr_id, NCR.site_id == site_id)
        if not found:
            raise HTTPException(404, f"{ncr_id} not found")
        return found

    @staticmethod
    def _move(ncr: NCR, to: str, actor: str, note: Optional[str] = None) -> None:
        allowed = ALLOWED_TRANSITIONS.get(ncr.status, set())
        if to not in allowed:
            raise HTTPException(
                409,
                f"{ncr.ncr_id} is {ncr.status.replace('_', ' ').lower()} and "
                f"cannot move to {to.replace('_', ' ').lower()}"
                + (
                    f". From here it can only go to: "
                    f"{', '.join(sorted(s.replace('_', ' ').lower() for s in allowed))}."
                    if allowed else ", which is a final state."
                ),
            )
        ncr.history.append(
            NCREvent(
                sequence=len(ncr.history) + 1, actor=actor,
                from_status=ncr.status, to_status=to, note=note,
            )
        )
        ncr.status = to
        ncr.updated_at = datetime.now()

    # ------------------------------------------------------------- raising

    @staticmethod
    async def raise_ncr(payload: dict, site_id: str, user_id: str) -> dict:
        title = (payload.get("title") or "").strip()
        description = (payload.get("description") or "").strip()
        if not title or not description:
            raise HTTPException(400, "An NCR needs a title and a description")

        severity = (payload.get("severity") or Severity.MAJOR.value).upper()
        if severity not in SEVERITIES:
            raise HTTPException(
                400, f"severity must be one of: {', '.join(sorted(SEVERITIES))}"
            )

        evidence = (payload.get("objective_evidence") or "").strip()
        # The distinction between what was observed and what was concluded is
        # the whole difference between a finding that survives a dispute and
        # one that does not.
        if severity in {s.value for s in BLOCKS_CERTIFICATION} and not evidence:
            raise HTTPException(
                400,
                f"A {severity.lower()} nonconformity needs objective evidence - "
                f"what was actually measured or observed, as distinct from the "
                f"conclusion drawn from it. Without it the finding cannot be "
                f"defended when the contractor disputes it.",
            )

        ncr_id = await next_identifier(NCR, "ncr_id", site_id, "NCR")
        now = datetime.now()
        ncr = NCR(
            ncr_id=ncr_id, site_id=site_id,
            job_id=payload.get("job_id"),
            work_package_id=payload.get("work_package_id"),
            inspection_call_id=payload.get("inspection_call_id"),
            certification_id=payload.get("certification_id"),
            client_id=payload.get("client_id"),
            manufacturer_id=payload.get("manufacturer_id"),
            responsible_party=payload.get("responsible_party"),
            title=title, description=description,
            discipline=payload.get("discipline"),
            location=payload.get("location"),
            requirement_source=payload.get("requirement_source"),
            requirement_revision=payload.get("requirement_revision"),
            requirement_clause=payload.get("requirement_clause"),
            objective_evidence=evidence or None,
            evidence_ids=list(payload.get("evidence_ids") or []),
            severity=severity,
            raised_by=user_id, raised_on=now,
            due_by=target_due(severity, now),
            history=[
                NCREvent(sequence=1, actor=user_id,
                         to_status=NCRStatus.OPEN.value, note="raised")
            ],
        )
        await ncr.insert()
        await audit.record(
            "ncr", ncr_id, AuditAction.CREATE,
            actor={"user_id": user_id}, site_id=site_id, note=title,
            context={"severity": severity, "job_id": ncr.job_id,
                     "inspection_call_id": ncr.inspection_call_id},
        )
        out = ncr.model_dump(exclude={"id"})
        out["blocks_certification"] = severity in {
            s.value for s in BLOCKS_CERTIFICATION
        }
        return out

    # -------------------------------------------------------- disposition

    @staticmethod
    async def propose_disposition(
        ncr_id: str, payload: dict, site_id: str, user_id: str
    ) -> dict:
        """The responsible party says what they intend to do about it."""
        ncr = await NCRService.get(ncr_id, site_id)
        disposition = (payload.get("disposition") or "").upper()
        if disposition not in DISPOSITIONS:
            raise HTTPException(
                400,
                f"disposition must be one of: {', '.join(sorted(DISPOSITIONS))}",
            )
        note = (payload.get("note") or "").strip()
        if not note:
            raise HTTPException(
                400,
                "A disposition needs a note saying what will be done and why.",
            )

        NCRService._move(
            ncr, NCRStatus.DISPOSITION_PROPOSED.value, user_id,
            f"{disposition}: {note}",
        )
        ncr.disposition = disposition
        ncr.disposition_proposed_by = payload.get("proposed_by") or user_id
        ncr.disposition_note = note
        ncr.root_cause = payload.get("root_cause") or ncr.root_cause
        ncr.corrective_action = (
            payload.get("corrective_action") or ncr.corrective_action
        )
        ncr.preventive_action = (
            payload.get("preventive_action") or ncr.preventive_action
        )
        await ncr.save()
        await audit.record(
            "ncr", ncr_id, AuditAction.UPDATE,
            actor={"user_id": user_id}, site_id=site_id, note=note,
            context={"disposition": disposition},
        )
        out = ncr.model_dump(exclude={"id"})
        out["needs_client_concession"] = disposition in {
            d.value for d in NEEDS_CLIENT_CONCESSION
        }
        return out

    @staticmethod
    async def accept_disposition(
        ncr_id: str, payload: dict, site_id: str, user_id: str
    ) -> dict:
        """Agree the proposed disposition and let the correction start.

        Where the disposition is a concession against the client's own
        specification, the client's authority is required. IQE reports the
        deviation; it does not decide the client will live with it.
        """
        ncr = await NCRService.get(ncr_id, site_id)
        if not ncr.disposition:
            raise HTTPException(
                409, f"{ncr_id} has no proposed disposition to accept"
            )

        if ncr.disposition == Disposition.REJECT_FINDING:
            reason = (payload.get("reason") or "").strip()
            if not reason:
                raise HTTPException(
                    400,
                    "Accepting that the finding was wrong needs a reason. An "
                    "NCR withdrawn without one is indistinguishable from one "
                    "that was argued away.",
                )
            NCRService._move(ncr, NCRStatus.CLOSED.value, user_id, reason)
            ncr.verification_note = reason
            ncr.verified_by = user_id
            ncr.verified_on = datetime.now()
            await ncr.save()
            await audit.record(
                "ncr", ncr_id, AuditAction.STATUS_CHANGE,
                actor={"user_id": user_id}, site_id=site_id, note=reason,
                context={"outcome": "finding_rejected"},
            )
            return ncr.model_dump(exclude={"id"})

        if ncr.disposition in {d.value for d in NEEDS_CLIENT_CONCESSION}:
            authority = (payload.get("concession_authority") or "").strip()
            approver = (payload.get("concession_approved_by") or "").strip()
            if not (authority and approver):
                raise HTTPException(
                    409,
                    f"{ncr.disposition.replace('_', ' ').lower()} is a "
                    f"concession against the client's own specification, so it "
                    f"needs the name of who granted it and their written "
                    f"reference. IQE reports the deviation; it does not decide "
                    f"the client will live with it.",
                )
            ncr.concession_authority = authority
            ncr.concession_approved_by = approver

        NCRService._move(
            ncr, NCRStatus.IN_CORRECTION.value, user_id,
            payload.get("note") or "disposition accepted",
        )
        await ncr.save()
        await audit.record(
            "ncr", ncr_id, AuditAction.AUTHORIZE,
            actor={"user_id": user_id}, site_id=site_id,
            context={"disposition": ncr.disposition,
                     "concession_authority": ncr.concession_authority},
        )
        return ncr.model_dump(exclude={"id"})

    # -------------------------------------------------------- verification

    @staticmethod
    async def submit_for_verification(
        ncr_id: str, payload: dict, site_id: str, user_id: str
    ) -> dict:
        """The responsible party says the correction is done."""
        ncr = await NCRService.get(ncr_id, site_id)
        note = (payload.get("note") or "").strip()
        if not note:
            raise HTTPException(
                400, "Submitting for verification needs a note saying what was done"
            )
        NCRService._move(
            ncr, NCRStatus.AWAITING_VERIFICATION.value, user_id, note
        )
        ncr.corrective_action = payload.get("corrective_action") or ncr.corrective_action
        await ncr.save()
        return ncr.model_dump(exclude={"id"})

    @staticmethod
    async def verify(
        ncr_id: str, payload: dict, site_id: str, user_id: str
    ) -> dict:
        """Check that the correction worked, and close it if it did.

        The person who asserted completion does not get to confirm it. That is
        the same separation as certification from execution, and it is the
        only thing standing between "closed" and "fixed".
        """
        ncr = await NCRService.get(ncr_id, site_id)
        accepted = bool(payload.get("accepted"))
        note = (payload.get("note") or "").strip()
        if not note:
            raise HTTPException(
                400,
                "Verification needs a note saying what was checked. "
                "'Closed' with no record of what was looked at is an "
                "assertion, not a verification.",
            )

        submitter = next(
            (e.actor for e in reversed(ncr.history)
             if e.to_status == NCRStatus.AWAITING_VERIFICATION.value),
            None,
        )
        if submitter and submitter == user_id:
            raise HTTPException(
                409,
                f"{user_id} submitted {ncr_id} as corrected and cannot also "
                f"verify it. Verifying your own correction is an assertion "
                f"repeated, not a check.",
            )

        if accepted:
            NCRService._move(ncr, NCRStatus.CLOSED.value, user_id, note)
            ncr.verified_by = user_id
            ncr.verified_on = datetime.now()
            ncr.verification_note = note
            ncr.verification_evidence_ids = list(
                payload.get("verification_evidence_ids") or []
            )
        else:
            NCRService._move(ncr, NCRStatus.IN_CORRECTION.value, user_id, note)

        await ncr.save()
        await audit.record(
            "ncr", ncr_id,
            AuditAction.AUTHORIZE if accepted else AuditAction.STATUS_CHANGE,
            actor={"user_id": user_id}, site_id=site_id, note=note,
            context={"accepted": accepted},
        )
        return ncr.model_dump(exclude={"id"})

    @staticmethod
    async def void(ncr_id: str, payload: dict, site_id: str, user_id: str) -> dict:
        """Raised in error. Kept, never deleted."""
        ncr = await NCRService.get(ncr_id, site_id)
        reason = (payload.get("reason") or "").strip()
        if not reason:
            raise HTTPException(400, "Voiding an NCR needs a reason")
        NCRService._move(ncr, NCRStatus.VOID.value, user_id, reason)
        ncr.void_reason = reason
        await ncr.save()
        return ncr.model_dump(exclude={"id"})

    # ------------------------------------------------------------ the gate

    @staticmethod
    async def open_against(
        site_id: str = "SITE-01",
        *,
        job_id: Optional[str] = None,
        work_package_id: Optional[str] = None,
    ) -> dict:
        """Open nonconformities that would block a certificate.

        Observations and minors do not block: a minor departure that does not
        affect fitness for purpose is reported on the certificate, not a
        reason to withhold it.
        """
        query: dict[str, Any] = {"site_id": site_id}
        if job_id:
            query["job_id"] = job_id
        if work_package_id:
            query["work_package_id"] = work_package_id
        rows = await NCR.find(query).to_list()

        open_rows = [r for r in rows if r.status in {s.value for s in OPEN_STATUSES}]
        blocking = [
            r for r in open_rows
            if r.severity in {s.value for s in BLOCKS_CERTIFICATION}
        ]
        now = datetime.now()
        overdue = [r for r in open_rows if r.due_by and r.due_by < now]

        return {
            "open": [r.model_dump(exclude={"id"}) for r in open_rows],
            "blocking": [
                {"ncr_id": r.ncr_id, "severity": r.severity, "title": r.title,
                 "status": r.status, "due_by": r.due_by}
                for r in blocking
            ],
            "overdue": [
                {"ncr_id": r.ncr_id, "severity": r.severity, "title": r.title,
                 "due_by": r.due_by,
                 "hours_late": round((now - r.due_by).total_seconds() / 3600, 1)}
                for r in overdue
            ],
            "may_certify": not blocking,
            "note": (
                "No open nonconformity blocks certification."
                if not blocking else
                f"{len(blocking)} open nonconformit"
                f"{'y' if len(blocking) == 1 else 'ies'} of critical or major "
                f"severity. A certificate issued over these would state that "
                f"work conformed when IQE's own record says it did not."
            ),
        }

    @staticmethod
    async def list_ncrs(
        site_id: str = "SITE-01", status: str = "", job_id: str = "",
        severity: str = "", open_only: bool = False,
    ) -> dict:
        query: dict[str, Any] = {"site_id": site_id}
        if status:
            query["status"] = status.upper()
        if job_id:
            query["job_id"] = job_id
        if severity:
            query["severity"] = severity.upper()
        rows = await NCR.find(query).sort("-raised_on").to_list()
        if open_only:
            rows = [r for r in rows if r.status in {s.value for s in OPEN_STATUSES}]
        now = datetime.now()
        return {
            "total": len(rows),
            "data": [
                {
                    **r.model_dump(exclude={"id"}),
                    "is_open": r.status in {s.value for s in OPEN_STATUSES},
                    "blocks_certification": (
                        r.severity in {s.value for s in BLOCKS_CERTIFICATION}
                        and r.status in {s.value for s in OPEN_STATUSES}
                    ),
                    "overdue": bool(
                        r.due_by and r.due_by < now
                        and r.status in {s.value for s in OPEN_STATUSES}
                    ),
                }
                for r in rows
            ],
        }
