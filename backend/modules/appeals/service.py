"""Handling appeals against an inspection decision."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import HTTPException

from core.audit import AuditAction, record as audit
from core.sequences import next_identifier
from modules.appeals.models import (
    CLOSED_STATUSES,
    Appeal,
    AppealGrounds,
    AppealStatus,
)
from modules.certifications.models import Certification

VALID_GROUNDS = {g.value for g in AppealGrounds}
VALID_STATUSES = {s.value for s in AppealStatus}
VALID_ENTITY_TYPES = {"certification", "work_package", "visit"}


class AppealService:

    @staticmethod
    async def raise_appeal(
        data: dict, site_id: str = "SITE-01", user_id: str = "USR-001"
    ) -> Appeal:
        entity_type = data.get("entity_type")
        entity_id = data.get("entity_id")
        if entity_type not in VALID_ENTITY_TYPES:
            raise HTTPException(
                400, f"Invalid entity_type '{entity_type}'. Expected one of: "
                     f"{sorted(VALID_ENTITY_TYPES)}",
            )
        if not entity_id:
            raise HTTPException(400, "An appeal must name the decision it contests")
        if not (data.get("statement") or "").strip():
            raise HTTPException(
                400, "An appeal needs a statement of what is being contested and why",
            )
        if not (data.get("appellant_name") or "").strip():
            raise HTTPException(400, "An appeal needs a named appellant")

        grounds = data.get("grounds") or AppealGrounds.TECHNICAL_JUDGEMENT.value
        if grounds not in VALID_GROUNDS:
            raise HTTPException(400, f"Invalid grounds '{grounds}'. Expected one of: {sorted(VALID_GROUNDS)}")

        # Who made the decision being contested. Captured now, because that is
        # what makes the independence check possible later.
        original = list(data.get("original_decision_by") or [])
        if entity_type == "certification" and not original:
            cert = await Certification.find_one(
                Certification.certification_id == entity_id,
                Certification.site_id == site_id,
            )
            if cert:
                original = [x for x in (cert.prepared_by, cert.certified_by_person_id) if x]
                data.setdefault("job_id", cert.job_id)

        appeal = Appeal(
            appeal_id=await next_identifier(Appeal, "appeal_id", site_id, "APL", kind="appeal"),
            site_id=site_id,
            entity_type=entity_type,
            entity_id=entity_id,
            job_id=data.get("job_id"),
            appellant_name=data["appellant_name"].strip(),
            appellant_organisation=data.get("appellant_organisation"),
            appellant_contact=data.get("appellant_contact"),
            grounds=grounds,
            statement=data["statement"].strip(),
            original_decision_by=original,
            created_by=user_id,
        )
        await appeal.insert()

        await audit(
            "appeal", appeal.appeal_id, AuditAction.CREATE,
            actor={"user_id": user_id},
            note=f"Appeal raised against {entity_type} {entity_id}",
            context={"grounds": grounds, "appellant": appeal.appellant_name},
            site_id=site_id,
        )
        return appeal

    @staticmethod
    async def get(appeal_id: str, site_id: str = "SITE-01") -> Appeal:
        appeal = await Appeal.find_one(
            Appeal.appeal_id == appeal_id, Appeal.site_id == site_id
        )
        if not appeal:
            raise HTTPException(404, f"Appeal '{appeal_id}' not found")
        return appeal

    @staticmethod
    async def list_appeals(
        site_id: str = "SITE-01",
        status: str = "",
        entity_type: str = "",
        entity_id: str = "",
    ):
        query: dict = {"site_id": site_id}
        if status:
            query["status"] = status
        if entity_type:
            query["entity_type"] = entity_type
        if entity_id:
            query["entity_id"] = entity_id
        items = await Appeal.find(query).sort(-Appeal.received_date).to_list()
        return {"total": len(items), "data": [i.model_dump(exclude={"id"}) for i in items]}

    @staticmethod
    async def assign_reviewers(
        appeal_id: str,
        reviewer_person_ids: list[str],
        site_id: str = "SITE-01",
        user_id: str = "USR-001",
    ) -> Appeal:
        """Put an independent panel on the appeal.

        Refuses anyone who took part in the decision being contested: an
        inspector reviewing their own rejection is not an independent review,
        which is the substance of ISO/IEC 17020 clause 7.6 rather than a
        formality.
        """
        appeal = await AppealService.get(appeal_id, site_id)
        if appeal.status in CLOSED_STATUSES:
            raise HTTPException(409, f"{appeal_id} is {appeal.status} and cannot be reopened")
        if not reviewer_person_ids:
            raise HTTPException(400, "Name at least one reviewer")

        conflicted = sorted(set(reviewer_person_ids) & set(appeal.original_decision_by))
        if conflicted:
            raise HTTPException(
                409,
                f"{', '.join(conflicted)} took part in the decision being appealed and "
                f"cannot review it. An appeal must be decided by people not involved "
                f"in the original decision.",
            )

        appeal.reviewers = list(reviewer_person_ids)
        appeal.status = AppealStatus.UNDER_REVIEW.value
        appeal.acknowledged_at = appeal.acknowledged_at or datetime.now()
        appeal.updated_at = datetime.now()
        await appeal.save()

        await audit(
            "appeal", appeal_id, AuditAction.UPDATE,
            actor={"user_id": user_id},
            note="Independent reviewers assigned",
            context={"reviewers": reviewer_person_ids},
            site_id=site_id,
        )
        return appeal

    @staticmethod
    async def decide(
        appeal_id: str,
        status: str,
        outcome: str,
        decided_by: str,
        site_id: str = "SITE-01",
        remedy_reference: Optional[str] = None,
    ) -> Appeal:
        """Record the outcome.

        The decider must be one of the assigned independent reviewers, for the
        same reason the assignment is checked.
        """
        if status not in CLOSED_STATUSES:
            raise HTTPException(
                400,
                f"'{status}' does not close an appeal. Expected one of: "
                f"{sorted(CLOSED_STATUSES)}",
            )
        if not (outcome or "").strip():
            raise HTTPException(
                400, "An appeal decision needs its reasoning recorded - the appellant "
                     "is entitled to know why",
            )

        appeal = await AppealService.get(appeal_id, site_id)
        if appeal.status in CLOSED_STATUSES:
            raise HTTPException(409, f"{appeal_id} is already {appeal.status}")

        if status != AppealStatus.WITHDRAWN.value:
            if decided_by in appeal.original_decision_by:
                raise HTTPException(
                    409,
                    f"{decided_by} took part in the decision being appealed and cannot "
                    f"decide the appeal.",
                )
            if appeal.reviewers and decided_by not in appeal.reviewers:
                raise HTTPException(
                    409,
                    f"{decided_by} is not one of the assigned reviewers "
                    f"({', '.join(appeal.reviewers)}).",
                )

        previous = appeal.status
        appeal.status = status
        appeal.outcome = outcome.strip()
        appeal.decided_by = decided_by
        appeal.decided_at = datetime.now()
        appeal.remedy_reference = remedy_reference
        appeal.updated_at = datetime.now()
        await appeal.save()

        await audit(
            "appeal", appeal_id, AuditAction.UPDATE,
            actor={"user_id": decided_by},
            before={"status": previous}, after={"status": status},
            note=outcome.strip(),
            context={
                "entity_type": appeal.entity_type, "entity_id": appeal.entity_id,
                "remedy_reference": remedy_reference,
            },
            site_id=site_id,
        )
        return appeal

    @staticmethod
    async def summary(site_id: str = "SITE-01"):
        """What a management review asks for: how many, how long, how often we
        were wrong."""
        items = await Appeal.find(Appeal.site_id == site_id).to_list()
        decided = [a for a in items if a.decided_at and a.received_date]
        upheld = [a for a in items if a.status in (
            AppealStatus.UPHELD.value, AppealStatus.PARTIALLY_UPHELD.value
        )]
        turnaround = [
            (a.decided_at - a.received_date).days for a in decided
        ]
        by_grounds: dict[str, int] = {}
        for a in items:
            by_grounds[a.grounds] = by_grounds.get(a.grounds, 0) + 1

        return {
            "total": len(items),
            "open": len([a for a in items if a.status not in CLOSED_STATUSES]),
            "upheld_or_partially": len(upheld),
            "upheld_rate_pct": round(len(upheld) / len(decided) * 100, 1) if decided else 0.0,
            "average_days_to_decide": round(sum(turnaround) / len(turnaround), 1) if turnaround else None,
            "by_grounds": by_grounds,
        }
