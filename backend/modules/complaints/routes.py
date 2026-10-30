from typing import Optional
from fastapi import APIRouter, Body, Depends
from core.auth import get_current_user
from modules.complaints.service import ComplaintService

router = APIRouter(prefix="/complaints", tags=["Complaints"])


@router.get("/")
async def list_complaints(
    search: str = "", 
    alpha: str = "", 
    is_active: Optional[bool] = None, 
    page: int = 1, 
    per_page: int = 100, 
    user: dict = Depends(get_current_user)
):
    return await ComplaintService.list(user.get("site_id", "SITE-01"), search, alpha, is_active, page, per_page)


@router.get("/{complaint_id}")
async def get_complaint(complaint_id: str, user: dict = Depends(get_current_user)):
    return await ComplaintService.get(complaint_id, user.get("site_id", "SITE-01"))


@router.post("/")
async def create_complaint(data: dict, user: dict = Depends(get_current_user)):
    return await ComplaintService.create(data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.put("/{complaint_id}")
async def update_complaint(complaint_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await ComplaintService.update(complaint_id, data)


@router.patch("/{complaint_id}/status")
async def toggle_complaint_status(complaint_id: str, is_active: bool, user: dict = Depends(get_current_user)):
    return await ComplaintService.toggle_status(complaint_id, is_active, user.get("site_id", "SITE-01"))


@router.post("/{complaint_id}/escalate-to-risk")
async def escalate_to_risk(
    complaint_id: str, body: dict = Body(...), user: dict = Depends(get_current_user)
):
    """Raise the preventive half of a complaint as a risk.

    ISO/IEC 17020:2026 replaced preventive action with risk management, so
    "stop this recurring" has nowhere to live on the complaint itself.
    """
    return await ComplaintService.escalate_to_risk(
        complaint_id, body,
        user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )
