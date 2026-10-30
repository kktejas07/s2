from __future__ import annotations
from typing import Optional, List
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


class MaterialLedgerEntry(BaseModel):
    sl_no: Optional[int] = None
    date: str
    material_name: str  # Cement, Sand, Dust, 10mm Metal, 20mm Metal, 40mm Metal, Bricks, B-Wire
    unit: str  # Bags, Mt, Cum, Nos
    opening_balance: float = 0.0
    received_qty: float = 0.0
    details_of_purchase: Optional[str] = None  # Supplier / Vendor Name
    vehicle_no: Optional[str] = None
    issued_for_consumption: float = 0.0
    details_of_consumption: Optional[str] = None  # Structure / Purpose e.g. Columns, Footing, PCC (1:4:8), M25
    closing_balance: float = 0.0
    remarks: Optional[str] = None


class SteelDiameterLedger(BaseModel):
    diameter: str  # 8mm, 10mm, 12mm, 16mm, 20mm, 25mm, B-Wire
    unit: str = "Mt"
    opening_balance: float = 0.0
    received_qty: float = 0.0
    details_of_purchase: Optional[str] = None  # Suguna Metals Ltd., etc.
    issued_for_consumption: float = 0.0
    details_of_consumption: Optional[str] = None
    closing_balance: float = 0.0


class WaybillEntry(BaseModel):
    sl_no: int
    date: str
    supplier_name: str
    vehicle_no: str
    material_type: str
    received_qty_mt: float
    remarks: Optional[str] = None
    verification_status: str = "Verified"


class ConstructionAbstractItem(BaseModel):
    sl_no: str
    item_code: str
    description: str
    unit: str
    opening_balance: float = 0.0
    total_purchased: float = 0.0
    total_consumed: float = 0.0
    theoretical_consumed: float = 0.0
    wastage_qty: float = 0.0
    wastage_percentage: float = 0.0
    unit_rate: float = 0.0
    claimed_amount: float = 0.0
    verified_payable_amount: float = 0.0
    closing_balance: float = 0.0
    remarks: Optional[str] = None
    verification_status: str = "Verified & Approved"


class ConstructionBillVerificationRecord(Document):
    site_id: str = "SITE-MUDIGONDA-01"
    site_name: str = "Mudigonda CHC Site"
    report_ref: str = "IQE/CBV/2026/088"
    contractor_name: str = "Suguna Metals & Civil Contractors Ltd."
    client_name: str = "State Health Medical Infrastructure Corp / MCGM"
    ra_bill_no: str = "RA-CBV-2026-004"
    verification_date: datetime = Field(default_factory=datetime.now)
    audit_period: str = "April 2026 - August 2026"
    
    abstract_items: List[ConstructionAbstractItem] = []
    steel_ledgers: List[SteelDiameterLedger] = []
    daily_material_logs: List[MaterialLedgerEntry] = []
    waybills: List[WaybillEntry] = []

    total_claimed_amount: float = 0.0
    total_verified_amount: float = 0.0
    total_discrepancy_savings: float = 0.0
    overall_status: str = "VERIFIED & PASSED"  # VERIFIED & PASSED, DISCREPANCY FLAGGED, UNDER RECONCILIATION
    is_locked: bool = False
    
    auditor_engineer: str = "Er. R. K. Sharma (Lead Civil QA/QC Auditor)"
    technical_director: str = "Dr. A. V. Kumar (Director ISO 17020 Inspection)"
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "construction_bill_verifications"
