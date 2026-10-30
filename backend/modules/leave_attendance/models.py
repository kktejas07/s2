from __future__ import annotations
from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


class LeaveRequest(Document):
    leave_id: str
    person_id: str
    site_id: str = "SITE-01"
    leave_type: str = "casual"  # casual, sick, earned, unpaid, comp_off
    from_date: datetime
    to_date: datetime
    days: float = 1.0
    reason: Optional[str] = None
    approved_by: Optional[str] = None
    approved_on: Optional[datetime] = None
    status: str = "pending"  # pending, approved, rejected, cancelled
    remarks: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "leave_requests"
        indexes = ["site_id", "person_id", "status", "from_date"]


class AttendanceRecord(Document):
    attendance_id: str
    person_id: str
    site_id: str = "SITE-01"
    date: datetime
    status: str = "present"  # present, absent, half_day, on_leave, holiday, weekly_off
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    hours_worked: float = 0.0
    job_id: Optional[str] = None
    region_code: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "attendance_records"
        indexes = ["site_id", "person_id", "date"]


class TimesheetEntry(BaseModel):
    date: datetime
    job_id: Optional[str] = None
    hours: float = 0.0
    activity_type: str = "inspection"  # inspection, travel, training, admin
    remarks: Optional[str] = None


class Timesheet(Document):
    timesheet_id: str
    person_id: str
    site_id: str = "SITE-01"
    period_month: int
    period_year: int
    home_region: Optional[str] = None
    working_region: Optional[str] = None
    entries: list[TimesheetEntry] = []
    total_days: float = 0.0
    total_hours: float = 0.0
    approved_by: Optional[str] = None
    approved_on: Optional[datetime] = None
    status: str = "draft"  # draft, submitted, approved, rejected
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "timesheets"
        indexes = ["site_id", "person_id", "period_year", "period_month", "status"]
