"""Migrating the three legacy verticals onto the spine.

The thing worth testing here is not that records get created - it is that the
migration can be run twice without duplicating anything, and that a dry run
writes nothing at all. Those two properties are what make the cut-over
recoverable, and both are easy to break with an innocent-looking edit.
"""
import sys
from datetime import datetime
from pathlib import Path

import pytest
import pytest_asyncio
from beanie import init_beanie
from fastapi import HTTPException
from mongomock_motor import AsyncMongoMockClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from modules.assignments.models import Assignment  # noqa: E402
from modules.billing.models import BillingTerms  # noqa: E402
from modules.certifications.models import Certification  # noqa: E402
from modules.construction_bill_verification.models import (  # noqa: E402
    ConstructionAbstractItem,
    ConstructionBillVerificationRecord,
)
from modules.invoices.models import Invoice  # noqa: E402
from modules.evidence.models import Evidence  # noqa: E402
from modules.jobs.models import Job  # noqa: E402
from modules.migration import service as migration  # noqa: E402
from modules.people.models import (  # noqa: E402
    Authorization,
    CompetenceProfile,
    ImpartialityDeclaration,
    Person,
)
from modules.schedule_m_pharma_epc.models import (  # noqa: E402
    ScheduleMChecklistItem,
    ScheduleMPharmaEPCProject,
    ScheduleMRABillReview,
)
from modules.tpi.models import TpiReport  # noqa: E402
from modules.work_packages.models import WorkPackage  # noqa: E402
from modules.work_types.models import WorkTypeDefinition  # noqa: E402
from modules.work_types.service import WorkTypeService  # noqa: E402
from core.audit import AuditEntry  # noqa: E402
from core.sequences import Sequence  # noqa: E402

SITE = "SITE-01"
USER = "USR-MIGRATION"


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
        database=client["migration_test"],
        document_models=[
            Evidence,
            AuditEntry,
            Sequence,
            Job, WorkTypeDefinition, WorkPackage, Person, CompetenceProfile,
            Authorization, ImpartialityDeclaration, Assignment, Certification,
            Invoice, BillingTerms, TpiReport, ScheduleMPharmaEPCProject,
            ConstructionBillVerificationRecord,
        ],
    )
    await WorkTypeService.seed_catalogue(SITE, USER)
    yield client


# ------------------------------------------------------------------- TPI

async def seed_tpi_reports():
    await TpiReport(
        form_code="TP02", report_no="IQE-TP02-2026-0001", status="ISSUED",
        customer="Granules India Limited", supplier="L&T Valves Limited",
        po_no="PO-001", issued_at=datetime.now(),
    ).insert()
    await TpiReport(
        form_code="TP02", report_no="IQE-TP02-2026-0002", status="DRAFT",
        customer="Granules India Limited", supplier="L&T Valves Limited",
    ).insert()
    await TpiReport(
        form_code="TP05", report_no="IQE-TP05-2026-0001", status="SUBMITTED",
        customer="NTPC Limited", supplier="BHEL",
    ).insert()
    await TpiReport(
        form_code="TP99", report_no="IQE-TP99-2026-0001", status="DRAFT",
        customer="Unknown Co", supplier="Nobody",
    ).insert()


@pytest.mark.asyncio
async def test_tpi_dry_run_writes_nothing(db):
    await seed_tpi_reports()
    res = await migration.migrate_tpi_reports(SITE, USER, dry_run=True)

    assert res["dry_run"] is True
    assert res["records_read"] == 4
    assert len(res["work_packages"]) == 3          # the TP99 one is unmapped
    assert await WorkPackage.find_all().count() == 0, "a dry run must not write"
    assert await Job.find_all().count() == 0, "a dry run must not write"


@pytest.mark.asyncio
async def test_tpi_unmapped_form_code_is_reported_not_guessed(db):
    """An unrecognised form code is surfaced for a human to map. Guessing a work
    type would put the work under the wrong competence requirements."""
    await seed_tpi_reports()
    res = await migration.migrate_tpi_reports(SITE, USER, dry_run=True)

    assert len(res["unmapped"]) == 1
    assert res["unmapped"][0]["form_code"] == "TP99"


@pytest.mark.asyncio
async def test_tpi_groups_reports_under_one_job_per_customer(db):
    await seed_tpi_reports()
    await migration.migrate_tpi_reports(SITE, USER, dry_run=False)

    jobs = await Job.find_all().to_list()
    assert len(jobs) == 2, f"expected one job per customer, got {[j.job_id for j in jobs]}"

    granules = next(j for j in jobs if "GRANULES" in j.job_id)
    packages = await WorkPackage.find(WorkPackage.job_id == granules.job_id).to_list()
    assert len(packages) == 2, "both Granules reports belong to the same job"


