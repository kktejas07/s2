"""modules/ai after it stopped being a facade.

What it used to do:

* `generate_inspection_report` composed a prompt string and returned it under
  the key "prompt" with status "draft", so a screen labelled AI-generated
  report displayed a prompt.
* `vector_search` performed substring matching with no vectors involved.
* `suggest_inspector` selected users with `role_id == 3` - the **client** role
  - and applied none of the competence, authorization, impartiality or
  calendar checks the assignment engine exists to enforce. It could propose a
  client's project manager as an IQE inspector.

These tests hold each endpoint to what its name claims.
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
from core.config import settings  # noqa: E402
from core.sequences import Sequence  # noqa: E402
from modules.ai.service import AIService  # noqa: E402
from modules.assignments.models import Assignment  # noqa: E402
from modules.auth.models import UserLogin  # noqa: E402
from modules.jobs.models import Job  # noqa: E402
from modules.people.models import (  # noqa: E402
    Authorization, CompetenceProfile, ImpartialityDeclaration, Person,
)
from modules.people.service import PeopleService  # noqa: E402
from modules.users.models import Competency  # noqa: E402
from modules.visits.models import Visit  # noqa: E402
from modules.work_packages.models import WorkPackage  # noqa: E402
from modules.work_packages.service import WorkPackageService  # noqa: E402
from modules.work_types.models import WorkTypeDefinition  # noqa: E402
from modules.work_types.service import WorkTypeService  # noqa: E402

SITE = "SITE-01"
OTHER_SITE = "SITE-02"
USER = "USR-TEST"
ai = AIService()


def _patch_mongomock():
    from mongomock_motor import AsyncMongoMockDatabase

    original = AsyncMongoMockDatabase.list_collection_names

    async def patched(self, *args, **kwargs):
        kwargs.pop("authorizedCollections", None)
        kwargs.pop("nameOnly", None)
        return await original(self, *args, **kwargs)

    AsyncMongoMockDatabase.list_collection_names = patched


@pytest_asyncio.fixture
async def db(monkeypatch):
    monkeypatch.setattr(settings, "azure_openai_endpoint", None)
    monkeypatch.setattr(settings, "azure_openai_api_key", None)
    _patch_mongomock()
    client = AsyncMongoMockClient()
    await init_beanie(
        database=client["ai_honesty_test"],
        document_models=[
            Visit, UserLogin, Competency, Person, CompetenceProfile,
            Authorization, ImpartialityDeclaration, Assignment, Job,
            WorkTypeDefinition, WorkPackage, AuditEntry, Sequence,
        ],
    )
    await WorkTypeService.seed_catalogue(SITE, USER)
    yield client


# --------------------------------------------------- report generation

@pytest.mark.asyncio
async def test_no_model_means_no_draft_and_no_prompt_masquerading_as_one(db):
    await Visit(visit_id="VST-1", site_id=SITE, job_id="JOB-1",
                inspector_name="R Sharma", comments="Weld visual complete.").insert()

    result = await ai.generate_inspection_report("VST-1", SITE)

    assert result["draft"] is None
    assert result["status"] == "not_configured"
    assert "prompt" not in result, "a prompt must never stand in for a draft"
    # The gathered facts are still returned, so the section can be written by hand.
    assert result["context"]["inspector"] == "R Sharma"


@pytest.mark.asyncio
async def test_report_generation_is_scoped_to_the_callers_site(db):
    await Visit(visit_id="VST-X", site_id=OTHER_SITE, job_id="JOB-X").insert()
    assert "error" in await ai.generate_inspection_report("VST-X", SITE)


# ---------------------------------------------------------- search

@pytest.mark.asyncio
async def test_search_is_named_for_what_it_does_and_says_why_it_matched(db):
    await Visit(visit_id="VST-2", site_id=SITE, job_id="J",
                inspection_report_no="IQE-TP-02-0007",
                comments="Porosity noted on the cap pass.").insert()

    results = await ai.keyword_search("porosity", SITE)
    assert len(results) == 1
    assert results[0]["visit_id"] == "VST-2"
    assert "comments" in results[0]["matched_on"], "a result should say why it ranked"


@pytest.mark.asyncio
async def test_search_does_not_cross_sites(db):
    await Visit(visit_id="VST-3", site_id=OTHER_SITE, job_id="J",
                comments="porosity").insert()
    assert await ai.keyword_search("porosity", SITE) == []


@pytest.mark.asyncio
async def test_an_empty_query_returns_nothing_rather_than_everything(db):
    await Visit(visit_id="VST-4", site_id=SITE, job_id="J", comments="anything").insert()
    assert await ai.keyword_search("   ", SITE) == []


# -------------------------------------------------------- anomalies

@pytest.mark.asyncio
async def test_anomaly_flags_state_the_threshold_they_tripped(db):
    """A flag an inspector can argue with is more useful than one they cannot."""
    from modules.visits.models import Expense

    await Visit(visit_id="VST-5", site_id=SITE, job_id="J",
                expenses=[Expense(expense_id="EXP-1", type="travel",
                                  amount=80000.0, currency="INR")]).insert()

    result = await ai.detect_anomalies("VST-5", SITE)
    assert result["method"] == "rules"
    assert result["thresholds"]["high_expense"] == 50000.0
    assert any(f["type"] == "high_expense" for f in result["flags"])


def test_a_malformed_date_is_not_reported_as_an_anomaly():
    """Bad data is not a finding about the inspection. The model now rejects a
    malformed date outright, so this checks the helper that older records with
    string dates still pass through."""
    from modules.ai.service import _visit_hours

    class Stub:
        visited_from = "not-a-date"
        visited_to = "also-not"

    assert _visit_hours(Stub()) is None


# ------------------------------------------------ inspector suggestion

@pytest.mark.asyncio
async def test_suggestion_no_longer_proposes_client_users_as_inspectors(db):
    """The defect: it selected role_id == 3, which is the client role."""
    await UserLogin(user_id="USR-CLIENT", site_id=SITE, login_name="tenant",
                    login_password="x", full_name="Tenant Project Manager",
                    email="tenant@client.example", role_id=3, is_active=True).insert()

    suggestions = await ai.suggest_inspector("inspection", "", SITE)
    assert all(s["person_id"] != "USR-CLIENT" for s in suggestions)
    assert all(s.get("name") != "Tenant Project Manager" for s in suggestions)


@pytest.mark.asyncio
async def test_a_ranked_suggestion_comes_from_the_assignment_engine(db):
    """With a work package there is a competence requirement to check, so the
    suggestion carries the same gate an actual assignment would."""
    await Job(job_id="JOB-S", site_id=SITE, title="S", client_name="C",
              status="active").insert()
    wp = await WorkPackageService.create(
        {"job_id": "JOB-S", "work_type_code": "CODE_INSP", "title": "Weld inspection",
         "planned_start": datetime.now() + timedelta(days=2),
         "planned_finish": datetime.now() + timedelta(days=5)},
        SITE, USER,
    )

    # An authorised inspector, and an unauthorised one.
    for name, authorise in (("Authorised Inspector", True), ("No Ticket", False)):
        person = await PeopleService.create(
            {"full_name": name, "category": "TECHNICAL_INSPECTION",
             "engagement_type": "PERMANENT", "employment_status": "active"},
            SITE, USER,
        )
        if authorise:
            auth = await PeopleService.create_authorization(
                person.person_id,
                {"inspection_types": ["CODE_INSPECTION"], "qualification_verified": True,
                 "training_completed": True, "supervised_inspections_count": 3,
                 "supervised_required": 3, "witnessed_assessment_passed": True,
                 "valid_until": datetime.now() + timedelta(days=200)},
                SITE, USER,
            )
            await PeopleService.decide_authorization(
                auth.authorization_id, "authorized", SITE, USER
            )

    suggestions = await ai.suggest_inspector(
        "inspection", "", SITE, work_package_id=wp.work_package_id
    )
    names = [s["name"] for s in suggestions]
    assert "Authorised Inspector" in names
    assert "No Ticket" not in names, "an unauthorised person must not be suggested"
    assert all(s["gate"] == "full" for s in suggestions)


@pytest.mark.asyncio
async def test_without_a_work_package_the_answer_says_it_is_unranked(db):
    """There is no competence requirement to rank against, so claiming a
    ranking would imply a judgement nothing supports."""
    person = await PeopleService.create(
        {"full_name": "Someone Deployable", "category": "TECHNICAL_INSPECTION",
         "engagement_type": "PERMANENT", "employment_status": "active"},
        SITE, USER,
    )
    auth = await PeopleService.create_authorization(
        person.person_id,
        {"inspection_types": ["CODE_INSPECTION"], "qualification_verified": True,
         "training_completed": True, "supervised_inspections_count": 3,
         "supervised_required": 3, "witnessed_assessment_passed": True,
         "valid_until": datetime.now() + timedelta(days=200)},
        SITE, USER,
    )
    await PeopleService.decide_authorization(auth.authorization_id, "authorized", SITE, USER)

    suggestions = await ai.suggest_inspector("inspection", "", SITE)
    assert suggestions
    assert all(s["score"] is None for s in suggestions)
    assert all(s["gate"] == "deployability_only" for s in suggestions)
