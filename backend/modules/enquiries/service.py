"""The pre-sales funnel.

PEOPLE_AND_PRESALES_SPEC.md Part A. See models.py for why the two kinds of
"no" are modelled separately; this file is where that distinction is enforced.

Three rules run through everything here:

* **Transitions are checked, not assumed.** Setting a status is never a bare
  assignment - `_move()` refuses anything the state machine has no path for
  and appends to the history. A funnel whose states can be set arbitrarily
  tells you nothing a free-string field did not.
* **A "no" needs a reason.** Both gates require reason codes, because the
  rollup over those codes is the entire commercial point of the module.
* **An issued revision is immutable.** Changing a quotation the client holds
  means issuing the next revision, not editing the one they have.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from fastapi import HTTPException

from core import audit
from core.audit import AuditAction
from core.sequences import next_identifier
from modules.enquiries.models import (
    ALLOWED_TRANSITIONS,
    TERMINAL_STATUSES,
    Enquiry,
    EnquiryCategory,
    EnquiryStatus,
    GoNoGoDecision,
    ProposalRevision,
    ProposalStatus,
    ScorecardCriterion,
    StatusTransition,
)
from modules.enquiries.reason_codes import (
    ReasonCode,
    is_lost_code,
    is_nogo_code,
    seed as seed_reason_codes,
)

#: The scorecard. Weights say what IQE actually cares about: an impartiality
#: conflict or a competence gap outranks commercial appetite, because the first
#: two can make the work impossible to perform defensibly and the third only
#: makes it unattractive.
DEFAULT_CRITERIA: list[tuple[str, str, float]] = [
    ("SCOPE_FIT", "Within our accreditation scope", 2.0),
    ("COMPETENCE", "We have authorised, competent people", 2.0),
    ("IMPARTIALITY", "No impartiality conflict", 2.0),
    ("GEOGRAPHY", "Reachable without disproportionate travel", 1.0),
    ("CAPACITY", "Capacity exists in the client's window", 1.5),
    ("COMMERCIAL", "Rate clears our floor", 1.5),
    ("CLIENT_CREDIT", "Client pays, and pays on time", 1.0),
]

#: Scores run 0-5. Below this share of the weighted maximum the system
#: recommends no-go. Deliberately not a pass mark: a human decides, and may
#: override with a reason.
GO_THRESHOLD_PCT = 60.0

#: A zero here recommends no-go regardless of the total. See _weigh().
DISQUALIFYING = {"SCOPE_FIT", "COMPETENCE", "IMPARTIALITY"}

VALID_DECISIONS = {"go", "no_go"}


def _now() -> datetime:
    return datetime.now()


class EnquiryService:
    # ------------------------------------------------------------- reading

    @staticmethod
    async def list(
        site_id: str,
        status: str = "",
        client_id: str = "",
        page: int = 1,
        per_page: int = 25,
    ):
        query: dict[str, Any] = {"site_id": site_id}
        if status:
            query["status"] = status
        if client_id:
            query["client_id"] = client_id
        total = await Enquiry.find(query).count()
        items = (
            await Enquiry.find(query)
            .sort(-Enquiry.created_at)
            .skip((page - 1) * per_page)
            .limit(per_page)
            .to_list()
        )
        return {
            "total": total,
            "page": page,
            "per_page": per_page,
            "data": [e.model_dump(exclude={"id"}) for e in items],
        }

    @staticmethod
    async def get(enquiry_id: str, site_id: str = "SITE-01") -> Enquiry:
        eq = await Enquiry.find_one(
            Enquiry.enquiry_id == enquiry_id, Enquiry.site_id == site_id
        )
        if not eq:
            raise HTTPException(404, f"Enquiry {enquiry_id} not found")
        return eq

    @staticmethod
    async def detail(enquiry_id: str, site_id: str = "SITE-01") -> dict:
        """Everything a reviewer needs on one screen: the enquiry, its
        decisions and every revision - because the question being asked is
        almost always "how did this get here", not "what is it now"."""
        eq = await EnquiryService.get(enquiry_id, site_id)
        decisions = (
            await GoNoGoDecision.find(
                GoNoGoDecision.enquiry_id == enquiry_id,
                GoNoGoDecision.site_id == site_id,
            )
            .sort(GoNoGoDecision.sequence)
            .to_list()
        )
        revisions = (
            await ProposalRevision.find(
                ProposalRevision.enquiry_id == enquiry_id,
                ProposalRevision.site_id == site_id,
            )
            .sort(ProposalRevision.revision_no)
            .to_list()
        )
        return {
            "enquiry": eq.model_dump(exclude={"id"}),
            "decisions": [d.model_dump(exclude={"id"}) for d in decisions],
            "revisions": [r.model_dump(exclude={"id"}) for r in revisions],
            "next_statuses": sorted(ALLOWED_TRANSITIONS.get(eq.status, set())),
        }

    # ------------------------------------------------------------- writing

    @staticmethod
    async def create(data: dict, site_id: str, user_id: str) -> Enquiry:
        data = dict(data)
        data["site_id"] = site_id
        data["created_by"] = user_id
        if not data.get("enquiry_id"):
            data["enquiry_id"] = await next_identifier(
                Enquiry, "enquiry_id", site_id, "ENQ"
            )
        data.setdefault("enquiry_date", _now())
        data["status"] = EnquiryStatus.DRAFT.value
        data["status_history"] = [
            StatusTransition(to_status=EnquiryStatus.DRAFT.value, by=user_id).model_dump()
        ]
        eq = Enquiry(**data)
        await eq.insert()
        await audit.record(
            "enquiry", eq.enquiry_id, AuditAction.CREATE,
            actor={"user_id": user_id}, site_id=site_id,
            context={"client_id": eq.client_id, "source": eq.source},
        )
        return eq

    @staticmethod
    async def _move(
        eq: Enquiry,
        to_status: str,
        user_id: str,
        note: Optional[str] = None,
    ) -> Enquiry:
        """The only way a status changes.

        Refusing an illegal transition is the point: without this, "status" is
        a free string again and the funnel is decoration.
        """
        from_status = eq.status
        if to_status == from_status:
            return eq
        allowed = ALLOWED_TRANSITIONS.get(from_status, set())
        if to_status not in allowed:
            nxt = ", ".join(sorted(allowed)) or "nothing - this status is terminal"
            raise HTTPException(
                409,
                f"An enquiry in '{from_status}' cannot move to '{to_status}'. "
                f"From here it can go to: {nxt}.",
            )
        eq.status = to_status
        eq.status_history.append(
            StatusTransition(
                from_status=from_status, to_status=to_status, by=user_id, note=note
            )
        )
        eq.updated_at = _now()
        await eq.save()
        await audit.record(
            "enquiry", eq.enquiry_id, AuditAction.STATUS_CHANGE,
            actor={"user_id": user_id}, site_id=eq.site_id, note=note,
            changes=[{"field": "status", "before": from_status, "after": to_status}],
        )
        return eq

    @staticmethod
    async def advance(
        enquiry_id: str, to_status: str, site_id: str, user_id: str,
        note: Optional[str] = None,
    ) -> dict:
        eq = await EnquiryService.get(enquiry_id, site_id)
        eq = await EnquiryService._move(eq, to_status, user_id, note)
        return eq.model_dump(exclude={"id"})

    # ----------------------------------------------------- gate 1: scoring

    @staticmethod
    async def build_scorecard(
        enquiry_id: str, site_id: str, user_id: str, auto_score: bool = True
    ) -> dict:
        """Prepare the scorecard for a decision, pre-scored where the system
        can say something defensible.

        Auto-scores are advisory and stay in their own field. The human's
        number goes in `score`, so when the two disagree both survive.
        """
        eq = await EnquiryService.get(enquiry_id, site_id)
        if eq.status == EnquiryStatus.DRAFT:
            eq = await EnquiryService._move(
                eq, EnquiryStatus.QUALIFYING, user_id, "scorecard opened"
            )
        if eq.status == EnquiryStatus.QUALIFYING:
            eq = await EnquiryService._move(eq, EnquiryStatus.PENDING_DECISION, user_id)

        criteria = [
            ScorecardCriterion(code=code, label=label, weight=weight)
            for code, label, weight in DEFAULT_CRITERIA
        ]
        if auto_score:
            await EnquiryService._auto_score(eq, criteria)

        return {
            "enquiry_id": enquiry_id,
            "criteria": [c.model_dump() for c in criteria],
            "max_score": round(sum(c.weight * 5 for c in criteria), 2),
            "go_threshold_pct": GO_THRESHOLD_PCT,
            "note": (
                "Scores run 0-5. Auto-scores are a starting point and are kept "
                "separate from your own; where you disagree, both are recorded."
            ),
        }

    @staticmethod
    async def _auto_score(eq: Enquiry, criteria: list[ScorecardCriterion]) -> None:
        """Pre-score the criteria the system can answer from its own records.

        Only two are answerable without a model: whether anyone is authorised
        for the work, and whether the client has a history. Everything else is
        left blank rather than guessed - a fabricated score on a scorecard
        meant to be defensible is worse than an empty one.
        """
        by_code = {c.code: c for c in criteria}

        # COMPETENCE: is anyone authorised and deployable at this site?
        try:
            from modules.people.service import PeopleService

            pool = await PeopleService.deployable_pool(eq.site_id)
            people = pool.get("data", pool) if isinstance(pool, dict) else pool
            count = len(people or [])
            c = by_code.get("COMPETENCE")
            if c is not None:
                if count == 0:
                    c.auto_score, c.auto_rationale = 0, (
                        "No deployable authorised person on record at this site."
                    )
                elif count < 3:
                    c.auto_score, c.auto_rationale = 2, (
                        f"Only {count} deployable authorised "
                        f"{'person' if count == 1 else 'people'} on record."
                    )
                else:
                    c.auto_score, c.auto_rationale = 4, (
                        f"{count} deployable authorised people on record. "
                        "Confirm one covers the methods this enquiry needs."
                    )
        except Exception:
            pass

        # CLIENT_CREDIT: have we been paid by this client before?
        try:
            from modules.invoices.models import Invoice

            invoices = await Invoice.find(
                Invoice.site_id == eq.site_id, Invoice.client_id == eq.client_id
            ).to_list()
            c = by_code.get("CLIENT_CREDIT")
            if c is not None and invoices:
                paid = [i for i in invoices if (i.status or "").lower() == "paid"]
                ratio = len(paid) / len(invoices)
                c.auto_score = 5 if ratio >= 0.9 else 3 if ratio >= 0.6 else 1
                c.auto_rationale = (
                    f"{len(paid)} of {len(invoices)} previous invoices settled."
                )
            elif c is not None:
                c.auto_rationale = "No invoice history with this client."
        except Exception:
            pass

    @staticmethod
    def _weigh(criteria: list[ScorecardCriterion]) -> tuple[float, float, str]:
        """Weighted score, maximum, and what the score recommends.

        Unscored criteria count as zero rather than being dropped from the
        denominator: an unanswered "is there an impartiality conflict" should
        drag the recommendation down, not be quietly excused.

        Three criteria are disqualifying rather than weighted. A weighted
        average lets a zero be outvoted by six good scores, which is right for
        a thin margin and wrong for these: an impartiality conflict is
        forbidden by ISO/IEC 17020 cl. 4.1 however attractive the work, work
        outside the scope of accreditation cannot be certified at all, and
        with nobody competent the inspection cannot be performed. Those are
        not things a high score elsewhere can compensate for, so a zero on any
        of them recommends no-go whatever the total says.
        """
        total = sum(c.weight * (c.score or 0) for c in criteria)
        maximum = sum(c.weight * 5 for c in criteria)
        pct = (total / maximum * 100) if maximum else 0.0

        blocked = any(
            c.code in DISQUALIFYING and (c.score or 0) == 0 for c in criteria
        )
        recommendation = (
            "no_go" if blocked or pct < GO_THRESHOLD_PCT else "go"
        )
        return round(total, 2), round(maximum, 2), recommendation

    @staticmethod
    async def decide(
        enquiry_id: str, payload: dict, site_id: str, user_id: str
    ) -> dict:
        """Gate 1. Record the scorecard, the recommendation and the decision.

        An override without a reason is refused, and so is a no-go without
        reason codes - those two records are the whole value of the gate.
        """
        eq = await EnquiryService.get(enquiry_id, site_id)
        if eq.status not in {EnquiryStatus.PENDING_DECISION, EnquiryStatus.REMEDIATION}:
            raise HTTPException(
                409,
                f"A decision can only be recorded from 'pending_decision' or "
                f"'remediation'; this enquiry is '{eq.status}'.",
            )

        decision = (payload.get("decision") or "").lower()
        if decision not in VALID_DECISIONS:
            raise HTTPException(400, "decision must be 'go' or 'no_go'")

        criteria = [ScorecardCriterion(**c) for c in payload.get("criteria", [])]
        if not criteria:
            raise HTTPException(
                400, "A decision needs its scorecard; build it first."
            )
        for c in criteria:
            if c.score is not None and not 0 <= c.score <= 5:
                raise HTTPException(400, f"{c.code}: score must be between 0 and 5")

        total, maximum, recommendation = EnquiryService._weigh(criteria)
        override_reason = (payload.get("override_reason") or "").strip() or None
        if decision != recommendation and not override_reason:
            raise HTTPException(
                400,
                f"The scorecard recommends '{recommendation}' and you chose "
                f"'{decision}'. An override needs a reason - it is what makes "
                f"the decision defensible later.",
            )

        reason_codes = list(payload.get("reason_codes") or [])
        if decision == "no_go":
            if not reason_codes:
                raise HTTPException(
                    400,
                    "A no-go needs at least one reason code. Without one there "
                    "is no record of what to fix before re-approaching.",
                )
            await EnquiryService._validate_codes(reason_codes, site_id, gate="nogo")

        prior = await GoNoGoDecision.find(
            GoNoGoDecision.enquiry_id == enquiry_id,
            GoNoGoDecision.site_id == site_id,
        ).count()

        record = GoNoGoDecision(
            decision_id=await next_identifier(
                GoNoGoDecision, "decision_id", site_id, "GNG"
            ),
            enquiry_id=enquiry_id,
            site_id=site_id,
            sequence=prior + 1,
            criteria=criteria,
            weighted_score=total,
            max_score=maximum,
            recommendation=recommendation,
            decision=decision,
            override_reason=override_reason,
            reason_codes=reason_codes,
            decided_by=user_id,
            remediation_plan=payload.get("remediation_plan"),
            remediation_owner=payload.get("remediation_owner"),
            remediation_due=payload.get("remediation_due"),
        )
        await record.insert()

        target = EnquiryStatus.GO if decision == "go" else EnquiryStatus.NO_GO
        if eq.status == EnquiryStatus.REMEDIATION:
            # A re-run after remediation re-enters the gate before moving on.
            eq = await EnquiryService._move(
                eq, EnquiryStatus.PENDING_DECISION, user_id,
                f"re-decided after remediation (attempt {prior + 1})",
            )
        eq = await EnquiryService._move(
            eq, target, user_id, f"decision {record.decision_id}"
        )
        if decision == "no_go":
            eq.outcome_reason_codes = reason_codes
            await eq.save()

        await audit.record(
            "enquiry", enquiry_id, AuditAction.AUTHORIZE,
            actor={"user_id": user_id}, site_id=site_id,
            note=f"Gate 1: {decision} (scorecard recommended {recommendation})",
            context={
                "decision_id": record.decision_id,
                "weighted_score": total,
                "max_score": maximum,
                "reason_codes": reason_codes,
                "overridden": decision != recommendation,
            },
        )
        return record.model_dump(exclude={"id"})

    @staticmethod
    async def _validate_codes(codes: list[str], site_id: str, gate: str) -> None:
        """Reject a code that does not exist, or that belongs to the other
        gate - a LOST_PRICE on a no-go would corrupt the rollup that the whole
        taxonomy exists to produce."""
        await seed_reason_codes(site_id)
        known = {
            r.code
            for r in await ReasonCode.find(
                ReasonCode.site_id == site_id, ReasonCode.is_active == True  # noqa: E712
            ).to_list()
        }
        unknown = [c for c in codes if c not in known]
        if unknown:
            raise HTTPException(400, f"Unknown reason code(s): {', '.join(unknown)}")
        if gate == "nogo":
            wrong = [c for c in codes if not is_nogo_code(c)]
            if wrong:
                raise HTTPException(
                    400,
                    f"{', '.join(wrong)} describe why a client did not award the "
                    f"work, not why we declined to bid. Use a NOGO_* code.",
                )
        else:
            wrong = [c for c in codes if not is_lost_code(c)]
            if wrong:
                raise HTTPException(
                    400,
                    f"{', '.join(wrong)} describe why we declined to bid, not why "
                    f"the client did not award. Use a LOST_* code.",
                )

    @staticmethod
    async def remediate(
        enquiry_id: str, payload: dict, site_id: str, user_id: str
    ) -> dict:
        """Open the remedy loop on a no-go.

        This is the path the spec describes as the one the current model
        cannot express: a no-go is a constraint to fix, not an ending.
        """
        eq = await EnquiryService.get(enquiry_id, site_id)
        plan = (payload.get("remediation_plan") or "").strip()
        if not plan:
            raise HTTPException(
                400, "Say what will be fixed; the loop is pointless without it."
            )
        eq = await EnquiryService._move(
            eq, EnquiryStatus.REMEDIATION, user_id, plan
        )
        latest = (
            await GoNoGoDecision.find(
                GoNoGoDecision.enquiry_id == enquiry_id,
                GoNoGoDecision.site_id == site_id,
            )
            .sort(-GoNoGoDecision.sequence)
            .first_or_none()
        )
        if latest:
            latest.remediation_plan = plan
            latest.remediation_owner = payload.get("remediation_owner")
            latest.remediation_due = payload.get("remediation_due")
            latest.linked_requisition_id = payload.get("linked_requisition_id")
            await latest.save()
        return eq.model_dump(exclude={"id"})

    # -------------------------------------------------- gate 2: proposals

    @staticmethod
    async def create_proposal(
        enquiry_id: str, payload: dict, site_id: str, user_id: str
    ) -> dict:
        """Rev 0."""
        eq = await EnquiryService.get(enquiry_id, site_id)
        if eq.current_proposal_id:
            raise HTTPException(
                409,
                f"{enquiry_id} already has proposal {eq.current_proposal_id}. "
                f"Add a revision to it rather than starting another.",
            )
        if eq.status == EnquiryStatus.GO:
            eq = await EnquiryService._move(eq, EnquiryStatus.ESTIMATING, user_id)
        if eq.status != EnquiryStatus.ESTIMATING:
            raise HTTPException(
                409,
                f"A proposal is drawn up after a go decision; this enquiry is "
                f"'{eq.status}'.",
            )

        proposal_id = await next_identifier(
            ProposalRevision, "proposal_id", site_id, "QTN"
        )
        rev = ProposalRevision(
            proposal_id=proposal_id,
            revision_no=0,
            enquiry_id=enquiry_id,
            site_id=site_id,
            created_by=user_id,
            **EnquiryService._pricing(payload, eq),
        )
        await rev.insert()

        eq.current_proposal_id = proposal_id
        eq.current_revision_no = 0
        eq.updated_at = _now()
        await eq.save()
        await EnquiryService._move(eq, EnquiryStatus.PROPOSAL_DRAFT, user_id)

        await audit.record(
            "enquiry", enquiry_id, AuditAction.CREATE,
            actor={"user_id": user_id}, site_id=site_id,
            note=f"Proposal {proposal_id} Rev 0 drafted",
            context={"total_value": rev.total_value},
        )
        return rev.model_dump(exclude={"id"})

    @staticmethod
    def _pricing(payload: dict, eq: Enquiry) -> dict:
        """Work the total out here rather than trusting a number from the
        client of the API: a quotation whose total does not follow from its
        own line items is indefensible in a dispute."""
        items = payload.get("line_items")
        line_items = (
            [EnquiryCategory(**i) for i in items] if items else list(eq.categories)
        )
        inspector_cost = float(payload.get("inspector_cost") or 0.0)
        travel_cost = float(payload.get("travel_cost") or 0.0)
        overhead_pct = float(payload.get("overhead_pct") or 0.0)
        margin_pct = float(payload.get("margin_pct") or 0.0)

        line_total = sum(
            (i.rate if i.rate is not None else i.budget) * (i.qty or 1)
            if i.rate is not None
            else (i.budget or 0.0)
            for i in line_items
        )
        base = line_total + inspector_cost + travel_cost
        with_overhead = base * (1 + overhead_pct / 100)
        total = with_overhead * (1 + margin_pct / 100)

        return {
            "currency": payload.get("currency", "INR"),
            "line_items": line_items,
            "estimated_mandays": float(payload.get("estimated_mandays") or 0.0),
            "inspector_cost": inspector_cost,
            "travel_cost": travel_cost,
            "overhead_pct": overhead_pct,
            "margin_pct": margin_pct,
            "total_value": round(total, 2),
            "validity_days": int(payload.get("validity_days") or 30),
            "change_summary": payload.get("change_summary"),
        }

    @staticmethod
    async def add_revision(
        proposal_id: str, payload: dict, site_id: str, user_id: str
    ) -> dict:
        """Rev n+1, copy-on-write from the latest.

        The previous revision is left exactly as the client received it. This
        is the rule the spec calls the most damaging one to get wrong.
        """
        revisions = (
            await ProposalRevision.find(
                ProposalRevision.proposal_id == proposal_id,
                ProposalRevision.site_id == site_id,
            )
            .sort(-ProposalRevision.revision_no)
            .to_list()
        )
        if not revisions:
            raise HTTPException(404, f"Proposal {proposal_id} not found")
        latest = revisions[0]

        summary = (payload.get("change_summary") or "").strip()
        if not summary:
            raise HTTPException(
                400,
                "A revision needs a change summary. 'What changed between Rev "
                f"{latest.revision_no} and Rev {latest.revision_no + 1}' is the "
                "first question asked in any dispute.",
            )

        eq = await EnquiryService.get(latest.enquiry_id, site_id)
        # Carry forward anything the caller did not restate.
        carried = {
            "line_items": [i.model_dump() for i in latest.line_items],
            "estimated_mandays": latest.estimated_mandays,
            "inspector_cost": latest.inspector_cost,
            "travel_cost": latest.travel_cost,
            "overhead_pct": latest.overhead_pct,
            "margin_pct": latest.margin_pct,
            "validity_days": latest.validity_days,
            "currency": latest.currency,
        }
        carried.update({k: v for k, v in payload.items() if v is not None})

        rev = ProposalRevision(
            proposal_id=proposal_id,
            revision_no=latest.revision_no + 1,
            enquiry_id=latest.enquiry_id,
            site_id=site_id,
            created_by=user_id,
            **EnquiryService._pricing(carried, eq),
        )
        await rev.insert()

        if latest.status == ProposalStatus.ISSUED:
            latest.status = ProposalStatus.SUPERSEDED.value
            latest.updated_at = _now()
            await latest.save()

        eq.current_revision_no = rev.revision_no
        eq.updated_at = _now()
        await eq.save()

        await audit.record(
            "enquiry", eq.enquiry_id, AuditAction.REVISE,
            actor={"user_id": user_id}, site_id=site_id,
            note=f"{proposal_id} Rev {rev.revision_no}: {summary}",
            changes=[{
                "field": "total_value",
                "before": str(latest.total_value),
                "after": str(rev.total_value),
            }],
        )
        return rev.model_dump(exclude={"id"})

    @staticmethod
    async def issue_revision(
        proposal_id: str, revision_no: int, site_id: str, user_id: str
    ) -> dict:
        """Freeze a revision and send it. After this it cannot be edited."""
        rev = await ProposalRevision.find_one(
            ProposalRevision.proposal_id == proposal_id,
            ProposalRevision.revision_no == revision_no,
            ProposalRevision.site_id == site_id,
        )
        if not rev:
            raise HTTPException(404, f"{proposal_id} Rev {revision_no} not found")
        if rev.status != ProposalStatus.DRAFT:
            raise HTTPException(
                409,
                f"Rev {revision_no} is already {rev.status}. Add a new revision "
                f"instead - what the client holds does not change.",
            )
        rev.status = ProposalStatus.ISSUED.value
        rev.issued_at = _now()
        rev.issued_by = user_id
        rev.updated_at = _now()
        await rev.save()

        eq = await EnquiryService.get(rev.enquiry_id, site_id)
        eq.pipeline_value = rev.total_value
        await eq.save()
        if eq.status in {EnquiryStatus.PROPOSAL_DRAFT, EnquiryStatus.UNDER_CLARIFICATION,
                         EnquiryStatus.REVIVED}:
            await EnquiryService._move(
                eq, EnquiryStatus.SUBMITTED, user_id,
                f"{proposal_id} Rev {revision_no} issued",
            )

        await audit.record(
            "enquiry", rev.enquiry_id, AuditAction.ISSUE,
            actor={"user_id": user_id}, site_id=site_id,
            note=f"{proposal_id} Rev {revision_no} issued",
            context={"total_value": rev.total_value, "validity_days": rev.validity_days},
        )
        return rev.model_dump(exclude={"id"})

    # ---------------------------------------------------- gate 2: outcome

    @staticmethod
    async def record_outcome(
        enquiry_id: str, payload: dict, site_id: str, user_id: str
    ) -> dict:
        """Gate 2: the client's decision."""
        eq = await EnquiryService.get(enquiry_id, site_id)
        outcome = (payload.get("outcome") or "").lower()
        if outcome not in {"won", "lost"}:
            raise HTTPException(400, "outcome must be 'won' or 'lost'")

        if outcome == "lost":
            codes = list(payload.get("reason_codes") or [])
            if not codes:
                raise HTTPException(
                    400,
                    "A loss needs at least one reason code. The rollup over "
                    "these is the only pricing and positioning data the firm "
                    "gets from work it did not win.",
                )
            await EnquiryService._validate_codes(codes, site_id, gate="lost")
            eq.outcome_reason_codes = codes
            eq.competitor_names = list(payload.get("competitor_names") or [])
            await eq.save()
            eq = await EnquiryService._move(
                eq, EnquiryStatus.LOST, user_id, payload.get("note")
            )
        else:
            eq.award_reference = payload.get("award_reference")
            await eq.save()
            eq = await EnquiryService._move(
                eq, EnquiryStatus.WON, user_id, payload.get("award_reference")
            )

        await audit.record(
            "enquiry", enquiry_id, AuditAction.STATUS_CHANGE,
            actor={"user_id": user_id}, site_id=site_id,
            note=f"Gate 2: {outcome}",
            context={
                "reason_codes": eq.outcome_reason_codes,
                "competitors": eq.competitor_names,
                "award_reference": eq.award_reference,
            },
        )
        return eq.model_dump(exclude={"id"})

    @staticmethod
    async def revive(enquiry_id: str, payload: dict, site_id: str, user_id: str) -> dict:
        """A lost enquiry the client has re-opened. The loss stays on the
        record; this is a new attempt, not a correction of the old one."""
        eq = await EnquiryService.get(enquiry_id, site_id)
        return (
            await EnquiryService._move(
                eq, EnquiryStatus.REVIVED, user_id, payload.get("note")
            )
        ).model_dump(exclude={"id"})

    @staticmethod
    async def close(enquiry_id: str, payload: dict, site_id: str, user_id: str) -> dict:
        """Stop pursuing. Which terminal state applies follows from where the
        enquiry is, so the caller cannot file a loss as a no-bid."""
        eq = await EnquiryService.get(enquiry_id, site_id)
        target = (
            EnquiryStatus.CLOSED_NO_BID
            if eq.status in {EnquiryStatus.NO_GO, EnquiryStatus.REMEDIATION}
            else EnquiryStatus.CLOSED_LOST
        )
        return (
            await EnquiryService._move(eq, target, user_id, payload.get("note"))
        ).model_dump(exclude={"id"})

    # ------------------------------------------------------------ convert

    @staticmethod
    async def convert(enquiry_id: str, payload: dict, site_id: str, user_id: str) -> dict:
        """The join to the rest of the system: a won enquiry becomes a Job.

        Deliberately not idempotent-by-accident - a second call is refused
        rather than quietly creating a second job for the same award.
        """
        from modules.jobs.models import Job

        eq = await EnquiryService.get(enquiry_id, site_id)
        if eq.status == EnquiryStatus.CONVERTED:
            raise HTTPException(
                409, f"{enquiry_id} is already job {eq.won_job_id}."
            )
        if eq.status != EnquiryStatus.WON:
            raise HTTPException(
                409,
                f"Only a won enquiry converts to a job; this one is '{eq.status}'.",
            )

        latest = None
        if eq.current_proposal_id:
            latest = await ProposalRevision.find_one(
                ProposalRevision.proposal_id == eq.current_proposal_id,
                ProposalRevision.revision_no == (eq.current_revision_no or 0),
                ProposalRevision.site_id == site_id,
            )

        job_id = await next_identifier(Job, "job_id", site_id, "JOB")
        job = Job(
            job_id=job_id,
            site_id=site_id,
            status="active",
            client_id=eq.client_id,
            client_name=payload.get("client_name"),
            title=payload.get("title") or f"Awarded from {enquiry_id}",
            description=payload.get("description")
            or f"Converted from enquiry {enquiry_id}"
            + (f", award reference {eq.award_reference}" if eq.award_reference else ""),
            # The job is budgeted at the revision the client actually awarded,
            # not at a number re-entered by hand.
            budget_contract_amount=latest.total_value if latest else 0.0,
            budget_total=latest.total_value if latest else 0.0,
            budget=latest.total_value if latest else 0.0,
            currency=latest.currency if latest else "INR",
            # Carry the enquiry's scope across as the job's scope of work.
            tags=[f"enquiry:{enquiry_id}"]
            + ([f"proposal:{eq.current_proposal_id}"] if eq.current_proposal_id else []),
            created_by=user_id,
        )

        # Autonomous SOW Scenario injection
        from modules.jobs.scenarios import PREDEFINED_SOW_TEMPLATES
        from modules.jobs.models import SOWItem
        from modules.service_orders.models import ServiceOrder
        from modules.work_packages.models import WorkPackage

        cat_text = (eq.category or "") + " " + " ".join(c.description or "" for c in (eq.categories or [])) + " " + (payload.get("title") or "")
        desc_lower = cat_text.lower()
        if any(w in desc_lower for w in ["pipe", "vessel", "boiler", "tank"]):
            template_code = "PV-ASME"
        elif any(w in desc_lower for w in ["structur", "steel", "fabricat"]):
            template_code = "STR-AWS"
        elif any(w in desc_lower for w in ["electr", "panel", "switchgear"]):
            template_code = "ELE-IEC"
        elif any(w in desc_lower for w in ["valve", "flow"]):
            template_code = "VAL-API"
        else:
            template_code = "NDT-ASNT"

        chosen_template = next((t for t in PREDEFINED_SOW_TEMPLATES if t["code"] == template_code), PREDEFINED_SOW_TEMPLATES[0])
        job.job_type_category = template_code.split("-")[0]
        job.scope_of_work = [SOWItem(**item) for item in chosen_template["checklist_items"]]
        await job.insert()

        # Autonomous linked ServiceOrder creation
        so_id = await next_identifier(ServiceOrder, "so_id", site_id, "SO")
        so = ServiceOrder(
            so_id=so_id,
            site_id=site_id,
            job_id=job_id,
            so_number=f"SO/{job_id.replace('JOB-', '')}",
            order_name=f"Service Order - {job.title}",
            client_id=eq.client_id,
            status="approved",
            order_type="tpi_inspection",
            estimated_cost=job.budget_total,
            currency=job.currency,
            created_by=user_id,
        )
        await so.insert()

        # Autonomous linked WorkPackage creation
        wp_id = await next_identifier(WorkPackage, "work_package_id", site_id, "WP")
        work_type_code = "CODE_INSP" if template_code != "NDT-ASNT" else "VENDOR_AUDIT"
        wp = WorkPackage(
            work_package_id=wp_id,
            site_id=site_id,
            job_id=job_id,
            so_id=so_id,
            work_type_code=work_type_code,
            title=f"Field Quality & NDT Package for {job.title}",
            description=f"Auto-generated inspection package linked to SOW {template_code}",
            status="planned",
            client_id=eq.client_id,
            planned_quantity=len(job.scope_of_work),
            planned_uom="CHECKPOINTS",
            rate=job.budget_total,
            ceiling_value=job.budget_total,
            currency=job.currency,
            created_by=user_id,
        )
        await wp.insert()

        eq.won_job_id = job_id
        await eq.save()
        await EnquiryService._move(
            eq, EnquiryStatus.CONVERTED, user_id, f"converted to {job_id}"
        )

        await audit.record(
            "enquiry", enquiry_id, AuditAction.STATUS_CHANGE,
            actor={"user_id": user_id}, site_id=site_id,
            note=f"Converted to job {job_id} with SO {so_id} and WP {wp_id}",
            context={"job_id": job_id, "so_id": so_id, "work_package_id": wp_id, "award_reference": eq.award_reference},
        )
        await audit.record(
            "job", job_id, AuditAction.CREATE,
            actor={"user_id": user_id}, site_id=site_id,
            note=f"Created from enquiry {enquiry_id} with SOW {template_code}",
            context={"enquiry_id": enquiry_id, "template_code": template_code},
        )
        return {
            "job_id": job_id,
            "so_id": so_id,
            "work_package_id": wp_id,
            "applied_template": chosen_template["method_name"],
            "sow_checkpoints_count": len(job.scope_of_work),
            "enquiry": eq.model_dump(exclude={"id"}),
        }


