from typing import Optional
from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.visits.service import VisitService
from modules.visits.models import Expense, Photo, Finding
from pydantic import BaseModel

router = APIRouter(prefix="/visits", tags=["Visits"])


class QCReq(BaseModel):
    status: str
    comments: str = ""


class FinReq(BaseModel):
    status: str
    comments: str = ""


class SubmitReq(BaseModel):
    inspection_report_no: Optional[str] = None
    comments: Optional[str] = None
    visited_from: Optional[str] = None
    visited_to: Optional[str] = None
    report_content: Optional[str] = None
    report_mode: Optional[str] = "ai"


@router.get("", include_in_schema=False)
@router.get("/")
async def list_visits(
    search: str = "",
    alpha: str = "",
    status: str = "",
    is_active: Optional[bool] = None,
    page: int = 1,
    per_page: int = 100,
    user: dict = Depends(get_current_user)
):
    return await VisitService.list(
        user.get("site_id", "SITE-01"),
        search,
        alpha,
        status,
        is_active,
        page,
        per_page
    )


@router.get("/logsheet")
async def get_logsheet(
    search: str = "",
    alpha: str = "",
    status: str = "",
    is_active: Optional[bool] = None,
    page: int = 1,
    per_page: int = 100,
    user: dict = Depends(get_current_user)
):
    return await VisitService.get_logsheet(
        user.get("site_id", "SITE-01"),
        search,
        alpha,
        status,
        is_active,
        page,
        per_page
    )


@router.get("/{visit_id}/master-report")
async def get_master_report(visit_id: str, user: dict = Depends(get_current_user)):
    return await VisitService.get_master_report(visit_id, user.get("site_id", "SITE-01"))


@router.get("/{visit_id}")
async def get_visit(visit_id: str, user: dict = Depends(get_current_user)):
    return await VisitService.get(visit_id)


@router.post("/")
async def create_visit(data: dict, user: dict = Depends(get_current_user)):
    return await VisitService.create(data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.put("/{visit_id}")
async def update_visit(visit_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await VisitService.update(visit_id, data)


@router.patch("/{visit_id}/status")
async def toggle_visit_status(visit_id: str, is_active: bool, user: dict = Depends(get_current_user)):
    return await VisitService.toggle_status(visit_id, is_active)


@router.patch("/{visit_id}/accept")
async def accept_visit(visit_id: str, user: dict = Depends(get_current_user)):
    return await VisitService.update_status(visit_id, "initiated", ["scheduled"])


@router.patch("/{visit_id}/scope-checklists")
async def update_scope_checklists(visit_id: str, checklists: list[dict], user: dict = Depends(get_current_user)):
    return await VisitService.update_scope_checklists(visit_id, checklists)


@router.patch("/{visit_id}/submit")
async def submit_visit(visit_id: str, data: SubmitReq, user: dict = Depends(get_current_user)):
    return await VisitService.submit(visit_id, data.dict(exclude_none=True))


@router.patch("/{visit_id}/quality-check")
async def quality_check(visit_id: str, data: QCReq, user: dict = Depends(get_current_user)):
    return await VisitService.quality_check(visit_id, data.status, data.comments, user.get("user_id", "USR-001"))


@router.patch("/{visit_id}/finance-approval")
async def finance_approval(visit_id: str, data: FinReq, user: dict = Depends(get_current_user)):
    return await VisitService.finance_approval(visit_id, data.status, data.comments, user.get("user_id", "USR-001"))


@router.post("/{visit_id}/generate-invoice")
async def generate_visit_invoice(visit_id: str, user: dict = Depends(get_current_user)):
    return await VisitService.generate_invoice_from_visit(visit_id, user.get("user_id", "USR-001"))


@router.post("/{visit_id}/expenses")
async def add_expense(visit_id: str, expense: Expense, user: dict = Depends(get_current_user)):
    return await VisitService.add_expense(visit_id, expense)


@router.post("/{visit_id}/photos")
async def add_photo(visit_id: str, photo: Photo, user: dict = Depends(get_current_user)):
    return await VisitService.add_photo(visit_id, photo)


@router.post("/{visit_id}/findings")
async def add_finding(visit_id: str, finding: Finding, user: dict = Depends(get_current_user)):
    return await VisitService.add_finding(visit_id, finding)


class GPSCheckinReq(BaseModel):
    lat: float
    lng: float
    accuracy_m: float = 12.5


@router.post("/{visit_id}/gps-checkin")
async def record_gps_checkin(visit_id: str, data: GPSCheckinReq, user: dict = Depends(get_current_user)):
    return await VisitService.record_gps_checkin(
        visit_id, data.lat, data.lng, data.accuracy_m, user.get("user_id", "USR-001")
    )


@router.post("/{visit_id}/gps-checkin/", include_in_schema=False)
async def record_gps_checkin_slash(visit_id: str, data: GPSCheckinReq, user: dict = Depends(get_current_user)):
    return await VisitService.record_gps_checkin(
        visit_id, data.lat, data.lng, data.accuracy_m, user.get("user_id", "USR-001")
    )

