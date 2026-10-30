"""The commercial envelope: ceilings, periods, amendments and renewals.

Four situations drive this module, and the tests are grouped by them:

1. A fixed-period order nearing its end date - renew it.
2. Work that would take the order past its ceiling - refuse it, increase the
   value.
3. A period closing with the money unspent and the work not done - extend it.
   The budget was never the problem.
4. New scope from the same client - a new order, not an amendment.

Underneath all four is one rule: more money or more time on the same scope is
an amendment; new scope is a new order. Most of what follows guards that line
and the one that keeps it honest - IQE cannot move its own envelope.
"""
import sys
from datetime import datetime, timedelta
from pathlib import Path

import pytest
import pytest_asyncio
from beanie import init_beanie
from fastapi import HTTPException
from mongomock_motor import AsyncMongoMockClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.audit import AuditEntry  # noqa: E402
from core.sequences import Sequence  # noqa: E402
from modules.commercial.models import (  # noqa: E402
    Amendment,
    AmendmentStatus,
    TermType,
)
from modules.commercial.service import CommercialService  # noqa: E402
from modules.invoices.models import Invoice  # noqa: E402
from modules.jobs.models import Job  # noqa: E402
from modules.service_orders.models import ServiceOrder  # noqa: E402
from modules.work_packages.models import WorkPackage  # noqa: E402
from modules.work_types.models import WorkTypeDefinition  # noqa: E402

SITE = "SITE-01"
USER = "EMP-COORD"
LAKH = 100_000.0


def _patch_mongomock():
    from mongomock_motor import AsyncMongoMockDatabase

    original = AsyncMongoMockDatabase.list_collection_names

    async def patched(self, *args, **kwargs):
        kwargs.pop("authorizedCollections", None)
        kwargs.pop("nameOnly", None)
        return await original(self, *args, **kwargs)

    AsyncMongoMockDatabase.list_collection_names = patched


@pytest_asyncio.fixture
async def db():
    _patch_mongomock()
    client = AsyncMongoMockClient()
    await init_beanie(
        database=client["commercial_test"],
        document_models=[
            ServiceOrder, Amendment, WorkPackage, Job, Invoice,
            WorkTypeDefinition,
            AuditEntry, Sequence,
        ],
    )
    yield client


async def _order(
    so_id="SO-2026-0001", amount=5 * LAKH, term=TermType.FIXED_PERIOD,
    starts_days_ago=180, runs_days=365, lead=60,
) -> ServiceOrder:
    now = datetime.now()
    order = ServiceOrder(
        so_id=so_id, job_id="JOB-2026-0003", site_id=SITE,
        so_number="SHMIC/SO/2026/14", so_type="SO",
        client_id="CLI-0001", client_name="Suguna Holdings",
        amount=amount, currency="INR",
        so_date=now - timedelta(days=starts_days_ago),
        term_type=term.value,
        valid_from=now - timedelta(days=starts_days_ago),
        valid_until=(
            now - timedelta(days=starts_days_ago) + timedelta(days=runs_days)
            if term == TermType.FIXED_PERIOD else None
        ),
        renewal_lead_days=lead,
    )
    await order.insert()
    return order


async def _package(so_id: str, ceiling: float, wp_id: str, status="PLANNED"):
    wp = WorkPackage(
        work_package_id=wp_id, site_id=SITE, job_id="JOB-2026-0003",
        so_id=so_id, work_type_code="TPI-VIS", title=f"Package {wp_id}",
        ceiling_value=ceiling, status=status,
    )
    await wp.insert()
    return wp


async def _amend(so_id, kind, *, value=0.0, until=None, reason="Because.",
                 approve=True):
    out = await CommercialService.propose(
        {"so_id": so_id, "amendment_type": kind, "value_delta": value,
         "new_valid_until": until, "reason": reason},
        SITE, USER,
    )
    if approve:
        out = await CommercialService.approve(
            out["amendment_id"],
            {"client_authority": "SHMIC/LTR/2026/318",
             "approved_by_client": "K. Ramesh, SHMIC"},
            SITE, USER,
        )
    return out


