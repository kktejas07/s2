from __future__ import annotations
from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


class InspectionReleaseNote(Document):
    """Gate: only when hold points signed, NCRs closed, cat. A punch items closed."""
    irn_id: str  # IRN-YYYY-XXXX
    site_id: str = "SITE-01"
    job_id: str
    work_package_id: Optional[str] = None

    description: str
    scope_summary: Optional[str] = None

    # Pre-conditions checked
    hold_points_signed: bool = False
    hold_points_count: int = 0
    hold_points_signed_count: int = 0
    ncrs_closed: bool = False
    ncr_total: int = 0
    ncr_closed_count: int = 0
    ncr_open_ids: list[str] = []
    cat_a_punch_closed: bool = False
    cat_a_total: int = 0
    cat_a_closed_count: int = 0
    cat_a_open_ids: list[str] = []

    # Approval
    recommended_by: Optional[str] = None  # TM
    recommended_on: Optional[datetime] = None
    approved_by: Optional[str] = None  # Country Manager
    approved_on: Optional[datetime] = None

    # Release
    released: bool = False
    release_date: Optional[datetime] = None
    release_certificate_doc_id: Optional[str] = None

    status: str = "draft"  # draft, preconditions_checked, recommended, approved, released, rejected
    rejection_reason: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "inspection_release_notes"
        indexes = ["site_id", "job_id", "status"]
