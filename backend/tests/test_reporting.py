"""Report format registry and the composed project report.

The registry tests are pure assertions over DEFAULT_FORMATS - they catch the
drift that a registry invites: a duplicate code, a kind that is not in the
enum, a format pointing at a work type that does not exist, or a work type
that produces no report at all.

The project-report test runs the real composition against an in-memory
MongoDB, because the whole point of that report is that it reads across
modules; asserting it in isolation would prove nothing.
"""
import sys
from datetime import datetime, timedelta
from pathlib import Path

import pytest
import pytest_asyncio
from beanie import init_beanie
from mongomock_motor import AsyncMongoMockClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from modules.assignments.models import Assignment  # noqa: E402
from modules.billing.models import BillingTerms  # noqa: E402
from modules.certifications.models import Certification  # noqa: E402
from modules.certifications.service import CertificationService  # noqa: E402
from modules.invoices.models import Invoice  # noqa: E402
from modules.evidence.models import Evidence  # noqa: E402
from modules.jobs.models import Job  # noqa: E402
from modules.people.models import (  # noqa: E402
    Authorization,
    CompetenceProfile,
    ImpartialityDeclaration,
    Person,
)
from modules.reporting.models import DEFAULT_FORMATS, ReportFormat, ReportKind  # noqa: E402
from modules.reporting.service import ReportingService  # noqa: E402
from modules.work_packages.models import WorkPackage  # noqa: E402
from modules.work_packages.service import WorkPackageService  # noqa: E402
from modules.work_types.catalogue import DEFAULT_CATALOGUE  # noqa: E402
from modules.work_types.models import WorkTypeDefinition  # noqa: E402
from modules.work_types.service import WorkTypeService  # noqa: E402
from core.audit import AuditEntry  # noqa: E402
from core.sequences import Sequence  # noqa: E402

SITE = "SITE-01"
USER = "USR-TEST"


# ------------------------------------------------- registry, no database

def test_format_codes_are_unique():
    codes = [f["format_code"] for f in DEFAULT_FORMATS]
    assert len(codes) == len(set(codes)), f"duplicate format codes: {codes}"


def test_every_kind_is_a_valid_enum_member():
    valid = {k.value for k in ReportKind}
    for f in DEFAULT_FORMATS:
        assert f["kind"] in valid, f"{f['format_code']} has kind {f['kind']}"


def test_every_format_names_a_real_work_type():
    """A format pointing at a work type code that does not exist would silently
    never be offered. Cheap to assert, expensive to discover in the field."""
    known = {wt["work_type_code"] for wt in DEFAULT_CATALOGUE}
    for f in DEFAULT_FORMATS:
        for code in f["work_type_codes"]:
            assert code in known, f"{f['format_code']} references unknown work type {code}"


def test_every_work_type_can_produce_at_least_one_report():
    """If a work type has no format, a package of that type finishes with
    nothing to hand the client."""
    produced: set[str] = set()
    for f in DEFAULT_FORMATS:
        produced.update(f["work_type_codes"])
    missing = {wt["work_type_code"] for wt in DEFAULT_CATALOGUE} - produced
    assert not missing, f"work types with no report format: {sorted(missing)}"


def test_composed_formats_span_every_work_type():
    """A COMPOSED format is built from records rather than owned by one work
    type, so it must not be pinned to a work type list."""
    for f in DEFAULT_FORMATS:
        if f["kind"] == ReportKind.COMPOSED.value:
            assert f["work_type_codes"] == [], (
                f"{f['format_code']} is COMPOSED but pinned to {f['work_type_codes']}"
            )


def test_certificate_formats_require_a_reviewer_signature():
    """A certificate is an assurance IQE puts its name to; a single field
    signature is not enough under the RBAC matrix."""
    for f in DEFAULT_FORMATS:
        if f["kind"] == ReportKind.CERTIFICATE.value:
            sigs = f.get("requires_signatures", [])
            assert len(sigs) >= 2, f"{f['format_code']} needs a second signatory, has {sigs}"


