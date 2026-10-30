from typing import Optional
from datetime import datetime
from fastapi import HTTPException
from core.audit import AuditAction, record as audit
from modules.appraisal.models import Appraisal, WitnessedInspection


class AppraisalService:

    # ── Appraisals ─────────────────────────────────────────────────────

    @staticmethod
    async def list_appraisals(
        site_id: str, person_id: Optional[str] = None,
        status: Optional[str] = None, page: int = 1, per_page: int = 100,
    ):
        query: dict = {"site_id": site_id}
        if person_id:
            query["person_id"] = person_id
        if status:
            query["status"] = status
        total = await Appraisal.find(query).count()
        items = (
            await Appraisal.find(query)
            .skip((page - 1) * per_page).limit(per_page)
            .sort(-Appraisal.created_at).to_list()
        )
        return {"total": total, "items": items, "page": page, "per_page": per_page}

    @staticmethod
    async def create_appraisal(data: dict, site_id: str, user_id: str):
        appraisal = Appraisal(**data, site_id=site_id, created_by=user_id)
        await appraisal.insert()
        await audit(AuditAction.CREATE, "appraisals", appraisal.appraisal_id, user_id, site_id)
        return appraisal

    @staticmethod
    async def get_appraisal(appraisal_id: str, site_id: str):
        a = await Appraisal.find_one({"appraisal_id": appraisal_id, "site_id": site_id})
        if not a:
            raise HTTPException(404, "Appraisal not found")
        return a

    @staticmethod
    async def self_review(appraisal_id: str, data: dict, site_id: str, user_id: str):
        a = await Appraisal.find_one({"appraisal_id": appraisal_id, "site_id": site_id})
        if not a:
            raise HTTPException(404, "Appraisal not found")
        if a.status not in ("draft", "self_review"):
            raise HTTPException(400, f"Cannot do self-review on a {a.status} appraisal")
        a.employee_comments = data.get("employee_comments", a.employee_comments)
        if "kpi_scores" in data:
            a.kpi_scores = data["kpi_scores"]
        a.status = "self_review"
        a.updated_at = datetime.now()
        await a.save()
        await audit(AuditAction.UPDATE, "appraisals", appraisal_id, user_id, site_id, {"status": "self_review"})
        return a

    @staticmethod
    async def manager_review(appraisal_id: str, data: dict, site_id: str, user_id: str):
        a = await Appraisal.find_one({"appraisal_id": appraisal_id, "site_id": site_id})
        if not a:
            raise HTTPException(404, "Appraisal not found")
        if a.status not in ("self_review", "manager_review"):
            raise HTTPException(400, f"Cannot do manager review on a {a.status} appraisal")
        for field in ("overall_rating", "strengths", "improvement_areas", "training_needs",
                      "authorization_recommendation", "authorization_scopes_to_add",
                      "authorization_scopes_to_remove", "reviewer_comments"):
            if field in data:
                setattr(a, field, data[field])
        a.reviewer_person_id = user_id
        a.status = "manager_review"
        a.updated_at = datetime.now()
        await a.save()
        await audit(AuditAction.UPDATE, "appraisals", appraisal_id, user_id, site_id, {"status": "manager_review"})
        return a

    @staticmethod
    async def complete_appraisal(appraisal_id: str, site_id: str, user_id: str):
        a = await Appraisal.find_one({"appraisal_id": appraisal_id, "site_id": site_id})
        if not a:
            raise HTTPException(404, "Appraisal not found")
        if a.status != "manager_review":
            raise HTTPException(400, f"Cannot complete a {a.status} appraisal")
        a.status = "completed"
        a.completed_on = datetime.now()
        a.updated_at = datetime.now()
        await a.save()
        await audit(AuditAction.UPDATE, "appraisals", appraisal_id, user_id, site_id, {"status": "completed"})
        return a

    # ── Witnessed Inspections ──────────────────────────────────────────

    @staticmethod
    async def list_witnessed(
        site_id: str, person_id: Optional[str] = None, page: int = 1, per_page: int = 100,
    ):
        query: dict = {"site_id": site_id}
        if person_id:
            query["person_id"] = person_id
        total = await WitnessedInspection.find(query).count()
        items = (
            await WitnessedInspection.find(query)
            .skip((page - 1) * per_page).limit(per_page)
            .sort(-WitnessedInspection.created_at).to_list()
        )
        return {"total": total, "items": items, "page": page, "per_page": per_page}

    @staticmethod
    async def create_witnessed(data: dict, site_id: str, user_id: str):
        wi = WitnessedInspection(**data, site_id=site_id, created_by=user_id)
        await wi.insert()
        await audit(AuditAction.CREATE, "witnessed_inspections", wi.witness_id, user_id, site_id)
        return wi

    @staticmethod
    async def get_witnessed_for_person(person_id: str, site_id: str):
        items = await WitnessedInspection.find({"person_id": person_id, "site_id": site_id}).sort(-WitnessedInspection.date).to_list()
        return {"person_id": person_id, "total": len(items), "items": items}
