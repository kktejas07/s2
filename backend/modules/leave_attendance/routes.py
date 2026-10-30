from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from core.auth import get_current_user
from modules.leave_attendance.service import LeaveAttendanceService

router = APIRouter(prefix="/leave-attendance", tags=["Leave & Attendance"])


# ── Leave ──────────────────────────────────────────────────────────────

@router.post("/leave")
async def create_leave(data: dict, user: dict = Depends(get_current_user)):
    return await LeaveAttendanceService.create_leave(data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.get("/leave")
async def list_leaves(
    person_id: Optional[str] = None, status: Optional[str] = None,
    page: int = 1, per_page: int = 100, user: dict = Depends(get_current_user),
):
    return await LeaveAttendanceService.list_leaves(user.get("site_id", "SITE-01"), person_id, status, page, per_page)


@router.patch("/leave/{leave_id}/approve")
async def approve_leave(leave_id: str, remarks: Optional[str] = None, user: dict = Depends(get_current_user)):
    return await LeaveAttendanceService.approve_leave(leave_id, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"), remarks)


@router.patch("/leave/{leave_id}/reject")
async def reject_leave(leave_id: str, remarks: Optional[str] = None, user: dict = Depends(get_current_user)):
    return await LeaveAttendanceService.reject_leave(leave_id, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"), remarks)


# ── Attendance ─────────────────────────────────────────────────────────

@router.post("/attendance")
async def create_attendance(data: dict, user: dict = Depends(get_current_user)):
    return await LeaveAttendanceService.create_attendance(data, user.get("site_id", "SITE-01"))


@router.get("/attendance")
async def list_attendance(
    person_id: Optional[str] = None,
    from_date: Optional[datetime] = None, to_date: Optional[datetime] = None,
    page: int = 1, per_page: int = 100, user: dict = Depends(get_current_user),
):
    return await LeaveAttendanceService.list_attendance(user.get("site_id", "SITE-01"), person_id, from_date, to_date, page, per_page)


@router.get("/attendance/summary/{person_id}")
async def attendance_summary(
    person_id: str, month: int = Query(...), year: int = Query(...),
    user: dict = Depends(get_current_user),
):
    return await LeaveAttendanceService.attendance_summary(person_id, user.get("site_id", "SITE-01"), month, year)


# ── Timesheets ─────────────────────────────────────────────────────────

@router.post("/timesheets")
async def create_timesheet(data: dict, user: dict = Depends(get_current_user)):
    return await LeaveAttendanceService.create_timesheet(data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.get("/timesheets")
async def list_timesheets(
    person_id: Optional[str] = None, status: Optional[str] = None,
    page: int = 1, per_page: int = 100, user: dict = Depends(get_current_user),
):
    return await LeaveAttendanceService.list_timesheets(user.get("site_id", "SITE-01"), person_id, status, page, per_page)


@router.get("/timesheets/{timesheet_id}")
async def get_timesheet(timesheet_id: str, user: dict = Depends(get_current_user)):
    return await LeaveAttendanceService.get_timesheet(timesheet_id, user.get("site_id", "SITE-01"))


@router.patch("/timesheets/{timesheet_id}/submit")
async def submit_timesheet(timesheet_id: str, user: dict = Depends(get_current_user)):
    return await LeaveAttendanceService.submit_timesheet(timesheet_id, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.patch("/timesheets/{timesheet_id}/approve")
async def approve_timesheet(timesheet_id: str, user: dict = Depends(get_current_user)):
    return await LeaveAttendanceService.approve_timesheet(timesheet_id, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))
