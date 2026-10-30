from __future__ import annotations
from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


class RFI(Document):
    """Request for Inspection — contractor raises against ITP line."""
    rfi_id: str  # RFI-YYYY-XXXX
    site_id: str = "SITE-01"
    job_id: str
    work_package_id: Optional[str] = None
    itp_id: Optional[str] = None
    itp_line_ref: Optional[str] = None

    contractor_name: Optional[str] = None
    raised_by: Optional[str] = None
    raised_on: datetime = Field(default_factory=datetime.now)

    inspection_point_type: str = "hold"  # hold, witness, surveillance, review
    discipline: Optional[str] = None
    description: str
    location: Optional[str] = None
    requested_date: Optional[datetime] = None

    # Scheduling (IC schedules, TM confirms)
    scheduled_date: Optional[datetime] = None
    scheduled_by: Optional[str] = None  # IC
    inspector_person_id: Optional[str] = None
    tm_confirmed: bool = False
    tm_confirmed_by: Optional[str] = None

    # Result
    inspection_date: Optional[datetime] = None
    result: Optional[str] = None  # accepted, rejected, conditional
    visit_id: Optional[str] = None
    ncr_ids: list[str] = []

    # Turnaround tracking (KPI indicator)
    turnaround_hours: Optional[float] = None

    status: str = "open"  # open, scheduled, inspected, closed, cancelled
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "rfis"
        indexes = ["site_id", "job_id", "status", "rfi_id"]
