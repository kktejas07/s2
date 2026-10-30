"""Impartiality exposure computed from the work.

Both halves of this already existed - orders and invoices on one side,
assignments on the other - and nothing joined them, so no screen could show
the condition ISO/IEC 17020:2026 asks about by name.

The tests pin two things above all: that the two exposures stay separate
(financial dependence is not the same as personal familiarity), and that the
output never writes to the register by itself.
"""
import sys
from datetime import datetime, timedelta
from pathlib import Path

import pytest
import pytest_asyncio
from beanie import init_beanie
from mongomock_motor import AsyncMongoMockClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.audit import AuditEntry  # noqa: E402
from core.sequences import Sequence  # noqa: E402
from modules.assignments.models import Assignment  # noqa: E402
from modules.invoices.models import Invoice  # noqa: E402
from modules.jobs.models import Job  # noqa: E402
from modules.people.models import ImpartialityDeclaration  # noqa: E402
from modules.risk.impartiality import ImpartialityExposure  # noqa: E402
from modules.risk.models import Risk  # noqa: E402

SITE = "SITE-01"
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
        database=client["impartiality_test"],
        document_models=[
            Job, Invoice, Assignment, ImpartialityDeclaration, Risk,
            AuditEntry, Sequence,
        ],
    )
    yield client


async def _job(job_id: str, client_id: str, client_name: str):
    await Job(
        job_id=job_id, site_id=SITE, title=f"Job {job_id}",
        client_id=client_id, client_name=client_name,
    ).insert()


async def _invoice(inv_id: str, job_id: str, value: float, days_ago: int = 30):
    await Invoice(
        invoice_id=inv_id, job_id=job_id, site_id=SITE,
        invoice_number=f"IQE/{inv_id}", grand_total=value, status="issued",
        invoice_date=datetime.now() - timedelta(days=days_ago),
    ).insert()


async def _assign(person_id: str, job_id: str, n: int = 1, days_ago: int = 30):
    for i in range(n):
        await Assignment(
            assignment_id=f"ASG-{person_id}-{job_id}-{i}", site_id=SITE,
            work_package_id=f"WP-{job_id}-{i}", job_id=job_id,
            person_id=person_id, status="CONFIRMED",
            planned_from=datetime.now() - timedelta(days=days_ago),
        ).insert()


# ------------------------------------------------------ concentration

@pytest.mark.asyncio
async def test_a_dominant_client_is_reported_as_concentration(db):
    await _job("JOB-1", "CLI-BIG", "Reliance Industries")
    await _job("JOB-2", "CLI-SMALL", "Suguna Holdings")
    await _invoice("INV-1", "JOB-1", 40 * LAKH)
    await _invoice("INV-2", "JOB-2", 10 * LAKH)

    out = await ImpartialityExposure.compute(SITE)
    assert out["measurable"] is True
    assert out["total_invoiced"] == 50 * LAKH
    assert out["top_client_share_percent"] == 80.0
    assert [c["client_id"] for c in out["concentrated_clients"]] == ["CLI-BIG"]
    assert "largest at 80%" in out["note"]


@pytest.mark.asyncio
async def test_an_evenly_spread_book_reports_no_concentration(db):
    for i in range(5):
        await _job(f"JOB-{i}", f"CLI-{i}", f"Client {i}")
        await _invoice(f"INV-{i}", f"JOB-{i}", 10 * LAKH)
    out = await ImpartialityExposure.compute(SITE)
    assert out["concentrated_clients"] == []
    assert "No client exceeds" in out["note"]


@pytest.mark.asyncio
async def test_no_revenue_says_so_rather_than_reporting_no_concentration(db):
    """Not measurable and no concentration are different answers, and
    reporting the second when the first is true would be reassuring and
    wrong."""
    out = await ImpartialityExposure.compute(SITE)
    assert out["measurable"] is False
    assert "This is not the same as no concentration" in out["note"]


@pytest.mark.asyncio
async def test_cancelled_invoices_do_not_count_as_revenue(db):
    await _job("JOB-1", "CLI-BIG", "Reliance")
    await _job("JOB-2", "CLI-SMALL", "Suguna")
    await _invoice("INV-1", "JOB-1", 40 * LAKH)
    await Invoice(
        invoice_id="INV-X", job_id="JOB-1", site_id=SITE,
        invoice_number="IQE/X", grand_total=100 * LAKH, status="cancelled",
        invoice_date=datetime.now(),
    ).insert()
    await _invoice("INV-2", "JOB-2", 10 * LAKH)

    out = await ImpartialityExposure.compute(SITE)
    assert out["total_invoiced"] == 50 * LAKH


@pytest.mark.asyncio
async def test_revenue_outside_the_window_is_excluded(db):
    await _job("JOB-1", "CLI-BIG", "Reliance")
    await _job("JOB-2", "CLI-SMALL", "Suguna")
    await _invoice("INV-1", "JOB-1", 40 * LAKH, days_ago=500)
    await _invoice("INV-2", "JOB-2", 10 * LAKH, days_ago=30)

    out = await ImpartialityExposure.compute(SITE, window_days=365)
    assert out["total_invoiced"] == 10 * LAKH
    assert out["top_client_share_percent"] == 100.0


# -------------------------------------------------------- familiarity

@pytest.mark.asyncio
async def test_an_inspector_working_mostly_for_one_client_is_reported(db):
    await _job("JOB-1", "CLI-BIG", "Reliance")
    await _job("JOB-2", "CLI-SMALL", "Suguna")
    await _assign("EMP-00006", "JOB-1", n=9)
    await _assign("EMP-00006", "JOB-2", n=1)

    out = await ImpartialityExposure.compute(SITE)
    assert len(out["familiar_inspectors"]) == 1
    row = out["familiar_inspectors"][0]
    assert row["person_id"] == "EMP-00006"
    assert row["share_percent"] == 90.0
    assert row["assignments_total"] == 10


