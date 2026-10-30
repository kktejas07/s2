"""Billing terms and the contract-level commercial model.

Adds the payment terms, billing frequency, retention and advance that EPC and
inspection contracts carry, and which the existing Invoice model had no home
for. Without retention, certified value and invoiced value can never reconcile.

See SOW_EXECUTION_ARCHITECTURE.md section 4.3.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import BaseModel, Field


class PaymentTerms(str, Enum):
    NET_15 = "NET_15"
    NET_30 = "NET_30"
    NET_45 = "NET_45"
    NET_60 = "NET_60"
    NET_90 = "NET_90"
    ON_CERTIFICATION = "ON_CERTIFICATION"   # due on issue
    MILESTONE = "MILESTONE"                 # due per contract milestone
    ADVANCE_PCT = "ADVANCE_PCT"             # part up front


#: Days added to invoice date to reach the due date.
TERM_DAYS: dict[str, int] = {
    PaymentTerms.NET_15.value: 15,
    PaymentTerms.NET_30.value: 30,
    PaymentTerms.NET_45.value: 45,
    PaymentTerms.NET_60.value: 60,
    PaymentTerms.NET_90.value: 90,
    PaymentTerms.ON_CERTIFICATION.value: 0,
    PaymentTerms.MILESTONE.value: 30,       # falls back to 30 unless the milestone sets one
    PaymentTerms.ADVANCE_PCT.value: 0,
}


class BillingFrequency(str, Enum):
    PER_VISIT = "PER_VISIT"
    WEEKLY = "WEEKLY"
    FORTNIGHTLY = "FORTNIGHTLY"
    MONTHLY = "MONTHLY"
    PER_MILESTONE = "PER_MILESTONE"
    ON_COMPLETION = "ON_COMPLETION"


class BillingTerms(Document):
    """Commercial terms for a service order. One per SO."""
    terms_id: str                           # BT-YYYY-XXXX
    site_id: str = "SITE-01"
    so_id: str
    job_id: Optional[str] = None
    client_id: Optional[str] = None

    payment_terms_code: str = PaymentTerms.NET_30.value
    billing_frequency: str = BillingFrequency.PER_MILESTONE.value
    custom_term_days: Optional[int] = None  # overrides TERM_DAYS when set

    retention_pct: float = 0.0              # held against defects, released later
    advance_pct: float = 0.0                # paid up front, recovered per bill
    advance_recovered_pct: float = 0.0      # how much of the advance each bill recovers

    currency: str = "INR"
    gst_percentage: float = 18.0
    tds_percentage: float = 0.0

    notes: Optional[str] = None
    is_active: bool = True
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "billing_terms"
        indexes = ["site_id", "so_id", "job_id"]


class InvoiceLineItem(BaseModel):
    """A billable line traced back to what authorised it."""
    line_id: str
    description: str
    source_type: str = "certification"      # certification | visit | manual
    source_id: Optional[str] = None         # CERT-… / VIS-…
    work_package_id: Optional[str] = None
    rate_basis: Optional[str] = None
    quantity: float = 0.0
    uom: Optional[str] = None
    rate: float = 0.0
    amount: float = 0.0


def due_date_for(
    invoice_date: datetime, payment_terms_code: str, custom_days: Optional[int] = None
) -> datetime:
    """Derive a due date from the invoice date and terms.

    Makes Invoice.overdue_alert computable instead of something a human sets.
    """
    days = custom_days if custom_days is not None else TERM_DAYS.get(payment_terms_code, 30)
    return invoice_date + timedelta(days=days)


def is_overdue(due: Optional[datetime], payment_status: str, as_of: Optional[datetime] = None) -> bool:
    if not due or payment_status == "paid":
        return False
    return (as_of or datetime.now()) > due


def ageing_bucket(due: Optional[datetime], payment_status: str, as_of: Optional[datetime] = None) -> str:
    """Standard receivable ageing buckets, for the finance dashboard."""
    if payment_status == "paid":
        return "paid"
    if not due:
        return "no_due_date"
    delta = ((as_of or datetime.now()) - due).days
    if delta <= 0:
        return "current"
    if delta <= 30:
        return "1_30"
    if delta <= 60:
        return "31_60"
    if delta <= 90:
        return "61_90"
    return "90_plus"
