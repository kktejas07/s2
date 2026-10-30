from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.job_handoff.service import JobHandoffService

router = APIRouter(prefix="/job-handoff", tags=["Job Handoff (Enquiry → Job)"])


@router.post("/convert")
async def convert_enquiry(data: dict, user: dict = Depends(get_current_user)):
    return await JobHandoffService.convert_enquiry_to_job(
        data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )


@router.get("/conversions")
async def list_conversions(page: int = 1, per_page: int = 50, user: dict = Depends(get_current_user)):
    return await JobHandoffService.list_conversions(user.get("site_id", "SITE-01"), page, per_page)


@router.get("/conversions/{conversion_id}")
async def get_conversion(conversion_id: str, user: dict = Depends(get_current_user)):
    return await JobHandoffService.get_conversion(conversion_id, user.get("site_id", "SITE-01"))
