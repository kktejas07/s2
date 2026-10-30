from __future__ import annotations
from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


class Payment(Document):
    payment_id: str
    site_id: str = "SITE-01"
    invoice_id: str
    job_id: Optional[str] = None
    client_id: Optional[str] = None
    client_name: Optional[str] = None

    payment_date: Optional[datetime] = None
    payment_mode: str = "NEFT"
    receipt_number: Optional[str] = None
    challan_number: Optional[str] = None
    transaction_ref: Optional[str] = None
    bank_name: Optional[str] = None

    amount_received: float = 0.0
    tds_deducted: float = 0.0
    net_received: float = 0.0

    is_advance: bool = False
    is_credit_note: bool = False

    # TDS reconciliation (26AS / 16A)
    tds_certificate_received: bool = False
    tds_certificate_quarter: Optional[str] = None
    tds_26as_verified: bool = False
    tds_16a_received: bool = False
    tds_mismatch: bool = False
    tds_mismatch_amount: float = 0.0

    comments: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "payments"


class DunningRecord(Document):
    dunning_id: str
    site_id: str = "SITE-01"
    invoice_id: str
    client_id: Optional[str] = None
    ar_id: Optional[str] = None

    dunning_level: int = 1
    due_date: datetime
    overdue_days: int = 0
    amount_outstanding: float = 0.0

    action_taken: str
    action_date: datetime = Field(default_factory=datetime.now)
    action_by: Optional[str] = None
    next_action_date: Optional[datetime] = None
    response: Optional[str] = None
    commitment_date: Optional[datetime] = None
    commitment_amount: float = 0.0

    status: str = "open"
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "dunning_records"