def test_every_template_path_exists_on_disk():
    """A template_path pointing at a file that is not there fails at render
    time, in front of a client, rather than here."""
    from pathlib import Path

    templates = Path(__file__).resolve().parent.parent / "app" / "pdf" / "templates"
    for f in DEFAULT_FORMATS:
        path = f.get("template_path")
        if not path:
            continue
        assert (templates / path).is_file(), (
            f"{f['format_code']} points at {path}, which does not exist in {templates}"
        )


def test_template_paths_are_not_shared_between_unrelated_formats():
    """Two formats rendering from one template means at least one of them is
    producing a document with the wrong title and sections - the kind of defect
    that only shows up when a client reads it."""
    seen: dict[str, str] = {}
    for f in DEFAULT_FORMATS:
        path = f.get("template_path")
        if not path:
            continue
        assert path not in seen, (
            f"{f['format_code']} and {seen[path]} both render from {path}; "
            "one of them is mislabelled"
        )
        seen[path] = f["format_code"]


def test_registry_names_match_the_title_the_template_actually_renders():
    """The defect this exists for: GMP_COMPLIANCE ("Schedule M Compliance
    Report") was pointed at fqual01.html, whose own title is "Quantity
    Verification & Survey Report". The file existed and nothing else used it, so
    neither an existence check nor a uniqueness check caught it - only comparing
    the registry's name against the template's own declared title does.

    app/pdf/service.py holds the authoritative title per template.
    """
    from app.pdf.service import FORM_CONFIGS

    title_by_template = {
        cfg["template"]: cfg["display_title"] for cfg in FORM_CONFIGS.values()
    }

    def words(text: str) -> set[str]:
        return {
            w for w in text.lower().replace("&", " ").replace("-", " ").split()
            if w not in {"report", "note", "the", "of", "and", "iqe", "tpi"}
        }

    for f in DEFAULT_FORMATS:
        path = f.get("template_path")
        if not path or path not in title_by_template:
            continue
        declared = title_by_template[path]
        shared = words(f["name"]) & words(declared)
        assert shared, (
            f"{f['format_code']} is named '{f['name']}' but renders from {path}, "
            f"which declares itself '{declared}'. One of the two is wrong."
        )


def test_annexures_resolve_to_known_formats_or_declared_artefacts():
    """Annexure codes are either other formats or named evidence artefacts.
    Anything else is a typo that renders as an empty appendix."""
    format_codes = {f["format_code"] for f in DEFAULT_FORMATS}
    artefacts = {"PHOTO_ANNEX", "NCR", "PUNCH_LIST", "MATERIAL_LEDGER"}
    for f in DEFAULT_FORMATS:
        for annex in f.get("annexures", []):
            assert annex in format_codes or annex in artefacts, (
                f"{f['format_code']} annexure {annex} resolves to nothing"
            )


# ------------------------------------------------------- against a database

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
        database=client["reporting_test"],
        document_models=[
            Evidence,
            AuditEntry,
            Sequence,
            Job, WorkTypeDefinition, WorkPackage, Person, CompetenceProfile,
            Authorization, ImpartialityDeclaration, Assignment, Certification,
            Invoice, BillingTerms, ReportFormat,
        ],
    )
    yield client


@pytest.mark.asyncio
async def test_seed_formats_is_idempotent(db):
    first = await ReportingService.seed_formats(SITE)
    assert len(first["created"]) == len(DEFAULT_FORMATS)
    assert first["skipped_existing"] == []

    second = await ReportingService.seed_formats(SITE)
    assert second["created"] == []
    assert len(second["skipped_existing"]) == len(DEFAULT_FORMATS)

    listed = await ReportingService.list_formats(SITE)
    assert listed["total"] == len(DEFAULT_FORMATS)


