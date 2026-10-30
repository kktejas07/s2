"""Resolving a rate, and checking it against the floor.

Resolution order: the client's own active card, then the house card, then
nothing. "Then nothing" is deliberate and is the part that matters - where no
card prices a piece of work, this says so rather than falling back to a
plausible number. An invented rate is worse than a missing one, because the
missing one gets asked about and the invented one gets invoiced.

The floor exists so that the pre-sales gate has something to check. Before
this, BELOW_RATE_FLOOR was a reason code a person selected against no floor
at all.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Optional

from fastapi import HTTPException

from core import audit
from core.audit import AuditAction
from core.sequences import next_identifier
from modules.rates.models import (
    PRICES_WORK,
    CardStatus,
    RateCard,
    RateFloor,
    RateLine,
    ResolvedRate,
)

logger = logging.getLogger(__name__)

VALID_STATUSES = {s.value for s in CardStatus}


def _in_force(card: RateCard, when: datetime) -> bool:
    if card.status not in {s.value for s in PRICES_WORK}:
        return False
    if card.valid_from and when < card.valid_from:
        return False
    if card.valid_until and when > card.valid_until:
        return False
    return True


def _match(card: RateCard, work_type_code: str, discipline: Optional[str]):
    """The most specific line that fits.

    A line naming the discipline beats one that does not: ultrasonic testing
    and visual inspection are both inspection and are not the same price.
    """
    exact = [
        l for l in card.lines
        if l.work_type_code == work_type_code
        and discipline and l.discipline == discipline
    ]
    if exact:
        return exact[0]
    general = [
        l for l in card.lines
        if l.work_type_code == work_type_code and not l.discipline
    ]
    return general[0] if general else None


class RateService:
    # ------------------------------------------------------------- the cards

    @staticmethod
    async def create_card(data: dict, site_id: str, user_id: str) -> dict:
        name = (data.get("name") or "").strip()
        if not name:
            raise HTTPException(400, "A rate card needs a name")
        valid_from = data.get("valid_from") or datetime.now()
        valid_until = data.get("valid_until")
        if valid_until and valid_until <= valid_from:
            raise HTTPException(400, "The card expires on or before it starts")

        lines = [RateLine(**l) for l in (data.get("lines") or [])]
        for line in lines:
            if line.rate < 0:
                raise HTTPException(
                    400, f"{line.work_type_code} has a negative rate"
                )

        card_id = await next_identifier(RateCard, "card_id", site_id, "RC")
        card = RateCard(
            card_id=card_id, site_id=site_id, name=name,
            client_id=data.get("client_id"),
            client_name=data.get("client_name"),
            currency=data.get("currency") or "INR",
            valid_from=valid_from, valid_until=valid_until,
            lines=lines,
            escalation_percent=data.get("escalation_percent"),
            escalation_basis=data.get("escalation_basis"),
            created_by=user_id,
        )
        await card.insert()
        await audit.record(
            "rate_card", card_id, AuditAction.CREATE,
            actor={"user_id": user_id}, site_id=site_id,
            context={"client_id": card.client_id, "lines": len(lines)},
        )
        return card.model_dump(exclude={"id"})

    @staticmethod
    async def activate(card_id: str, payload: dict, site_id: str, user_id: str) -> dict:
        """Put a card into force, superseding whatever it replaces.

        Supersession is the point. Two active cards for one client would
        price the same work two ways, and which one won would depend on query
        order - the kind of bug that is only noticed in an invoice dispute.
        """
        card = await RateService.get_card(card_id, site_id)
        if card.status == CardStatus.ACTIVE:
            raise HTTPException(409, f"{card_id} is already active")
        if card.status == CardStatus.SUPERSEDED:
            raise HTTPException(
                409,
                f"{card_id} was superseded and cannot be reactivated. What a "
                f"job was priced at when it was quoted is a question that gets "
                f"asked, so a superseded card stays as it was.",
            )
        if not card.lines:
            raise HTTPException(400, "A card with no lines prices nothing")

        query: dict[str, Any] = {"site_id": site_id, "status": CardStatus.ACTIVE.value}
        query["client_id"] = card.client_id
        current = await RateCard.find(query).to_list()
        for other in current:
            other.status = CardStatus.SUPERSEDED.value
            other.valid_until = other.valid_until or datetime.now()
            other.updated_at = datetime.now()
            await other.save()
            card.supersedes_card_id = other.card_id
            card.version = other.version + 1

        card.status = CardStatus.ACTIVE.value
        card.approved_by = user_id
        card.approved_on = datetime.now()
        card.client_authority = payload.get("client_authority")
        card.updated_at = datetime.now()
        await card.save()

        await audit.record(
            "rate_card", card_id, AuditAction.AUTHORIZE,
            actor={"user_id": user_id}, site_id=site_id,
            context={"superseded": [c.card_id for c in current]},
        )
        out = card.model_dump(exclude={"id"})
        out["superseded"] = [c.card_id for c in current]
        return out

    @staticmethod
    async def get_card(card_id: str, site_id: str) -> RateCard:
        card = await RateCard.find_one(
            RateCard.card_id == card_id, RateCard.site_id == site_id
        )
        if not card:
            raise HTTPException(404, f"{card_id} not found")
        return card

    @staticmethod
    async def list_cards(
        site_id: str = "SITE-01", client_id: str = "", status: str = ""
    ) -> dict:
        query: dict[str, Any] = {"site_id": site_id}
        if client_id:
            query["client_id"] = client_id
        if status:
            query["status"] = status.upper()
        rows = await RateCard.find(query).to_list()
        now = datetime.now()
        return {
            "total": len(rows),
            "data": [
                {
                    **r.model_dump(exclude={"id"}),
                    "in_force": _in_force(r, now),
                    "line_count": len(r.lines),
                }
                for r in rows
            ],
        }

    # ------------------------------------------------------------- the floor

    @staticmethod
    async def set_floor(data: dict, site_id: str, user_id: str) -> dict:
        work_type_code = (data.get("work_type_code") or "").strip()
        if not work_type_code:
            raise HTTPException(400, "work_type_code is required")
        if float(data.get("direct_cost") or 0) <= 0:
            raise HTTPException(
                400,
                "A floor needs a direct cost. Without one the floor is zero, "
                "which passes every rate and checks nothing.",
            )

        existing = await RateFloor.find(
            RateFloor.site_id == site_id,
            RateFloor.work_type_code == work_type_code,
        ).to_list()
        discipline = data.get("discipline")
        match = next((f for f in existing if f.discipline == discipline), None)

        if match:
            match.direct_cost = float(data["direct_cost"])
            match.overhead_percent = float(data.get("overhead_percent") or 0)
            match.target_margin_percent = float(
                data.get("target_margin_percent") or 0
            )
            match.rate_basis = data.get("rate_basis") or match.rate_basis
            match.note = data.get("note")
            match.updated_at = datetime.now()
            await match.save()
            floor = match
        else:
            floor_id = await next_identifier(RateFloor, "floor_id", site_id, "RF")
            floor = RateFloor(
                floor_id=floor_id, site_id=site_id,
                work_type_code=work_type_code, discipline=discipline,
                rate_basis=data.get("rate_basis") or "PER_VISIT",
                direct_cost=float(data["direct_cost"]),
                overhead_percent=float(data.get("overhead_percent") or 0),
                target_margin_percent=float(data.get("target_margin_percent") or 0),
                currency=data.get("currency") or "INR",
                note=data.get("note"), created_by=user_id,
            )
            await floor.insert()

        await audit.record(
            "rate_floor", floor.floor_id, AuditAction.UPDATE,
            actor={"user_id": user_id}, site_id=site_id,
            context={"work_type_code": work_type_code,
                     "floor_rate": floor.floor_rate},
        )
        out = floor.model_dump(exclude={"id"})
        out["floor_rate"] = floor.floor_rate
        return out

    @staticmethod
    async def list_floors(site_id: str = "SITE-01") -> dict:
        rows = await RateFloor.find(RateFloor.site_id == site_id).to_list()
        return {
            "total": len(rows),
            "data": [
                {**r.model_dump(exclude={"id"}), "floor_rate": r.floor_rate}
                for r in rows
            ],
        }

    @staticmethod
    async def _floor_for(
        work_type_code: str, discipline: Optional[str], site_id: str
    ) -> Optional[RateFloor]:
        floors = await RateFloor.find(
            RateFloor.site_id == site_id,
            RateFloor.work_type_code == work_type_code,
        ).to_list()
        exact = [f for f in floors if discipline and f.discipline == discipline]
        if exact:
            return exact[0]
        general = [f for f in floors if not f.discipline]
        return general[0] if general else None

    # --------------------------------------------------------- the resolution

    @staticmethod
    async def resolve(
        work_type_code: str,
        *,
        client_id: Optional[str] = None,
        discipline: Optional[str] = None,
        site_id: str = "SITE-01",
        when: Optional[datetime] = None,
        proposed_rate: Optional[float] = None,
    ) -> ResolvedRate:
        """What this work prices at, and whether it clears the floor.

        Where nothing prices it, that is the answer. Falling back to a
        plausible number would be worse: a missing rate gets asked about, an
        invented one gets invoiced.
        """
        when = when or datetime.now()
        out = ResolvedRate(work_type_code=work_type_code, discipline=discipline)

        cards = await RateCard.find(RateCard.site_id == site_id).to_list()
        in_force = [c for c in cards if _in_force(c, when)]

        client_cards = [c for c in in_force if client_id and c.client_id == client_id]
        house_cards = [c for c in in_force if not c.client_id]

        chosen, line, source = None, None, "none"
        for card in client_cards:
            found = _match(card, work_type_code, discipline)
            if found:
                chosen, line, source = card, found, "client_card"
                break
        if not line:
            for card in house_cards:
                found = _match(card, work_type_code, discipline)
                if found:
                    chosen, line, source = card, found, "house_card"
                    break

        # The standard, for measuring how far a client rate sits below it.
        standard = None
        for card in house_cards:
            found = _match(card, work_type_code, discipline)
            if found:
                standard = found.rate
                break

        floor = await RateService._floor_for(work_type_code, discipline, site_id)
        if floor:
            out.floor = floor.floor_rate
            out.floor_id = floor.floor_id

        # A rate someone is proposing takes precedence over the card for the
        # purpose of the check: gate 1 is asking about the rate on the table.
        effective = proposed_rate if proposed_rate is not None else (
            line.rate if line else None
        )

        if line and chosen:
            out.rate_basis = line.rate_basis
            out.uom = line.uom
            out.currency = chosen.currency
            out.card_id = chosen.card_id
            out.card_name = chosen.name
            out.card_valid_until = chosen.valid_until
            out.source = source
            out.priced = True

        out.rate = effective

        if effective is not None and standard and standard > 0:
            out.discount_from_standard_percent = round(
                (standard - effective) / standard * 100, 1
            )

        if effective is not None and out.floor is not None:
            out.below_floor = effective < out.floor
            if floor and floor.direct_cost > 0:
                out.margin_percent = round(
                    (effective - floor.direct_cost) / floor.direct_cost * 100, 1
                )

        notes: list[str] = []
        if not out.priced and proposed_rate is None:
            notes.append(
                f"No active rate card prices {work_type_code}"
                + (f" for {client_id}" if client_id else "")
                + ". Nothing is assumed - an invented rate would be billed."
            )
        if out.floor is None:
            notes.append(
                f"No floor is set for {work_type_code}, so there is nothing to "
                f"check the rate against."
            )
        elif out.below_floor:
            notes.append(
                f"{effective:,.0f} is below the {out.floor:,.0f} floor. The "
                f"work would not cover its own cost and the required margin."
            )
        if chosen and chosen.valid_until:
            days = (chosen.valid_until - when).total_seconds() / 86400
            if days <= 45:
                notes.append(
                    f"{chosen.card_id} expires in {int(days)} days. Rates "
                    f"expire on their own cycle, not with the order."
                )
        out.note = " ".join(notes) if notes else "Priced from the card in force."
        return out

    @staticmethod
    async def check_proposed(
        work_type_code: str, rate: float,
        *, client_id: Optional[str] = None, discipline: Optional[str] = None,
        site_id: str = "SITE-01",
    ) -> dict:
        """The gate-1 check. BELOW_RATE_FLOOR becomes computable."""
        resolved = await RateService.resolve(
            work_type_code, client_id=client_id, discipline=discipline,
            site_id=site_id, proposed_rate=rate,
        )
        return {
            "acceptable": not resolved.below_floor,
            "checkable": resolved.floor is not None,
            "proposed": rate,
            "resolved": resolved.model_dump(),
            "reason_code": "BELOW_RATE_FLOOR" if resolved.below_floor else None,
            "note": resolved.note,
        }

    # ------------------------------------------------------------- the sweep

    @staticmethod
    async def expiring(site_id: str = "SITE-01", days: int = 45) -> dict:
        """Cards about to lapse. An order still in force under a lapsed card
        is how work gets done at last year's prices."""
        from datetime import timedelta

        now = datetime.now()
        horizon = now + timedelta(days=days)
        cards = await RateCard.find(
            RateCard.site_id == site_id,
            RateCard.status == CardStatus.ACTIVE.value,
        ).to_list()

        expiring, lapsed = [], []
        for c in cards:
            if not c.valid_until:
                continue
            row = {
                "card_id": c.card_id, "name": c.name,
                "client_id": c.client_id, "client_name": c.client_name,
                "valid_until": c.valid_until,
                "days_remaining": int(
                    (c.valid_until - now).total_seconds() / 86400
                ),
                "line_count": len(c.lines),
                "escalation_percent": c.escalation_percent,
            }
            if c.valid_until < now:
                lapsed.append(row)
            elif c.valid_until <= horizon:
                expiring.append(row)

        return {
            "horizon_days": days,
            "lapsed": lapsed,
            "expiring": expiring,
            "note": (
                f"{len(lapsed)} card(s) have lapsed and {len(expiring)} expire "
                f"within {days} days. A card expires on its own cycle, not "
                f"with the order it prices, so an order can be perfectly valid "
                f"while the rates under it are a year old."
            ),
        }