@pytest.mark.asyncio
async def test_a_new_inspector_is_not_reported_as_captured(db):
    """Two assignments both for one client is not capture; it is being new."""
    await _job("JOB-1", "CLI-BIG", "Reliance")
    await _assign("EMP-NEW", "JOB-1", n=2)
    out = await ImpartialityExposure.compute(SITE)
    assert out["familiar_inspectors"] == []


@pytest.mark.asyncio
async def test_a_well_spread_inspector_is_not_reported(db):
    await _job("JOB-1", "CLI-A", "A")
    await _job("JOB-2", "CLI-B", "B")
    await _assign("EMP-00006", "JOB-1", n=5)
    await _assign("EMP-00006", "JOB-2", n=5)
    out = await ImpartialityExposure.compute(SITE)
    assert out["familiar_inspectors"] == []


@pytest.mark.asyncio
async def test_the_two_exposures_are_kept_separate(db):
    """A body can be well diversified overall and still have an inspector who
    has worked for nobody else."""
    for i in range(5):
        await _job(f"JOB-{i}", f"CLI-{i}", f"Client {i}")
        await _invoice(f"INV-{i}", f"JOB-{i}", 10 * LAKH)
    await _assign("EMP-00006", "JOB-0", n=10)

    out = await ImpartialityExposure.compute(SITE)
    assert out["concentrated_clients"] == []       # finances are fine
    assert len(out["familiar_inspectors"]) == 1    # the person is not
    assert out["compounded"] == []                 # and they do not compound


@pytest.mark.asyncio
async def test_the_intersection_is_called_out_separately(db):
    """An inspector working almost entirely for a client that is also most of
    the revenue sits at both pressures at once."""
    await _job("JOB-1", "CLI-BIG", "Reliance")
    await _job("JOB-2", "CLI-SMALL", "Suguna")
    await _invoice("INV-1", "JOB-1", 40 * LAKH)
    await _invoice("INV-2", "JOB-2", 10 * LAKH)
    await _assign("EMP-00006", "JOB-1", n=9)
    await _assign("EMP-00006", "JOB-2", n=1)

    out = await ImpartialityExposure.compute(SITE)
    assert len(out["compounded"]) == 1
    assert out["compounded"][0]["person_id"] == "EMP-00006"
    assert "an assessor opens with" in out["note"]


@pytest.mark.asyncio
async def test_a_declared_conflict_drops_out_of_the_intersection(db):
    """Already known about and on file is a different situation from unseen."""
    await _job("JOB-1", "CLI-BIG", "Reliance")
    await _job("JOB-2", "CLI-SMALL", "Suguna")
    await _invoice("INV-1", "JOB-1", 40 * LAKH)
    await _invoice("INV-2", "JOB-2", 10 * LAKH)
    await _assign("EMP-00006", "JOB-1", n=9)
    await _assign("EMP-00006", "JOB-2", n=1)
    await ImpartialityDeclaration(
        declaration_id="IMP-1", person_id="EMP-00006", site_id=SITE,
        conflicted_client_ids=["CLI-BIG"],
    ).insert()

    out = await ImpartialityExposure.compute(SITE)
    assert out["familiar_inspectors"][0]["already_declared"] is True
    assert out["compounded"] == []


# --------------------------------------------------------- the proposals

@pytest.mark.asyncio
async def test_proposals_are_never_written_to_the_register(db):
    """A risk that appeared without anyone deciding it was one has not been
    identified in any sense an assessor would accept."""
    await _job("JOB-1", "CLI-BIG", "Reliance")
    await _job("JOB-2", "CLI-SMALL", "Suguna")
    await _invoice("INV-1", "JOB-1", 40 * LAKH)
    await _invoice("INV-2", "JOB-2", 10 * LAKH)

    out = await ImpartialityExposure.propose_risks(SITE)
    assert len(out["proposals"]) == 1
    assert out["proposals"][0]["category"] == "IMPARTIALITY"
    assert "Nothing is written" in out["note"]

    # Nothing landed on the register.
    assert await Risk.find(Risk.site_id == SITE).count() == 0


@pytest.mark.asyncio
async def test_a_larger_share_proposes_a_larger_impact(db):
    await _job("JOB-1", "CLI-BIG", "Reliance")
    await _invoice("INV-1", "JOB-1", 60 * LAKH)
    out = await ImpartialityExposure.propose_risks(SITE)
    # 100% of revenue from one client.
    assert out["proposals"][0]["inherent_impact"] == 5
    assert out["proposals"][0]["above_tolerance"] is True


@pytest.mark.asyncio
async def test_nothing_to_propose_is_not_claimed_as_no_exposure(db):
    for i in range(5):
        await _job(f"JOB-{i}", f"CLI-{i}", f"Client {i}")
        await _invoice(f"INV-{i}", f"JOB-{i}", 10 * LAKH)
    out = await ImpartialityExposure.propose_risks(SITE)
    assert out["proposals"] == []
    assert "not the same as no exposure" in out["note"]


@pytest.mark.asyncio
async def test_the_output_does_not_imply_wrongdoing(db):
    await _job("JOB-1", "CLI-BIG", "Reliance")
    await _invoice("INV-1", "JOB-1", 60 * LAKH)
    out = await ImpartialityExposure.compute(SITE)
    assert "None of this is a finding" in out["note"]
    assert "calls for a treatment" in out["note"]
