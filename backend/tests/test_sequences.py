"""Atomic identifier allocation.

What matters here is not that IDs increment - the old max-plus-one code did
that too - but that numbering *continues* from existing data rather than
restarting, and that each caller gets a distinct value.

The concurrency property itself cannot be proven here: mongomock serialises
everything, so a race has no way to appear. `scripts/verify_against_real_db.py`
probes for it against a real server, which is the only place it can be
observed.
"""
import sys
from pathlib import Path

import pytest
import pytest_asyncio
from beanie import init_beanie
from mongomock_motor import AsyncMongoMockClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.audit import AuditEntry  # noqa: E402
from core.sequences import Sequence, next_identifier, next_value  # noqa: E402
from modules.evidence.models import Evidence  # noqa: E402
from modules.jobs.models import Job  # noqa: E402
from modules.people.models import (  # noqa: E402
    Authorization,
    CompetenceProfile,
    ImpartialityDeclaration,
    Person,
)
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
        database=client["sequence_test"],
        document_models=[
            Evidence,
            AuditEntry,
            Sequence, Job, WorkTypeDefinition, WorkPackage, Person,
            CompetenceProfile, Authorization, ImpartialityDeclaration,
        ],
    )
    yield client


@pytest.mark.asyncio
async def test_values_are_distinct_and_monotonic(db):
    values = [await next_value("SITE-01:test:X-") for _ in range(5)]
    assert values == [1, 2, 3, 4, 5]
    assert len(set(values)) == 5


@pytest.mark.asyncio
async def test_separate_keys_do_not_share_a_counter(db):
    a = [await next_value("SITE-01:work_package:WP-2026-") for _ in range(3)]
    b = [await next_value("SITE-01:certification:CERT-2026-") for _ in range(2)]
    assert a == [1, 2, 3]
    assert b == [1, 2], "a second kind must start its own sequence"


@pytest.mark.asyncio
async def test_seed_applies_only_when_the_counter_is_created(db):
    """Seeding happens once. If it applied on every call the sequence would
    jump backwards the moment a record was deleted."""
    first = await next_value("SITE-01:seeded:S-", seed=40)
    second = await next_value("SITE-01:seeded:S-", seed=40)
    third = await next_value("SITE-01:seeded:S-", seed=0)
    assert [first, second, third] == [41, 42, 43]


@pytest.mark.asyncio
async def test_numbering_continues_from_records_that_already_exist(db):
    """The regression this guards: switching allocation strategy must not
    restart numbering at 0001 on a database that already holds work."""
    await WorkTypeService.seed_catalogue(SITE, USER)
    await Job(job_id="JOB-X", site_id=SITE, title="Existing",
              client_name="C", status="active").insert()

    # A record written before the counter existed, as legacy data would be.
    year = __import__("datetime").datetime.now().year
    await WorkPackage(
        work_package_id=f"WP-{year}-0042", site_id=SITE, job_id="JOB-X",
        work_type_code="CODE_INSP", title="Legacy package",
    ).insert()

    nxt = await WorkPackageService.create(
        {"job_id": "JOB-X", "work_type_code": "CODE_INSP", "title": "New package"},
        SITE, USER,
    )
    assert nxt.work_package_id == f"WP-{year}-0043", (
        f"numbering restarted at {nxt.work_package_id} instead of continuing "
        "from the existing 0042"
    )


@pytest.mark.asyncio
async def test_identifier_format_is_unchanged(db):
    """IDs are printed on documents clients keep. The allocation change must
    not alter how they look."""
    year = __import__("datetime").datetime.now().year
    wp = await next_identifier(WorkPackage, "work_package_id", SITE, "WP", kind="wp")
    assert wp == f"WP-{year}-0001"

    emp = await next_identifier(
        Person, "person_id", SITE, "EMP", year_scoped=False, width=5, kind="person"
    )
    assert emp == "EMP-00001", "person IDs are not year-scoped and are 5 wide"


@pytest.mark.asyncio
async def test_a_malformed_existing_identifier_does_not_stall_allocation(db):
    """Legacy data contains surprises. Allocation has to keep moving."""
    await Job(job_id="JOB-Y", site_id=SITE, title="Existing",
              client_name="C", status="active").insert()
    year = __import__("datetime").datetime.now().year
    await WorkPackage(
        work_package_id=f"WP-{year}-NOTANUMBER", site_id=SITE, job_id="JOB-Y",
        work_type_code="CODE_INSP", title="Malformed",
    ).insert()

    allocated = await next_identifier(
        WorkPackage, "work_package_id", SITE, "WP", kind="wp_malformed"
    )
    assert allocated.startswith(f"WP-{year}-")
    assert allocated != f"WP-{year}-NOTANUMBER"
