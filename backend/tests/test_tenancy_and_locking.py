"""Site isolation and concurrent-edit safety.

Two defects these cover:

* site_id was on every model and threaded through most queries, but the
  reporting service looked a job up by identifier alone - so a caller at one
  site could read another site's project header by guessing a job number.
* Beanie's save() writes the whole document, so two reviewers editing the same
  certification silently overwrote each other and neither was told.
"""
import sys
from pathlib import Path

import pytest
import pytest_asyncio
from beanie import init_beanie
from fastapi import HTTPException
from mongomock_motor import AsyncMongoMockClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.audit import AuditEntry  # noqa: E402
from core.concurrency import StaleWriteError, bump, check_version  # noqa: E402
from core.sequences import Sequence  # noqa: E402
from modules.assignments.models import Assignment  # noqa: E402
from modules.billing.models import BillingTerms  # noqa: E402
from modules.certifications.models import Certification  # noqa: E402
from modules.certifications.service import CertificationService  # noqa: E402
from modules.evidence.models import Evidence  # noqa: E402
from modules.invoices.models import Invoice  # noqa: E402
from modules.jobs.models import Job  # noqa: E402
from modules.people.models import (  # noqa: E402
    Authorization, CompetenceProfile, ImpartialityDeclaration, Person,
)
from modules.reporting.models import ReportFormat  # noqa: E402
from modules.reporting.service import ReportingService  # noqa: E402
from modules.work_packages.models import WorkPackage  # noqa: E402
from modules.work_packages.service import WorkPackageService  # noqa: E402
from modules.work_types.models import WorkTypeDefinition  # noqa: E402
from modules.work_types.service import WorkTypeService  # noqa: E402

SITE_A = "SITE-01"
SITE_B = "SITE-02"
USER = "USR-TEST"


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
        database=client["tenancy_test"],
        document_models=[
            AuditEntry, Sequence, Evidence, Job, WorkTypeDefinition, WorkPackage,
            Person, CompetenceProfile, Authorization, ImpartialityDeclaration,
            Assignment, Certification, Invoice, BillingTerms, ReportFormat,
        ],
    )
    for site in (SITE_A, SITE_B):
        await WorkTypeService.seed_catalogue(site, USER)
    yield client


# ------------------------------------------------------------- tenancy

@pytest.mark.asyncio
async def test_a_project_report_cannot_be_read_across_sites(db):
    await Job(job_id="JOB-SHARED-0001", site_id=SITE_B, title="Site B's confidential job",
              client_name="Their client", status="active").insert()

    # Site B can read its own.
    report = await ReportingService.project_report("JOB-SHARED-0001", SITE_B)
    assert report["project_header"]["client_name"] == "Their client"

    # Site A must not, even knowing the identifier.
    with pytest.raises(HTTPException) as exc:
        await ReportingService.project_report("JOB-SHARED-0001", SITE_A)
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_work_packages_do_not_leak_between_sites(db):
    await Job(job_id="JOB-A", site_id=SITE_A, title="A", client_name="CA",
              status="active").insert()
    await Job(job_id="JOB-B", site_id=SITE_B, title="B", client_name="CB",
              status="active").insert()
    await WorkPackageService.create(
        {"job_id": "JOB-A", "work_type_code": "CODE_INSP", "title": "A's work"},
        SITE_A, USER,
    )
    await WorkPackageService.create(
        {"job_id": "JOB-B", "work_type_code": "CODE_INSP", "title": "B's work"},
        SITE_B, USER,
    )

    a = await WorkPackage.find(WorkPackage.site_id == SITE_A).to_list()
    b = await WorkPackage.find(WorkPackage.site_id == SITE_B).to_list()
    assert [p.title for p in a] == ["A's work"]
    assert [p.title for p in b] == ["B's work"]


@pytest.mark.asyncio
async def test_a_report_format_registry_is_per_site(db):
    await ReportingService.seed_formats(SITE_A)
    assert (await ReportingService.list_formats(SITE_A))["total"] > 0
    assert (await ReportingService.list_formats(SITE_B))["total"] == 0


