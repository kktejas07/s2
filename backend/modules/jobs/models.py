from __future__ import annotations
from typing import Optional
from datetime import datetime
from beanie import Document


from pydantic import BaseModel, Field


class SOWItem(BaseModel):
    item_id: str
    description: str
    category: str = "Inspection Criterion"
    is_checklist: bool = True
    completed: bool = False
    notes: Optional[str] = None


class AssignmentHistoryEntry(BaseModel):
    entry_id: str
    inspector_id: str
    inspector_name: str
    certifications: list[str] = []
    experience_years: int = 10
    submitted_at: datetime = Field(default_factory=datetime.now)
    status: str = "pending_client_approval"  # pending_client_approval, approved_by_client, rejected_by_client
    client_remarks: Optional[str] = None
    decided_at: Optional[datetime] = None


class Job(Document):
    job_id: str
    site_id: str = "SITE-01"
    status: str = "draft"
    
    # Client & Plant Unit Link
    client_id: Optional[str] = None
    client_name: Optional[str] = None
    client_unit_id: Optional[str] = None
    client_unit_name: Optional[str] = None
    
    # Supplier / Manufacturer Link
    manufacturer_id: Optional[str] = None
    manufacturer_name: Optional[str] = None
    manufacturer_unit_id: Optional[str] = None
    manufacturer_unit_name: Optional[str] = None
    
    # Purchase Order Reference Link
    po_id: Optional[str] = None
    po_number: Optional[str] = None
    
    title: str
    description: Optional[str] = None
    job_type: str = "inspection"
    job_type_category: str = "PV-PIPE"  # PV-PIPE, STR-FAB, NDT-RAD, VND-AUD, PRE-SHP, CUSTOM

    # Service line and region (P1, R1)
    service_line: str = "PART_B"  # PART_A (TPI/accredited), PART_B (accredited scope), PART_C (EPC project support), MANPOWER (secondment)
    region_code: Optional[str] = None  # N, S, E, W
    financial_year: Optional[str] = None  # "2627"
    j_no: Optional[str] = None  # S-2627-0001 format (region-FY-sequence)
    enquiry_id: Optional[str] = None
    project_quality_plan_id: Optional[str] = None
    parts_in_scope: list[str] = []  # ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
    
    # Inspector CV & Client Approval Portal Fields
    assigned_inspector_id: Optional[str] = None
    assigned_inspector_name: Optional[str] = None
    inspector_cv_resume: Optional[str] = None
    inspector_certifications: list[str] = []
    inspector_experience_years: int = 10
    client_approval_status: str = "draft"  # draft, pending_client_approval, approved_by_client, rejected_by_client
    client_approval_remarks: Optional[str] = None
    client_approved_at: Optional[datetime] = None
    
    # Assignment History Audit Trail Roadmap
    inspector_assignment_history: list[AssignmentHistoryEntry] = []
    
    # Budget Breakdown & Dates
    budget_contract_amount: float = 0.0
    budget_inspector_fee: float = 0.0
    budget_travel_allowance: float = 0.0
    budget_total: float = 0.0
    budget: float = 0.0
    currency: str = "INR"
    scheduled_start_date: Optional[datetime] = None
    scheduled_end_date: Optional[datetime] = None
    requested_start: Optional[datetime] = None
    requested_end: Optional[datetime] = None
    
    # Scope of Work (SOW) & Checklists
    scope_of_work: list[SOWItem] = []
    
    location_address: Optional[str] = None
    requires_qc: bool = True
    requires_finance: bool = True
    tags: list[str] = []
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    closed_on: Optional[datetime] = None
    close_reason: Optional[str] = None

    class Settings:
        name = "jobs"
        indexes = ["site_id", "status", "created_at", "job_id"]
