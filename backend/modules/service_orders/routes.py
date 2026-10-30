from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.service_orders.service import ServiceOrderService

router = APIRouter(prefix="/service-orders", tags=["Service Orders"])


@router.get("", include_in_schema=False)
@router.get("/")
async def list(job_id: str = "", page: int = 1, per_page: int = 25, user: dict = Depends(get_current_user)):
    return await ServiceOrderService.list(user["site_id"], job_id, page, per_page)


@router.get("/next-number")
async def next_number(so_type: str = "SO", user: dict = Depends(get_current_user)):
    return {"next_number": await ServiceOrderService.get_next_number(so_type, user["site_id"])}


@router.get("/{so_id}")
async def get(so_id: str, user: dict = Depends(get_current_user)):
    return await ServiceOrderService.get(so_id, user.get("site_id", "SITE-01"))


@router.post("/")
async def create(data: dict, user: dict = Depends(get_current_user)):
    return await ServiceOrderService.create(data, user["site_id"], user["user_id"])


@router.put("/{so_id}")
async def update(so_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await ServiceOrderService.update(so_id, data, user.get("site_id", "SITE-01"))