# ------------------------------------------------------------------- terms

@pytest.mark.asyncio
async def test_a_fixed_period_order_needs_an_end_date(db):
    """Without one it never alerts, and work continues past the term with
    nobody noticing."""
    await _order()
    with pytest.raises(HTTPException) as e:
        await CommercialService.set_terms(
            "SO-2026-0001", {"term_type": "FIXED_PERIOD"}, SITE, USER
        )
    assert "never alerts for renewal" in e.value.detail


@pytest.mark.asyncio
async def test_an_open_ended_order_cannot_carry_an_end_date(db):
    """The two say different things, and a reader would believe the date."""
    await _order()
    with pytest.raises(HTTPException) as e:
        await CommercialService.set_terms(
            "SO-2026-0001",
            {"term_type": "OPEN_ENDED",
             "valid_until": datetime.now() + timedelta(days=90)},
            SITE, USER,
        )
    assert "does not end on a date" in e.value.detail


@pytest.mark.asyncio
async def test_the_envelope_is_computed_from_the_work_not_stored(db):
    """A stored balance is a number that was true once."""
    await _order(amount=5 * LAKH)
    await _package("SO-2026-0001", 1 * LAKH, "WP-2026-0001")
    first = await CommercialService.state("SO-2026-0001", SITE)
    assert first.committed == 1 * LAKH
    assert first.remaining == 4 * LAKH

    await _package("SO-2026-0001", 1.5 * LAKH, "WP-2026-0002")
    second = await CommercialService.state("SO-2026-0001", SITE)
    assert second.committed == 2.5 * LAKH
    assert second.remaining == 2.5 * LAKH
    assert second.percent_consumed == 50.0


@pytest.mark.asyncio
async def test_cancelled_packages_do_not_consume_the_envelope(db):
    await _order(amount=5 * LAKH)
    await _package("SO-2026-0001", 1 * LAKH, "WP-2026-0001")
    await _package("SO-2026-0001", 2 * LAKH, "WP-2026-0002", status="CANCELLED")
    state = await CommercialService.state("SO-2026-0001", SITE)
    assert state.committed == 1 * LAKH


@pytest.mark.asyncio
async def test_consumption_takes_the_greater_of_committed_and_invoiced(db):
    """Billed work counts even where no package was raised for it, and
    committed work counts before it is billed. Adding them would double."""
    await _order(amount=5 * LAKH)
    await _package("SO-2026-0001", 1 * LAKH, "WP-2026-0001")
    await Invoice(
        invoice_id="INV-2026-0001", job_id="JOB-2026-0003", site_id=SITE,
        invoice_number="IQE/2026/0001", grand_total=3 * LAKH, status="issued",
    ).insert()

    state = await CommercialService.state("SO-2026-0001", SITE)
    assert state.committed == 1 * LAKH
    assert state.invoiced == 3 * LAKH
    assert state.consumed == 3 * LAKH        # not 4


# ------------------------------------------- scenario 2: the ceiling breach

@pytest.mark.asyncio
async def test_work_that_would_breach_the_ceiling_is_refused(db):
    """Scenario 2. A lakh allocated, a lakh committed, and more asked for."""
    await _order(amount=1 * LAKH)
    await _package("SO-2026-0001", 0.9 * LAKH, "WP-2026-0001")

    check = await CommercialService.check_draw("SO-2026-0001", 0.5 * LAKH, SITE)
    assert check["allowed"] is False
    assert "past the" in check["blockers"][0]
    assert check["suggested_amendments"] == ["VALUE_INCREASE"]
    assert "no leverage left" in check["note"]


@pytest.mark.asyncio
async def test_work_within_the_ceiling_is_allowed(db):
    await _order(amount=1 * LAKH)
    await _package("SO-2026-0001", 0.4 * LAKH, "WP-2026-0001")
    check = await CommercialService.check_draw("SO-2026-0001", 0.5 * LAKH, SITE)
    assert check["allowed"] is True
    assert check["remaining_after"] == pytest.approx(0.1 * LAKH)


