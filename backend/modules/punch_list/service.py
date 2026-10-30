from typing import Optional
from datetime import datetime
from fastapi import HTTPException
from core.audit import AuditAction, record as audit
from modules.punch_list.models import PunchItem


class PunchListService:

    @staticmethod
    async def list(
        site_id: str = "SITE-01",
        job_id: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        search: str = "",
        page: int = 1,
        per_page: int = 100,
    ):
        query: dict = {"site_id": site_id}
        if job_id:
            query["job_id"] = job_id
        if category:
            query["category"] = category
        if status:
            query["status"] = status
        if search:
            query["$or"] = [
                {"punch_id": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"location": {"$regex": search, "$options": "i"}},
            ]
        total = await PunchItem.find(query).count()
        items = (
            await PunchItem.find(query)
            .skip((page - 1) * per_page)
            .limit(per_page)
            .sort(-PunchItem.created_at)
            .to_list()
        )
        return {"total": total, "items": [i.dict() for i in items], "page": page, "per_page": per_page}

    @staticmethod
    async def get(punch_id: str, site_id: str):
        item = await PunchItem.find_one({"punch_id": punch_id, "site_id": site_id})
        if not item:
            raise HTTPException(status_code=404, detail="Punch item not found")
        return item.dict()

    @staticmethod
    async def create(data: dict, site_id: str, user_id: str):
        count = await PunchItem.find({"site_id": site_id}).count()
        year = datetime.now().year
        punch_id = f"PUN-{year}-{count + 1:04d}"
        item = PunchItem(punch_id=punch_id, site_id=site_id, raised_by=user_id, **{
            k: v for k, v in data.items()
            if k in PunchItem.model_fields and k not in ("punch_id", "site_id", "raised_by")
        })
        await item.insert()
        await audit(AuditAction.CREATE, "punch_item", punch_id, user_id, site_id, after=item.dict())
        return item.dict()

    @staticmethod
    async def mark_corrected(punch_id: str, data: dict, site_id: str, user_id: str):
        item = await PunchItem.find_one({"punch_id": punch_id, "site_id": site_id})
        if not item:
            raise HTTPException(status_code=404, detail="Punch item not found")
        item.corrected_on = data.get("corrected_on", datetime.now())
        item.status = "corrected"
        item.updated_at = datetime.now()
        await item.save()
        await audit(AuditAction.UPDATE, "punch_item", punch_id, user_id, site_id, after={"status": "corrected"})
        return item.dict()

    @staticmethod
    async def re_inspect(punch_id: str, data: dict, site_id: str, user_id: str):
        item = await PunchItem.find_one({"punch_id": punch_id, "site_id": site_id})
        if not item:
            raise HTTPException(status_code=404, detail="Punch item not found")
        item.re_inspected = True
        item.re_inspected_by = user_id
        item.re_inspected_on = datetime.now()
        item.re_inspection_result = data.get("result", "accepted")
        if item.re_inspection_result == "accepted":
            item.status = "closed"
            item.closed_on = datetime.now()
            item.closed_by = user_id
        else:
            item.status = "open"
            item.corrected_on = None
        item.updated_at = datetime.now()
        await item.save()
        await audit(AuditAction.UPDATE, "punch_item", punch_id, user_id, site_id, after={"result": item.re_inspection_result})
        return item.dict()

    @staticmethod
    async def close(punch_id: str, site_id: str, user_id: str):
        item = await PunchItem.find_one({"punch_id": punch_id, "site_id": site_id})
        if not item:
            raise HTTPException(status_code=404, detail="Punch item not found")
        item.status = "closed"
        item.closed_on = datetime.now()
        item.closed_by = user_id
        item.updated_at = datetime.now()
        await item.save()
        await audit(AuditAction.UPDATE, "punch_item", punch_id, user_id, site_id, after={"status": "closed"})
        return item.dict()

    @staticmethod
    async def summary(job_id: str, site_id: str):
        """Count by category and status — open cat A items block release."""
        items = await PunchItem.find({"job_id": job_id, "site_id": site_id}).to_list()
        summary: dict = {}
        for cat in ("A", "B", "C"):
            cat_items = [i for i in items if i.category == cat]
            open_items = [i for i in cat_items if i.status not in ("closed", "waived")]
            summary[cat] = {"total": len(cat_items), "open": len(open_items), "closed": len(cat_items) - len(open_items)}
        summary["release_blocked"] = summary["A"]["open"] > 0
        return summary
