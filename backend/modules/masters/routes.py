from fastapi import APIRouter
from modules.masters.service import MasterDataService

router = APIRouter(prefix="/masters", tags=["Master Data"])


@router.get("/visit-statuses")
async def get_visit_statuses():
    return await MasterDataService.get_visit_statuses()


@router.get("/job-types")
async def get_job_types():
    return await MasterDataService.get_job_types()


@router.get("/user-roles")
async def get_user_roles():
    return await MasterDataService.get_user_roles()


@router.get("/invoice-types")
async def get_invoice_types():
    return await MasterDataService.get_invoice_types()


@router.get("/complaint-modes")
async def get_complaint_modes():
    return await MasterDataService.get_complaint_modes()


@router.get("/expense-types")
async def get_expense_types():
    return await MasterDataService.get_expense_types()


@router.get("/photo-categories")
async def get_photo_categories():
    return await MasterDataService.get_photo_categories()


@router.get("/finding-severities")
async def get_finding_severities():
    return await MasterDataService.get_finding_severities()