@pytest.mark.asyncio
async def test_raising_the_package_itself_is_refused_not_just_the_check(db):
    """The check is only worth having if the thing it guards is actually
    guarded."""
    from modules.work_packages.service import WorkPackageService

    await _order(amount=1 * LAKH)
    await _package("SO-2026-0001", 0.9 * LAKH, "WP-2026-0001")
    await Job(job_id="JOB-2026-0003", site_id=SITE, title="Block B").insert()
    await WorkTypeDefinition(
        work_type_code="TPI-VIS", site_id=SITE, name="Visual inspection",
    ).insert()

    with pytest.raises(HTTPException) as e:
        await WorkPackageService.create(
            {"job_id": "JOB-2026-0003", "work_type_code": "TPI-VIS",
             "title": "One package too many", "so_id": "SO-2026-0001",
             "ceiling_value": 0.5 * LAKH},
            SITE, USER,
        )
    assert e.value.status_code == 409
    assert "value increase" in e.value.detail
    assert "client authorise it first" in e.value.detail


@pytest.mark.asyncio
async def test_an_approved_increase_lets_the_work_through(db):
    await _order(amount=1 * LAKH)
    await _package("SO-2026-0001", 0.9 * LAKH, "WP-2026-0001")
    await _amend("SO-2026-0001", "VALUE_INCREASE", value=1 * LAKH,
                 reason="Scope grew by two additional vessels.")

    state = await CommercialService.state("SO-2026-0001", SITE)
    assert state.effective_ceiling == 2 * LAKH
    assert state.base_value == 1 * LAKH
    assert state.amended_value == 1 * LAKH

    check = await CommercialService.check_draw("SO-2026-0001", 0.5 * LAKH, SITE)
    assert check["allowed"] is True


@pytest.mark.asyncio
async def test_a_proposed_increase_does_not_move_the_ceiling(db):
    """A request is not authority. Treating it as such is how work gets done
    that the client never agreed to pay for."""
    await _order(amount=1 * LAKH)
    await _package("SO-2026-0001", 0.9 * LAKH, "WP-2026-0001")
    out = await _amend("SO-2026-0001", "VALUE_INCREASE", value=1 * LAKH,
                       approve=False)
    assert out["status"] == AmendmentStatus.PROPOSED
    assert "unchanged until the client authorises it" in out["note"]

    state = await CommercialService.state("SO-2026-0001", SITE)
    assert state.effective_ceiling == 1 * LAKH
    check = await CommercialService.check_draw("SO-2026-0001", 0.5 * LAKH, SITE)
    assert check["allowed"] is False


# ------------------------------------------------ the client's authority

@pytest.mark.asyncio
async def test_iqe_cannot_move_its_own_ceiling(db):
    """The line this module turns on, and the same one as a hold point: an
    amendment IQE grants itself is a unilateral change of terms."""
    await _order(amount=1 * LAKH)
    out = await _amend("SO-2026-0001", "VALUE_INCREASE", value=1 * LAKH,
                       approve=False)
    with pytest.raises(HTTPException) as e:
        await CommercialService.approve(out["amendment_id"], {}, SITE, USER)
    assert e.value.status_code == 409
    assert "unilateral change of terms" in e.value.detail


@pytest.mark.asyncio
async def test_an_amendment_needs_a_reason(db):
    await _order()
    with pytest.raises(HTTPException) as e:
        await CommercialService.propose(
            {"so_id": "SO-2026-0001", "amendment_type": "VALUE_INCREASE",
             "value_delta": 1 * LAKH},
            SITE, USER,
        )
    assert "indistinguishable from a mistake" in e.value.detail


@pytest.mark.asyncio
async def test_a_rejected_amendment_is_kept_with_its_reason(db):
    """That the client declined an increase is exactly what someone needs to
    know when the work stops."""
    await _order(amount=1 * LAKH)
    out = await _amend("SO-2026-0001", "VALUE_INCREASE", value=1 * LAKH,
                       approve=False)
    done = await CommercialService.reject(
        out["amendment_id"],
        {"reason": "Client will not fund the extra vessels this year."},
        SITE, USER,
    )
    assert done["status"] == AmendmentStatus.REJECTED
    assert "will not fund" in done["rejected_reason"]

    state = await CommercialService.state("SO-2026-0001", SITE)
    assert state.effective_ceiling == 1 * LAKH
    listed = await CommercialService.list_amendments("SO-2026-0001", SITE)
    assert listed["total"] == 1


