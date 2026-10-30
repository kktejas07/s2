from __future__ import annotations
from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


class Reassignment(BaseModel):
    old_control_number_id: str
    new_control_number_id: str
    changed_by: str
    reason: Optional[str] = None
    changed_on: datetime = Field(default_factory=datetime.now)


class ControlNumber(Document):
    control_number_id: str  # e.g. CN-2026-001
    control_number: str     # e.g. CN-2026-001
    job_id: Optional[str] = None
    so_id: Optional[str] = None
    site_id: str = "SITE-01"
    
    # Enquiry Info
    enquiry_no: Optional[str] = None
    enquiry_date: Optional[datetime] = None
    equipment_name: Optional[str] = None
    
    # Client / Customer Details & Units
    client_id: Optional[str] = None
    client_name: Optional[str] = None
    client_unit_id: Optional[str] = None
    client_unit_name: Optional[str] = None
    
    # Supplier / Manufacturer Details & Units
    manufacturer_id: Optional[str] = None
    manufacturer_name: Optional[str] = None
    manufacturer_unit_id: Optional[str] = None
    manufacturer_unit_name: Optional[str] = None
    
    # LOI / PO Details
    loi_no: Optional[str] = None
    loi_date: Optional[datetime] = None
    po_number: Optional[str] = None
    
    # Service Order (SO) Details
    so_number: Optional[str] = None
    so_effective_date: Optional[datetime] = None
    so_due_date: Optional[datetime] = None
    so_type: str = "Regular"  # Regular, Man-Day, Lump-Sum
    
    location: Optional[str] = None
    work_scope: Optional[str] = None
    contract_amount: float = 0.0
    currency: str = "INR"
    comments: Optional[str] = None
    remarks: Optional[str] = None
    
    po_item_ids: list[str] = []
    is_active: bool = True
    reassignment_history: list[Reassignment] = []
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "control_numbers"
