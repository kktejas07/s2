"""Amendments, renewals, and the enforcement that makes the envelope real.

The envelope only means something if something is refused. Four situations
arise in practice, and each one resolves to the same question - is this more
of the same agreement, or a different one:

1. A fixed-period order approaching its end date. If the work continues, that
   is a renewal: an amendment on the same order. A new order would restate
   terms both parties already agreed.
2. A work package that would take the order past its ceiling. Refused, with a
   value increase proposed. Letting it through creates work nobody has agreed
   to pay for, and the excess is argued about at invoice time when the
   leverage has gone.
3. A period closing with the money unspent and the inspection not done. The
   budget is not the problem; the undone work is. That is an extension.
4. Work complete, and the same client brings new work. That is a new order -
   it may inherit the previous shape, but it is a different agreement.

What is deliberately refused: IQE moving its own envelope. Every amendment
that changes value or period needs the client's named authority and their
written reference, for the same reason a hold point cannot be waived
internally. An amendment IQE grants itself is not an amendment, it is a
unilateral change of terms.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import HTTPException

from core import audit
from core.audit import AuditAction
from core.sequences import next_identifier
from modules.commercial.envelope import DEFAULT_RENEWAL_LEAD_DAYS, compute
from modules.commercial.models import (
    EXPIRES,
    IN_FORCE,
    MOVES_PERIOD,
    MOVES_VALUE,
    NEEDS_AN_END_DATE,
    Amendment,
    OrderRole,
    AmendmentStatus,
    AmendmentType,
    TermType,
)

logger = logging.getLogger(__name__)

VALID_TYPES = {t.value for t in AmendmentType}
TERM_TYPES = {t.value for t in TermType}


class CommercialService:
    # ------------------------------------------------------------ gathering

    @staticmethod
    async def _committed(so_id: str, site_id: str) -> float:
        """What has been promised against this order.

        Work package ceilings, falling back to rate x planned quantity where
        no ceiling was set - a package with neither is counted as zero rather
        than guessed at, because an invented figure here would refuse real
        work.
        """
        from modules.work_packages.models import WorkPackage

        packages = await WorkPackage.find(
            WorkPackage.so_id == so_id,
            WorkPackage.site_id == site_id,
        ).to_list()
        total = 0.0
        for p in packages:
            if not p.is_active or p.status in {"CANCELLED", "cancelled"}:
                continue
            if p.ceiling_value:
                total += float(p.ceiling_value)
            elif p.rate and p.planned_quantity:
                total += float(p.rate) * float(p.planned_quantity)
        return round(total, 2)

    @staticmethod
    async def _invoiced(so_id: str, site_id: str) -> float:
        """What has actually been billed, excluding cancelled invoices."""
        from modules.invoices.models import Invoice
        from modules.jobs.models import Job

        jobs = await Job.find(Job.site_id == site_id).to_list()
        job_ids = {j.job_id for j in jobs if getattr(j, "so_id", None) == so_id}
        if not job_ids:
            # Jobs do not all carry so_id; fall back to the order's own job.
            from modules.service_orders.models import ServiceOrder
            order = await ServiceOrder.find_one(
                ServiceOrder.so_id == so_id, ServiceOrder.site_id == site_id
            )
            if order and order.job_id:
                job_ids = {order.job_id}
        if not job_ids:
            return 0.0

        invoices = await Invoice.find(Invoice.site_id == site_id).to_list()
        total = sum(
            float(i.grand_total or 0.0) for i in invoices
            if i.job_id in job_ids and i.status not in {"cancelled", "void"}
        )
        return round(total, 2)

    @staticmethod
    async def _work_outstanding(so_id: str, site_id: str) -> bool:
        """Whether anything under this order is still unfinished."""
        from modules.work_packages.models import WorkPackage

        packages = await WorkPackage.find(
            WorkPackage.so_id == so_id,
            WorkPackage.site_id == site_id,
        ).to_list()
        return any(
            p.is_active and p.status not in {"COMPLETED", "CANCELLED",
                                             "completed", "cancelled"}
            for p in packages
        )

    @staticmethod
    async def get_order(so_id: str, site_id: str):
        from modules.service_orders.models import ServiceOrder

        order = await ServiceOrder.find_one(
            ServiceOrder.so_id == so_id, ServiceOrder.site_id == site_id
        )
        if not order:
            raise HTTPException(404, f"{so_id} not found")
        return order

    @staticmethod
    async def _call_offs(so_id: str, site_id: str) -> list:
        from modules.service_orders.models import ServiceOrder

        rows = await ServiceOrder.find(
            ServiceOrder.site_id == site_id,
            ServiceOrder.parent_so_id == so_id,
        ).to_list()
        return [r for r in rows if r.is_active]

    @staticmethod
    async def state(so_id: str, site_id: str = "SITE-01", now=None):
        """Where this order stands, computed fresh.

        A framework's consumption is its call-offs' - what they have carved
        out, and what they have billed. Computing it from work packages
        raised directly against the framework would read zero on a framework
        that is fully committed, which is the failure this structure exists
        to prevent.
        """
        order = await CommercialService.get_order(so_id, site_id)
        role = getattr(order, "order_role", None) or OrderRole.STANDALONE.value

        if role == OrderRole.FRAMEWORK.value:
            children = await CommercialService._call_offs(so_id, site_id)
            # What the call-offs have carved out of the framework, whether or
            # not they have spent it. A framework fully carved up cannot take
            # another call-off even with nothing yet invoiced.
            committed = round(sum(float(c.amount or 0.0) for c in children), 2)
            invoiced = 0.0
            outstanding = False
            for child in children:
                invoiced += await CommercialService._invoiced(child.so_id, site_id)
                outstanding = outstanding or await CommercialService._work_outstanding(
                    child.so_id, site_id
                )
            return await compute(
                order, committed=committed, invoiced=round(invoiced, 2),
                work_outstanding=outstanding, call_off_count=len(children),
                now=now,
            )

        parent_remaining = None
        parent_id = getattr(order, "parent_so_id", None)
        if parent_id:
            try:
                parent_state = await CommercialService.state(parent_id, site_id, now=now)
                parent_remaining = parent_state.remaining
            except Exception as e:  # noqa: BLE001 - reported, not hidden
                logger.warning(
                    "Could not read framework %s for %s: %s", parent_id, so_id, e
                )

        return await compute(
            order,
            committed=await CommercialService._committed(so_id, site_id),
            invoiced=await CommercialService._invoiced(so_id, site_id),
            work_outstanding=await CommercialService._work_outstanding(so_id, site_id),
            parent_remaining=parent_remaining,
            now=now,
        )

    # ------------------------------------------------------------- the terms

    @staticmethod
    async def set_terms(
        so_id: str, payload: dict, site_id: str, user_id: str
    ) -> dict:
        """Put an envelope around an order: how long it runs and how much.

        Refused where the terms contradict themselves, because a fixed-period
        order with no end date is not a fixed period - it is an open-ended one
        that will never alert, and nobody will notice until the client asks
        why work continued past the term.
        """
        order = await CommercialService.get_order(so_id, site_id)
        term_type = (payload.get("term_type") or "").upper()
        if term_type not in TERM_TYPES:
            raise HTTPException(
                400, f"term_type must be one of: {', '.join(sorted(TERM_TYPES))}"
            )

        valid_from = payload.get("valid_from") or order.so_date or datetime.now()
        valid_until = payload.get("valid_until")

        if term_type == TermType.FIXED_PERIOD.value:
            if not valid_until:
                raise HTTPException(
                    400,
                    "A fixed-period order needs an end date. Without one it "
                    "never alerts for renewal and work quietly continues past "
                    "the term.",
                )
            if valid_until <= valid_from:
                raise HTTPException(
                    400, "The end date is on or before the start date"
                )
        elif valid_until:
            raise HTTPException(
                400,
                f"A {term_type.replace('_', ' ').lower()} order does not end "
                f"on a date, so an end date would be misleading. Use "
                f"FIXED_PERIOD if it does.",
            )

        amount = payload.get("amount")
        if amount is not None:
            if float(amount) < 0:
                raise HTTPException(400, "An order value cannot be negative")
            order.amount = float(amount)

        order.term_type = term_type
        order.valid_from = valid_from
        order.valid_until = valid_until
        order.renewal_lead_days = int(
            payload.get("renewal_lead_days") or DEFAULT_RENEWAL_LEAD_DAYS
        )
        order.updated_at = datetime.now()
        await order.save()

        await audit.record(
            "service_order", so_id, AuditAction.UPDATE,
            actor={"user_id": user_id}, site_id=site_id,
            note=f"Terms set: {term_type}",
            context={"term_type": term_type, "valid_until": str(valid_until),
                     "amount": order.amount},
        )
        state = await CommercialService.state(so_id, site_id)
        return {"so_id": so_id, "state": state.model_dump()}

    # -------------------------------------------------------- the amendments

    @staticmethod
    async def propose(payload: dict, site_id: str, user_id: str) -> dict:
        """Raise an amendment. Proposing changes nothing about the envelope.

        Validated hard at this point rather than at approval, so that an
        amendment which could never make sense is never put in front of a
        client.
        """
        so_id = payload.get("so_id")
        if not so_id:
            raise HTTPException(400, "so_id is required")
        order = await CommercialService.get_order(so_id, site_id)

        kind = (payload.get("amendment_type") or "").upper()
        if kind not in VALID_TYPES:
            raise HTTPException(
                400,
                f"amendment_type must be one of: {', '.join(sorted(VALID_TYPES))}",
            )

        reason = (payload.get("reason") or "").strip()
        if not reason:
            raise HTTPException(
                400,
                "An amendment needs a reason. Read back in two years, one "
                "without a reason is indistinguishable from a mistake.",
            )

        term_type = getattr(order, "term_type", None) or TermType.FIXED_PERIOD.value
        value_delta = float(payload.get("value_delta") or 0.0)
        new_until = payload.get("new_valid_until")

        # A period amendment against something with no end date is a
        # misunderstanding of what was agreed, not a clerical slip.
        if kind in {t.value for t in NEEDS_AN_END_DATE}:
            if term_type not in {t.value for t in EXPIRES}:
                raise HTTPException(
                    409,
                    f"{so_id} is {term_type.replace('_', ' ').lower()}, so it "
                    f"has no end date to extend or renew. If it should have "
                    f"one, change its terms to a fixed period first.",
                )
            if not new_until:
                raise HTTPException(
                    400, f"A {kind.replace('_', ' ').lower()} needs a new end date"
                )

        if kind in {t.value for t in MOVES_VALUE} and value_delta == 0:
            raise HTTPException(
                400,
                f"A {kind.replace('_', ' ').lower()} that moves no money "
                f"changes nothing. If the period is what is changing, raise a "
                f"period extension instead.",
            )

        if kind == AmendmentType.VALUE_INCREASE and value_delta < 0:
            raise HTTPException(
                400,
                "A value increase cannot be negative. Reducing an order is a "
                "curtailment, and is recorded as one.",
            )

        if new_until:
            state = await CommercialService.state(so_id, site_id)
            current = state.effective_valid_until
            if current and new_until <= current:
                raise HTTPException(
                    400,
                    f"The new end date is not after the current one "
                    f"({current:%d %b %Y}). An extension that shortens the "
                    f"order is a curtailment.",
                )

        existing = await Amendment.find(
            Amendment.so_id == so_id, Amendment.site_id == site_id
        ).to_list()
        amendment_id = await next_identifier(
            Amendment, "amendment_id", site_id, "AMD"
        )

        record = Amendment(
            amendment_id=amendment_id,
            site_id=site_id,
            so_id=so_id,
            sequence=len(existing) + 1,
            amendment_type=kind,
            status=AmendmentStatus.PROPOSED.value,
            value_delta=value_delta,
            new_valid_until=new_until,
            new_rate_basis=payload.get("new_rate_basis"),
            scope_note=payload.get("scope_note"),
            reason=reason,
            triggered_by=payload.get("triggered_by"),
            trigger_rule=payload.get("trigger_rule"),
            raised_by=user_id,
        )
        await record.save()

        await audit.record(
            "amendment", amendment_id, AuditAction.CREATE,
            actor={"user_id": user_id}, site_id=site_id, note=reason,
            context={"so_id": so_id, "type": kind, "value_delta": value_delta},
        )
        out = record.model_dump(exclude={"id"})
        out["note"] = (
            "Proposed only. The order's ceiling and validity are unchanged "
            "until the client authorises it."
        )
        return out

    @staticmethod
    async def approve(
        amendment_id: str, payload: dict, site_id: str, user_id: str
    ) -> dict:
        """The client has authorised it. Only now does the envelope move."""
        record = await CommercialService.get_amendment(amendment_id, site_id)
        if record.status != AmendmentStatus.PROPOSED:
            raise HTTPException(
                409,
                f"{amendment_id} is already "
                f"{record.status.lower()} and cannot be approved again",
            )

        authority = (payload.get("client_authority") or "").strip()
        approver = (payload.get("approved_by_client") or "").strip()

        # The line this module turns on. An order is a bilateral agreement;
        # IQE moving its own ceiling is not an amendment to it.
        if record.amendment_type in (
            {t.value for t in MOVES_VALUE} | {t.value for t in MOVES_PERIOD}
        ):
            if not (authority and approver):
                raise HTTPException(
                    409,
                    f"{amendment_id} changes what the client is committed to, "
                    f"so it needs the name of who authorised it and their "
                    f"written reference. An amendment IQE grants itself is a "
                    f"unilateral change of terms, not an amendment.",
                )

        record.status = AmendmentStatus.APPROVED.value
        record.client_authority = authority or None
        record.approved_by_client = approver or None
        record.approved_on = datetime.now()
        record.effective_from = payload.get("effective_from") or datetime.now()
        record.updated_at = datetime.now()
        await record.save()

        await audit.record(
            "amendment", amendment_id, AuditAction.AUTHORIZE,
            actor={"user_id": user_id}, site_id=site_id, note=record.reason,
            context={"so_id": record.so_id, "authority": authority,
                     "approved_by_client": approver},
        )
        state = await CommercialService.state(record.so_id, site_id)
        out = record.model_dump(exclude={"id"})
        out["state"] = state.model_dump()
        return out

    @staticmethod
    async def reject(
        amendment_id: str, payload: dict, site_id: str, user_id: str
    ) -> dict:
        """Kept rather than deleted: that the client declined an increase is
        exactly what someone needs to know when the work stops."""
        record = await CommercialService.get_amendment(amendment_id, site_id)
        if record.status != AmendmentStatus.PROPOSED:
            raise HTTPException(
                409, f"{amendment_id} is already {record.status.lower()}"
            )
        reason = (payload.get("reason") or "").strip()
        if not reason:
            raise HTTPException(400, "Rejecting an amendment needs a reason")

        record.status = AmendmentStatus.REJECTED.value
        record.rejected_reason = reason
        record.updated_at = datetime.now()
        await record.save()
        await audit.record(
            "amendment", amendment_id, AuditAction.STATUS_CHANGE,
            actor={"user_id": user_id}, site_id=site_id, note=reason,
            context={"so_id": record.so_id},
        )
        return record.model_dump(exclude={"id"})

    @staticmethod
    async def get_amendment(amendment_id: str, site_id: str) -> Amendment:
        record = await Amendment.find_one(
            Amendment.amendment_id == amendment_id,
            Amendment.site_id == site_id,
        )
        if not record:
            raise HTTPException(404, f"{amendment_id} not found")
        return record

    @staticmethod
    async def list_amendments(
        so_id: str = "", site_id: str = "SITE-01", status: str = ""
    ) -> dict:
        query: dict[str, Any] = {"site_id": site_id}
        if so_id:
            query["so_id"] = so_id
        if status:
            query["status"] = status.upper()
        rows = await Amendment.find(query).sort("sequence").to_list()
        return {
            "total": len(rows),
            "data": [r.model_dump(exclude={"id"}) for r in rows],
        }

    # ------------------------------------------------------- the framework

    @staticmethod
    async def open_call_off(
        parent_so_id: str, payload: dict, site_id: str, user_id: str
    ) -> dict:
        """Carve a call-off out of a framework.

        Refused where it would not fit, or would outlive the framework. Both
        are the same mistake: a call-off is a slice of the parent agreement,
        and a slice larger than the cake, or one that outlasts it, is not
        covered by anything.
        """
        from modules.service_orders.models import ServiceOrder

        parent = await CommercialService.get_order(parent_so_id, site_id)
        role = getattr(parent, "order_role", None)
        if role != OrderRole.FRAMEWORK.value:
            raise HTTPException(
                409,
                f"{parent_so_id} is not a framework, so nothing can be called "
                f"off it. Only a framework carries a ceiling for others to "
                f"draw against.",
            )

        amount = float(payload.get("amount") or 0.0)
        if amount <= 0:
            raise HTTPException(400, "A call-off needs a value")

        state = await CommercialService.state(parent_so_id, site_id)
        if state.renewal and state.renewal.expired:
            raise HTTPException(
                409,
                f"{parent_so_id} lapsed on "
                f"{state.effective_valid_until:%d %b %Y}. A call-off under a "
                f"lapsed framework is covered by nothing.",
            )
        if amount > state.remaining:
            raise HTTPException(
                409,
                f"{amount:,.0f} does not fit: {parent_so_id} has "
                f"{state.remaining:,.0f} left of its "
                f"{state.effective_ceiling:,.0f} ceiling, across "
                f"{state.call_off_count} existing call-off(s). Either reduce "
                f"this call-off or have the client authorise a value increase "
                f"on the framework.",
            )

        valid_until = payload.get("valid_until")
        parent_until = state.effective_valid_until
        if parent_until and valid_until and valid_until > parent_until:
            raise HTTPException(
                409,
                f"This call-off would run to {valid_until:%d %b %Y}, past the "
                f"framework's {parent_until:%d %b %Y}. Work after that date is "
                f"covered by nothing - extend the framework first.",
            )
        # Inherited rather than left open: a call-off with no end date under a
        # framework that has one would look indefinite on its own screen.
        if parent_until and not valid_until:
            valid_until = parent_until

        so_id = await next_identifier(ServiceOrder, "so_id", site_id, "SO")
        order = ServiceOrder(
            so_id=so_id, site_id=site_id,
            job_id=payload.get("job_id") or parent.job_id,
            so_number=payload.get("so_number") or f"{parent.so_number}/CO-{state.call_off_count + 1}",
            so_type=parent.so_type,
            client_id=parent.client_id, client_name=parent.client_name,
            client_unit_id=parent.client_unit_id,
            manufacturer_id=payload.get("manufacturer_id") or parent.manufacturer_id,
            manufacturer_name=payload.get("manufacturer_name") or parent.manufacturer_name,
            amount=amount, currency=parent.currency,
            so_date=payload.get("so_date") or datetime.now(),
            order_role=OrderRole.CALL_OFF.value,
            parent_so_id=parent_so_id,
            term_type=state.term_type,
            valid_from=payload.get("valid_from") or datetime.now(),
            valid_until=valid_until,
            renewal_lead_days=getattr(parent, "renewal_lead_days", None),
            project_number=payload.get("project_number"),
            project_name=payload.get("project_name"),
            created_by=user_id,
        )
        await order.insert()

        await audit.record(
            "service_order", so_id, AuditAction.CREATE,
            actor={"user_id": user_id}, site_id=site_id,
            note=f"Call-off against {parent_so_id}",
            context={"parent_so_id": parent_so_id, "amount": amount,
                     "framework_remaining_after": state.remaining - amount},
        )
        out = order.model_dump(exclude={"id"})
        out["framework_remaining_after"] = round(state.remaining - amount, 2)
        return out

    @staticmethod
    async def make_framework(
        so_id: str, payload: dict, site_id: str, user_id: str
    ) -> dict:
        """Turn an order into a framework.

        Refused once work has been raised against it: those packages would
        become invisible, counted against nothing, which is precisely the
        condition a framework exists to make impossible.
        """
        order = await CommercialService.get_order(so_id, site_id)
        if getattr(order, "parent_so_id", None):
            raise HTTPException(
                409, f"{so_id} is itself a call-off and cannot hold call-offs"
            )
        committed = await CommercialService._committed(so_id, site_id)
        if committed > 0:
            raise HTTPException(
                409,
                f"{so_id} already has {committed:,.0f} of work raised directly "
                f"against it. Making it a framework now would leave those "
                f"packages counted against nothing. Move them to a call-off "
                f"first.",
            )
        order.order_role = OrderRole.FRAMEWORK.value
        order.updated_at = datetime.now()
        await order.save()
        await audit.record(
            "service_order", so_id, AuditAction.UPDATE,
            actor={"user_id": user_id}, site_id=site_id,
            note="Converted to a framework",
        )
        state = await CommercialService.state(so_id, site_id)
        return {"so_id": so_id, "state": state.model_dump()}

    @staticmethod
    async def list_frameworks(site_id: str = "SITE-01") -> dict:
        """Every framework, whether or not anything is wrong with it.

        Discovering frameworks only through the sweep would mean a healthy
        one never appeared anywhere - and a framework at 88% with nothing yet
        flagged is exactly the one worth seeing, because the next call-off is
        the one that does not fit.
        """
        from modules.service_orders.models import ServiceOrder

        rows = await ServiceOrder.find(
            ServiceOrder.site_id == site_id,
            ServiceOrder.order_role == OrderRole.FRAMEWORK.value,
        ).to_list()
        out = []
        for order in rows:
            if not order.is_active:
                continue
            state = await CommercialService.state(order.so_id, site_id)
            out.append({
                "so_id": order.so_id,
                "so_number": order.so_number,
                "client_name": order.client_name,
                "effective_ceiling": state.effective_ceiling,
                "committed": state.committed,
                "remaining": state.remaining,
                "percent_consumed": state.percent_consumed,
                "call_off_count": state.call_off_count,
                "valid_until": state.effective_valid_until,
                "exhausted": state.remaining <= 0,
            })
        out.sort(key=lambda r: -r["percent_consumed"])
        return {"total": len(out), "data": out}

    @staticmethod
    async def framework_view(so_id: str, site_id: str = "SITE-01") -> dict:
        """A framework and everything drawn against it, in one read."""
        state = await CommercialService.state(so_id, site_id)
        if state.order_role != OrderRole.FRAMEWORK.value:
            raise HTTPException(409, f"{so_id} is not a framework")

        children = await CommercialService._call_offs(so_id, site_id)
        rows = []
        for child in children:
            child_state = await CommercialService.state(child.so_id, site_id)
            rows.append({
                "so_id": child.so_id,
                "so_number": child.so_number,
                "project_name": child.project_name,
                "ceiling": child_state.effective_ceiling,
                "consumed": child_state.consumed,
                "percent_consumed": child_state.percent_consumed,
                "valid_until": child_state.effective_valid_until,
                "usable": child_state.usable,
                "blocked_because": child_state.blocked_because,
            })
        return {
            "framework": state.model_dump(),
            "call_offs": rows,
            "note": (
                f"{len(rows)} call-off(s) have carved "
                f"{state.committed:,.0f} out of the "
                f"{state.effective_ceiling:,.0f} ceiling, leaving "
                f"{state.remaining:,.0f}. The framework's figure is what "
                f"binds: a call-off with room of its own cannot spend what "
                f"the framework above it no longer has."
            ),
        }

    # ------------------------------------------------------- the enforcement

    @staticmethod
    async def check_draw(
        so_id: str, amount: float, site_id: str = "SITE-01",
        *, on_date: Optional[datetime] = None,
    ) -> dict:
        """May `amount` of work be drawn against this order?

        Returns every reason it may not, together, rather than the first one.
        Someone told only about the ceiling, who raises an increase and then
        discovers the order also lapsed, has been made to do the work twice.
        """
        state = await CommercialService.state(so_id, site_id)
        when = on_date or datetime.now()
        blockers: list[str] = []
        remedies: list[str] = []

        if state.renewal and state.renewal.expires:
            until = state.effective_valid_until
            if until and when > until:
                blockers.append(
                    f"the order lapsed on {until:%d %b %Y} and this work falls "
                    f"after that"
                )
                remedies.append(AmendmentType.RENEWAL.value)

        projected = state.consumed + float(amount or 0.0)
        if state.effective_ceiling > 0 and projected > state.effective_ceiling:
            over = projected - state.effective_ceiling
            blockers.append(
                f"it would take committed work {over:,.0f} past the "
                f"{state.effective_ceiling:,.0f} ceiling"
            )
            remedies.append(AmendmentType.VALUE_INCREASE.value)

        # The framework above is the binding constraint when it has less
        # room than this call-off does. Checking only the local ceiling is
        # how a framework gets exhausted while every call-off looks healthy.
        if state.parent_remaining is not None and float(amount or 0) > state.parent_remaining:
            blockers.append(
                f"the framework above it ({state.parent_so_id}) has only "
                f"{state.parent_remaining:,.0f} left"
            )
            remedies.append(AmendmentType.VALUE_INCREASE.value)

        if not state.usable and state.blocked_because and not blockers:
            blockers.append(state.blocked_because)

        allowed = not blockers
        return {
            "so_id": so_id,
            "requested": float(amount or 0.0),
            "allowed": allowed,
            "blockers": blockers,
            "suggested_amendments": sorted(set(remedies)),
            "remaining_after": round(state.effective_ceiling - projected, 2),
            "state": state.model_dump(),
            "note": (
                "Within the envelope."
                if allowed else
                "Refused: " + "; and ".join(blockers) + ". Work drawn outside "
                "the envelope is work the client has not agreed to pay for, "
                "and that is argued about at invoice time when there is no "
                "leverage left."
            ),
        }

    # ------------------------------------------------------------- the sweep

    @staticmethod
    async def sweep(site_id: str = "SITE-01", now=None) -> dict:
        """What needs a decision across every order.

        One pass, four buckets, matching the four situations this exists for.
        """
        from modules.service_orders.models import ServiceOrder

        now = now or datetime.now()
        orders = await ServiceOrder.find(
            ServiceOrder.site_id == site_id
        ).to_list()

        renewals, extensions, breaches, at_risk = [], [], [], []
        for order in orders:
            if not order.is_active:
                continue
            try:
                state = await CommercialService.state(order.so_id, site_id, now=now)
            except Exception as e:  # noqa: BLE001
                logger.warning("Could not read %s: %s", order.so_id, e)
                continue

            row = {
                "so_id": order.so_id,
                "so_number": order.so_number,
                "client_name": order.client_name,
                "effective_ceiling": state.effective_ceiling,
                "consumed": state.consumed,
                "percent_consumed": state.percent_consumed,
                "valid_until": state.effective_valid_until,
                "days_remaining": state.renewal.days_remaining if state.renewal else None,
            }

            if state.renewal and (state.renewal.within_lead_time or state.renewal.expired):
                if state.will_expire_underspent:
                    extensions.append({
                        **row,
                        "why": (
                            "the period is closing with most of the value "
                            "unspent and work still outstanding"
                        ),
                    })
                else:
                    renewals.append({**row, "why": state.renewal.note})

            if state.over_ceiling:
                breaches.append({
                    **row,
                    "why": (
                        f"committed work is {state.consumed - state.effective_ceiling:,.0f} "
                        f"over the ceiling"
                    ),
                })

            if state.unbilled_at_risk > 0:
                at_risk.append({
                    **row,
                    "unbilled": state.unbilled_at_risk,
                    "why": "work committed but not invoiced on a closing order",
                })

        total_at_risk = sum(r["unbilled"] for r in at_risk)
        return {
            "as_at": now,
            "renewals_due": renewals,
            "extensions_indicated": extensions,
            "ceiling_breaches": breaches,
            "unbilled_at_risk": at_risk,
            "total_unbilled_at_risk": round(total_at_risk, 2),
            "note": (
                f"{len(renewals)} order(s) need a renewal decision, "
                f"{len(extensions)} look like extensions rather than renewals, "
                f"{len(breaches)} are over ceiling, and {total_at_risk:,.0f} of "
                f"committed work sits uninvoiced on orders that are closing. "
                f"An extension and a renewal are different decisions: an "
                f"underspent order with work outstanding did not run out of "
                f"money, it ran out of time."
            ),
        }

    # --------------------------------------------------------- the successor

    @staticmethod
    async def propose_successor(
        so_id: str, payload: dict, site_id: str, user_id: str
    ) -> dict:
        """New scope for the same client: the shape of the previous order,
        carried onto a new one.

        A draft, not a saved order. The judgement about whether this is really
        new scope belongs to a person, and the one thing the system can do
        usefully is make the alternative visible: if the scope is the same,
        this should have been an amendment.
        """
        order = await CommercialService.get_order(so_id, site_id)
        state = await CommercialService.state(so_id, site_id)

        term_type = state.term_type
        months = payload.get("term_months")
        valid_from = payload.get("valid_from") or datetime.now()
        valid_until = None
        if term_type == TermType.FIXED_PERIOD.value:
            if months:
                valid_until = valid_from + timedelta(days=30 * int(months))
            elif state.valid_from and state.base_valid_until:
                span = state.base_valid_until - state.valid_from
                valid_until = valid_from + span

        return {
            "source_so_id": so_id,
            "draft": {
                "client_id": order.client_id,
                "client_name": order.client_name,
                "client_unit_id": order.client_unit_id,
                "manufacturer_id": order.manufacturer_id,
                "manufacturer_name": order.manufacturer_name,
                "so_type": order.so_type,
                "currency": order.currency,
                "term_type": term_type,
                "valid_from": valid_from,
                "valid_until": valid_until,
                "renewal_lead_days": getattr(
                    order, "renewal_lead_days", DEFAULT_RENEWAL_LEAD_DAYS
                ),
                "amount": payload.get("amount", order.amount),
                "project_number": payload.get("project_number"),
                "project_name": payload.get("project_name"),
            },
            "carried_forward": [
                "client and unit", "manufacturer", "term type and length",
                "renewal lead time", "currency",
            ],
            "not_carried_forward": [
                "the order value, which is specific to the scope",
                "line items, which describe different work",
                "amendments, which belong to the order they changed",
            ],
            "note": (
                "A draft for a new order, not a saved one. This is the right "
                "shape only if the scope is genuinely new. If the client is "
                "asking for more of what this order already covers, it is an "
                "amendment on "
                f"{so_id} - a new order would restate terms both parties have "
                "already agreed, and split one commercial relationship across "
                "two records that have to be reconciled by hand."
            ),
        }
