from __future__ import annotations
from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


class PunchItem(Document):
    punch_id: str  # PUN-YYYY-XXXX
    site_id: str = "SITE-01"
    job_id: str
    work_package_id: Optional[str] = None
    ncr_id: Optional[str] = None

    category: str = "B"  # A (must close before release), B (close before handover), C (minor/cosmetic)
    discipline: Optional[str] = None
    location: Optional[str] = None
    description: str
    raised_by: Optional[str] = None
    raised_on: datetime = Field(default_factory=datetime.now)

    responsible_contractor: Optional[str] = None
    target_date: Optional[datetime] = None

    # Correction and re-inspection
    corrected_on: Optional[datetime] = None
    re_inspected: bool = False
    re_inspected_by: Optional[str] = None
    re_inspected_on: Optional[datetime] = None
    re_inspection_result: Optional[str] = None  # accepted, rejected

    photo_ids: list[str] = []
    status: str = "open"  # open, corrected, re_inspected, closed, waived
    closed_on: Optional[datetime] = None
    closed_by: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "punch_items"
        indexes = ["site_id", "job_id", "category", "status"]
