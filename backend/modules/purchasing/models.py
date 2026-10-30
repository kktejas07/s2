from __future__ import annotations
from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


class PurchaseItem(BaseModel):
    item_no: int = 1
    description: str
    quantity: float = 1.0
    uom: Optional[str] = None
    rate: float = 0.0
    amount: float = 0.0


class PurchaseRequisition(Document):
    requisition_id: str
    site_id: str = "SITE-01"
    vendor_id: Optional[str] = None
    vendor_name: str
    vendor_type: str = "manufacturer"
    purpose: str
    job_id: Optional[str] = None

    items: list[PurchaseItem] = []
    total_amount: float = 0.0

    requested_by: Optional[str] = None
    approved_by: Optional[str] = None
    approved_on: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    status: str = "draft"

    is_msme: bool = False
    msme_registration: Optional[str] = None
    msme_due_date: Optional[datetime] = None

    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "purchase_requisitions"


class VendorPayment(Document):
    vp_id: str
    site_id: str = "SITE-01"
    vendor_id: Optional[str] = None
    vendor_name: str
    vendor_type: str = "manufacturer"
    requisition_id: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[datetime] = None
    job_id: Optional[str] = None

    report_id: Optional[str] = None
    tm_approved: bool = False
    tm_approved_by: Optional[str] = None
    tm_approved_on: Optional[datetime] = None

    amount: float = 0.0
    tds_deducted: float = 0.0
    tds_section: str = "194J"
    net_payable: float = 0.0

    due_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None
    payment_mode: Optional[str] = None
    payment_ref: Optional[str] = None
    status: str = "pending"

    is_msme: bool = False
    msme_45day_compliant: bool = True

    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "vendor_payments"
