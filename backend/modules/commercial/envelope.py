"""Where an order stands against its ceiling and its period.

Computed from the work every time, never stored. The house rule elsewhere in
this codebase - calibration_state, approval_state, review_state - applies here
for the same reason, and more sharply: a stored balance is a number that was
true once. Someone voids an invoice, a work package is cancelled, an amendment
is approved, and the stored figure is quietly wrong while continuing to look
authoritative. A balance nobody can trust is worse than no balance, because
work gets refused or allowed on the strength of it.

Two notions of spend are tracked separately because they answer different
questions:

* **Committed** - work packages raised against the order. This is what the
  body has promised to do, and it is the number that matters when deciding
  whether another package fits.
* **Invoiced** - what has actually been billed. This is the number that
  matters to finance.

They diverge, and the divergence is itself informative: committed far above
invoiced on an order about to expire is work that may become unbillable.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from modules.commercial.models import (
    EXPIRES,
    IN_FORCE,
    MOVES_PERIOD,
    MOVES_VALUE,
    Amendment,
    OrderRole,
    AmendmentStatus,
    AmendmentType,
    EnvelopeState,
    RenewalAlert,
    TermType,
)

#: Default warning window before a fixed-period order lapses. Renewal in this
#: industry runs through the client's procurement, which is rarely quick.
DEFAULT_RENEWAL_LEAD_DAYS = 60

#: Below this, an order finishing its term has not really been used, and the
#: question is why rather than whether to renew.
UNDERSPEND_THRESHOLD = 0.60


def _days_between(later: datetime, earlier: datetime) -> float:
    return (later - earlier).total_seconds() / 86400


def _renewal(
    term_type: str,
    effective_until: Optional[datetime],
    lead_days: int,
    now: datetime,
) -> RenewalAlert:
    """How close the order is to lapsing, in words someone can act on."""
    if term_type not in {t.value for t in EXPIRES} or not effective_until:
        return RenewalAlert(
            expires=False,
            note=(
                "This order has no end date, so there is nothing to renew. It "
                "is drawn against as work arises."
                if term_type == TermType.OPEN_ENDED.value
                else "This order runs until the work it covers is finished."
            ),
        )

    days = _days_between(effective_until, now)
    expired = days < 0
    within = 0 <= days <= lead_days

    if expired:
        note = (
            f"Lapsed {abs(int(days))} days ago. No work can be drawn against "
            f"it until it is renewed or replaced."
        )
    elif within:
        note = (
            f"Expires in {int(days)} days. Renewal runs through the client's "
            f"procurement, so it is raised now rather than at the end."
        )
    else:
        note = f"Expires in {int(days)} days."

    return RenewalAlert(
        expires=True,
        valid_until=effective_until,
        days_remaining=int(days),
        within_lead_time=within,
        expired=expired,
        note=note,
    )


async def compute(
    order,
    *,
    committed: float = 0.0,
    invoiced: float = 0.0,
    work_outstanding: bool = False,
    call_off_count: int = 0,
    parent_remaining: Optional[float] = None,
    now: Optional[datetime] = None,
) -> EnvelopeState:
    """Work out where `order` stands.

    `committed` and `invoiced` are passed in rather than queried here so that
    this stays a pure calculation that can be reasoned about and tested
    directly. The service layer does the gathering.
    """
    now = now or datetime.now()

    amendments = await Amendment.find(
        Amendment.so_id == order.so_id,
        Amendment.site_id == order.site_id,
    ).to_list()
    # Only authorised changes move the envelope. A proposal is a request.
    live = [a for a in amendments if a.status in {s.value for s in IN_FORCE}]

    base_value = float(order.amount or 0.0)
    value_delta = sum(
        a.value_delta for a in live
        if a.amendment_type in {t.value for t in MOVES_VALUE}
    )
    ceiling = base_value + value_delta

    term_type = getattr(order, "term_type", None) or TermType.FIXED_PERIOD.value
    base_until = getattr(order, "valid_until", None) or order.due_date
    # The latest approved date change wins; they are applied in order so a
    # later extension supersedes an earlier one rather than adding to it.
    period_moves = sorted(
        (a for a in live
         if a.amendment_type in {t.value for t in MOVES_PERIOD}
         and a.new_valid_until),
        key=lambda a: (a.approved_on or a.created_at),
    )
    effective_until = period_moves[-1].new_valid_until if period_moves else base_until

    lead_days = int(
        getattr(order, "renewal_lead_days", None) or DEFAULT_RENEWAL_LEAD_DAYS
    )
    renewal = _renewal(term_type, effective_until, lead_days, now)

    # The greater of the two: committed work the body is obliged to do counts
    # against the envelope even before it is billed, and billed work counts
    # even if no package was ever raised for it.
    consumed = max(committed, invoiced)
    remaining = ceiling - consumed
    pct = (consumed / ceiling * 100) if ceiling > 0 else 0.0
    over = consumed > ceiling and ceiling > 0

    # Burn and projection. Only meaningful once there is a start and some
    # spend; projecting from nothing produces a confident wrong date.
    valid_from = getattr(order, "valid_from", None) or order.so_date
    burn: Optional[float] = None
    exhaustion: Optional[datetime] = None
    if valid_from and consumed > 0:
        elapsed = _days_between(now, valid_from)
        if elapsed >= 1:
            burn = consumed / elapsed
            if burn > 0 and remaining > 0:
                from datetime import timedelta
                exhaustion = now + timedelta(days=remaining / burn)

    # Scenario: the window closes with the money unspent and the work not
    # done. The money is not the problem - the undone inspection is.
    underspent = bool(
        renewal.expires
        and not renewal.expired
        and renewal.within_lead_time
        and ceiling > 0
        and (consumed / ceiling) < UNDERSPEND_THRESHOLD
        and work_outstanding
    )

    # Committed but not yet billed, on an order that is about to close. This
    # is the figure that actually goes missing: work done under an order that
    # lapsed before anyone raised the invoice.
    at_risk = 0.0
    if renewal.expires and (renewal.expired or renewal.within_lead_time):
        at_risk = max(0.0, committed - invoiced)

    role = getattr(order, "order_role", None) or OrderRole.STANDALONE.value

    usable = True
    blocked: Optional[str] = None
    if role == OrderRole.FRAMEWORK.value:
        # A framework is a container. Work raised directly against one would
        # consume the ceiling without appearing in any call-off, which is the
        # exact invisibility this structure exists to prevent.
        usable = False
        blocked = (
            "this is a framework - work is drawn against a call-off under it, "
            "not against the framework itself"
        )
    elif renewal.expired:
        usable = False
        blocked = (
            f"the order lapsed on {effective_until:%d %b %Y}"
            if effective_until else "the order has lapsed"
        )
    elif over:
        usable = False
        blocked = (
            f"committed work exceeds the order ceiling by "
            f"{consumed - ceiling:,.0f}"
        )
    elif getattr(order, "status", "active") not in {"active", "ACTIVE"}:
        usable = False
        blocked = f"the order is {getattr(order, 'status', 'inactive')}"

    notes = []
    if over:
        notes.append(
            f"Committed work is {consumed - ceiling:,.0f} over the ceiling. "
            f"A value increase has to be authorised before more is drawn."
        )
    elif ceiling > 0 and pct >= 85:
        notes.append(f"{pct:.0f}% of the ceiling is consumed.")
    if underspent:
        notes.append(
            "The period is closing with most of the value unspent and work "
            "still outstanding - the question is an extension, not a renewal."
        )
    if at_risk > 0:
        notes.append(
            f"{at_risk:,.0f} of committed work is not yet invoiced against an "
            f"order that is closing."
        )
    # The binding constraint on a call-off may be the framework above it
    # rather than its own ceiling. Reporting only the local figure is what
    # lets a framework be exhausted while every call-off looks healthy.
    if parent_remaining is not None and parent_remaining < remaining:
        notes.append(
            f"The framework above this has {parent_remaining:,.0f} left, "
            f"less than this call-off's own {remaining:,.0f} - the "
            f"framework is the binding constraint."
        )
    if role == OrderRole.FRAMEWORK.value and call_off_count:
        notes.append(
            f"{call_off_count} call-off(s) draw against this framework."
        )
    if not notes:
        notes.append(renewal.note)

    return EnvelopeState(
        base_value=base_value,
        amended_value=value_delta,
        effective_ceiling=ceiling,
        committed=committed,
        invoiced=invoiced,
        consumed=consumed,
        remaining=remaining,
        percent_consumed=round(pct, 1),
        over_ceiling=over,
        term_type=term_type,
        valid_from=valid_from,
        base_valid_until=base_until,
        effective_valid_until=effective_until,
        renewal=renewal,
        usable=usable,
        blocked_because=blocked,
        burn_per_day=round(burn, 2) if burn is not None else None,
        projected_exhaustion=exhaustion,
        will_expire_underspent=underspent,
        unbilled_at_risk=round(at_risk, 2),
        amendment_count=len(live),
        order_role=role,
        parent_so_id=getattr(order, "parent_so_id", None),
        call_off_count=call_off_count,
        parent_remaining=parent_remaining,
        note=" ".join(notes),
    )