class PipelineService:
    """What the funnel looks like, and why work does not arrive."""

    @staticmethod
    async def summary(site_id: str = "SITE-01") -> dict:
        items = await Enquiry.find(Enquiry.site_id == site_id).to_list()
        by_status: dict[str, dict] = {}
        for e in items:
            row = by_status.setdefault(e.status, {"count": 0, "value": 0.0})
            row["count"] += 1
            row["value"] += e.pipeline_value or 0.0

        live = [e for e in items if e.status not in TERMINAL_STATUSES]
        # Weighted forecast: value times the firm's own probability. Shown
        # beside the raw total because the raw total always flatters.
        weighted = sum(
            (e.pipeline_value or 0.0) * (e.probability_pct or 0) / 100 for e in live
        )

        decided = [
            e for e in items
            if e.status in {EnquiryStatus.WON, EnquiryStatus.CONVERTED,
                            EnquiryStatus.LOST, EnquiryStatus.CLOSED_LOST}
        ]
        won = [e for e in decided
               if e.status in {EnquiryStatus.WON, EnquiryStatus.CONVERTED}]
        no_bid = [e for e in items
                  if e.status in {EnquiryStatus.NO_GO, EnquiryStatus.REMEDIATION,
                                  EnquiryStatus.CLOSED_NO_BID}]

        return {
            "total": len(items),
            "live": len(live),
            "by_status": by_status,
            "pipeline_value": round(sum(e.pipeline_value or 0.0 for e in live), 2),
            "weighted_value": round(weighted, 2),
            "win_rate_pct": round(len(won) / len(decided) * 100, 1) if decided else None,
            "bid_count": len(decided),
            "no_bid_count": len(no_bid),
            "note": (
                "Win rate counts only enquiries IQE bid on. The "
                f"{len(no_bid)} declined at gate 1 are reported separately - "
                "folding them in would make a disciplined no-bid look like a loss."
            ),
        }

    @staticmethod
    async def loss_analysis(site_id: str = "SITE-01") -> dict:
        """Reason-code rollup, with the two gates kept apart."""
        await seed_reason_codes(site_id)
        catalogue = {
            r.code: r
            for r in await ReasonCode.find(ReasonCode.site_id == site_id).to_list()
        }
        items = await Enquiry.find(Enquiry.site_id == site_id).to_list()

        declined: dict[str, int] = {}
        lost: dict[str, int] = {}
        for e in items:
            for code in e.outcome_reason_codes or []:
                bucket = declined if is_nogo_code(code) else lost
                bucket[code] = bucket.get(code, 0) + 1

        def rows(counts: dict[str, int]) -> list[dict]:
            return sorted(
                (
                    {
                        "code": code,
                        "count": n,
                        "group": getattr(catalogue.get(code), "group", None),
                        "label": getattr(catalogue.get(code), "label", code),
                        "remedy_hint": getattr(catalogue.get(code), "remedy_hint", None),
                    }
                    for code, n in counts.items()
                ),
                key=lambda r: -r["count"],
            )

        return {
            "we_declined": rows(declined),
            "client_did_not_award": rows(lost),
            "note": (
                "Kept apart on purpose. The first group is work IQE turned "
                "down and every line points at something IQE could change. The "
                "second is work the client placed elsewhere. Averaging them "
                "would suggest a remedy for neither."
            ),
        }
