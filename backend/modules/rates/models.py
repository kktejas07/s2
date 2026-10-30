"""Rate cards: what the work is sold at, and the floor below which it is not.

Three separate things were being conflated before this existed.

* **The standard rate** - what IQE publishes for a work type. The starting
  point of every negotiation.
* **The client rate** - what a particular client has agreed, usually below
  standard. Lives on a card with its own validity, because rates expire on
  their own cycle and not with the order. An order still in force under a
  lapsed card is how work gets done at last year's prices and discovered at
  invoicing.
* **The floor** - below which the work does not cover its own cost. This is
  the one that matters commercially and the one that did not exist: the
  pre-sales scorecard carries a BELOW_RATE_FLOOR reason code that a person
  asserted by hand, against no floor at all. A reason code nobody can check
  is a note, not a control.

The floor is a property of the work, not of the client. A client who
negotiates hard does not change what a man-day costs IQE to deploy; they
change whether IQE should take the work. Keeping the floor on the work type
and the discount on the client card is what makes the gate-1 check possible.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import BaseModel, Field


class CardStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    SUPERSEDED = "SUPERSEDED"
    EXPIRED = "EXPIRED"


#: Only an active card prices anything. A draft is a proposal and a
#: superseded one is history, and pricing from either would quietly bill the
#: wrong number.
PRICES_WORK = {CardStatus.ACTIVE}


class RateLine(BaseModel):
    """One priced row. Keyed by work type and, optionally, discipline -
    ultrasonic testing and visual inspection are both inspection and are not
    the same price."""

    work_type_code: str
    discipline: Optional[str] = None
    rate_basis: str
    rate: float
    uom: Optional[str] = None

    #: Overtime and travel are charged separately often enough that leaving
    #: them out means they get buried in the base rate and never recovered.
    overtime_multiplier: Optional[float] = None
    mobilisation_charge: Optional[float] = None

    note: Optional[str] = None


class RateCard(Document):
    """A set of rates agreed with one client, valid for a period.

    Superseded rather than edited. What a job was priced at when it was quoted
    is a question that gets asked, and a card that was edited in place cannot
    answer it.
    """

    card_id: str                                   # RC-YYYY-NNNN
    site_id: str = "SITE-01"
    name: str

    #: Null for the house card - IQE's published standard, used where a client
    #: has no card of their own.
    client_id: Optional[str] = None
    client_name: Optional[str] = None

    currency: str = "INR"
    status: str = CardStatus.DRAFT.value
    version: int = 1
    supersedes_card_id: Optional[str] = None

    valid_from: datetime
    valid_until: Optional[datetime] = None          # null: until superseded

    lines: list[RateLine] = []

    #: Annual uplift, where the contract carries one. Applied on renewal
    #: rather than silently: a rate that moves without anyone deciding is how
    #: year three gets inspected at year one's prices, or billed at a number
    #: the client never agreed.
    escalation_percent: Optional[float] = None
    escalation_basis: Optional[str] = None          # e.g. "WPI" or "fixed"

    approved_by: Optional[str] = None
    approved_on: Optional[datetime] = None
    client_authority: Optional[str] = None

    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "rate_cards"
        indexes = ["site_id", "client_id", "status", "card_id"]


class RateFloor(Document):
    """The lowest rate at which a work type is worth doing.

    Deliberately separate from any card. The floor is what the work costs IQE
    to deliver plus the margin the business requires; a client's negotiating
    position does not change it. Keeping them apart is what lets gate 1 check
    a proposed rate against something real instead of against an opinion.
    """

    floor_id: str                                  # RF-YYYY-NNNN
    site_id: str = "SITE-01"
    work_type_code: str
    discipline: Optional[str] = None
    rate_basis: str

    #: What it costs to put a competent person in front of the work.
    direct_cost: float = 0.0
    #: Overhead recovery and required margin, as a percentage of direct cost.
    overhead_percent: float = 0.0
    target_margin_percent: float = 0.0

    currency: str = "INR"
    effective_from: datetime = Field(default_factory=datetime.now)
    note: Optional[str] = None

    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    @property
    def floor_rate(self) -> float:
        """Direct cost, plus overhead recovery, plus the required margin.

        Computed rather than stored so that changing a cost input cannot
        leave a stale floor behind that work is then priced against.
        """
        with_overhead = self.direct_cost * (1 + self.overhead_percent / 100)
        return round(with_overhead * (1 + self.target_margin_percent / 100), 2)

    class Settings:
        name = "rate_floors"
        indexes = ["site_id", "work_type_code", "floor_id"]


class ResolvedRate(BaseModel):
    """What a piece of work prices at, and whether it should be taken.

    Computed on request, never stored.
    """

    work_type_code: str
    discipline: Optional[str] = None
    rate_basis: Optional[str] = None
    rate: Optional[float] = None
    currency: str = "INR"
    uom: Optional[str] = None

    source: str = "none"                # client_card | house_card | none
    card_id: Optional[str] = None
    card_name: Optional[str] = None
    card_valid_until: Optional[datetime] = None

    floor: Optional[float] = None
    floor_id: Optional[str] = None
    below_floor: bool = False
    margin_percent: Optional[float] = None
    discount_from_standard_percent: Optional[float] = None

    priced: bool = False
    note: str = ""
