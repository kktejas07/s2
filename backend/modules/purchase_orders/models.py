from __future__ import annotations
from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


class POItemDetail(BaseModel):
    po_item_id: str
    item_no: int = 1
    description: str
    tag_number: Optional[str] = None
    quantity: float = 1.0
    uom: Optional[str] = "NOS"
    inspection_activity: Optional[str] = "TPI & Visual Inspection"
    number_of_visits: Optional[int] = 1
    rate: float = 0.0
    amount: float = 0.0
    remarks: Optional[str] = None


class PurchaseOrder(Document):
    po_id: str  # File No / PO ID e.g. PO-001
    job_id: Optional[str] = None
    site_id: str = "SITE-01"
    po_number: str  # Customer PO Ref e.g. PO/RIL/2026/094
    po_date: Optional[datetime] = None
    validity_date: Optional[datetime] = None
    
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
    
    po_amount: float = 0.0
    currency: str = "INR"
    remarks: Optional[str] = None
    comments: Optional[str] = None
    
    items: list[POItemDetail] = []
    total_items: int = 0
    is_active: bool = True
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "purchase_orders"