@pytest.mark.asyncio
async def test_a_value_increase_cannot_be_negative(db):
    await _order()
    with pytest.raises(HTTPException) as e:
        await CommercialService.propose(
            {"so_id": "SO-2026-0001", "amendment_type": "VALUE_INCREASE",
             "value_delta": -5000, "reason": "Trimming."},
            SITE, USER,
        )
    assert "curtailment" in e.value.detail


# --------------------------------------------- scenario 1: the renewal

@pytest.mark.asyncio
async def test_an_order_nearing_its_end_date_alerts_for_renewal(db):
    """Scenario 1. Renewal runs through the client's procurement, so the lead
    time matters more than the date."""
    await _order(starts_days_ago=330, runs_days=365, lead=60)   # 35 days left
    state = await CommercialService.state("SO-2026-0001", SITE)
    assert state.renewal.expires is True
    assert state.renewal.within_lead_time is True
    assert 30 <= state.renewal.days_remaining <= 40
    assert "client's procurement" in state.renewal.note


@pytest.mark.asyncio
async def test_an_order_with_months_left_does_not_alert(db):
    await _order(starts_days_ago=30, runs_days=365, lead=60)
    state = await CommercialService.state("SO-2026-0001", SITE)
    assert state.renewal.within_lead_time is False
    assert state.renewal.expired is False


@pytest.mark.asyncio
async def test_a_lapsed_order_blocks_work_outright(db):
    await _order(starts_days_ago=400, runs_days=365)
    state = await CommercialService.state("SO-2026-0001", SITE)
    assert state.renewal.expired is True
    assert state.usable is False
    assert "lapsed" in state.blocked_because

    check = await CommercialService.check_draw("SO-2026-0001", 1000.0, SITE)
    assert check["allowed"] is False
    assert "RENEWAL" in check["suggested_amendments"]


@pytest.mark.asyncio
async def test_a_renewal_extends_the_same_order_rather_than_replacing_it(db):
    """More of the same agreement is an amendment. A new order would restate
    terms both parties already agreed."""
    await _order(starts_days_ago=330, runs_days=365)
    before = await CommercialService.state("SO-2026-0001", SITE)
    new_until = before.effective_valid_until + timedelta(days=365)

    await _amend("SO-2026-0001", "RENEWAL", until=new_until,
                 reason="Framework renewed for a second year at the same rates.")

    after = await CommercialService.state("SO-2026-0001", SITE)
    assert after.effective_valid_until == new_until
    assert after.base_valid_until == before.base_valid_until   # base untouched
    assert after.renewal.within_lead_time is False
    assert after.amendment_count == 1


@pytest.mark.asyncio
async def test_an_open_ended_order_cannot_be_renewed(db):
    """There is no end date to move. Asking to renew one is a sign the person
    means something else."""
    await _order(term=TermType.OPEN_ENDED)
    with pytest.raises(HTTPException) as e:
        await CommercialService.propose(
            {"so_id": "SO-2026-0001", "amendment_type": "RENEWAL",
             "new_valid_until": datetime.now() + timedelta(days=365),
             "reason": "Rolling it on."},
            SITE, USER,
        )
    assert e.value.status_code == 409
    assert "no end date to extend or renew" in e.value.detail


@pytest.mark.asyncio
async def test_an_extension_that_shortens_the_order_is_refused(db):
    await _order(starts_days_ago=330, runs_days=365)
    with pytest.raises(HTTPException) as e:
        await CommercialService.propose(
            {"so_id": "SO-2026-0001", "amendment_type": "PERIOD_EXTENSION",
             "new_valid_until": datetime.now() - timedelta(days=5),
             "reason": "Pulling it in."},
            SITE, USER,
        )
    assert "is a curtailment" in e.value.detail