@pytest.mark.asyncio
async def test_tpi_carries_legacy_lifecycle_into_package_status(db):
    await seed_tpi_reports()
    await migration.migrate_tpi_reports(SITE, USER, dry_run=False)

    issued = await WorkPackage.find_one(WorkPackage.title == "IQE-TP02-2026-0001")
    draft = await WorkPackage.find_one(WorkPackage.title == "IQE-TP02-2026-0002")
    submitted = await WorkPackage.find_one(WorkPackage.title == "IQE-TP05-2026-0001")

    assert issued.status == "under_qc", "an issued report is work that was done and signed"
    assert draft.status == "planned", "a draft report has not been executed"
    assert submitted.status == "submitted"


@pytest.mark.asyncio
async def test_tpi_stops_short_of_certifying(db):
    """The verticals never recorded a separate certifying act. Carrying an
    issued report all the way to 'certified' would assert a control that was
    never exercised."""
    await seed_tpi_reports()
    await migration.migrate_tpi_reports(SITE, USER, dry_run=False)

    statuses = {wp.status for wp in await WorkPackage.find_all().to_list()}
    assert "certified" not in statuses
    assert "billed" not in statuses


@pytest.mark.asyncio
async def test_tpi_migration_is_idempotent(db):
    await seed_tpi_reports()
    first = await migration.migrate_tpi_reports(SITE, USER, dry_run=False)
    count_after_first = await WorkPackage.find_all().count()

    second = await migration.migrate_tpi_reports(SITE, USER, dry_run=False)

    assert len(first["work_packages"]) == 3
    assert second["work_packages"] == []
    assert len(second["skipped_already_migrated"]) == 3
    assert await WorkPackage.find_all().count() == count_after_first
    assert await Job.find_all().count() == 2, "re-running must not create a second job"


@pytest.mark.asyncio
async def test_migration_refuses_without_a_seeded_catalogue(db):
    """Migrating into work types that do not exist would create packages with no
    competence requirements, which is the one thing the spine must never allow."""
    for wt in await WorkTypeDefinition.find_all().to_list():
        await wt.delete()
    await seed_tpi_reports()

    with pytest.raises(HTTPException) as exc:
        await migration.migrate_tpi_reports(SITE, USER, dry_run=True)
    assert exc.value.status_code == 400
    assert "catalogue" in exc.value.detail


# ----------------------------------------------------------- Schedule M

async def seed_schedule_m():
    def chk(item_id, discipline, status):
        return ScheduleMChecklistItem(
            item_id=item_id, discipline=discipline,
            verification_point=f"{item_id} point", status=status,
        )

    def review(bill_no, boq_item, claimed, verified, package="HVAC"):
        return ScheduleMRABillReview(
            ra_bill_no=bill_no, boq_item=boq_item, description=f"{boq_item} work",
            unit="sqm", package=package,
            claimed_value=claimed, verified_value=verified,
        )

    await ScheduleMPharmaEPCProject(
        project_id="PRJ-SCH-M-2026-01",
        project_name="Sterile facility EPC",
        client_name="SunPharma BioTech Ltd.",
        epc_contractor="Ideal Pharma EPC",
        checklists=[
            chk("HVA-001", "HVAC", "PASS"),
            chk("HVA-002", "HVAC", "PASS"),
            chk("CIV-001", "Civil & Cleanroom", "PENDING"),
            chk("CIV-002", "Civil & Cleanroom", "PASS"),
        ],
        ra_bill_reviews=[
            review("RA-01", "B-001", 500000.0, 470000.0),
            review("RA-01", "B-002", 300000.0, 300000.0),
            review("RA-02", "B-003", 120000.0, 100000.0, package="Piping"),
        ],
    ).insert()


@pytest.mark.asyncio
async def test_schedule_m_makes_one_package_per_discipline(db):
    await seed_schedule_m()
    res = await migration.migrate_schedule_m_projects(SITE, USER, dry_run=False)

    packages = await WorkPackage.find_all().to_list()
    assert len(packages) == 2, "one per discipline, not one per checklist line"
    assert {p.discipline for p in packages} == {"HVAC", "Civil & Cleanroom"}

    hvac = next(p for p in packages if p.discipline == "HVAC")
    civil = next(p for p in packages if p.discipline == "Civil & Cleanroom")
    assert hvac.status == "under_qc", "all points passed, so the work was executed"
    assert civil.status == "in_progress", "a pending point means the work is not finished"
    assert res["records_read"] == 1


@pytest.mark.asyncio
async def test_schedule_m_groups_bill_lines_into_one_certification_per_bill(db):
    """Each review row is one BOQ line; a certification covers a whole bill."""
    await seed_schedule_m()
    res = await migration.migrate_schedule_m_projects(SITE, USER, dry_run=True)

    certs = {c["reference_bill_no"]: c for c in res["certifications"]}
    assert set(certs) == {"RA-01", "RA-02"}

    ra01 = certs["RA-01"]
    assert ra01["line_items"] == 2
    assert ra01["claimed_value"] == 800000.0
    assert ra01["certified_value"] == 770000.0
    assert ra01["deduction_value"] == 30000.0

    assert certs["RA-02"]["deduction_value"] == 20000.0


