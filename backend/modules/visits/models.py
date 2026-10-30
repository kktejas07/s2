from __future__ import annotations
from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


class Expense(BaseModel):
    expense_id: str
    type: str = "travel"
    description: Optional[str] = None
    amount: float = 0.0
    km: Optional[float] = None
    currency: str = "INR"
    notes: Optional[str] = None


class Photo(BaseModel):
    photo_id: str
    url: str
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    category: str = "visual"
    ai_tags: list[str] = []
    defect_found: Optional[bool] = None
    captured_at: Optional[datetime] = None


class Finding(BaseModel):
    finding_id: str
    description: str
    severity: str = "observation"
    category: str = "visual"
    photo_ids: list[str] = []
    inspector_notes: Optional[str] = None
    ai_suggested: bool = False


class ScopeCheckItem(BaseModel):
    item_id: str
    title: str
    description: Optional[str] = None
    category: str = "Scope Verification"
    is_completed: bool = False
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None


class Visit(Document):
    visit_id: str  # e.g. VST-2026-001
    site_id: str = "SITE-01"
    job_id: Optional[str] = None
    control_number_id: Optional[str] = None
    so_id: Optional[str] = None
    po_id: Optional[str] = None
    po_number: Optional[str] = None
    
    # Client & Plant Site Details
    client_id: Optional[str] = None
    customer_name: Optional[str] = None
    client_unit_id: Optional[str] = None
    client_unit_name: Optional[str] = None
    
    # Supplier / Manufacturer Details & Works Sites
    manufacturer_id: Optional[str] = None
    manufacturer_name: Optional[str] = None
    manufacturer_unit_id: Optional[str] = None
    manufacturer_unit_name: Optional[str] = None
    
    plant_location: Optional[str] = None
    protocol_standard: str = "ISO 9001:2026 & ISO/IEC 17020:2026 Quality Inspection Protocol"  # Standard TPI Inspection Protocol
    environmental_condition: Optional[str] = "Normal (Safety & Heat stress audited per ISO 9001:2026 Cl. 4.1)"
    impartiality_declared: bool = True  # Conflict of interest declaration per ISO/IEC 17020:2026 Cl. 4.1 / IQE-MS-10
    
    # GPS Geofence & Check-In Verification (ISO/IEC 17020 Satellite Timestamping)
    plant_latitude: Optional[float] = 17.5831  # Default plant perimeter (Gagillapur / Industrial Zone)
    plant_longitude: Optional[float] = 78.3842
    plant_geofence_radius_m: float = 250.0
    gps_checkin_lat: Optional[float] = None
    gps_checkin_lng: Optional[float] = None
    gps_checkin_accuracy_m: Optional[float] = None
    gps_checkin_timestamp: Optional[datetime] = None
    gps_geofence_verified: Optional[bool] = None
    gps_plant_distance_m: Optional[float] = None
    gps_satellite_seal: Optional[str] = None
    gps_checkin_by: Optional[str] = None
    
    # Inspector Assignment & Dates
    inspector_id: Optional[str] = None
    inspector_name: Optional[str] = None
    planned_date: Optional[datetime] = None
    scheduled_start_date: Optional[datetime] = None
    scheduled_end_date: Optional[datetime] = None
    rfi_date: Optional[datetime] = None
    visited_from: Optional[datetime] = None
    visited_to: Optional[datetime] = None
    
    visit_type: str = "Regular Visit"  # Regular Visit, Re-inspection, Emergency Callout, Final Stage Audit
    inspection_scope: Optional[str] = None
    inspection_report_no: Optional[str] = None
    comments: Optional[str] = None
    
    status: str = "scheduled"  # scheduled, initiated, in_progress, completed, quality_check_completed, finance_check_completed, cancelled
    is_active: bool = True
    
    expenses: list[Expense] = []
    photos: list[Photo] = []
    findings: list[Finding] = []
    scope_checklists: list[ScopeCheckItem] = []
    po_item_ids: list[str] = []
    
    report_mode: str = "ai"  # "ai" or "manual"
    report_content: Optional[str] = None
    
    quality_check_status: Optional[str] = None
    quality_check_comments: Optional[str] = None
    quality_check_by: Optional[str] = None
    quality_check_on: Optional[datetime] = None
    
    finance_status: Optional[str] = None
    finance_comments: Optional[str] = None
    finance_by: Optional[str] = None
    finance_on: Optional[datetime] = None
    
    is_invoiced: bool = False
    invoice_id: Optional[str] = None
    billing_cycle_days: int = 30
    payment_due_date: Optional[datetime] = None
    
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "visits"


class ManufacturerVisitLocation(Document):
    visit_id: str
    manufacturer_id: str
    location_details: str
    is_sub_manufacturer: bool = False
    sub_manufacturer_details: Optional[str] = None
    contact_no: Optional[str] = None
    cost: float = 0.0
    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "manufacturer_visit_locations"
