from __future__ import annotations
from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


class AccountReceivable(Document):
    ar_id: str
    site_id: str = "SITE-01"
    client_id: Optional[str] = None
    client_name: str
    invoice_id: Optional[str] = None
    invoice_number: Optional[str] = None
    job_id: Optional[str] = None
    po_number: Optional[str] = None
    entry_date: datetime = Field(default_factory=datetime.now)
    due_date: datetime
    payment_terms_days: int = 30  # Default 30-day payment cycle
    amount: float = 0.0
    paid_amount: float = 0.0
    balance_amount: float = 0.0
    status: str = "pending"  # pending, partially_paid, settled, overdue
    overdue_alert: bool = False
    settlement_date: Optional[datetime] = None
    payment_mode: Optional[str] = None
    transaction_ref: Optional[str] = None
    remarks: Optional[str] = None
    # HO pool tracking
    ho_pool_amount: float = 0.0
    region_code: Optional[str] = None
    # Ageing bucket (auto-calculated)
    ageing_bucket: str = "current"
    dunning_count: int = 0
    last_dunning_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "accounts_receivable"


class AccountPayable(Document):
    ap_id: str
    site_id: str = "SITE-01"
    vendor_id: Optional[str] = None
    vendor_name: str
    vendor_type: str = "manufacturer"  # manufacturer, sub_contractor, inspector
    invoice_id: Optional[str] = None
    po_number: Optional[str] = None
    entry_date: datetime = Field(default_factory=datetime.now)
    due_date: datetime
    payment_terms_days: int = 30  # Default 30-day payment cycle
    amount: float = 0.0
    paid_amount: float = 0.0
    balance_amount: float = 0.0
    status: str = "pending"  # pending, partially_paid, settled, overdue
    overdue_alert: bool = False
    disbursement_date: Optional[datetime] = None
    payment_mode: Optional[str] = None
    transaction_ref: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "accounts_payable"
