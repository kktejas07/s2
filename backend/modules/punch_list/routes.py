from typing import Optional
from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.punch_list.service import PunchListService

router = APIRouter(prefix="/punch-list", tags=["Punch List"])


@router.get("/")
async def list_punch_items(
    job_id: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: str = "",
    page: int = 1,
    per_page: int = 100,
    user: dict = Depends(get_current_user),
):
    return await PunchListService.list(user.get("site_id", "SITE-01"), job_id, category, status, search, page, per_page)


@router.get("/summary/{job_id}")
async def punch_summary(job_id: str, user: dict = Depends(get_current_user)):
    return await PunchListService.summary(job_id, user.get("site_id", "SITE-01"))


@router.get("/{punch_id}")
async def get_punch_item(punch_id: str, user: dict = Depends(get_current_user)):
    return await PunchListService.get(punch_id, user.get("site_id", "SITE-01"))


@router.post("/")
async def create_punch_item(data: dict, user: dict = Depends(get_current_user)):
    return await PunchListService.create(data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.patch("/{punch_id}/correct")
async def mark_corrected(punch_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await PunchListService.mark_corrected(punch_id, data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.patch("/{punch_id}/re-inspect")
async def re_inspect(punch_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await PunchListService.re_inspect(punch_id, data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.patch("/{punch_id}/close")
async def close_punch_item(punch_id: str, user: dict = Depends(get_current_user)):
    return await PunchListService.close(punch_id, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))