@pytest.mark.asyncio
async def test_the_latest_extension_supersedes_rather_than_adds(db):
    """Two extensions to the same date are one date, not two years."""
    await _order(starts_days_ago=330, runs_days=365)
    base = (await CommercialService.state("SO-2026-0001", SITE)).effective_valid_until

    await _amend("SO-2026-0001", "PERIOD_EXTENSION",
                 until=base + timedelta(days=90), reason="Slipped a quarter.")
    await _amend("SO-2026-0001", "PERIOD_EXTENSION",
                 until=base + timedelta(days=180), reason="Slipped again.")

    state = await CommercialService.state("SO-2026-0001", SITE)
    assert state.effective_valid_until == base + timedelta(days=180)


# ------------------------------- scenario 3: time ran out, money did not

@pytest.mark.asyncio
async def test_a_closing_period_with_the_work_undone_reads_as_an_extension(db):
    """Scenario 3. Two lakh allocated, little of it consumed, the window
    nearly up and the inspection not done. The budget was never the problem,
    so renewing it would answer the wrong question."""
    await _order(amount=2 * LAKH, starts_days_ago=150, runs_days=180, lead=60)
    await _package("SO-2026-0001", 0.3 * LAKH, "WP-2026-0001")   # 15% consumed

    state = await CommercialService.state("SO-2026-0001", SITE)
    assert state.renewal.within_lead_time is True
    assert state.will_expire_underspent is True
    assert "ran out of time" not in state.note     # that wording is the sweep's
    assert "extension, not a renewal" in state.note

    out = await CommercialService.sweep(SITE)
    assert [r["so_id"] for r in out["extensions_indicated"]] == ["SO-2026-0001"]
    assert out["renewals_due"] == []
    assert "ran out of time" in out["note"]


@pytest.mark.asyncio
async def test_a_closing_period_with_the_work_done_reads_as_a_renewal(db):
    """The same dates and the same spend, but nothing outstanding - so the
    question is whether to carry on, not whether to extend."""
    await _order(amount=2 * LAKH, starts_days_ago=150, runs_days=180, lead=60)
    await _package("SO-2026-0001", 0.3 * LAKH, "WP-2026-0001", status="COMPLETED")

    state = await CommercialService.state("SO-2026-0001", SITE)
    assert state.will_expire_underspent is False
    out = await CommercialService.sweep(SITE)
    assert [r["so_id"] for r in out["renewals_due"]] == ["SO-2026-0001"]
    assert out["extensions_indicated"] == []


@pytest.mark.asyncio
async def test_a_well_spent_closing_order_is_a_renewal_not_an_extension(db):
    """Most of the money used means time and money ran out together."""
    await _order(amount=2 * LAKH, starts_days_ago=150, runs_days=180, lead=60)
    await _package("SO-2026-0001", 1.8 * LAKH, "WP-2026-0001")
    state = await CommercialService.state("SO-2026-0001", SITE)
    assert state.will_expire_underspent is False


# ------------------------------------------------ what is about to be lost

@pytest.mark.asyncio
async def test_committed_but_unbilled_work_on_a_closing_order_is_flagged(db):
    """The figure that actually goes missing: work done under an order that
    lapsed before anyone raised the invoice."""
    await _order(amount=5 * LAKH, starts_days_ago=330, runs_days=365, lead=60)
    await _package("SO-2026-0001", 4 * LAKH, "WP-2026-0001")
    await Invoice(
        invoice_id="INV-2026-0001", job_id="JOB-2026-0003", site_id=SITE,
        invoice_number="IQE/2026/0001", grand_total=1 * LAKH, status="issued",
    ).insert()

    state = await CommercialService.state("SO-2026-0001", SITE)
    assert state.unbilled_at_risk == 3 * LAKH
    assert "not yet invoiced" in state.note

    out = await CommercialService.sweep(SITE)
    assert out["total_unbilled_at_risk"] == 3 * LAKH


@pytest.mark.asyncio
async def test_nothing_is_at_risk_on_an_order_with_months_to_run(db):
    await _order(amount=5 * LAKH, starts_days_ago=30, runs_days=365)
    await _package("SO-2026-0001", 4 * LAKH, "WP-2026-0001")
    state = await CommercialService.state("SO-2026-0001", SITE)
    assert state.unbilled_at_risk == 0


