from __future__ import annotations
from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


class SignoffStatus(str):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REWORK = "rework"
    REJECTED = "rejected"


class ReportSignoff(Document):
    """Technical Manager review and sign-off of inspection reports (step 7).

    Deputy logic per org chart rev 1 and Annexure 2:
    - RH may sign within authorised scope for jobs they did not sell.
    - Otherwise another region's TM signs, arranged by Country Manager.
    - Never self-review: signer must not have been the inspector.
    """
    signoff_id: str  # SGN-YYYY-XXXX
    site_id: str = "SITE-01"
    job_id: str
    visit_id: Optional[str] = None
    report_ref: Optional[str] = None
    certification_id: Optional[str] = None

    # Who should sign
    assigned_tm_person_id: Optional[str] = None

    # Actual signer (may differ if deputy or cross-region TM)
    signed_by_person_id: Optional[str] = None
    signed_by_name: Optional[str] = None
    signed_by_role: str = "tm"  # tm, deputy_rh, cross_region_tm
    is_deputy: bool = False
    deputy_reason: Optional[str] = None
    cross_region_code: Optional[str] = None
    arranged_by: Optional[str] = None

    # Review outcome
    review_date: Optional[datetime] = None
    result: str = "pending"  # pending, approved, rework_required, rejected
    rework_notes: Optional[str] = None  # MS-12 rework instructions
    rework_count: int = 0

    # Verification checks
    scope_verified: bool = False
    coi_checked: bool = False  # conflict-of-interest: signer did not sell/inspect this job

    signed_on: Optional[datetime] = None
    status: str = "pending"
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "report_signoffs"
        indexes = ["site_id", "job_id", "status", "signed_by_person_id"]
