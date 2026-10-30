"""End-to-end walk of the execution spine against an in-memory MongoDB.

Every other test in this suite exercises a pure function. This one runs the
modules against each other, which is where integration bugs live: ID
sequencing, status coupling between work packages and certifications, the
billing gate, and double-billing guards.

Uses mongomock_motor, so it needs no running database.
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

from modules.assignments.models import Assignment  # noqa: E402
from modules.assignments.service import AssignmentService  # noqa: E402
from modules.billing.models import BillingTerms  # noqa: E402
from modules.billing.service import BillingService  # noqa: E402
from modules.certifications.models import Certification  # noqa: E402
from modules.certifications.service import CertificationService  # noqa: E402
from modules.invoices.models import Invoice  # noqa: E402
from modules.jobs.models import Job  # noqa: E402
from modules.people.models import (  # noqa: E402
    Authorization,
    CompetenceProfile,
    ImpartialityDeclaration,
    Person,
)
from modules.people.service import PeopleService  # noqa: E402
from modules.work_packages.models import WorkPackage  # noqa: E402
from modules.work_packages.service import WorkPackageService  # noqa: E402
from modules.work_types.models import WorkTypeDefinition  # noqa: E402
from modules.work_types.service import WorkTypeService  # noqa: E402
from core.audit import AuditEntry  # noqa: E402
from core.sequences import Sequence
from modules.ncr.models import NCR  # noqa: E402

SITE = "SITE-01"
USER = "USR-TEST"


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
        database=client["spine_test"],
        document_models=[
            AuditEntry,
            Sequence,
            Job, WorkTypeDefinition, WorkPackage, Person, CompetenceProfile,
            Authorization, ImpartialityDeclaration, Assignment, Certification,
            Invoice, BillingTerms,
            NCR,
        ],
    )
    yield client


async def seed_job() -> Job:
    job = Job(
        job_id="JOB-2026-0001",
        site_id=SITE,
        title="Penstock fabrication inspection",
        client_id="CLT-0001",
        client_name="Greenko Group",
        manufacturer_id="MFR-0001",
        manufacturer_name="MEIL Fabrication Yard",
    )
    await job.insert()
    return job


async def seed_authorized_person(name="Rajesh Sharma", types=("CODE_INSPECTION",)) -> Person:
    person = await PeopleService.create(
        {
            "full_name": name,
            "category": "TECHNICAL_INSPECTION",
            "engagement_type": "PERMANENT",
            "employment_status": "active",
            "base_location": "Bhootpur, Telangana",
            "prof_qualification": "Welding",
            "experience_text": "12",
        },
        SITE, USER,
    )
    auth = await PeopleService.create_authorization(
        person.person_id,
        {
            "inspection_types": list(types),
            "qualification_verified": True,
            "training_completed": True,
            "supervised_inspections_count": 3,
            "supervised_required": 3,
            "witnessed_assessment_passed": True,
            "valid_until": datetime.now() + timedelta(days=365),
        },
        SITE, USER,
    )
    await PeopleService.decide_authorization(auth.authorization_id, "authorized", SITE, USER)
    return await PeopleService.get(person.person_id, SITE)


# ------------------------------------------------------------- the full walk

@pytest.mark.asyncio
async def test_full_spine_from_work_package_to_invoice(db):
    """Work package → assignment → certification → invoice, all wired together."""
    await seed_job()
    await WorkTypeService.seed_catalogue(SITE, USER)
    person = await seed_authorized_person()
    assert person.deployable is True, person.deployability_reason

    wp = await WorkPackageService.create(
        {
            "job_id": "JOB-2026-0001",
            "work_type_code": "BOQ_RECON",
            "title": "Penstock BOQ reconciliation",
            "location": "Bhootpur, Telangana",
            "planned_start": datetime.now() + timedelta(days=3),
            "planned_finish": datetime.now() + timedelta(days=20),
            "rate": 100.0,
        },
        SITE, USER,
    )
    assert wp.work_package_id.startswith("WP-")
    # Commercial defaults come from the work type, not the caller.
    assert wp.rate_basis == "PCT_CERTIFIED_VALUE"
    assert wp.planned_uom == "cum"
    # Counterparty is inherited from the parent job.
    assert wp.client_name == "Greenko Group"

    # --- assignment: the engine must find our authorized person
    rec = await AssignmentService.recommend(wp.work_package_id, SITE)
    assert rec["eligible_count"] == 0, "BOQ_RECON needs QUANTITY_SURVEY, not CODE_INSPECTION"

    surveyor = await seed_authorized_person("Anil Kumar", types=("QUANTITY_SURVEY",))
    rec = await AssignmentService.recommend(wp.work_package_id, SITE)
    assert rec["eligible_count"] == 1
    assert rec["recommendations"][0]["person_id"] == surveyor.person_id

    assignment = await AssignmentService.assign(
        wp.work_package_id, surveyor.person_id, SITE, USER
    )
    assert assignment.assignment_id.startswith("ASG-")
    # Evidence snapshotted at assignment time.
    assert assignment.authorization_id is not None
    assert "QUANTITY_SURVEY" in assignment.inspection_types_covered

    # Assigning moved the package on.
    wp = await WorkPackageService.get(wp.work_package_id, SITE)
    assert wp.status == "assigned"

    # --- walk to QC
    for to in ("in_progress", "submitted", "under_qc"):
        wp = await WorkPackageService.transition(wp.work_package_id, to, SITE, USER)
    assert wp.status == "under_qc"

    # --- certification: contractor claims 100, we certify 90
    cert = await CertificationService.create(
        {
            "work_package_id": wp.work_package_id,
            "reference_bill_no": "RA-01",
            "retention_pct": 5.0,
            "line_items": [
                {
                    "line_id": "L1", "description": "Penstock fabrication",
                    "uom": "cum", "rate": 1000.0,
                    "claimed_quantity": 100.0, "certified_quantity": 90.0,
                }
            ],
        },
        SITE, USER,
    )
    assert cert.claimed_value == 100_000.0
    assert cert.certified_value == 90_000.0
    assert cert.deduction_value == 10_000.0
    assert cert.retention_value == 4_500.0        # 5% of certified, not claimed
    assert cert.net_payable_value == 85_500.0

    # Billing is blocked while the certification is still a draft.
    elig = await CertificationService.billing_eligibility(wp.work_package_id, SITE)
    assert elig["eligible"] is False

    cert = await CertificationService.issue(cert.certification_id, surveyor.person_id, SITE, USER)
    assert cert.status == "issued"

    # Issuing advanced the work package.
    wp = await WorkPackageService.get(wp.work_package_id, SITE)
    assert wp.status == "certified"

    elig = await CertificationService.billing_eligibility(wp.work_package_id, SITE)
    assert elig["eligible"] is True
    assert elig["billable_value"] == 85_500.0

    # --- invoice
    result = await BillingService.raise_invoice_from_certifications(
        [cert.certification_id], SITE, USER
    )
    assert result["invoice_id"].startswith("INV-")
    assert result["subtotal"] == 85_500.0
    assert result["cgst"] == 7_695.0 and result["sgst"] == 7_695.0   # 18% split
    assert result["grand_total"] == 100_890.0
    assert result["due_date"] is not None

    # Certification consumed, work package billed.
    cert = await CertificationService.get(cert.certification_id, SITE)
    assert cert.billed_invoice_id == result["invoice_id"]
    wp = await WorkPackageService.get(wp.work_package_id, SITE)
    assert wp.status == "billed"


# ------------------------------------------------------------------- guards

@pytest.mark.asyncio
async def test_same_certification_cannot_be_billed_twice(db):
    await seed_job()
    await WorkTypeService.seed_catalogue(SITE, USER)
    wp = await WorkPackageService.create(
        {"job_id": "JOB-2026-0001", "work_type_code": "BOQ_RECON", "title": "Measure"},
        SITE, USER,
    )
    cert = await CertificationService.create(
        {
            "work_package_id": wp.work_package_id,
            "line_items": [{"line_id": "L1", "description": "X", "rate": 10.0,
                            "claimed_quantity": 5.0, "certified_quantity": 5.0}],
        },
        SITE, USER,
    )
    await CertificationService.issue(cert.certification_id, "EMP-00001", SITE, USER)
    await BillingService.raise_invoice_from_certifications([cert.certification_id], SITE, USER)

    with pytest.raises(HTTPException) as exc:
        await BillingService.raise_invoice_from_certifications([cert.certification_id], SITE, USER)
    assert exc.value.status_code == 409
    assert "already billed" in exc.value.detail


@pytest.mark.asyncio
async def test_unauthorized_person_cannot_be_assigned(db):
    """The gate holds at assignment, not only in the recommendation list."""
    await seed_job()
    await WorkTypeService.seed_catalogue(SITE, USER)
    wp = await WorkPackageService.create(
        {"job_id": "JOB-2026-0001", "work_type_code": "CODE_INSP", "title": "Weld inspection"},
        SITE, USER,
    )
    # Onboarding, no authorization at all.
    person = await PeopleService.create(
        {"full_name": "Unqualified Person", "employment_status": "onboarding"}, SITE, USER
    )
    with pytest.raises(HTTPException) as exc:
        await AssignmentService.assign(wp.work_package_id, person.person_id, SITE, USER)
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_authorization_refused_until_evidence_is_complete(db):
    person = await PeopleService.create({"full_name": "Trainee", "employment_status": "active"}, SITE, USER)
    auth = await PeopleService.create_authorization(
        person.person_id,
        {"inspection_types": ["CODE_INSPECTION"], "qualification_verified": True},
        SITE, USER,
    )
    with pytest.raises(HTTPException) as exc:
        await PeopleService.decide_authorization(auth.authorization_id, "authorized", SITE, USER)
    assert exc.value.status_code == 409
    assert "training not completed" in exc.value.detail


@pytest.mark.asyncio
async def test_invoice_refuses_to_span_two_jobs(db):
    await seed_job()
    other = Job(job_id="JOB-2026-0002", site_id=SITE, title="Other job")
    await other.insert()
    await WorkTypeService.seed_catalogue(SITE, USER)

    cert_ids = []
    for job_id in ("JOB-2026-0001", "JOB-2026-0002"):
        wp = await WorkPackageService.create(
            {"job_id": job_id, "work_type_code": "BOQ_RECON", "title": f"Work {job_id}"},
            SITE, USER,
        )
        c = await CertificationService.create(
            {
                "work_package_id": wp.work_package_id,
                "line_items": [{"line_id": "L1", "description": "X", "rate": 10.0,
                                "claimed_quantity": 2.0, "certified_quantity": 2.0}],
            },
            SITE, USER,
        )
        await CertificationService.issue(c.certification_id, "EMP-00001", SITE, USER)
        cert_ids.append(c.certification_id)

    with pytest.raises(HTTPException) as exc:
        await BillingService.raise_invoice_from_certifications(cert_ids, SITE, USER)
    assert exc.value.status_code == 400
    assert "span" in exc.value.detail


@pytest.mark.asyncio
async def test_impartiality_conflict_excludes_from_recommendations(db):
    await seed_job()
    await WorkTypeService.seed_catalogue(SITE, USER)
    person = await seed_authorized_person("Conflicted Engineer", types=("CODE_INSPECTION",))
    await PeopleService.declare_impartiality(
        person.person_id, {"conflicted_client_ids": ["CLT-0001"]}, SITE
    )
    wp = await WorkPackageService.create(
        {"job_id": "JOB-2026-0001", "work_type_code": "CODE_INSP", "title": "Weld inspection"},
        SITE, USER,
    )
    rec = await AssignmentService.recommend(wp.work_package_id, SITE)
    assert rec["eligible_count"] == 0
    assert any("Impartiality" in e["reason"] for e in rec["excluded"])


@pytest.mark.asyncio
async def test_ids_increment_rather_than_collide(db):
    await seed_job()
    await WorkTypeService.seed_catalogue(SITE, USER)
    ids = []
    for i in range(3):
        wp = await WorkPackageService.create(
            {"job_id": "JOB-2026-0001", "work_type_code": "CODE_INSP", "title": f"Package {i}"},
            SITE, USER,
        )
        ids.append(wp.work_package_id)
    assert len(set(ids)) == 3, f"duplicate work package ids: {ids}"
    assert ids == sorted(ids), f"ids not monotonic: {ids}"


@pytest.mark.asyncio
async def test_seeding_the_catalogue_twice_adds_nothing(db):
    first = await WorkTypeService.seed_catalogue(SITE, USER)
    second = await WorkTypeService.seed_catalogue(SITE, USER)
    assert len(first["created"]) == 8
    assert second["created"] == []
    assert len(second["skipped_existing"]) == 8


@pytest.mark.asyncio
async def test_preparer_cannot_certify_their_own_measurement(db):
    """Separation of duties. The person who prepared the certification is the
    one who measured; letting them certify it collapses the two-person control
    the RBAC matrix and ISO/IEC 17020 impartiality both assume."""
    await seed_job()
    await WorkTypeService.seed_catalogue(SITE, USER)
    wp = await WorkPackageService.create(
        {"job_id": "JOB-2026-0001", "work_type_code": "BILL_VERIF",
         "title": "RA Bill 07", "rate": 1.0},
        SITE, USER,
    )
    for to in ("assigned", "in_progress", "submitted", "under_qc"):
        wp = await WorkPackageService.transition(wp.work_package_id, to, SITE, USER)

    cert = await CertificationService.create(
        {
            "work_package_id": wp.work_package_id,
            "prepared_by": "EMP-00007",
            "line_items": [{
                "line_id": "L1", "description": "Brickwork", "uom": "sqm",
                "rate": 500.0, "claimed_quantity": 200.0, "certified_quantity": 190.0,
            }],
        },
        SITE, USER,
    )

    with pytest.raises(HTTPException) as exc:
        await CertificationService.issue(cert.certification_id, "EMP-00007", SITE, USER)
    assert exc.value.status_code == 409
    assert "cannot also certify" in exc.value.detail

    # A separate reviewer may certify the same draft.
    issued = await CertificationService.issue(cert.certification_id, "EMP-00008", SITE, USER)
    assert issued.status == "issued"
    assert issued.prepared_by == "EMP-00007"
    assert issued.certified_by_person_id == "EMP-00008"


@pytest.mark.asyncio
async def test_self_certification_is_allowed_when_the_work_type_permits_it(db):
    """Some accredited scopes do place certifying authority with the performing
    inspector. That is configuration on the work type, not a code change."""
    await seed_job()
    await WorkTypeService.seed_catalogue(SITE, USER)

    # BOQ_RECON is False in the catalogue, so turning it on here is what grants
    # the permission. Using a work type that already allows it would make this
    # test pass even if the flag were ignored entirely.
    wt = await WorkTypeDefinition.find_one(
        WorkTypeDefinition.work_type_code == "BOQ_RECON",
        WorkTypeDefinition.site_id == SITE,
    )
    assert wt.allow_self_certification is False, "precondition: catalogue default"
    wt.allow_self_certification = True
    await wt.save()

    wp = await WorkPackageService.create(
        {"job_id": "JOB-2026-0001", "work_type_code": "BOQ_RECON",
         "title": "Weld visual", "rate": 1.0},
        SITE, USER,
    )
    for to in ("assigned", "in_progress", "submitted", "under_qc"):
        wp = await WorkPackageService.transition(wp.work_package_id, to, SITE, USER)

    cert = await CertificationService.create(
        {
            "work_package_id": wp.work_package_id,
            "prepared_by": "EMP-00009",
            "line_items": [{
                "line_id": "L1", "description": "Weld visual inspection", "uom": "nos",
                "rate": 100.0, "claimed_quantity": 10.0, "certified_quantity": 10.0,
            }],
        },
        SITE, USER,
    )
    issued = await CertificationService.issue(cert.certification_id, "EMP-00009", SITE, USER)
    assert issued.status == "issued"


@pytest.mark.asyncio
async def test_an_open_major_nonconformity_blocks_the_certificate(db):
    """The NCR gate, exercised through the real certification path.

    `Certification.ncr_ids` used to be a list of strings pointing at nothing,
    so a certificate could carry references that resolved to no record. Now an
    open critical or major nonconformity stops issue outright: certifying over
    one would state that the work conformed while IQE's own record says it did
    not.
    """
    from modules.ncr.service import NCRService

    await seed_job()
    await WorkTypeService.seed_catalogue(SITE, USER)
    wp = await WorkPackageService.create(
        {"job_id": "JOB-2026-0001", "work_type_code": "BOQ_RECON", "title": "Measure"},
        SITE, USER,
    )
    cert = await CertificationService.create(
        {
            "work_package_id": wp.work_package_id,
            "line_items": [{"line_id": "L1", "description": "X", "rate": 10.0,
                            "claimed_quantity": 5.0, "certified_quantity": 5.0}],
        },
        SITE, USER,
    )

    ncr = await NCRService.raise_ncr(
        {"job_id": "JOB-2026-0001", "work_package_id": wp.work_package_id,
         "title": "Quantities overstated against the measured length",
         "description": "Claimed run exceeds the measured run.",
         "severity": "MAJOR",
         "objective_evidence": "Tape measurement of 41.2m against 48.0m claimed.",
         "requirement_source": "BOQ item 4.2", "requirement_revision": "Rev 2"},
        SITE, "EMP-00006",
    )

    with pytest.raises(HTTPException) as exc:
        await CertificationService.issue(
            cert.certification_id, "EMP-00001", SITE, USER
        )
    assert exc.value.status_code == 409
    assert ncr["ncr_id"] in exc.value.detail
    assert "says it did not" in exc.value.detail

    # Closed, and the certificate issues - still carrying nothing open.
    await NCRService.propose_disposition(
        ncr["ncr_id"], {"disposition": "REWORK", "note": "Re-measure and re-claim."},
        SITE, "SUGUNA-QA",
    )
    await NCRService.accept_disposition(ncr["ncr_id"], {}, SITE, USER)
    await NCRService.submit_for_verification(
        ncr["ncr_id"], {"note": "Re-measured."}, SITE, "SUGUNA-QA"
    )
    await NCRService.verify(
        ncr["ncr_id"], {"accepted": True, "note": "Agreed at 41.2m."},
        SITE, "EMP-00006",
    )

    issued = await CertificationService.issue(
        cert.certification_id, "EMP-00001", SITE, USER
    )
    assert issued.status == "issued"
    assert issued.ncr_ids == []


@pytest.mark.asyncio
async def test_a_minor_nonconformity_is_carried_onto_the_certificate(db):
    """It does not block - a departure that does not affect fitness for
    purpose is something the client should see, not a reason to withhold the
    certificate."""
    from modules.ncr.service import NCRService

    await seed_job()
    await WorkTypeService.seed_catalogue(SITE, USER)
    wp = await WorkPackageService.create(
        {"job_id": "JOB-2026-0001", "work_type_code": "BOQ_RECON", "title": "Measure"},
        SITE, USER,
    )
    cert = await CertificationService.create(
        {
            "work_package_id": wp.work_package_id,
            "line_items": [{"line_id": "L1", "description": "X", "rate": 10.0,
                            "claimed_quantity": 5.0, "certified_quantity": 5.0}],
        },
        SITE, USER,
    )
    ncr = await NCRService.raise_ncr(
        {"job_id": "JOB-2026-0001", "work_package_id": wp.work_package_id,
         "title": "Measurement sheets unsigned",
         "description": "Sheets not countersigned by the site engineer.",
         "severity": "MINOR"},
        SITE, "EMP-00006",
    )

    issued = await CertificationService.issue(
        cert.certification_id, "EMP-00001", SITE, USER
    )
    assert issued.status == "issued"
    assert issued.ncr_ids == [ncr["ncr_id"]]
