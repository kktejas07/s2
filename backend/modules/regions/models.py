"""Multi-region organisational structure.

IQE operates four regions (N, S, E, W); the Head Office shares the South
office in Hyderabad.  Every fee collected splits 25 % to the HO pool that
funds Accounts, HR, IT, QMS and central sales.  Inspectors may be loaned
across regions at an internal rate card, and deputy coverage rules define
who acts when a role-holder is absent.

Covers workflow gaps R1-R6 from the IQEIPL workflow document.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import Field


class RegionCode(str, Enum):
    NORTH = "N"
    SOUTH = "S"
    EAST = "E"
    WEST = "W"


class AbsentRole(str, Enum):
    IC = "IC"
    TM = "TM"
    RH = "RH"
    BD = "BD"
    RECRUITER = "RECRUITER"


class LoanStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class SettlementStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    SETTLED = "settled"


HO_POOL_PCT = 0.25


class Region(Document):
    region_code: str                           # N, S, E, W
    name: str                                  # "North", "South", …
    head_office: bool = False                  # True only for the region that hosts HO
    regional_head_person_id: Optional[str] = None
    technical_manager_person_id: Optional[str] = None
    inspection_coordinator_person_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "regions"
        indexes = ["region_code"]


class Office(Document):
    office_id: str                             # OFF-S-01
    region_code: str
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    is_head_office: bool = False
    site_ids: list[str] = []                   # maps legacy site_id values to this office
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "offices"
        indexes = ["region_code", "office_id"]


class InterOfficeSettlement(Document):
    settlement_id: str                         # IOS-2627-04  (FY + month)
    period_month: int                          # 1-12
    period_year: int                           # financial year start, e.g. 2026
    from_region: str                           # region that collected the fee
    to_region: str = "S"                       # HO (South / Hyderabad)

    fee_collected: float = 0.0
    ho_pool_share: float = 0.0                 # 25 % of fee_collected
    region_share: float = 0.0                  # 75 % of fee_collected
    adjustments: float = 0.0
    net_payable_to_ho: float = 0.0

    settled_by: Optional[str] = None
    settled_on: Optional[datetime] = None
    status: str = SettlementStatus.DRAFT.value
    remarks: Optional[str] = None

    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "inter_office_settlements"
        indexes = ["from_region", "period_year", "period_month", "status"]


class InspectorLoan(Document):
    loan_id: str                               # LOAN-2627-001
    inspector_person_id: str
    home_region: str
    borrowing_region: str
    job_id: Optional[str] = None
    rate_card_rate: float = 0.0                # internal daily rate
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    timesheet_ids: list[str] = []
    status: str = LoanStatus.ACTIVE.value
    approved_by: Optional[str] = None
    remarks: Optional[str] = None

    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "inspector_loans"
        indexes = ["home_region", "borrowing_region", "status", "inspector_person_id"]


class DeputyCoverage(Document):
    """Who covers when someone is absent.

    The IQEIPL workflow defines specific escalation rules:
    - IC absent  → RH schedules, TM confirms technical fit
    - TM absent  → RH signs within authorised scope and for jobs they
                   did not sell; else another region's TM, arranged by CM
    - RH absent  → Country Manager covers the region's approvals
    - BD absent  → RH handles regional enquiries; MD above limits
    - Recruiter absent → HR Manager covers
    """
    coverage_id: str                           # DEP-2627-001
    absent_role: str                           # IC, TM, RH, BD, RECRUITER
    absent_person_id: Optional[str] = None
    region_code: str

    deputy_person_id: str
    deputy_role: str                           # the role the deputy normally holds
    scope_limits: Optional[str] = None         # e.g. "within authorised scope only"

    valid_from: datetime = Field(default_factory=datetime.now)
    valid_until: Optional[datetime] = None
    arranged_by: Optional[str] = None          # typically Country Manager
    notes: Optional[str] = None
    is_active: bool = True

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "deputy_coverages"
        indexes = ["region_code", "absent_role", "is_active"]