# ------------------------------------------------------------- locking

def test_a_matching_version_is_accepted():
    class R:
        version = 3
        certification_id = "CERT-1"
    check_version(R(), 3, "Certification")       # does not raise


def test_a_stale_version_is_refused():
    class R:
        version = 4
        certification_id = "CERT-1"
    with pytest.raises(StaleWriteError) as exc:
        check_version(R(), 3, "Certification")
    assert exc.value.status_code == 409
    assert "changed by someone else" in exc.value.detail


def test_locking_is_opt_in():
    """A caller that does not participate is not blocked - see the module
    docstring for why that trade was made."""
    class R:
        version = 7
        certification_id = "CERT-1"
    check_version(R(), None, "Certification")    # does not raise


def test_bump_advances_the_version():
    class R:
        version = 2
    assert bump(R()) == 3


@pytest.mark.asyncio
async def test_a_second_editor_cannot_silently_overwrite_the_first(db):
    """The real scenario: two QC reviewers open the same draft, each changes a
    different line, both save."""
    await Job(job_id="JOB-L", site_id=SITE_A, title="L", client_name="C",
              status="active").insert()
    wp = await WorkPackageService.create(
        {"job_id": "JOB-L", "work_type_code": "BILL_VERIF", "title": "RA bill", "rate": 1.0},
        SITE_A, USER,
    )
    for to in ("assigned", "in_progress", "submitted", "under_qc"):
        await WorkPackageService.transition(wp.work_package_id, to, SITE_A, USER)

    cert = await CertificationService.create(
        {"work_package_id": wp.work_package_id, "prepared_by": "EMP-1",
         "line_items": [{"line_id": "L1", "description": "Concrete", "uom": "cum",
                         "rate": 1000.0, "claimed_quantity": 100.0,
                         "certified_quantity": 100.0}]},
        SITE_A, USER,
    )
    base = cert.version                       # both reviewers read this version

    # Reviewer one deducts eight units and saves.
    await CertificationService.update(
        cert.certification_id,
        {"line_items": [{"line_id": "L1", "description": "Concrete", "uom": "cum",
                         "rate": 1000.0, "claimed_quantity": 100.0,
                         "certified_quantity": 92.0}]},
        SITE_A, expected_version=base,
    )

    # Reviewer two, still holding the original version, tries to save.
    with pytest.raises(StaleWriteError):
        await CertificationService.update(
            cert.certification_id,
            {"reference_bill_no": "RA-07"},
            SITE_A, expected_version=base,
        )

    # Reviewer one's deduction survived.
    saved = await CertificationService.get(cert.certification_id, SITE_A)
    assert saved.certified_value == 92_000.0
    assert saved.version == base + 1


@pytest.mark.asyncio
async def test_reloading_lets_the_second_editor_proceed(db):
    """The refusal is recoverable: reload, re-apply, save."""
    await Job(job_id="JOB-M", site_id=SITE_A, title="M", client_name="C",
              status="active").insert()
    wp = await WorkPackageService.create(
        {"job_id": "JOB-M", "work_type_code": "BILL_VERIF", "title": "RA", "rate": 1.0},
        SITE_A, USER,
    )
    for to in ("assigned", "in_progress", "submitted", "under_qc"):
        await WorkPackageService.transition(wp.work_package_id, to, SITE_A, USER)
    cert = await CertificationService.create(
        {"work_package_id": wp.work_package_id, "prepared_by": "EMP-1",
         "line_items": [{"line_id": "L1", "description": "x", "uom": "nos",
                         "rate": 10.0, "claimed_quantity": 1.0, "certified_quantity": 1.0}]},
        SITE_A, USER,
    )
    await CertificationService.update(cert.certification_id, {"reference_bill_no": "A"},
                                      SITE_A, expected_version=cert.version)
    fresh = await CertificationService.get(cert.certification_id, SITE_A)
    updated = await CertificationService.update(
        cert.certification_id, {"reference_bill_no": "B"}, SITE_A,
        expected_version=fresh.version,
    )
    assert updated.reference_bill_no == "B"
