"""The audit trail.

ISO/IEC 17020 expects an inspection body to be able to say who made a decision
and on what basis. Before this the spine kept fragments - a work package's
status history, the two identities on a certification - but most actions left
no evidence they had happened.

These tests check the properties that make a trail usable as evidence: that the
decisions which matter are recorded, that the actor is the authenticated caller
rather than a value from the request, that a failure to record does not take
the business action down with it, and that entries are not rewritten.
"""
import sys
from datetime import datetime, timedelta
from pathlib import Path

import pytest
import pytest_asyncio
from beanie import init_beanie
from mongomock_motor import AsyncMongoMockClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.audit import AuditAction, AuditEntry, diff_fields, history, record  # noqa: E402
from core.sequences import Sequence  # noqa: E402
from modules.assignments.models import Assignment  # noqa: E402
from modules.billing.models import BillingTerms  # noqa: E402
from modules.certifications.models import Certification  # noqa: E402
from modules.certifications.service import CertificationService  # noqa: E402
from modules.invoices.models import Invoice  # noqa: E402
from modules.evidence.models import Evidence  # noqa: E402
from modules.jobs.models import Job  # noqa: E402
from modules.people.models import (  # noqa: E402
    Authorization, CompetenceProfile, ImpartialityDeclaration, Person,
)
from modules.people.service import PeopleService  # noqa: E402
from modules.work_packages.models import WorkPackage  # noqa: E402
from modules.work_packages.service import WorkPackageService  # noqa: E402
from modules.work_types.models import WorkTypeDefinition  # noqa: E402
from modules.work_types.service import WorkTypeService  # noqa: E402

SITE = "SITE-01"
USER = "USR-AUDIT"


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
        database=client["audit_test"],
        document_models=[
            Evidence,
            AuditEntry, Sequence, Job, WorkTypeDefinition, WorkPackage, Person,
            CompetenceProfile, Authorization, ImpartialityDeclaration,
            Assignment, Certification, Invoice, BillingTerms,
        ],
    )
    await WorkTypeService.seed_catalogue(SITE, USER)
    await Job(job_id="JOB-A-0001", site_id=SITE, title="Audited job",
              client_name="Client", status="active").insert()
    yield client


# ------------------------------------------------------------ pure helpers

def test_only_changed_fields_are_recorded():
    """A trail that logs every field on every save buries the one that matters."""
    changes = diff_fields(
        {"status": "draft", "value": 100, "title": "same"},
        {"status": "issued", "value": 100, "title": "same"},
    )
    assert [c.field for c in changes] == ["status"]
    assert changes[0].before == "draft"
    assert changes[0].after == "issued"


def test_housekeeping_timestamps_are_not_noise():
    assert diff_fields({"updated_at": 1, "status": "x"}, {"updated_at": 2, "status": "x"}) == []


def test_large_values_are_summarised_not_copied():
    """Copying whole documents would put client data in a second collection
    with its own retention story."""
    changes = diff_fields({"note": "a"}, {"note": "b" * 5000})
    assert len(changes[0].after) <= 300
    changes = diff_fields({"items": []}, {"items": [1, 2, 3]})
    assert changes[0].after == "3 item(s)"


# ------------------------------------------------------------ recording

@pytest.mark.asyncio
async def test_a_status_change_is_recorded(db):
    wp = await WorkPackageService.create(
        {"job_id": "JOB-A-0001", "work_type_code": "CODE_INSP", "title": "Audited package"},
        SITE, USER,
    )
    await WorkPackageService.transition(wp.work_package_id, "assigned", SITE, USER, "resourced")

    entries = await history("work_package", wp.work_package_id, SITE)
    assert len(entries) == 1
    e = entries[0]
    assert e.action == AuditAction.STATUS_CHANGE.value
    assert e.actor_user_id == USER
    assert e.note == "resourced"
    assert [(c.field, c.before, c.after) for c in e.changes] == [("status", "planned", "assigned")]


@pytest.mark.asyncio
async def test_issuing_a_certification_records_both_identities_and_the_money(db):
    """The question an assessor opens with: who certified this value?"""
    wp = await WorkPackageService.create(
        {"job_id": "JOB-A-0001", "work_type_code": "BILL_VERIF",
         "title": "RA bill", "rate": 1.0}, SITE, USER,
    )
    for to in ("assigned", "in_progress", "submitted", "under_qc"):
        await WorkPackageService.transition(wp.work_package_id, to, SITE, USER)

    cert = await CertificationService.create(
        {"work_package_id": wp.work_package_id, "prepared_by": "EMP-00001",
         "line_items": [{"line_id": "L1", "description": "Concrete", "uom": "cum",
                         "rate": 1000.0, "claimed_quantity": 100.0,
                         "certified_quantity": 90.0}]},
        SITE, USER,
    )
    await CertificationService.issue(cert.certification_id, "EMP-00002", SITE, USER)

    entries = await history("certification", cert.certification_id, SITE)
    issued = [e for e in entries if e.action == AuditAction.ISSUE.value]
    assert len(issued) == 1
    ctx = issued[0].context
    assert ctx["prepared_by"] == "EMP-00001"
    assert ctx["certified_by"] == "EMP-00002"
    assert ctx["claimed_value"] == 100_000.0
    assert ctx["certified_value"] == 90_000.0
    assert ctx["deduction_value"] == 10_000.0