# ------------------------------------ scenario 4: new scope, new order

@pytest.mark.asyncio
async def test_new_scope_for_the_same_client_drafts_a_new_order(db):
    """Scenario 4. The shape carries; the value does not, because the value
    belonged to the work that is finished."""
    await _order(amount=5 * LAKH, starts_days_ago=300, runs_days=365)
    out = await CommercialService.propose_successor(
        "SO-2026-0001", {"term_months": 12}, SITE, USER
    )
    draft = out["draft"]
    assert draft["client_name"] == "Suguna Holdings"
    assert draft["term_type"] == TermType.FIXED_PERIOD
    assert draft["renewal_lead_days"] == 60
    assert draft["valid_until"] is not None
    assert "line items" in " ".join(out["not_carried_forward"])
    # The system cannot know whether the scope is really new, so it names the
    # alternative rather than pretending to decide.
    assert "it is an amendment on SO-2026-0001" in out["note"]


@pytest.mark.asyncio
async def test_a_successor_to_an_open_ended_order_carries_no_end_date(db):
    await _order(term=TermType.OPEN_ENDED)
    out = await CommercialService.propose_successor("SO-2026-0001", {}, SITE, USER)
    assert out["draft"]["term_type"] == TermType.OPEN_ENDED
    assert out["draft"]["valid_until"] is None


# ------------------------------------------------------------- projection

@pytest.mark.asyncio
async def test_the_burn_rate_projects_when_the_money_runs_out(db):
    await _order(amount=5 * LAKH, starts_days_ago=100, runs_days=365)
    await _package("SO-2026-0001", 1 * LAKH, "WP-2026-0001")
    state = await CommercialService.state("SO-2026-0001", SITE)
    assert state.burn_per_day == pytest.approx(1000.0, rel=0.05)
    assert state.projected_exhaustion is not None
    assert state.projected_exhaustion > datetime.now()


@pytest.mark.asyncio
async def test_nothing_spent_yields_no_projection_rather_than_a_guess(db):
    """Projecting from no spend produces a confident wrong date."""
    await _order(amount=5 * LAKH, starts_days_ago=100, runs_days=365)
    state = await CommercialService.state("SO-2026-0001", SITE)
    assert state.burn_per_day is None
    assert state.projected_exhaustion is None


@pytest.mark.asyncio
async def test_the_check_reports_every_blocker_at_once(db):
    """Someone told only about the ceiling, who raises an increase and then
    discovers the order also lapsed, has been made to do the work twice."""
    await _order(amount=1 * LAKH, starts_days_ago=400, runs_days=365)
    await _package("SO-2026-0001", 1 * LAKH, "WP-2026-0001")
    check = await CommercialService.check_draw("SO-2026-0001", 0.5 * LAKH, SITE)
    assert len(check["blockers"]) == 2
    assert set(check["suggested_amendments"]) == {"RENEWAL", "VALUE_INCREASE"}


# ---------------------------------------------- frameworks and call-offs

async def _framework(amount=50 * LAKH, runs_days=730, so_id="SO-2026-0100"):
    order = await _order(so_id=so_id, amount=amount, starts_days_ago=30,
                         runs_days=runs_days)
    await CommercialService.make_framework(so_id, {}, SITE, USER)
    return order


@pytest.mark.asyncio
async def test_a_framework_takes_no_work_directly(db):
    """Work raised against the framework would consume the ceiling without
    appearing in any call-off - the exact invisibility this prevents."""
    await _framework()
    state = await CommercialService.state("SO-2026-0100", SITE)
    assert state.usable is False
    assert "drawn against a call-off under it" in state.blocked_because


@pytest.mark.asyncio
async def test_an_order_with_work_on_it_cannot_become_a_framework(db):
    """Those packages would be left counted against nothing."""
    await _order(amount=10 * LAKH)
    await _package("SO-2026-0001", 2 * LAKH, "WP-2026-0001")
    with pytest.raises(HTTPException) as e:
        await CommercialService.make_framework("SO-2026-0001", {}, SITE, USER)
    assert "counted against nothing" in e.value.detail


