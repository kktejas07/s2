from typing import Optional
from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.appraisal.service import AppraisalService

router = APIRouter(prefix="/appraisals", tags=["Appraisal & Competence Monitoring"])


@router.post("/")
async def create_appraisal(data: dict, user: dict = Depends(get_current_user)):
    return await AppraisalService.create_appraisal(data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.get("/")
async def list_appraisals(
    person_id: Optional[str] = None, status: Optional[str] = None,
    page: int = 1, per_page: int = 100, user: dict = Depends(get_current_user),
):
    return await AppraisalService.list_appraisals(user.get("site_id", "SITE-01"), person_id, status, page, per_page)


@router.get("/{appraisal_id}")
async def get_appraisal(appraisal_id: str, user: dict = Depends(get_current_user)):
    return await AppraisalService.get_appraisal(appraisal_id, user.get("site_id", "SITE-01"))


@router.patch("/{appraisal_id}/self-review")
async def self_review(appraisal_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await AppraisalService.self_review(appraisal_id, data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.patch("/{appraisal_id}/manager-review")
async def manager_review(appraisal_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await AppraisalService.manager_review(appraisal_id, data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.patch("/{appraisal_id}/complete")
async def complete_appraisal(appraisal_id: str, user: dict = Depends(get_current_user)):
    return await AppraisalService.complete_appraisal(appraisal_id, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


# ── Witnessed Inspections ──────────────────────────────────────────────

@router.post("/witnessed")
async def create_witnessed(data: dict, user: dict = Depends(get_current_user)):
    return await AppraisalService.create_witnessed(data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.get("/witnessed")
async def list_witnessed(
    person_id: Optional[str] = None, page: int = 1, per_page: int = 100,
    user: dict = Depends(get_current_user),
):
    return await AppraisalService.list_witnessed(user.get("site_id", "SITE-01"), person_id, page, per_page)


@router.get("/witnessed/{person_id}")
async def get_witnessed_for_person(person_id: str, user: dict = Depends(get_current_user)):
    return await AppraisalService.get_witnessed_for_person(person_id, user.get("site_id", "SITE-01"))
