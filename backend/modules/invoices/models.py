from __future__ import annotations
from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


class ChargeItem(BaseModel):
    sno: Optional[int] = None; category: str; description: str
    uom: Optional[str] = None; rate: float = 0.0; amount: float = 0.0


class AnnexureItem(BaseModel):
    visit_id: str; inspector_name: Optional[str] = None
    po_number: Optional[str] = None; visit_date: Optional[datetime] = None
    mileage_cost: float = 0.0; food_allowance: float = 0.0
    travel_fare: float = 0.0; hotel: float = 0.0
    service_charge: float = 0.0; other_expenses: float = 0.0
    total: float = 0.0; remarks: Optional[str] = None


class Invoice(Document):
    invoice_id: str; job_id: str; site_id: str
    status: str = "draft"
    client_id: Optional[str] = None; client_name: Optional[str] = None
    invoice_type: str = "customer"
    invoice_number: str; invoice_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    payment_status: str = "unpaid"  # unpaid, paid, partially_paid, overdue
    payment_date: Optional[datetime] = None
    payment_mode: Optional[str] = None  # NEFT, RTGS, Cheque, Wire
    transaction_ref: Optional[str] = None
    billing_type: str = "hourly"  # hourly vs bulk
    hourly_rate: float = 0.0
    total_hours: float = 0.0
    overdue_alert: bool = False
    visit_ids: list[str] = []
    consolidated_charges: list[ChargeItem] = []
    annexure: list[AnnexureItem] = []
    subtotal: float = 0.0; cgst: float = 0.0; sgst: float = 0.0
    igst: float = 0.0; tds: float = 0.0; grand_total: float = 0.0
    gst_percentage: float = 18.0
    # GST & statutory compliance (step 9)
    gstin_seller: Optional[str] = None
    gstin_buyer: Optional[str] = None
    place_of_supply: Optional[str] = None
    hsn_sac_code: str = "998346"
    is_reverse_charge: bool = False
    # E-invoicing (IRN)
    e_invoice_irn: Optional[str] = None
    e_invoice_ack_no: Optional[str] = None
    e_invoice_ack_date: Optional[datetime] = None
    e_invoice_qr_data: Optional[str] = None
    # TDS on fee
    tds_section: str = "194J"
    tds_rate: float = 10.0
    tds_amount: float = 0.0
    # Sales register linkage
    sales_register_ref: Optional[str] = None
    financial_year: Optional[str] = None
    # HO pool split
    ho_pool_amount: float = 0.0
    region_share_amount: float = 0.0
    pdf_path: Optional[str] = None
    frozen: bool = False
    cancelled: bool = False; cancellation_reason: Optional[str] = None
    cancelled_by: Optional[str] = None; cancelled_on: Optional[datetime] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings: name = "invoices"
