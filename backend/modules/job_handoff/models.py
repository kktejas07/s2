from __future__ import annotations
from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import Field


class JobConversion(Document):
    """Records the handoff from a WON enquiry to a new Job (step 4).

    When an enquiry reaches WON status, this conversion record is created
    and a Job is opened with the J.No format: {region}-{FY}-{sequence}.
    """
    conversion_id: str  # CNV-YYYY-XXXX
    site_id: str = "SITE-01"
    enquiry_id: str
    proposal_id: Optional[str] = None
    revision_no: Optional[int] = None

    # Award details
    award_reference: Optional[str] = None
    award_date: Optional[datetime] = None
    award_value: float = 0.0

    # Generated Job
    job_id: Optional[str] = None
    j_no: Optional[str] = None

    # Trigger for manpower request (H1)
    manpower_request_ids: list[str] = []

    converted_by: Optional[str] = None
    converted_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "job_conversions"
        indexes = ["site_id", "enquiry_id", "job_id"]