@pytest.mark.asyncio
async def test_an_authorization_decision_records_the_evidence_behind_it(db):
    person = await PeopleService.create(
        {"full_name": "Audited Person", "category": "TECHNICAL_INSPECTION",
         "engagement_type": "PERMANENT", "employment_status": "active"},
        SITE, USER,
    )
    auth = await PeopleService.create_authorization(
        person.person_id,
        {"inspection_types": ["CODE_INSPECTION"], "qualification_verified": True,
         "training_completed": True, "supervised_inspections_count": 3,
         "supervised_required": 3, "witnessed_assessment_passed": True,
         "valid_until": datetime.now() + timedelta(days=365)},
        SITE, USER,
    )
    await PeopleService.decide_authorization(
        auth.authorization_id, "authorized", SITE, "USR-TECHMGR", "evidence complete"
    )

    entries = await history("authorization", auth.authorization_id, SITE)
    assert len(entries) == 1
    e = entries[0]
    assert e.actor_user_id == "USR-TECHMGR"
    assert e.context["supervised"] == "3/3"
    assert e.context["witnessed_assessment_passed"] is True
    assert [(c.before, c.after) for c in e.changes] == [("pending", "authorized")]


@pytest.mark.asyncio
async def test_a_refused_authorization_leaves_no_entry(db):
    """Nothing happened, so nothing is recorded. A trail that logs attempts as
    though they were decisions would misrepresent the record."""
    from fastapi import HTTPException

    person = await PeopleService.create(
        {"full_name": "Trainee", "category": "TECHNICAL_INSPECTION",
         "engagement_type": "TRAINEE", "employment_status": "active"},
        SITE, USER,
    )
    auth = await PeopleService.create_authorization(
        person.person_id,
        {"inspection_types": ["CODE_INSPECTION"], "qualification_verified": False,
         "training_completed": False, "supervised_inspections_count": 0,
         "supervised_required": 3, "witnessed_assessment_passed": False},
        SITE, USER,
    )
    with pytest.raises(HTTPException):
        await PeopleService.decide_authorization(auth.authorization_id, "authorized", SITE, USER)

    assert await history("authorization", auth.authorization_id, SITE) == []


@pytest.mark.asyncio
async def test_entries_are_ordered_oldest_first(db):
    """The order an assessor reads a history in."""
    wp = await WorkPackageService.create(
        {"job_id": "JOB-A-0001", "work_type_code": "CODE_INSP", "title": "Walked"},
        SITE, USER,
    )
    for to in ("assigned", "in_progress", "submitted"):
        await WorkPackageService.transition(wp.work_package_id, to, SITE, USER)

    entries = await history("work_package", wp.work_package_id, SITE)
    assert [e.changes[0].after for e in entries] == ["assigned", "in_progress", "submitted"]
    assert entries == sorted(entries, key=lambda e: e.at)


@pytest.mark.asyncio
async def test_identifiers_are_unique(db):
    for i in range(5):
        await record("thing", f"T-{i}", AuditAction.CREATE, site_id=SITE)
    ids = [e.audit_id for e in await AuditEntry.find_all().to_list()]
    assert len(set(ids)) == len(ids)
    assert all(i.startswith("AUD-") for i in ids)


@pytest.mark.asyncio
async def test_a_failed_audit_write_does_not_fail_the_action(db, monkeypatch):
    """A certification must not be refused because the trail was unreachable -
    that trades an operational failure for a bookkeeping one. The failure is
    logged instead, loudly."""
    async def boom(*_a, **_k):
        raise RuntimeError("audit store unreachable")

    monkeypatch.setattr(AuditEntry, "insert", boom)

    entry = await record("certification", "CERT-X", AuditAction.ISSUE, site_id=SITE)
    assert entry is None, "record() reports the failure rather than raising"


@pytest.mark.asyncio
async def test_the_trail_has_no_update_or_delete_path(db):
    """Append-only is what makes it evidence. There is deliberately no service
    function that rewrites an entry."""
    import core.audit as audit_module

    exported = {n for n in dir(audit_module) if not n.startswith("_")}
    for forbidden in ("update", "amend", "delete", "purge", "edit"):
        assert forbidden not in exported, f"core.audit exposes {forbidden}()"
