from typing import Optional
from datetime import datetime
from fastapi import HTTPException
from core.audit import AuditAction, record as audit
from modules.leave_attendance.models import (
    LeaveRequest, AttendanceRecord, Timesheet,
)


class LeaveAttendanceService:

    # ── Leave ──────────────────────────────────────────────────────────

    @staticmethod
    async def list_leaves(
        site_id: str, person_id: Optional[str] = None,
        status: Optional[str] = None, page: int = 1, per_page: int = 100,
    ):
        query: dict = {"site_id": site_id}
        if person_id:
            query["person_id"] = person_id
        if status:
            query["status"] = status
        total = await LeaveRequest.find(query).count()
        items = (
            await LeaveRequest.find(query)
            .skip((page - 1) * per_page).limit(per_page)
            .sort(-LeaveRequest.created_at).to_list()
        )
        return {"total": total, "items": items, "page": page, "per_page": per_page}

    @staticmethod
    async def create_leave(data: dict, site_id: str, user_id: str):
        leave = LeaveRequest(**data, site_id=site_id, created_by=user_id)
        await leave.insert()
        await audit(AuditAction.CREATE, "leave_requests", leave.leave_id, user_id, site_id)
        return leave

    @staticmethod
    async def approve_leave(leave_id: str, site_id: str, user_id: str, remarks: Optional[str] = None):
        leave = await LeaveRequest.find_one({"leave_id": leave_id, "site_id": site_id})
        if not leave:
            raise HTTPException(404, "Leave request not found")
        if leave.status != "pending":
            raise HTTPException(400, f"Cannot approve a {leave.status} request")
        leave.status = "approved"
        leave.approved_by = user_id
        leave.approved_on = datetime.now()
        if remarks:
            leave.remarks = remarks
        leave.updated_at = datetime.now()
        await leave.save()
        await audit(AuditAction.UPDATE, "leave_requests", leave_id, user_id, site_id, {"status": "approved"})
        return leave

    @staticmethod
    async def reject_leave(leave_id: str, site_id: str, user_id: str, remarks: Optional[str] = None):
        leave = await LeaveRequest.find_one({"leave_id": leave_id, "site_id": site_id})
        if not leave:
            raise HTTPException(404, "Leave request not found")
        if leave.status != "pending":
            raise HTTPException(400, f"Cannot reject a {leave.status} request")
        leave.status = "rejected"
        leave.approved_by = user_id
        leave.approved_on = datetime.now()
        if remarks:
            leave.remarks = remarks
        leave.updated_at = datetime.now()
        await leave.save()
        await audit(AuditAction.UPDATE, "leave_requests", leave_id, user_id, site_id, {"status": "rejected"})
        return leave

    # ── Attendance ─────────────────────────────────────────────────────

    @staticmethod
    async def list_attendance(
        site_id: str, person_id: Optional[str] = None,
        from_date: Optional[datetime] = None, to_date: Optional[datetime] = None,
        page: int = 1, per_page: int = 100,
    ):
        query: dict = {"site_id": site_id}
        if person_id:
            query["person_id"] = person_id
        if from_date or to_date:
            date_q: dict = {}
            if from_date:
                date_q["$gte"] = from_date
            if to_date:
                date_q["$lte"] = to_date
            query["date"] = date_q
        total = await AttendanceRecord.find(query).count()
        items = (
            await AttendanceRecord.find(query)
            .skip((page - 1) * per_page).limit(per_page)
            .sort(-AttendanceRecord.date).to_list()
        )
        return {"total": total, "items": items, "page": page, "per_page": per_page}

    @staticmethod
    async def create_attendance(data: dict, site_id: str):
        record = AttendanceRecord(**data, site_id=site_id)
        await record.insert()
        return record

    @staticmethod
    async def attendance_summary(person_id: str, site_id: str, month: int, year: int):
        from_dt = datetime(year, month, 1)
        to_month = month + 1 if month < 12 else 1
        to_year = year if month < 12 else year + 1
        to_dt = datetime(to_year, to_month, 1)
        query = {"site_id": site_id, "person_id": person_id, "date": {"$gte": from_dt, "$lt": to_dt}}
        records = await AttendanceRecord.find(query).to_list()
        summary = {"present": 0, "absent": 0, "half_day": 0, "on_leave": 0, "holiday": 0, "weekly_off": 0}
        total_hours = 0.0
        for r in records:
            summary[r.status] = summary.get(r.status, 0) + 1
            total_hours += r.hours_worked
        return {
            "person_id": person_id, "month": month, "year": year,
            "breakdown": summary, "total_hours": total_hours, "total_records": len(records),
        }

    # ── Timesheets ─────────────────────────────────────────────────────

    @staticmethod
    async def list_timesheets(
        site_id: str, person_id: Optional[str] = None,
        status: Optional[str] = None, page: int = 1, per_page: int = 100,
    ):
        query: dict = {"site_id": site_id}
        if person_id:
            query["person_id"] = person_id
        if status:
            query["status"] = status
        total = await Timesheet.find(query).count()
        items = (
            await Timesheet.find(query)
            .skip((page - 1) * per_page).limit(per_page)
            .sort(-Timesheet.created_at).to_list()
        )
        return {"total": total, "items": items, "page": page, "per_page": per_page}

    @staticmethod
    async def create_timesheet(data: dict, site_id: str, user_id: str):
        ts = Timesheet(**data, site_id=site_id, created_by=user_id)
        await ts.insert()
        await audit(AuditAction.CREATE, "timesheets", ts.timesheet_id, user_id, site_id)
        return ts

    @staticmethod
    async def get_timesheet(timesheet_id: str, site_id: str):
        ts = await Timesheet.find_one({"timesheet_id": timesheet_id, "site_id": site_id})
        if not ts:
            raise HTTPException(404, "Timesheet not found")
        return ts

    @staticmethod
    async def submit_timesheet(timesheet_id: str, site_id: str, user_id: str):
        ts = await Timesheet.find_one({"timesheet_id": timesheet_id, "site_id": site_id})
        if not ts:
            raise HTTPException(404, "Timesheet not found")
        if ts.status != "draft":
            raise HTTPException(400, f"Cannot submit a {ts.status} timesheet")
        ts.status = "submitted"
        ts.updated_at = datetime.now()
        await ts.save()
        await audit(AuditAction.UPDATE, "timesheets", timesheet_id, user_id, site_id, {"status": "submitted"})
        return ts

    @staticmethod
    async def approve_timesheet(timesheet_id: str, site_id: str, user_id: str):
        ts = await Timesheet.find_one({"timesheet_id": timesheet_id, "site_id": site_id})
        if not ts:
            raise HTTPException(404, "Timesheet not found")
        if ts.status != "submitted":
            raise HTTPException(400, f"Cannot approve a {ts.status} timesheet")
        ts.status = "approved"
        ts.approved_by = user_id
        ts.approved_on = datetime.now()
        ts.updated_at = datetime.now()
        await ts.save()
        await audit(AuditAction.UPDATE, "timesheets", timesheet_id, user_id, site_id, {"status": "approved"})
        return ts
