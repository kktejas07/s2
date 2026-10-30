from __future__ import annotations
from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


class KPIScore(BaseModel):
    kpi_code: str
    kpi_name: str
    target: Optional[str] = None
    actual: Optional[str] = None
    score: Optional[int] = None  # 1-5
    weight: float = 1.0
    remarks: Optional[str] = None


class Appraisal(Document):
    appraisal_id: str  # APR-YYYY-XXXX
    person_id: str
    site_id: str = "SITE-01"
    appraisal_period: str  # "2026-2027"
    reviewer_person_id: Optional[str] = None
    kpi_scores: list[KPIScore] = []
    overall_rating: Optional[int] = None  # 1-5
    strengths: Optional[str] = None
    improvement_areas: Optional[str] = None
    training_needs: list[str] = []
    authorization_recommendation: str = "maintain"  # maintain, extend, restrict, withdraw
    authorization_scopes_to_add: list[str] = []
    authorization_scopes_to_remove: list[str] = []
    reviewer_comments: Optional[str] = None
    employee_comments: Optional[str] = None
    status: str = "draft"  # draft, self_review, manager_review, completed
    completed_on: Optional[datetime] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "appraisals"
        indexes = ["site_id", "person_id", "appraisal_period", "status"]


class CompetenceAssessment(BaseModel):
    area: str
    rating: int = 0  # 1-5
    notes: Optional[str] = None


class WitnessedInspection(Document):
    witness_id: str  # WIT-YYYY-XXXX
    person_id: str
    site_id: str = "SITE-01"
    witnessed_by: str
    visit_id: Optional[str] = None
    job_id: Optional[str] = None
    inspection_type: str
    date: datetime
    competence_areas: list[CompetenceAssessment] = []
    overall_result: str = "pending"  # pending, satisfactory, needs_improvement, unsatisfactory
    follow_up_required: bool = False
    follow_up_notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "witnessed_inspections"
        indexes = ["site_id", "person_id", "witnessed_by", "overall_result"]