@pytest.mark.asyncio
async def test_formats_for_work_type_filters_to_that_type(db):
    await ReportingService.seed_formats(SITE)

    boq = await ReportingService.formats_for_work_type("BOQ_RECON", SITE)
    codes = {f["format_code"] for f in boq["data"]}
    assert "BOQ_RECON" in codes
    assert "MEASUREMENT_SHEET" in codes
    assert "GMP_COMPLIANCE" not in codes, "a pharma format must not surface on a BOQ package"
    assert "PROJECT_REPORT" not in codes, "the composed report is not a per-work-type format"


@pytest.mark.asyncio
async def test_project_report_composes_the_certified_and_billing_position(db):
    """The number the client argues about is claimed vs certified. This walks a
    real package through certification and checks the report reports it."""
    await WorkTypeService.seed_catalogue(SITE, USER)
    await ReportingService.seed_formats(SITE)
    job = Job(
        job_id="JOB-2026-0009",
        site_id=SITE,
        title="Pump house RA bill verification",
        client_id="CLT-0009",
        client_name="Megha Engineering",
        location_address="Siddipet, Telangana",
    )
    await job.insert()

    wp = await WorkPackageService.create(
        {
            "job_id": job.job_id,
            "work_type_code": "BILL_VERIF",
            "title": "RA Bill 04 verification",
            "discipline": "Civil",
            "location": "Siddipet",
            "planned_start": datetime.now(),
            "planned_finish": datetime.now() + timedelta(days=10),
            "rate": 1.0,
        },
        SITE, USER,
    )
    for state in ("assigned", "in_progress", "submitted", "under_qc"):
        await WorkPackageService.transition(wp.work_package_id, state, SITE, USER)

    cert = await CertificationService.create(
        {
            "work_package_id": wp.work_package_id,
            "line_items": [
                {
                    "line_id": "L1",
                    "description": "Concrete M25 - foundation",
                    "uom": "cum", "rate": 6000.0,
                    "claimed_quantity": 100.0, "certified_quantity": 92.0,
                },
            ],
            "deductions": [
                {"reason_code": "MEASUREMENT_VARIANCE", "value": 48000.0,
                 "narrative": "8 cum not supported by joint measurement"},
            ],
            "retention_pct": 5.0,
        },
        SITE, USER,
    )
    await CertificationService.issue(cert.certification_id, "EMP-00002", SITE, USER)

    report = await ReportingService.project_report(job.job_id, SITE)

    assert report["format_code"] == "PROJECT_REPORT"
    assert report["project_header"]["client_name"] == "Megha Engineering"

    # one package, filed under its discipline rather than lumped together
    assert report["work_packages"]["total"] == 1
    assert "Civil" in report["work_packages"]["by_discipline"]
    assert report["work_packages"]["by_status"]["certified"] == 1

    pos = report["certified_position"]
    assert pos["certifications_issued"] == 1
    assert pos["claimed_value"] == 600000.0
    assert pos["certified_value"] == 552000.0
    assert pos["deduction_value"] == 48000.0
    assert pos["deduction_pct"] == 8.0
    assert pos["retention_held"] == 27600.0           # 5% of certified, not of claimed

    assert report["deductions_by_reason"]["MEASUREMENT_VARIANCE"] == 48000.0

    bill = report["billing_position"]
    assert bill["invoices_raised"] == 0
    assert bill["certified_not_billed_value"] == 524400.0   # certified less retention


@pytest.mark.asyncio
async def test_project_report_on_an_empty_job_does_not_divide_by_zero(db):
    """A job opened but not yet executed is the normal state for most of a
    project's life; the report has to render for it."""
    job = Job(job_id="JOB-2026-0010", site_id=SITE, title="Awaiting kickoff",
              client_id="CLT-0010", client_name="NTPC")
    await job.insert()

    report = await ReportingService.project_report(job.job_id, SITE)
    assert report["work_packages"]["total"] == 0
    assert report["certified_position"]["deduction_pct"] == 0.0
    assert report["people_deployed"]["count"] == 0
    assert report["billing_position"]["outstanding_value"] == 0.0


@pytest.mark.asyncio
async def test_project_report_rejects_an_unknown_job(db):
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc:
        await ReportingService.project_report("JOB-NOPE", SITE)
    assert exc.value.status_code == 404
