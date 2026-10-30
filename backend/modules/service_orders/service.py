from fastapi import HTTPException
from modules.service_orders.models import ServiceOrder
from datetime import datetime


class ServiceOrderService:

    @staticmethod
    async def list(site_id: str, job_id: str = "", page: int = 1, per_page: int = 25):
        query = {"site_id": site_id}
        if job_id: query["job_id"] = job_id
        total = await ServiceOrder.find(query).count()
        items = await ServiceOrder.find(query).sort(-ServiceOrder.created_at).skip((page - 1) * per_page).limit(per_page).to_list()
        return {"total": total, "page": page, "per_page": per_page, "data": [s.dict() for s in items]}

    @staticmethod
    async def get(so_id: str, site_id: str = "SITE-01"):
        so = await ServiceOrder.find_one(ServiceOrder.so_id == so_id, ServiceOrder.site_id == site_id)
        if not so: raise HTTPException(404, "Service Order not found")
        return so

    @staticmethod
    async def create(data: dict, site_id: str, user_id: str):
        so_id = data.get("so_id")
        if not so_id:
            so_id = await ServiceOrderService.get_next_number(data.get("so_type", "SO"), site_id)
            data["so_id"] = so_id
        else:
            existing = await ServiceOrder.find_one(ServiceOrder.so_id == so_id, ServiceOrder.site_id == site_id)
            if existing: raise HTTPException(400, "Service Order ID already exists")
        if not data.get("so_number"):
            data["so_number"] = so_id
        if "items" in data and "po_items" not in data:
            data["po_items"] = data.pop("items")
        so = ServiceOrder(**data, site_id=site_id, created_by=user_id)
        await so.insert()
        return so

    @staticmethod
    async def update(so_id: str, data: dict, site_id: str = "SITE-01"):
        so = await ServiceOrder.find_one(ServiceOrder.so_id == so_id, ServiceOrder.site_id == site_id)
        if not so: raise HTTPException(404, "Service Order not found")
        for k, v in data.items():
            if hasattr(so, k) and k not in ("so_id", "site_id", "created_at"):
                setattr(so, k, v)
        so.updated_at = datetime.now()
        await so.save()
        return so

    @staticmethod
    async def get_next_number(so_type: str, site_id: str):
        count = await ServiceOrder.find(ServiceOrder.site_id == site_id, ServiceOrder.so_type == so_type).count()
        prefix = "LOI" if so_type == "LOI" else "SO"
        year = datetime.now().strftime("%Y")
        return f"{prefix}-{year}-{count + 1:04d}"