@pytest.mark.asyncio
async def test_schedule_m_reports_bill_certifications_rather_than_writing_them(db):
    """Which discipline's package a bill attaches to is a judgement the legacy
    data does not record, so the migration reports and leaves it to a human."""
    await seed_schedule_m()
    await migration.migrate_schedule_m_projects(SITE, USER, dry_run=False)

    assert await Certification.find_all().count() == 0
    assert all(
        c.get("needs_work_package")
        for c in (await migration.migrate_schedule_m_projects(SITE, USER, dry_run=True))[
            "certifications"
        ]
    )


@pytest.mark.asyncio
async def test_schedule_m_migration_is_idempotent(db):
    await seed_schedule_m()
    await migration.migrate_schedule_m_projects(SITE, USER, dry_run=False)
    count = await WorkPackage.find_all().count()

    second = await migration.migrate_schedule_m_projects(SITE, USER, dry_run=False)
    assert second["work_packages"] == []
    assert len(second["skipped_already_migrated"]) == 2
    assert await WorkPackage.find_all().count() == count


# ------------------------------------------ construction bill verification

async def seed_cbv():
    await ConstructionBillVerificationRecord(
        site_id=SITE,
        site_name="Mudigonda CHC Site",
        report_ref="IQE/CBV/2026/088",
        contractor_name="Suguna Metals & Civil",
        client_name="State Health Infra Corp",
        ra_bill_no="RA-CBV-2026-004",
        abstract_items=[
            ConstructionAbstractItem(
                sl_no="1", item_code="CEM-01", description="Cement OPC 53",
                unit="Bags", unit_rate=400.0,
                claimed_amount=400000.0, verified_payable_amount=380000.0,
                total_consumed=1000.0,
            ),
            ConstructionAbstractItem(
                sl_no="2", item_code="STL-01", description="TMT steel 12mm",
                unit="Mt", unit_rate=65000.0,
                claimed_amount=650000.0, verified_payable_amount=650000.0,
                total_consumed=10.0,
            ),
        ],
    ).insert()


@pytest.mark.asyncio
async def test_cbv_creates_a_certification_matching_the_legacy_money(db):
    await seed_cbv()
    res = await migration.migrate_construction_bill_verifications(SITE, USER, dry_run=False)

    cert = await Certification.find_one(Certification.site_id == SITE)
    assert cert is not None
    assert cert.reference_bill_no == "RA-CBV-2026-004"
    assert cert.claimed_value == 1050000.0
    assert cert.certified_value == 1030000.0
    assert cert.deduction_value == 20000.0
    assert len(res["work_packages"]) == 1


@pytest.mark.asyncio
async def test_cbv_certification_is_left_as_a_draft(db):
    """Issuing would stamp IQE's certification on a figure the migration never
    re-verified. Separation of duties exists to stop exactly that."""
    await seed_cbv()
    await migration.migrate_construction_bill_verifications(SITE, USER, dry_run=False)

    cert = await Certification.find_one(Certification.site_id == SITE)
    assert cert.status == "draft"
    assert cert.certified_at is None


@pytest.mark.asyncio
async def test_cbv_dry_run_writes_nothing(db):
    await seed_cbv()
    res = await migration.migrate_construction_bill_verifications(SITE, USER, dry_run=True)

    assert res["work_packages"][0]["certification"]["certified_value"] == 1030000.0
    assert await WorkPackage.find_all().count() == 0
    assert await Certification.find_all().count() == 0


@pytest.mark.asyncio
async def test_cbv_migration_is_idempotent(db):
    await seed_cbv()
    await migration.migrate_construction_bill_verifications(SITE, USER, dry_run=False)
    second = await migration.migrate_construction_bill_verifications(SITE, USER, dry_run=False)

    assert second["work_packages"] == []
    assert len(second["skipped_already_migrated"]) == 1
    assert await Certification.find_all().count() == 1


# ----------------------------------------------------------------- all three

@pytest.mark.asyncio
async def test_migrate_all_runs_every_vertical_and_totals_them(db):
    await seed_tpi_reports()
    await seed_schedule_m()
    await seed_cbv()

    plan = await migration.migrate_all(SITE, USER, dry_run=True)
    assert plan["totals"]["records_read"] == 6          # 4 tpi + 1 schm + 1 cbv
    assert plan["totals"]["work_packages"] == 6         # 3 tpi + 2 disciplines + 1 cbv
    assert await WorkPackage.find_all().count() == 0

    done = await migration.migrate_all(SITE, USER, dry_run=False)
    assert done["totals"]["work_packages"] == 6
    assert await WorkPackage.find_all().count() == 6

    again = await migration.migrate_all(SITE, USER, dry_run=False)
    assert again["totals"]["work_packages"] == 0
    assert again["totals"]["skipped_already_migrated"] == 6
    assert await WorkPackage.find_all().count() == 6
