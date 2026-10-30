from __future__ import annotations
from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


class ClientFeedback(Document):
    feedback_id: str  # FBK-YYYY-XXXX
    site_id: str = "SITE-01"
    client_id: Optional[str] = None
    client_name: Optional[str] = None
    job_id: Optional[str] = None

    report_ref: Optional[str] = None
    feedback_date: datetime = Field(default_factory=datetime.now)

    # Rating areas (Manual 9.1.2)
    overall_rating: int = 0  # 1-5
    timeliness_rating: int = 0
    report_quality_rating: int = 0
    inspector_competence_rating: int = 0
    communication_rating: int = 0

    comments: Optional[str] = None
    improvement_suggestions: Optional[str] = None

    # Low rating escalation
    requires_escalation: bool = False
    escalated_to_mrm: bool = False
    mrm_ref: Optional[str] = None
    corrective_action: Optional[str] = None

    responded_by: Optional[str] = None
    responded_on: Optional[datetime] = None
    response_notes: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "client_feedback"
        indexes = ["site_id", "client_id", "job_id", "overall_rating"]


class MRMAgendaItem(Document):
    """Management Review Meeting agenda/minutes item (step 13)."""
    mrm_id: str  # MRM-YYYY-XXXX
    site_id: str = "SITE-01"
    meeting_date: Optional[datetime] = None
    period: Optional[str] = None  # "2026-Q3"

    category: str  # win_loss, kpi, complaints, feedback, ncr, audit, risk, manpower, budget
    title: str
    description: Optional[str] = None
    data_ref: Optional[str] = None

    presenter: Optional[str] = None
    decision: Optional[str] = None
    action_items: list[str] = []
    action_owner: Optional[str] = None
    action_due: Optional[datetime] = None

    status: str = "draft"  # draft, presented, actioned, closed
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "mrm_agenda"
        indexes = ["site_id", "category", "meeting_date"]