@pytest.mark.asyncio
async def test_call_offs_carve_the_framework_up(db):
    await _framework(amount=50 * LAKH)
    first = await CommercialService.open_call_off(
        "SO-2026-0100", {"amount": 12 * LAKH, "project_name": "Block B"},
        SITE, USER,
    )
    assert first["parent_so_id"] == "SO-2026-0100"
    assert first["order_role"] == "CALL_OFF"
    assert first["framework_remaining_after"] == 38 * LAKH

    await CommercialService.open_call_off(
        "SO-2026-0100", {"amount": 8 * LAKH}, SITE, USER
    )
    state = await CommercialService.state("SO-2026-0100", SITE)
    assert state.committed == 20 * LAKH
    assert state.remaining == 30 * LAKH
    assert state.call_off_count == 2


@pytest.mark.asyncio
async def test_a_call_off_larger_than_the_framework_is_refused(db):
    """A slice larger than the cake is covered by nothing."""
    await _framework(amount=10 * LAKH)
    await CommercialService.open_call_off(
        "SO-2026-0100", {"amount": 7 * LAKH}, SITE, USER
    )
    with pytest.raises(HTTPException) as e:
        await CommercialService.open_call_off(
            "SO-2026-0100", {"amount": 5 * LAKH}, SITE, USER
        )
    assert e.value.status_code == 409
    assert "does not fit" in e.value.detail
    assert "value increase on the framework" in e.value.detail


@pytest.mark.asyncio
async def test_a_call_off_cannot_outlive_its_framework(db):
    """Work after the framework's end date is covered by nothing."""
    await _framework(runs_days=200)
    parent = await CommercialService.state("SO-2026-0100", SITE)
    with pytest.raises(HTTPException) as e:
        await CommercialService.open_call_off(
            "SO-2026-0100",
            {"amount": 1 * LAKH,
             "valid_until": parent.effective_valid_until + timedelta(days=30)},
            SITE, USER,
        )
    assert "covered by nothing" in e.value.detail


@pytest.mark.asyncio
async def test_a_call_off_inherits_the_frameworks_end_date(db):
    """Left open it would look indefinite on its own screen."""
    await _framework(runs_days=200)
    parent = await CommercialService.state("SO-2026-0100", SITE)
    out = await CommercialService.open_call_off(
        "SO-2026-0100", {"amount": 1 * LAKH}, SITE, USER
    )
    assert out["valid_until"] == parent.effective_valid_until


@pytest.mark.asyncio
async def test_nothing_can_be_called_off_a_lapsed_framework(db):
    await _order(so_id="SO-2026-0100", amount=10 * LAKH,
                 starts_days_ago=800, runs_days=365)
    await CommercialService.make_framework("SO-2026-0100", {}, SITE, USER)
    with pytest.raises(HTTPException) as e:
        await CommercialService.open_call_off(
            "SO-2026-0100", {"amount": 1 * LAKH}, SITE, USER
        )
    assert "covered by nothing" in e.value.detail


@pytest.mark.asyncio
async def test_a_framework_counts_its_call_offs_invoices_not_its_own(db):
    """A framework's consumption is its call-offs'."""
    await _framework(amount=50 * LAKH)
    child = await CommercialService.open_call_off(
        "SO-2026-0100", {"amount": 12 * LAKH, "job_id": "JOB-CALLOFF"},
        SITE, USER,
    )
    await Invoice(
        invoice_id="INV-2026-0001", job_id="JOB-CALLOFF", site_id=SITE,
        invoice_number="IQE/2026/0001", grand_total=4 * LAKH, status="issued",
    ).insert()

    state = await CommercialService.state("SO-2026-0100", SITE)
    assert state.invoiced == 4 * LAKH
    # Carved out is still the binding figure: 12 lakh is committed even
    # though only 4 has been billed.
    assert state.consumed == 12 * LAKH
    assert child["so_id"] is not None


