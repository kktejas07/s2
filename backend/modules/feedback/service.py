from typing import Optional
from datetime import datetime
from fastapi import HTTPException
from core.audit import AuditAction, record as audit
from modules.feedback.models import ClientFeedback, MRMAgendaItem


class FeedbackService:

    @staticmethod
    async def list(site_id: str = "SITE-01", client_id: Optional[str] = None, job_id: Optional[str] = None, search: str = "", page: int = 1, per_page: int = 100):
        query: dict = {"site_id": site_id}
        if client_id:
            query["client_id"] = client_id
        if job_id:
            query["job_id"] = job_id
        if search:
            query["$or"] = [
                {"feedback_id": {"$regex": search, "$options": "i"}},
                {"client_name": {"$regex": search, "$options": "i"}},
                {"comments": {"$regex": search, "$options": "i"}},
            ]
        total = await ClientFeedback.find(query).count()
        items = await ClientFeedback.find(query).skip((page - 1) * per_page).limit(per_page).sort(-ClientFeedback.created_at).to_list()
        return {"total": total, "items": [i.dict() for i in items], "page": page, "per_page": per_page}

    @staticmethod
    async def get(feedback_id: str, site_id: str):
        fb = await ClientFeedback.find_one({"feedback_id": feedback_id, "site_id": site_id})
        if not fb:
            raise HTTPException(status_code=404, detail="Feedback not found")
        return fb.dict()

    @staticmethod
    async def create(data: dict, site_id: str, user_id: str):
        count = await ClientFeedback.find({"site_id": site_id}).count()
        year = datetime.now().year
        feedback_id = f"FBK-{year}-{count + 1:04d}"
        fb = ClientFeedback(feedback_id=feedback_id, site_id=site_id, **{
            k: v for k, v in data.items()
            if k in ClientFeedback.model_fields and k not in ("feedback_id", "site_id")
        })
        # Auto-flag low ratings for escalation
        ratings = [fb.overall_rating, fb.timeliness_rating, fb.report_quality_rating, fb.inspector_competence_rating, fb.communication_rating]
        if any(r > 0 and r < 3 for r in ratings):
            fb.requires_escalation = True
        await fb.insert()
        await audit(AuditAction.CREATE, "feedback", feedback_id, user_id, site_id, after=fb.dict())
        return fb.dict()

    @staticmethod
    async def respond(feedback_id: str, data: dict, site_id: str, user_id: str):
        fb = await ClientFeedback.find_one({"feedback_id": feedback_id, "site_id": site_id})
        if not fb:
            raise HTTPException(status_code=404, detail="Feedback not found")
        fb.responded_by = user_id
        fb.responded_on = datetime.now()
        fb.response_notes = data.get("response_notes")
        fb.corrective_action = data.get("corrective_action")
        fb.updated_at = datetime.now()
        await fb.save()
        await audit(AuditAction.UPDATE, "feedback", feedback_id, user_id, site_id, after={"responded": True})
        return fb.dict()

    @staticmethod
    async def escalate(feedback_id: str, data: dict, site_id: str, user_id: str):
        fb = await ClientFeedback.find_one({"feedback_id": feedback_id, "site_id": site_id})
        if not fb:
            raise HTTPException(status_code=404, detail="Feedback not found")
        fb.escalated_to_mrm = True
        fb.mrm_ref = data.get("mrm_ref")
        fb.updated_at = datetime.now()
        await fb.save()
        await audit(AuditAction.UPDATE, "feedback", feedback_id, user_id, site_id, after={"escalated_to_mrm": True})
        return fb.dict()


class MRMService:

    @staticmethod
    async def list(site_id: str = "SITE-01", category: Optional[str] = None, period: Optional[str] = None, page: int = 1, per_page: int = 100):
        query: dict = {"site_id": site_id}
        if category:
            query["category"] = category
        if period:
            query["period"] = period
        total = await MRMAgendaItem.find(query).count()
        items = await MRMAgendaItem.find(query).skip((page - 1) * per_page).limit(per_page).sort(-MRMAgendaItem.created_at).to_list()
        return {"total": total, "items": [i.dict() for i in items], "page": page, "per_page": per_page}

    @staticmethod
    async def get(mrm_id: str, site_id: str):
        item = await MRMAgendaItem.find_one({"mrm_id": mrm_id, "site_id": site_id})
        if not item:
            raise HTTPException(status_code=404, detail="MRM item not found")
        return item.dict()

    @staticmethod
    async def create(data: dict, site_id: str, user_id: str):
        count = await MRMAgendaItem.find({"site_id": site_id}).count()
        year = datetime.now().year
        mrm_id = f"MRM-{year}-{count + 1:04d}"
        item = MRMAgendaItem(mrm_id=mrm_id, site_id=site_id, **{
            k: v for k, v in data.items()
            if k in MRMAgendaItem.model_fields and k not in ("mrm_id", "site_id")
        })
        await item.insert()
        await audit(AuditAction.CREATE, "mrm", mrm_id, user_id, site_id, after=item.dict())
        return item.dict()

    @staticmethod
    async def record_decision(mrm_id: str, data: dict, site_id: str, user_id: str):
        item = await MRMAgendaItem.find_one({"mrm_id": mrm_id, "site_id": site_id})
        if not item:
            raise HTTPException(status_code=404, detail="MRM item not found")
        item.decision = data.get("decision")
        item.action_items = data.get("action_items", [])
        item.action_owner = data.get("action_owner")
        item.action_due = data.get("action_due")
        item.status = "presented"
        item.updated_at = datetime.now()
        await item.save()
        await audit(AuditAction.UPDATE, "mrm", mrm_id, user_id, site_id, after={"status": "presented"})
        return item.dict()

    @staticmethod
    async def close(mrm_id: str, site_id: str, user_id: str):
        item = await MRMAgendaItem.find_one({"mrm_id": mrm_id, "site_id": site_id})
        if not item:
            raise HTTPException(status_code=404, detail="MRM item not found")
        item.status = "closed"
        item.updated_at = datetime.now()
        await item.save()
        await audit(AuditAction.UPDATE, "mrm", mrm_id, user_id, site_id, after={"status": "closed"})
        return item.dict()
