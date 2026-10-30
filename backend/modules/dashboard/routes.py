from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.jobs.service import JobService
from modules.dashboard.service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def stats(user: dict = Depends(get_current_user)):
    return await JobService.dashboard(user["site_id"])

@router.get("/admin-counts")
async def admin_counts(user: dict = Depends(get_current_user)):
    return await DashboardService.get_admin_counts(user.get("site_id", "SITE-01"))

@router.get("/bento-summary")
async def bento_summary(user: dict = Depends(get_current_user)):
    return await DashboardService.get_bento_data(user.get("site_id", "SITE-01"))

@router.get("/bento-summary/", include_in_schema=False)
async def bento_summary_slash(user: dict = Depends(get_current_user)):
    return await DashboardService.get_bento_data(user.get("site_id", "SITE-01"))

