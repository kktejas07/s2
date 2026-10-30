from __future__ import annotations
from typing import Optional
from datetime import datetime
from fastapi import HTTPException
from core.audit import AuditAction, record as audit
from core.sequences import next_identifier
from modules.signoff.models import ReportSignoff


class SignoffService:

    @staticmethod
    async def create(data: dict, site_id: str, user_id: str):
        signoff_id = await next_identifier(
            ReportSignoff, "signoff_id", site_id, "SGN",
        )
        signoff = ReportSignoff(
            signoff_id=signoff_id,
            site_id=site_id,
            job_id=data["job_id"],
            visit_id=data.get("visit_id"),
            report_ref=data.get("report_ref"),
            certification_id=data.get("certification_id"),
            assigned_tm_person_id=data.get("assigned_tm_person_id"),
            status="pending",
            created_by=user_id,
        )
        await signoff.insert()
        await audit(AuditAction.CREATE, "report_signoff", signoff_id, user_id, site_id)
        return signoff.dict()

    @staticmethod
    async def list(
        site_id: str,
        job_id: Optional[str] = None,
        status: Optional[str] = None,
        person_id: Optional[str] = None,
        page: int = 1,
        per_page: int = 50,
    ):
        query: dict = {"site_id": site_id}
        if job_id:
            query["job_id"] = job_id
        if status:
            query["status"] = status
        if person_id:
            query["$or"] = [
                {"assigned_tm_person_id": person_id},
                {"signed_by_person_id": person_id},
            ]
        total = await ReportSignoff.find(query).count()
        items = (
            await ReportSignoff.find(query)
            .sort(-ReportSignoff.created_at)
            .skip((page - 1) * per_page)
            .limit(per_page)
            .to_list()
        )
        return {"total": total, "items": [i.dict() for i in items]}

    @staticmethod
    async def get(signoff_id: str, site_id: str):
        s = await ReportSignoff.find_one({"signoff_id": signoff_id, "site_id": site_id})
        if not s:
            raise HTTPException(status_code=404, detail="Signoff not found")
        return s.dict()

    @staticmethod
    async def submit_review(signoff_id: str, data: dict, site_id: str, user_id: str):
        s = await ReportSignoff.find_one({"signoff_id": signoff_id, "site_id": site_id})
        if not s:
            raise HTTPException(status_code=404, detail="Signoff not found")

        result = data.get("result")
        if result not in ("approved", "rework_required", "rejected"):
            raise HTTPException(status_code=400, detail="result must be approved, rework_required, or rejected")

        s.signed_by_person_id = data.get("signed_by_person_id", user_id)
        s.signed_by_name = data.get("signed_by_name")
        s.signed_by_role = data.get("signed_by_role", "tm")
        s.is_deputy = data.get("is_deputy", False)
        s.deputy_reason = data.get("deputy_reason")
        s.cross_region_code = data.get("cross_region_code")
        s.scope_verified = data.get("scope_verified", False)
        s.coi_checked = data.get("coi_checked", False)
        s.review_date = datetime.now()
        s.result = result

        if result == "approved":
            s.status = "approved"
            s.signed_on = datetime.now()
        elif result == "rework_required":
            s.status = "rework"
            s.rework_notes = data.get("rework_notes", "")
            s.rework_count += 1
        else:
            s.status = "rejected"

        s.updated_at = datetime.now()
        await s.save()
        await audit(AuditAction.UPDATE, "report_signoff", signoff_id, user_id, site_id, changes={"result": result})
        return s.dict()

    @staticmethod
    async def assign_deputy(signoff_id: str, data: dict, site_id: str, user_id: str):
        s = await ReportSignoff.find_one({"signoff_id": signoff_id, "site_id": site_id})
        if not s:
            raise HTTPException(status_code=404, detail="Signoff not found")

        s.signed_by_person_id = data["deputy_person_id"]
        s.signed_by_name = data.get("deputy_name")
        s.signed_by_role = data.get("role", "deputy_rh")
        s.is_deputy = True
        s.deputy_reason = data.get("reason", "TM absent")
        s.cross_region_code = data.get("cross_region_code")
        s.arranged_by = data.get("arranged_by", user_id)
        s.status = "under_review"
        s.updated_at = datetime.now()
        await s.save()
        await audit(AuditAction.UPDATE, "report_signoff", signoff_id, user_id, site_id, changes={"deputy": data["deputy_person_id"]})
        return s.dict()

    @staticmethod
    async def pending_for_user(person_id: str, site_id: str):
        query = {
            "site_id": site_id,
            "status": {"$in": ["pending", "under_review"]},
            "$or": [
                {"assigned_tm_person_id": person_id},
                {"signed_by_person_id": person_id},
            ],
        }
        items = await ReportSignoff.find(query).sort(-ReportSignoff.created_at).to_list()
        return {"total": len(items), "items": [i.dict() for i in items]}
