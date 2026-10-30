"""The AI assists the work type catalogue declares.

AIAssist listed six capabilities per work type and nothing read them. The
existing modules/ai is a facade - it composes a prompt and returns it without
calling a model.

Half of these do not need a model, and those are implemented deterministically
so they are testable and explainable: an inspection body defending a deduction
is better served by "3.2 standard deviations above the other lines" than by a
sentence a model wrote. The other half report honestly that they need one
rather than fabricating output.
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
from core.sequences import Sequence  # noqa: E402
from modules.ai_assist.service import AIAssistService  # noqa: E402
from modules.assignments.models import Assignment  # noqa: E402
from modules.certifications.models import Certification  # noqa: E402
from modules.certifications.service import CertificationService  # noqa: E402
from modules.evidence.models import Evidence  # noqa: E402
from modules.jobs.models import Job  # noqa: E402
from modules.work_packages.models import WorkPackage  # noqa: E402
from modules.work_packages.service import WorkPackageService  # noqa: E402
from modules.work_types.models import WorkTypeDefinition  # noqa: E402
from modules.work_types.service import WorkTypeService  # noqa: E402

SITE = "SITE-01"
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
        database=client["ai_assist_test"],
        document_models=[
            Job, WorkTypeDefinition, WorkPackage, Certification, Assignment,
            Evidence, AuditEntry, Sequence,
        ],
    )
    await WorkTypeService.seed_catalogue(SITE, USER)
    await Job(job_id="JOB-AI-1", site_id=SITE, title="AI job",
              client_name="C", status="active").insert()
    yield client


async def make_package(work_type_code="BILL_VERIF", **extra) -> WorkPackage:
    return await WorkPackageService.create(
        {"job_id": "JOB-AI-1", "work_type_code": work_type_code,
         "title": f"{work_type_code} package", "rate": 1.0, **extra},
        SITE, USER,
    )


# ------------------------------------------------------------- gating

@pytest.mark.asyncio
async def test_an_assist_the_work_type_does_not_declare_is_refused(db):
    """The catalogue decides which assists apply. Running anomaly detection on
    a work type that never declared it produces findings nobody agreed were
    meaningful."""
    wp = await make_package("STAFF_DEPUT")      # declares VALIDATION only
    with pytest.raises(HTTPException) as exc:
        await AIAssistService.detect_anomalies(wp.work_package_id, SITE)
    assert exc.value.status_code == 409
    assert "does not enable ANOMALY" in exc.value.detail


@pytest.mark.asyncio
async def test_available_separates_what_works_from_what_needs_a_model(db):
    wp = await make_package("BILL_VERIF")       # DOC_EXTRACT, ANOMALY, VALIDATION
    available = await AIAssistService.available_for(wp.work_package_id, SITE)
    assert set(available["ready"]) == {"ANOMALY", "VALIDATION"}
    assert available["needs_a_model"] == ["DOC_EXTRACT"]


# ---------------------------------------------------------- validation

@pytest.mark.asyncio
async def test_validation_blocks_an_unassigned_package(db):
    wp = await make_package("STAFF_DEPUT")
    result = await AIAssistService.validate(wp.work_package_id, SITE)
    assert result["ready_to_submit"] is False
    assert any("inspection officer" in b for b in result["blocking"])


@pytest.mark.asyncio
async def test_validation_requires_photos_when_the_work_type_does(db):
    """CODE_INSP sets requires_photos, so a package with none is not ready."""
    wp = await make_package("CODE_INSP")
    await Assignment(assignment_id="ASG-1", site_id=SITE,
                     work_package_id=wp.work_package_id, person_id="EMP-1",
                     job_id="JOB-AI-1").insert()

    result = await AIAssistService.validate(wp.work_package_id, SITE)
    assert any("photographic evidence" in b for b in result["blocking"])

    await Evidence(evidence_id="EV-1", site_id=SITE, entity_type="work_package",
                   entity_id=wp.work_package_id, kind="PHOTO", filename="a.png",
                   stored_path="a.png", content_type="image/png", size_bytes=1,
                   sha256="x").insert()
    cleared = await AIAssistService.validate(wp.work_package_id, SITE)
    assert not any("photographic evidence" in b for b in cleared["blocking"])


@pytest.mark.asyncio
async def test_validation_names_the_missing_thing(db):
    """An inspector told their report is incomplete is entitled to know which
    field - which is why this is deterministic rather than generated."""
    wp = await make_package("CODE_INSP")
    result = await AIAssistService.validate(wp.work_package_id, SITE)
    assert result["method"] == "deterministic"
    assert all(isinstance(b, str) and len(b) > 10 for b in result["blocking"])


@pytest.mark.asyncio
async def test_advisory_findings_do_not_block(db):
    wp = await make_package("STAFF_DEPUT")
    await Assignment(assignment_id="ASG-2", site_id=SITE,
                     work_package_id=wp.work_package_id, person_id="EMP-1",
                     job_id="JOB-AI-1").insert()
    result = await AIAssistService.validate(wp.work_package_id, SITE)
    assert result["ready_to_submit"] is True
    assert result["advisory"], "planned dates are missing, which should be advised"


# ------------------------------------------------------------- anomaly

async def certified_package(lines: list[dict]) -> WorkPackage:
    wp = await make_package("BILL_VERIF")
    for to in ("assigned", "in_progress", "submitted", "under_qc"):
        await WorkPackageService.transition(wp.work_package_id, to, SITE, USER)
    await CertificationService.create(
        {"work_package_id": wp.work_package_id, "prepared_by": "EMP-1",
         "line_items": lines},
        SITE, USER,
    )
    return wp


@pytest.mark.asyncio
async def test_a_rate_far_from_the_others_is_flagged(db):
    wp = await certified_package([
        {"line_id": f"L{i}", "description": f"Item {i}", "uom": "cum",
         "rate": 1000.0, "claimed_quantity": 10.0, "certified_quantity": 10.0}
        for i in range(1, 6)
    ] + [
        {"line_id": "L99", "description": "Suspicious item", "uom": "cum",
         "rate": 9000.0, "claimed_quantity": 10.0, "certified_quantity": 10.0}
    ])
    result = await AIAssistService.detect_anomalies(wp.work_package_id, SITE)
    rate_findings = [f for f in result["findings"] if f["kind"] == "RATE_OUTLIER"]
    assert rate_findings
    assert rate_findings[0]["item"] == "L99"
    assert rate_findings[0]["direction"] == "above"
    assert "standard deviations" in rate_findings[0]["explanation"]


@pytest.mark.asyncio
async def test_consistent_rates_produce_no_findings(db):
    """A detector that fires on everything is ignored."""
    wp = await certified_package([
        {"line_id": f"L{i}", "description": f"Item {i}", "uom": "cum",
         "rate": 1000.0, "claimed_quantity": 10.0, "certified_quantity": 10.0}
        for i in range(1, 7)
    ])
    result = await AIAssistService.detect_anomalies(wp.work_package_id, SITE)
    assert [f for f in result["findings"] if f["kind"] == "RATE_OUTLIER"] == []


@pytest.mark.asyncio
async def test_too_few_lines_to_judge_produces_nothing(db):
    """With three points one unusual value drags the mean far enough that
    nothing looks unusual, so claiming a finding would be false confidence."""
    wp = await certified_package([
        {"line_id": "L1", "description": "A", "uom": "cum", "rate": 100.0,
         "claimed_quantity": 1.0, "certified_quantity": 1.0},
        {"line_id": "L2", "description": "B", "uom": "cum", "rate": 100.0,
         "claimed_quantity": 1.0, "certified_quantity": 1.0},
        {"line_id": "L3", "description": "C", "uom": "cum", "rate": 9000.0,
         "claimed_quantity": 1.0, "certified_quantity": 1.0},
    ])
    result = await AIAssistService.detect_anomalies(wp.work_package_id, SITE)
    assert [f for f in result["findings"] if f["kind"] == "RATE_OUTLIER"] == []


@pytest.mark.asyncio
async def test_a_heavily_rejected_line_is_flagged(db):
    wp = await certified_package([
        {"line_id": "L1", "description": "Mostly rejected", "uom": "cum",
         "rate": 1000.0, "claimed_quantity": 100.0, "certified_quantity": 40.0},
    ])
    result = await AIAssistService.detect_anomalies(wp.work_package_id, SITE)
    high = [f for f in result["findings"] if f["kind"] == "HIGH_REJECTION"]
    assert high and high[0]["value"] == 60.0


# ----------------------------------------------------------- checklist

@pytest.mark.asyncio
async def test_a_checklist_is_built_from_the_declared_codes(db):
    wp = await make_package("GMP_SCHEDM")
    result = await AIAssistService.generate_checklist(wp.work_package_id, SITE)
    assert result["points"]
    text = " ".join(p["verification_point"] for p in result["points"])
    wt = await WorkTypeDefinition.find_one(
        WorkTypeDefinition.work_type_code == "GMP_SCHEDM",
        WorkTypeDefinition.site_id == SITE,
    )
    for code in wt.applicable_codes:
        assert code in text, f"{code} is not represented in the checklist"


@pytest.mark.asyncio
async def test_the_checklist_covers_competence_and_evidence(db):
    wp = await make_package("GMP_SCHEDM")
    result = await AIAssistService.generate_checklist(wp.work_package_id, SITE)
    disciplines = {p["discipline"] for p in result["points"]}
    assert "Competence" in disciplines
    assert result["note"], "a generated checklist must say it needs review"


@pytest.mark.asyncio
async def test_checklist_item_ids_are_unique(db):
    wp = await make_package("VENDOR_AUDIT")
    result = await AIAssistService.generate_checklist(wp.work_package_id, SITE)
    ids = [p["item_id"] for p in result["points"]]
    assert len(set(ids)) == len(ids)


# ------------------------------------------------------- model-backed

@pytest.mark.asyncio
async def test_report_drafting_reports_honestly_without_a_model(db):
    """The previous AI module returned a prompt string and called it a draft."""
    wp = await make_package("CODE_INSP")
    result = await AIAssistService.draft_report(wp.work_package_id, SITE)
    assert result["draft"] is None
    assert result["status"] == "not_configured"
    assert result["context"]["work_type"]["code"] == "CODE_INSP"


@pytest.mark.asyncio
async def test_extraction_returns_no_invented_values(db):
    """A guessed heat number on a material certificate is worse than a blank."""
    wp = await make_package("BILL_VERIF")
    await Evidence(evidence_id="EV-9", site_id=SITE, entity_type="work_package",
                   entity_id=wp.work_package_id, kind="DOCUMENT", filename="mtc.pdf",
                   stored_path="mtc.pdf", content_type="application/pdf",
                   size_bytes=1, sha256="x").insert()
    result = await AIAssistService.extract_document(wp.work_package_id, "EV-9", SITE)
    assert result["extracted"] is None
    assert result["status"] in ("not_configured", "unsupported_source")
    assert result["source"]["filename"] == "mtc.pdf"
