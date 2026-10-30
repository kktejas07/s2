from typing import Optional
from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.rfi.service import RFIService

router = APIRouter(prefix="/rfis", tags=["RFI (Request for Inspection)"])


@router.get("/")
async def list_rfis(
    job_id: Optional[str] = None,
    status: Optional[str] = None,
    search: str = "",
    page: int = 1,
    per_page: int = 100,
    user: dict = Depends(get_current_user),
):
    return await RFIService.list(user.get("site_id", "SITE-01"), job_id, status, search, page, per_page)


@router.get("/turnaround")
async def rfi_turnaround(job_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    return await RFIService.turnaround_report(user.get("site_id", "SITE-01"), job_id)


@router.get("/{rfi_id}")
async def get_rfi(rfi_id: str, user: dict = Depends(get_current_user)):
    return await RFIService.get(rfi_id, user.get("site_id", "SITE-01"))


@router.post("/")
async def create_rfi(data: dict, user: dict = Depends(get_current_user)):
    return await RFIService.create(data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.patch("/{rfi_id}/schedule")
async def schedule_rfi(rfi_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await RFIService.schedule(rfi_id, data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.patch("/{rfi_id}/confirm")
async def confirm_rfi(rfi_id: str, user: dict = Depends(get_current_user)):
    return await RFIService.confirm(rfi_id, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.patch("/{rfi_id}/result")
async def record_result(rfi_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await RFIService.record_result(rfi_id, data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))