@pytest.mark.asyncio
async def test_the_framework_binds_even_when_the_call_off_has_room(db):
    """The failure this exists to prevent: every call-off looks healthy while
    the framework behind them is exhausted."""
    await _framework(amount=10 * LAKH)
    big = await CommercialService.open_call_off(
        "SO-2026-0100", {"amount": 9 * LAKH, "job_id": "JOB-BIG"}, SITE, USER
    )
    small = await CommercialService.open_call_off(
        "SO-2026-0100", {"amount": 1 * LAKH, "job_id": "JOB-SMALL"}, SITE, USER
    )
    # The small call-off has a lakh of its own room, and the framework has
    # none.
    state = await CommercialService.state(small["so_id"], SITE)
    assert state.remaining == 1 * LAKH
    assert state.parent_remaining == 0.0
    assert "framework is the binding constraint" in state.note

    check = await CommercialService.check_draw(small["so_id"], 0.5 * LAKH, SITE)
    assert check["allowed"] is False
    assert "framework above it" in check["blockers"][0]
    assert big["so_id"] is not None


@pytest.mark.asyncio
async def test_the_framework_view_shows_everything_drawn_against_it(db):
    await _framework(amount=50 * LAKH)
    await CommercialService.open_call_off(
        "SO-2026-0100", {"amount": 12 * LAKH, "project_name": "Block B"},
        SITE, USER,
    )
    await CommercialService.open_call_off(
        "SO-2026-0100", {"amount": 8 * LAKH, "project_name": "Block C"},
        SITE, USER,
    )
    out = await CommercialService.framework_view("SO-2026-0100", SITE)
    assert len(out["call_offs"]) == 2
    assert {r["project_name"] for r in out["call_offs"]} == {"Block B", "Block C"}
    assert out["framework"]["remaining"] == 30 * LAKH
    assert "cannot spend what the framework above it no longer has" in out["note"]


@pytest.mark.asyncio
async def test_a_call_off_cannot_itself_hold_call_offs(db):
    await _framework(amount=50 * LAKH)
    child = await CommercialService.open_call_off(
        "SO-2026-0100", {"amount": 12 * LAKH}, SITE, USER
    )
    with pytest.raises(HTTPException) as e:
        await CommercialService.make_framework(child["so_id"], {}, SITE, USER)
    assert "is itself a call-off" in e.value.detail


@pytest.mark.asyncio
async def test_calling_off_a_non_framework_is_refused(db):
    await _order(amount=10 * LAKH)
    with pytest.raises(HTTPException) as e:
        await CommercialService.open_call_off(
            "SO-2026-0001", {"amount": 1 * LAKH}, SITE, USER
        )
    assert "is not a framework" in e.value.detail


@pytest.mark.asyncio
async def test_frameworks_are_listed_whether_or_not_anything_is_wrong(db):
    """A healthy framework at 88% is exactly the one worth seeing, because
    the next call-off is the one that does not fit. Finding frameworks only
    through the sweep would mean it never appeared anywhere."""
    await _framework(amount=50 * LAKH, so_id="SO-2026-0100")
    await CommercialService.open_call_off(
        "SO-2026-0100", {"amount": 44 * LAKH}, SITE, USER
    )
    await _order(so_id="SO-2026-0200", amount=5 * LAKH)   # not a framework

    out = await CommercialService.list_frameworks(SITE)
    assert out["total"] == 1
    row = out["data"][0]
    assert row["so_id"] == "SO-2026-0100"
    assert row["percent_consumed"] == 88.0
    assert row["remaining"] == 6 * LAKH
    assert row["exhausted"] is False
    assert row["call_off_count"] == 1


@pytest.mark.asyncio
async def test_the_fullest_framework_is_listed_first(db):
    await _framework(amount=10 * LAKH, so_id="SO-2026-0100")
    await _framework(amount=10 * LAKH, so_id="SO-2026-0300")
    await CommercialService.open_call_off(
        "SO-2026-0300", {"amount": 9 * LAKH}, SITE, USER
    )
    out = await CommercialService.list_frameworks(SITE)
    assert [r["so_id"] for r in out["data"]] == ["SO-2026-0300", "SO-2026-0100"]
