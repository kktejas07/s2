from __future__ import annotations
from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import Field


class WinLossRecord(Document):
    """Aggregated from enquiry outcomes for pipeline intelligence (step 13).

    Each closed enquiry (won, lost, no_go, closed_no_bid) generates one record.
    The dashboard, MRM and performance review use these for analysis.
    """
    record_id: str  # WL-YYYY-XXXX
    site_id: str = "SITE-01"
    enquiry_id: str
    client_id: Optional[str] = None
    client_name: Optional[str] = None

    outcome: str  # won, lost, no_go, closed_no_bid
    outcome_date: Optional[datetime] = None

    # Won details
    j_no: Optional[str] = None
    award_value: float = 0.0

    # Lost details
    competitor_name: Optional[str] = None
    lost_reason_codes: list[str] = []
    price_gap_pct: Optional[float] = None

    # No-go details
    no_go_reason_codes: list[str] = []

    service_line: Optional[str] = None
    region_code: Optional[str] = None
    sector: Optional[str] = None  # oil_gas, pharma, power, infrastructure, chemicals, metals

    # Analysis
    proposal_value: float = 0.0
    margin_pct: float = 0.0
    cycle_days: int = 0  # enquiry received to outcome

    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "win_loss_records"
        indexes = ["site_id", "outcome", "region_code", "client_id", "outcome_date"]
