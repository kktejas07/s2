from __future__ import annotations
from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


class POItem(BaseModel):
    description: str; quantity: float = 0.0
    uom: Optional[str] = None; inspection_activity: Optional[str] = None
    number_of_visits: Optional[int] = None
    rate: float = 0.0; amount: float = 0.0; remarks: Optional[str] = None


class ServiceOrder(Document):
    so_id: str; job_id: str; site_id: str; status: str = "active"
    client_id: Optional[str] = None; client_name: Optional[str] = None
    client_unit_id: Optional[str] = None
    manufacturer_id: Optional[str] = None; manufacturer_name: Optional[str] = None
    manufacturer_unit_id: Optional[str] = None
    so_type: str = "SO"; so_number: str
    so_date: Optional[datetime] = None; due_date: Optional[datetime] = None
    amount: float = 0.0; currency: str = "INR"

    # The commercial envelope. `amount` is the base ceiling and `valid_until`
    # the base end date; both are moved by approved amendments, and the
    # effective figures are computed in modules.commercial.envelope rather
    # than written back here. A stored balance is a number that was true once.
    #
    # term_type: FIXED_PERIOD runs to a date and can be renewed; PROJECT runs
    # until the work is done; OPEN_ENDED has no end at all - what a client
    # usually means by a lifetime or standing arrangement.
    term_type: Optional[str] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    renewal_lead_days: Optional[int] = None

    # Set when this order succeeded another for the same client. New scope,
    # so a new order rather than an amendment - but the lineage is worth
    # keeping, because "is this the fourth year of the same arrangement" is a
    # question people ask.
    succeeds_so_id: Optional[str] = None

    # Framework structure. A FRAMEWORK carries the ceiling and the term and
    # takes no work directly; CALL_OFF orders draw against it and name it in
    # parent_so_id. Consumption rolls up, so a framework cannot be exhausted
    # while each call-off under it still looks healthy.
    order_role: Optional[str] = None
    parent_so_id: Optional[str] = None
    po_items: list[POItem] = []
    project_number: Optional[str] = None; project_name: Optional[str] = None
    comments: Optional[str] = None
    is_active: bool = True
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings: name = "service_orders"
