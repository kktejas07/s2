from typing import Optional
from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.feedback.service import FeedbackService, MRMService

router = APIRouter(prefix="/feedback", tags=["Feedback & MRM"])
mrm = APIRouter(prefix="/mrm", tags=["Management Review Meeting"])


# --- Client Feedback ---

@router.get("/")
async def list_feedback(
    client_id: Optional[str] = None,
    job_id: Optional[str] = None,
    search: str = "",
    page: int = 1,
    per_page: int = 100,
    user: dict = Depends(get_current_user),
):
    return await FeedbackService.list(user.get("site_id", "SITE-01"), client_id, job_id, search, page, per_page)


@router.get("/{feedback_id}")
async def get_feedback(feedback_id: str, user: dict = Depends(get_current_user)):
    return await FeedbackService.get(feedback_id, user.get("site_id", "SITE-01"))


@router.post("/")
async def create_feedback(data: dict, user: dict = Depends(get_current_user)):
    return await FeedbackService.create(data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.patch("/{feedback_id}/respond")
async def respond_to_feedback(feedback_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await FeedbackService.respond(feedback_id, data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.patch("/{feedback_id}/escalate")
async def escalate_feedback(feedback_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await FeedbackService.escalate(feedback_id, data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


# --- MRM ---

@mrm.get("/")
async def list_mrm(
    category: Optional[str] = None,
    period: Optional[str] = None,
    page: int = 1,
    per_page: int = 100,
    user: dict = Depends(get_current_user),
):
    return await MRMService.list(user.get("site_id", "SITE-01"), category, period, page, per_page)


@mrm.get("/{mrm_id}")
async def get_mrm(mrm_id: str, user: dict = Depends(get_current_user)):
    return await MRMService.get(mrm_id, user.get("site_id", "SITE-01"))


@mrm.post("/")
async def create_mrm(data: dict, user: dict = Depends(get_current_user)):
    return await MRMService.create(data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@mrm.patch("/{mrm_id}/decision")
async def record_decision(mrm_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await MRMService.record_decision(mrm_id, data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@mrm.patch("/{mrm_id}/close")
async def close_mrm(mrm_id: str, user: dict = Depends(get_current_user)):
    return await MRMService.close(mrm_id, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))
