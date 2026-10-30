from typing import Optional
from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.signoff.service import SignoffService

router = APIRouter(prefix="/signoffs", tags=["Report Sign-off"])


@router.post("/")
async def create_signoff(data: dict, user: dict = Depends(get_current_user)):
    return await SignoffService.create(data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.get("/")
async def list_signoffs(
    job_id: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    per_page: int = 50,
    user: dict = Depends(get_current_user),
):
    return await SignoffService.list(user.get("site_id", "SITE-01"), job_id, status, page=page, per_page=per_page)


@router.get("/pending")
async def pending_signoffs(user: dict = Depends(get_current_user)):
    person_id = user.get("person_id") or user.get("user_id", "USR-001")
    return await SignoffService.pending_for_user(person_id, user.get("site_id", "SITE-01"))


@router.get("/{signoff_id}")
async def get_signoff(signoff_id: str, user: dict = Depends(get_current_user)):
    return await SignoffService.get(signoff_id, user.get("site_id", "SITE-01"))


@router.patch("/{signoff_id}/review")
async def submit_review(signoff_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await SignoffService.submit_review(
        signoff_id, data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )


@router.patch("/{signoff_id}/assign-deputy")
async def assign_deputy(signoff_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await SignoffService.assign_deputy(
        signoff_id, data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )
