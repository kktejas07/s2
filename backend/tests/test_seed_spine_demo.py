"""Runs the demo seeder for real, against an in-memory MongoDB.

A seed script that has never been executed is a liability: it is the first
thing a new developer runs, and it touches every module at once, so a single
wrong field name wastes an afternoon. This imports the actual script - not a
copy of its data - and runs it, so the seeder is exercised by the suite rather
than trusted.

It also asserts the two properties that make it safe to hand someone:
re-running it changes nothing, and --wipe removes what it made.
"""
import importlib.util
import sys
from pathlib import Path

import pytest
import pytest_asyncio
from beanie import init_beanie
from mongomock_motor import AsyncMongoMockClient

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

from modules.assignments.models import Assignment  # noqa: E402
from modules.billing.models import BillingTerms  # noqa: E402
from modules.certifications.models import Certification  # noqa: E402
from modules.invoices.models import Invoice  # noqa: E402
from modules.jobs.models import Job  # noqa: E402
from modules.people.models import Person  # noqa: E402
from modules.reporting.models import DEFAULT_FORMATS  # noqa: E402
from modules.reporting.service import ReportingService  # noqa: E402
from modules.work_packages.models import WorkPackage  # noqa: E402


def _load_seeder():
    """Import the script by path; scripts/ is not a package."""
    path = BACKEND / "scripts" / "seed_spine_demo.py"
    spec = importlib.util.spec_from_file_location("seed_spine_demo", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


seeder = _load_seeder()


def _patch_mongomock():
    """Beanie 2.2 calls list_collection_names(authorizedCollections=..., nameOnly=...),
    which mongomock does not accept. Drop the unsupported kwargs."""
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
        database=client["seed_test"], document_models=seeder.DOCUMENT_MODELS
    )
    yield client


def _silent(_msg: str) -> None:
    pass


@pytest.mark.asyncio
async def test_the_seeder_runs(db):
    """The whole script, end to end. If a field name is wrong anywhere in it,
    this is where that surfaces."""
    result = await seeder.run_seed(_silent)

    assert result["jobs_created"] == len(seeder.JOBS)
    assert result["people_total"] == len(seeder.PEOPLE)
    assert result["packages"] == len(seeder.PACKAGES)
    assert result["work_types_created"] == 8
    assert result["report_formats_created"] == len(DEFAULT_FORMATS)
    assert result["certifications"] == sum(1 for p in seeder.PACKAGES if p.get("certify"))
    assert result["disputed"] == 1
    assert result["overdue_invoices"] == 1
    assert result["invoices"] == sum(
        1 for p in seeder.PACKAGES if (p.get("certify") or {}).get("invoice")
    )


@pytest.mark.asyncio
async def test_seeded_people_span_technical_and_non_technical(db):
    """The ask was people management across both. A roster of only inspectors
    would leave the category filters with nothing to filter."""
    await seeder.run_seed(_silent)
    categories = {p.category for p in await Person.find_all().to_list()}
    assert categories == {
        "TECHNICAL_INSPECTION", "TECHNICAL_ENGINEERING",
        "SITE_LABOUR", "ADMIN_SUPPORT", "CORPORATE_FUNCTION",
    }


@pytest.mark.asyncio
async def test_seeded_packages_cover_the_lifecycle(db):
    """Each screen needs rows in the state it shows. A seeder that leaves
    everything 'planned' fixes nothing."""
    await seeder.run_seed(_silent)
    statuses = {wp.status for wp in await WorkPackage.find_all().to_list()}
    assert {"planned", "assigned", "in_progress", "submitted", "under_qc"} <= statuses
    assert "billed" in statuses or "certified" in statuses


@pytest.mark.asyncio
async def test_seeded_work_types_are_all_exercised(db):
    await seeder.run_seed(_silent)
    used = {wp.work_type_code for wp in await WorkPackage.find_all().to_list()}
    assert len(used) >= 6, f"only {sorted(used)} exercised; the rest render empty"


@pytest.mark.asyncio
async def test_seeded_certifications_respect_separation_of_duties(db):
    """The seeder must not quietly need the rule relaxed to work - if it did,
    the demo data would be teaching the wrong lesson."""
    await seeder.run_seed(_silent)
    for cert in await Certification.find_all().to_list():
        assert cert.status in ("issued", "disputed")
        assert cert.prepared_by != cert.certified_by_person_id


@pytest.mark.asyncio
async def test_every_role_dashboard_has_rows_to_show(db):
    """The point of seeding was that these screens were empty. A dashboard that
    still renders blank after seeding is the bug this test is for."""
    from modules.dashboards.service import DashboardService
    from modules.people.models import Person as P

    await seeder.run_seed(_silent)

    coordinator = await DashboardService.for_role("coordinator", "SITE-01")
    assert coordinator["needs_an_officer"], "no unassigned package to triage"
    assert coordinator["running_late"], "nothing overdue, so the late path never renders"

    qc = await DashboardService.for_role("qc_reviewer", "SITE-01")
    assert qc["review_queue"]
    assert qc["disputed"], "no disputed certification, so the dispute note never renders"

    finance = await DashboardService.for_role("finance", "SITE-01")
    assert finance["ready_to_invoice"]
    assert finance["overdue_invoices"], "no overdue invoice, so ageing buckets stay empty"

    tm = await DashboardService.for_role("technical_manager", "SITE-01")
    assert tm["awaiting_decision"], "no pending authorization for the TM to decide"
    assert tm["expiring"], "no credential inside the 60-day lapse horizon"

    inspector = await P.find_one(P.employee_code == "IQE-INS-001")
    officer = await DashboardService.for_role(
        "inspection_officer", "SITE-01", inspector.person_id
    )
    assert officer["this_week"], "the seeded inspector has no current work"


@pytest.mark.asyncio
async def test_the_pending_authorization_is_genuinely_undecidable(db):
    """The trainee is pending because the evidence is short, not because the
    seeder forgot to approve him. Approving should be refused."""
    from fastapi import HTTPException
    from modules.people.models import Authorization, Person as P
    from modules.people.service import PeopleService

    await seeder.run_seed(_silent)
    trainee = await P.find_one(P.employee_code == "IQE-INS-005")
    auth = await Authorization.find_one(Authorization.person_id == trainee.person_id)

    assert auth.status == "pending"
    with pytest.raises(HTTPException):
        await PeopleService.decide_authorization(
            auth.authorization_id, "authorized", "SITE-01", "USR-TEST"
        )


@pytest.mark.asyncio
async def test_a_disputed_certification_leaves_the_billable_queue(db):
    """Billing a contested value is the mistake the dispute state prevents."""
    from modules.billing.service import BillingService

    await seeder.run_seed(_silent)
    disputed = await Certification.find_one(Certification.status == "disputed")
    assert disputed is not None

    queue = await BillingService.billable_queue("SITE-01")
    billable_ids = {
        c["certification_id"]
        for job in queue["jobs"]
        for c in job.get("certifications", [])
    }
    assert billable_ids, "the queue is empty, so this assertion would prove nothing"
    assert disputed.certification_id not in billable_ids
    assert queue["total_certifications"] == len(billable_ids)


@pytest.mark.asyncio
async def test_seeded_deductions_reconcile_with_certified_value(db):
    """A deduction narrative that does not add up to the arithmetic gap is how
    demo data ends up teaching people to distrust the numbers."""
    await seeder.run_seed(_silent)
    for spec in seeder.PACKAGES:
        cert_spec = spec.get("certify")
        if not cert_spec or not cert_spec.get("deductions"):
            continue
        cert = await Certification.find_one(
            Certification.reference_bill_no == cert_spec["reference_bill_no"]
        )
        explained = sum(d["value"] for d in cert_spec["deductions"])
        assert explained == pytest.approx(cert.deduction_value), (
            f"{cert_spec['reference_bill_no']}: deduction lines explain {explained:,.0f} "
            f"but claimed less certified is {cert.deduction_value:,.0f}"
        )


@pytest.mark.asyncio
async def test_project_report_composes_from_the_seeded_data(db):
    """The end-to-end report was the point of the data. If it comes out empty,
    the seeding worked but joined up wrong."""
    await seeder.run_seed(_silent)
    report = await ReportingService.project_report("JOB-DEMO-0003", "SITE-01")

    assert report["work_packages"]["total"] == 3
    assert report["certified_position"]["certifications_issued"] == 1
    assert report["certified_position"]["deduction_value"] > 0
    assert report["people_deployed"]["count"] >= 1
    assert set(report["deductions_by_reason"]) == {
        "MATERIAL_SHORTFALL", "MEASUREMENT_VARIANCE",
    }


@pytest.mark.asyncio
async def test_seeding_twice_changes_nothing(db):
    await seeder.run_seed(_silent)
    before = {
        "jobs": await Job.find_all().count(),
        "people": await Person.find_all().count(),
        "packages": await WorkPackage.find_all().count(),
        "certs": await Certification.find_all().count(),
        "invoices": await Invoice.find_all().count(),
        "assignments": await Assignment.find_all().count(),
    }

    second = await seeder.run_seed(_silent)
    assert second["packages"] == 0
    assert second["jobs_created"] == 0
    assert second["certifications"] == 0

    assert before == {
        "jobs": await Job.find_all().count(),
        "people": await Person.find_all().count(),
        "packages": await WorkPackage.find_all().count(),
        "certs": await Certification.find_all().count(),
        "invoices": await Invoice.find_all().count(),
        "assignments": await Assignment.find_all().count(),
    }


@pytest.mark.asyncio
async def test_wipe_removes_what_was_seeded(db):
    await seeder.run_seed(_silent)
    removed = await seeder.run_wipe(_silent)

    assert removed["packages"] == len(seeder.PACKAGES)
    assert removed["people"] == len(seeder.PEOPLE)
    assert removed["jobs"] == len(seeder.JOBS)

    assert await WorkPackage.find_all().count() == 0
    assert await Certification.find_all().count() == 0
    assert await Invoice.find_all().count() == 0
    assert await Person.find_all().count() == 0


@pytest.mark.asyncio
async def test_wipe_leaves_hand_entered_records_alone(db):
    """--wipe is aimed at a database someone is also using by hand. Deleting by
    collection would take their work with it."""
    await seeder.run_seed(_silent)

    mine = Job(job_id="JOB-REAL-0001", site_id="SITE-01", title="A real job",
               client_name="Someone", status="active")
    await mine.insert()
    person = Person(person_id="EMP-REAL-1", site_id="SITE-01", employee_code="REAL-001",
                    full_name="A real colleague", category="TECHNICAL_INSPECTION",
                    engagement_type="PERMANENT")
    await person.insert()

    await seeder.run_wipe(_silent)

    assert await Job.find_one(Job.job_id == "JOB-REAL-0001") is not None
    assert await Person.find_one(Person.employee_code == "REAL-001") is not None
