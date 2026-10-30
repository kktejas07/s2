from typing import Optional
from datetime import datetime
from fastapi import HTTPException
from core.audit import AuditAction, record as audit
from modules.rfi.models import RFI


class RFIService:

    @staticmethod
    async def list(
        site_id: str = "SITE-01",
        job_id: Optional[str] = None,
        status: Optional[str] = None,
        search: str = "",
        page: int = 1,
        per_page: int = 100,
    ):
        query: dict = {"site_id": site_id}
        if job_id:
            query["job_id"] = job_id
        if status:
            query["status"] = status
        if search:
            query["$or"] = [
                {"rfi_id": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"contractor_name": {"$regex": search, "$options": "i"}},
            ]
        total = await RFI.find(query).count()
        items = (
            await RFI.find(query)
            .skip((page - 1) * per_page)
            .limit(per_page)
            .sort(-RFI.created_at)
            .to_list()
        )
        return {"total": total, "items": [i.dict() for i in items], "page": page, "per_page": per_page}

    @staticmethod
    async def get(rfi_id: str, site_id: str):
        rfi = await RFI.find_one({"rfi_id": rfi_id, "site_id": site_id})
        if not rfi:
            raise HTTPException(status_code=404, detail="RFI not found")
        return rfi.dict()

    @staticmethod
    async def create(data: dict, site_id: str, user_id: str):
        count = await RFI.find({"site_id": site_id}).count()
        year = datetime.now().year
        rfi_id = f"RFI-{year}-{count + 1:04d}"
        rfi = RFI(rfi_id=rfi_id, site_id=site_id, raised_by=user_id, **{
            k: v for k, v in data.items()
            if k in RFI.model_fields and k not in ("rfi_id", "site_id", "raised_by")
        })
        await rfi.insert()
        await audit(AuditAction.CREATE, "rfi", rfi_id, user_id, site_id, after=rfi.dict())
        return rfi.dict()

    @staticmethod
    async def schedule(rfi_id: str, data: dict, site_id: str, user_id: str):
        rfi = await RFI.find_one({"rfi_id": rfi_id, "site_id": site_id})
        if not rfi:
            raise HTTPException(status_code=404, detail="RFI not found")
        rfi.scheduled_date = data.get("scheduled_date")
        rfi.scheduled_by = user_id
        rfi.inspector_person_id = data.get("inspector_person_id")
        rfi.status = "scheduled"
        rfi.updated_at = datetime.now()
        await rfi.save()
        await audit(AuditAction.UPDATE, "rfi", rfi_id, user_id, site_id, after={"status": "scheduled"})
        return rfi.dict()

    @staticmethod
    async def confirm(rfi_id: str, site_id: str, user_id: str):
        rfi = await RFI.find_one({"rfi_id": rfi_id, "site_id": site_id})
        if not rfi:
            raise HTTPException(status_code=404, detail="RFI not found")
        rfi.tm_confirmed = True
        rfi.tm_confirmed_by = user_id
        rfi.updated_at = datetime.now()
        await rfi.save()
        await audit(AuditAction.UPDATE, "rfi", rfi_id, user_id, site_id, after={"tm_confirmed": True})
        return rfi.dict()

    @staticmethod
    async def record_result(rfi_id: str, data: dict, site_id: str, user_id: str):
        rfi = await RFI.find_one({"rfi_id": rfi_id, "site_id": site_id})
        if not rfi:
            raise HTTPException(status_code=404, detail="RFI not found")
        rfi.inspection_date = data.get("inspection_date", datetime.now())
        rfi.result = data.get("result")
        rfi.visit_id = data.get("visit_id")
        rfi.ncr_ids = data.get("ncr_ids", [])
        rfi.status = "inspected"
        if rfi.raised_on and rfi.inspection_date:
            delta = rfi.inspection_date - rfi.raised_on
            rfi.turnaround_hours = round(delta.total_seconds() / 3600, 1)
        rfi.updated_at = datetime.now()
        await rfi.save()
        await audit(AuditAction.UPDATE, "rfi", rfi_id, user_id, site_id, after={"result": rfi.result})
        return rfi.dict()

    @staticmethod
    async def turnaround_report(site_id: str, job_id: Optional[str] = None):
        query: dict = {"site_id": site_id, "turnaround_hours": {"$ne": None}}
        if job_id:
            query["job_id"] = job_id
        rfis = await RFI.find(query).to_list()
        if not rfis:
            return {"count": 0, "avg_hours": 0, "max_hours": 0, "min_hours": 0}
        hours = [r.turnaround_hours for r in rfis if r.turnaround_hours is not None]
        return {
            "count": len(hours),
            "avg_hours": round(sum(hours) / len(hours), 1) if hours else 0,
            "max_hours": max(hours) if hours else 0,
            "min_hours": min(hours) if hours else 0,
        }
