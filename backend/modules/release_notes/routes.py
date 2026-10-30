from typing import Optional
from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.release_notes.service import ReleaseNoteService

router = APIRouter(prefix="/release-notes", tags=["Inspection Release Notes"])


@router.get("/")
async def list_release_notes(
    job_id: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    per_page: int = 100,
    user: dict = Depends(get_current_user),
):
    return await ReleaseNoteService.list(user.get("site_id", "SITE-01"), job_id, status, page, per_page)


@router.get("/{irn_id}")
async def get_release_note(irn_id: str, user: dict = Depends(get_current_user)):
    return await ReleaseNoteService.get(irn_id, user.get("site_id", "SITE-01"))


@router.post("/")
async def create_release_note(data: dict, user: dict = Depends(get_current_user)):
    return await ReleaseNoteService.create(data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.post("/{irn_id}/check-preconditions")
async def check_preconditions(irn_id: str, user: dict = Depends(get_current_user)):
    return await ReleaseNoteService.check_preconditions(irn_id, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.patch("/{irn_id}/recommend")
async def recommend(irn_id: str, user: dict = Depends(get_current_user)):
    return await ReleaseNoteService.recommend(irn_id, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.patch("/{irn_id}/approve")
async def approve(irn_id: str, user: dict = Depends(get_current_user)):
    return await ReleaseNoteService.approve(irn_id, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.patch("/{irn_id}/release")
async def release(irn_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await ReleaseNoteService.release(irn_id, data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))
