"""Rate cards, the floor, and the gate-1 check that now has something to
check against.

Before this module, BELOW_RATE_FLOOR was a reason code someone selected
against no floor at all - a note, not a control. These tests pin the three
things that make it a control: a rate resolves from the card in force, the
floor is computed from cost rather than asserted, and where nothing prices
the work the answer is that nothing prices it.
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
from modules.rates.models import CardStatus, RateCard, RateFloor  # noqa: E402
from modules.rates.service import RateService  # noqa: E402

SITE = "SITE-01"
USER = "EMP-FIN"
CLIENT = "CLI-0001"


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
        database=client["rates_test"],
        document_models=[RateCard, RateFloor, AuditEntry, Sequence],
    )
    yield client


async def _card(
    *, client_id=None, name="House card", rate=12000.0, activate=True,
    valid_until=None, work_type="TPI-VIS", discipline=None,
):
    out = await RateService.create_card(
        {"name": name, "client_id": client_id,
         "client_name": "Suguna Holdings" if client_id else None,
         "valid_from": datetime.now() - timedelta(days=30),
         "valid_until": valid_until,
         "lines": [{"work_type_code": work_type, "discipline": discipline,
                    "rate_basis": "MAN_DAY", "rate": rate, "uom": "day"}]},
        SITE, USER,
    )
    if activate:
        out = await RateService.activate(out["card_id"], {}, SITE, USER)
    return out


async def _floor(direct=6000.0, overhead=25.0, margin=20.0, work_type="TPI-VIS"):
    return await RateService.set_floor(
        {"work_type_code": work_type, "rate_basis": "MAN_DAY",
         "direct_cost": direct, "overhead_percent": overhead,
         "target_margin_percent": margin},
        SITE, USER,
    )


# --------------------------------------------------------------- the floor

@pytest.mark.asyncio
async def test_the_floor_is_computed_from_cost_not_asserted(db):
    """6000 direct, 25% overhead, 20% margin -> 7500 -> 9000."""
    out = await _floor()
    assert out["floor_rate"] == 9000.0


@pytest.mark.asyncio
async def test_a_floor_with_no_cost_is_refused(db):
    """A zero floor passes every rate and checks nothing, which is worse than
    having no floor at all because it looks like a control."""
    with pytest.raises(HTTPException) as e:
        await RateService.set_floor(
            {"work_type_code": "TPI-VIS", "direct_cost": 0}, SITE, USER
        )
    assert "passes every rate and checks nothing" in e.value.detail


@pytest.mark.asyncio
async def test_updating_a_floor_replaces_it_rather_than_stacking(db):
    await _floor(direct=6000.0)
    await _floor(direct=7000.0)
    out = await RateService.list_floors(SITE)
    assert out["total"] == 1
    assert out["data"][0]["direct_cost"] == 7000.0


# --------------------------------------------------------------- the cards

@pytest.mark.asyncio
async def test_a_draft_card_prices_nothing(db):
    """Pricing from a proposal would bill a number nobody agreed."""
    await _card(activate=False)
    out = await RateService.resolve("TPI-VIS", site_id=SITE)
    assert out.priced is False
    assert "No active rate card prices" in out.note


@pytest.mark.asyncio
async def test_activating_a_card_supersedes_the_one_it_replaces(db):
    """Two active cards for one client would price the same work two ways,
    and which won would depend on query order."""
    first = await _card(client_id=CLIENT, name="2025 rates", rate=11000.0)
    second = await _card(client_id=CLIENT, name="2026 rates", rate=12500.0)

    assert second["superseded"] == [first["card_id"]]
    assert second["version"] == 2

    old = await RateService.get_card(first["card_id"], SITE)
    assert old.status == CardStatus.SUPERSEDED

    out = await RateService.resolve("TPI-VIS", client_id=CLIENT, site_id=SITE)
    assert out.rate == 12500.0
    assert out.card_id == second["card_id"]


@pytest.mark.asyncio
async def test_a_superseded_card_cannot_be_reactivated(db):
    """What a job was priced at when it was quoted is a question that gets
    asked."""
    first = await _card(client_id=CLIENT, name="2025 rates")
    await _card(client_id=CLIENT, name="2026 rates")
    with pytest.raises(HTTPException) as e:
        await RateService.activate(first["card_id"], {}, SITE, USER)
    assert "stays as it was" in e.value.detail


@pytest.mark.asyncio
async def test_a_card_with_no_lines_is_refused(db):
    out = await RateService.create_card(
        {"name": "Empty", "valid_from": datetime.now()}, SITE, USER
    )
    with pytest.raises(HTTPException) as e:
        await RateService.activate(out["card_id"], {}, SITE, USER)
    assert "prices nothing" in e.value.detail


@pytest.mark.asyncio
async def test_a_client_card_beats_the_house_card(db):
    await _card(name="House", rate=12000.0)
    await _card(client_id=CLIENT, name="Suguna", rate=10000.0)

    mine = await RateService.resolve("TPI-VIS", client_id=CLIENT, site_id=SITE)
    assert mine.rate == 10000.0
    assert mine.source == "client_card"

    other = await RateService.resolve("TPI-VIS", client_id="CLI-9999", site_id=SITE)
    assert other.rate == 12000.0
    assert other.source == "house_card"


@pytest.mark.asyncio
async def test_a_discipline_line_beats_a_general_one(db):
    """Ultrasonic testing and visual inspection are both inspection and are
    not the same price."""
    out = await RateService.create_card(
        {"name": "House", "valid_from": datetime.now() - timedelta(days=1),
         "lines": [
             {"work_type_code": "NDT", "rate_basis": "MAN_DAY", "rate": 14000},
             {"work_type_code": "NDT", "discipline": "Radiography",
              "rate_basis": "MAN_DAY", "rate": 22000},
         ]},
        SITE, USER,
    )
    await RateService.activate(out["card_id"], {}, SITE, USER)

    general = await RateService.resolve("NDT", site_id=SITE)
    assert general.rate == 14000

    rt = await RateService.resolve("NDT", discipline="Radiography", site_id=SITE)
    assert rt.rate == 22000


@pytest.mark.asyncio
async def test_an_expired_card_does_not_price_work(db):
    await _card(valid_until=datetime.now() - timedelta(days=2))
    out = await RateService.resolve("TPI-VIS", site_id=SITE)
    assert out.priced is False


@pytest.mark.asyncio
async def test_nothing_is_invented_where_no_card_covers_the_work(db):
    """A missing rate gets asked about; an invented one gets invoiced."""
    await _card(work_type="TPI-VIS")
    out = await RateService.resolve("BOQ-VERIFY", site_id=SITE)
    assert out.rate is None
    assert out.priced is False
    assert "an invented rate would be billed" in out.note


# ------------------------------------------------------------ the gate check

@pytest.mark.asyncio
async def test_a_rate_below_the_floor_is_reported_with_the_reason_code(db):
    """BELOW_RATE_FLOOR becomes computable rather than asserted."""
    await _floor()                      # floor 9000
    await _card(rate=12000.0)
    out = await RateService.check_proposed("TPI-VIS", 8000.0, site_id=SITE)
    assert out["acceptable"] is False
    assert out["checkable"] is True
    assert out["reason_code"] == "BELOW_RATE_FLOOR"
    assert "would not cover its own cost" in out["note"]


@pytest.mark.asyncio
async def test_a_rate_above_the_floor_passes(db):
    await _floor()
    await _card(rate=12000.0)
    out = await RateService.check_proposed("TPI-VIS", 9500.0, site_id=SITE)
    assert out["acceptable"] is True
    assert out["reason_code"] is None


@pytest.mark.asyncio
async def test_with_no_floor_the_check_says_it_cannot_check(db):
    """Reporting 'acceptable' when nothing was checked would be a lie with
    the shape of a control."""
    await _card(rate=12000.0)
    out = await RateService.check_proposed("TPI-VIS", 1.0, site_id=SITE)
    assert out["checkable"] is False
    assert "nothing to check the rate against" in out["note"]


@pytest.mark.asyncio
async def test_the_discount_from_standard_is_measured(db):
    """Where the discount is actually leaking, as opposed to where it was
    authorised."""
    await _card(name="House", rate=12000.0)
    await _card(client_id=CLIENT, name="Suguna", rate=9600.0)
    out = await RateService.resolve("TPI-VIS", client_id=CLIENT, site_id=SITE)
    assert out.discount_from_standard_percent == 20.0


@pytest.mark.asyncio
async def test_the_margin_over_direct_cost_is_reported(db):
    await _floor(direct=6000.0)
    await _card(rate=12000.0)
    out = await RateService.resolve("TPI-VIS", site_id=SITE)
    assert out.margin_percent == 100.0


# ------------------------------------------------------------- the expiry

@pytest.mark.asyncio
async def test_a_card_nearing_expiry_is_flagged_on_resolution(db):
    """A card expires on its own cycle, not with the order it prices."""
    await _card(valid_until=datetime.now() + timedelta(days=20))
    out = await RateService.resolve("TPI-VIS", site_id=SITE)
    assert out.priced is True
    assert "expires in 19 days" in out.note or "expires in 20 days" in out.note
    assert "not with the order" in out.note


@pytest.mark.asyncio
async def test_the_sweep_separates_lapsed_from_expiring(db):
    await _card(name="Still fine", valid_until=datetime.now() + timedelta(days=200))
    await _card(client_id="CLI-2", name="Closing",
                valid_until=datetime.now() + timedelta(days=20))

    out = await RateService.expiring(SITE, days=45)
    assert [r["name"] for r in out["expiring"]] == ["Closing"]
    assert out["lapsed"] == []
    assert "not with the order it prices" in out["note"]


@pytest.mark.asyncio
async def test_a_card_that_expires_before_it_starts_is_refused(db):
    with pytest.raises(HTTPException) as e:
        await RateService.create_card(
            {"name": "Backwards",
             "valid_from": datetime.now(),
             "valid_until": datetime.now() - timedelta(days=1),
             "lines": []},
            SITE, USER,
        )
    assert "expires on or before it starts" in e.value.detail
