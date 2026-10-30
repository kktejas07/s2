from __future__ import annotations
from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


class ExitChecklistItem(BaseModel):
    item_code: str
    description: str
    department: str  # HR, IT, Finance, Operations
    completed: bool = False
    completed_on: Optional[datetime] = None
    completed_by: Optional[str] = None


DEFAULT_EXIT_CHECKLIST = [
    ExitChecklistItem(item_code="EX-01", description="Withdraw all inspection authorizations (H8)", department="Operations"),
    ExitChecklistItem(item_code="EX-02", description="Remove system access and credentials", department="IT"),
    ExitChecklistItem(item_code="EX-03", description="Collect company assets (laptop, ID card, tools)", department="IT"),
    ExitChecklistItem(item_code="EX-04", description="Collect calibration equipment", department="Operations"),
    ExitChecklistItem(item_code="EX-05", description="Handover pending jobs and assignments", department="Operations"),
    ExitChecklistItem(item_code="EX-06", description="Clear pending expense claims", department="Finance"),
    ExitChecklistItem(item_code="EX-07", description="Calculate final settlement", department="Finance"),
    ExitChecklistItem(item_code="EX-08", description="Issue relieving letter", department="HR"),
    ExitChecklistItem(item_code="EX-09", description="Issue experience certificate", department="HR"),
    ExitChecklistItem(item_code="EX-10", description="Exit interview", department="HR"),
    ExitChecklistItem(item_code="EX-11", description="Revoke confidentiality and impartiality declarations", department="HR"),
    ExitChecklistItem(item_code="EX-12", description="Remove from active inspector pool", department="Operations"),
]


class ExitProcess(Document):
    exit_id: str  # EXT-YYYY-XXXX
    person_id: str
    site_id: str = "SITE-01"
    exit_type: str = "resignation"  # resignation, termination, retirement, contract_end, absconding
    notice_date: Optional[datetime] = None
    last_working_date: Optional[datetime] = None
    reason: Optional[str] = None
    checklist: list[ExitChecklistItem] = []
    authorization_withdrawn: bool = False
    system_access_removed: bool = False
    assets_returned: bool = False
    final_settlement_amount: float = 0.0
    final_settlement_status: str = "pending"  # pending, calculated, approved, paid
    handover_person_id: Optional[str] = None
    handover_notes: Optional[str] = None
    exit_interview_done: bool = False
    exit_interview_notes: Optional[str] = None
    status: str = "initiated"  # initiated, in_progress, completed
    completed_on: Optional[datetime] = None
    processed_by: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "exit_processes"
        indexes = ["site_id", "person_id", "status"]
