"""Evidence captured offline and uploaded later.

An inspector on a site has no signal. Evidence sits in a queue on the phone
and reaches the server hours later, possibly after several failed attempts.
Two things that were implicit have to become explicit for that to be safe:

* **Retries must not duplicate.** The dangerous failure is the ambiguous one -
  the request arrived, the reply did not - because the queue cannot tell it
  from a real failure and will try again. Without an idempotency key, one
  photograph becomes four over a bad afternoon.
* **The hash must reach back to the capture.** Hashing on receipt proves the
  bytes have not changed since the server got them, which for a file that sat
  in an outbox overnight is the wrong claim.
"""
import hashlib
import io
import sys
from datetime import datetime, timedelta
from pathlib import Path

import pytest
import pytest_asyncio
from beanie import init_beanie
from fastapi import UploadFile
from mongomock_motor import AsyncMongoMockClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.audit import AuditEntry  # noqa: E402
from core.sequences import Sequence  # noqa: E402
from modules.evidence.models import Evidence  # noqa: E402
from modules.evidence.service import EvidenceService  # noqa: E402

SITE = "SITE-01"
USER = "EMP-INSP"

#: A real JPEG header, so the content-type allowlist is exercised rather than
#: bypassed with an invented type.
JPEG = bytes.fromhex("ffd8ffe000104a46494600010101006000600000") + b"site photo" * 40


def _upload(data: bytes = JPEG, name: str = "slab.jpg") -> UploadFile:
    return UploadFile(
        filename=name,
        file=io.BytesIO(data),
        headers={"content-type": "image/jpeg"},
    )


def _patch_mongomock():
    from mongomock_motor import AsyncMongoMockDatabase

    original = AsyncMongoMockDatabase.list_collection_names

    async def patched(self, *args, **kwargs):
        kwargs.pop("authorizedCollections", None)
        kwargs.pop("nameOnly", None)
        return await original(self, *args, **kwargs)

    AsyncMongoMockDatabase.list_collection_names = patched


@pytest_asyncio.fixture
async def db(tmp_path, monkeypatch):
    _patch_mongomock()
    # Keep uploads inside the test's own directory rather than the repo's.
    monkeypatch.setattr("modules.evidence.service.UPLOAD_ROOT", tmp_path)
    client = AsyncMongoMockClient()
    await init_beanie(
        database=client["offline_test"],
        document_models=[Evidence, AuditEntry, Sequence],
    )
    yield client


# ----------------------------------------------------------- idempotency

@pytest.mark.asyncio
async def test_a_retried_upload_does_not_duplicate(db):
    """The ambiguous failure: the request arrived, the reply did not. The
    queue cannot tell that from a real failure, so it retries."""
    key = "cap-9f2c41ab-0001"
    first = await EvidenceService.attach(
        _upload(), "work_package", "WP-2026-0007",
        caption="Block B slab, east face",
        client_capture_id=key, site_id=SITE, user_id=USER,
    )
    second = await EvidenceService.attach(
        _upload(), "work_package", "WP-2026-0007",
        caption="Block B slab, east face",
        client_capture_id=key, site_id=SITE, user_id=USER,
    )
    assert second.evidence_id == first.evidence_id
    assert await Evidence.find(Evidence.site_id == SITE).count() == 1


@pytest.mark.asyncio
async def test_a_queue_draining_four_times_still_leaves_one_record(db):
    key = "cap-3a71de0b-0002"
    ids = set()
    for _ in range(4):
        item = await EvidenceService.attach(
            _upload(), "work_package", "WP-2026-0007",
            client_capture_id=key, site_id=SITE, user_id=USER,
        )
        ids.add(item.evidence_id)
    assert len(ids) == 1
    assert await Evidence.find(Evidence.site_id == SITE).count() == 1


@pytest.mark.asyncio
async def test_different_captures_are_not_collapsed(db):
    """Two photographs of the same thing, seconds apart, are two pieces of
    evidence. Only the key makes them the same."""
    for n in (1, 2):
        await EvidenceService.attach(
            _upload(), "work_package", "WP-2026-0007",
            client_capture_id=f"cap-{n:04d}", site_id=SITE, user_id=USER,
        )
    assert await Evidence.find(Evidence.site_id == SITE).count() == 2


@pytest.mark.asyncio
async def test_uploads_without_a_key_are_unaffected(db):
    """A browser upload has no outbox and no key; it must keep working."""
    for _ in range(2):
        await EvidenceService.attach(
            _upload(), "work_package", "WP-2026-0007", site_id=SITE, user_id=USER,
        )
    assert await Evidence.find(Evidence.site_id == SITE).count() == 2


@pytest.mark.asyncio
async def test_the_key_is_scoped_to_the_site(db):
    """Two devices at two sites could generate the same key; a collision
    across sites must not silently discard one site's evidence."""
    key = "cap-collision"
    await EvidenceService.attach(
        _upload(), "work_package", "WP-A", client_capture_id=key,
        site_id="SITE-01", user_id=USER,
    )
    await EvidenceService.attach(
        _upload(), "work_package", "WP-B", client_capture_id=key,
        site_id="SITE-02", user_id=USER,
    )
    # Not on evidence_id: identifiers are allocated per site, so both sites
    # legitimately hold EV-2026-00001. What matters is that two records exist
    # rather than the second site's capture being swallowed as a duplicate.
    assert await Evidence.find(Evidence.site_id == "SITE-01").count() == 1
    assert await Evidence.find(Evidence.site_id == "SITE-02").count() == 1


# ------------------------------------------------- capture-time integrity

@pytest.mark.asyncio
async def test_a_matching_capture_hash_is_recorded_as_verified(db):
    """The chain reaches back to the moment of capture rather than to the
    moment the server happened to receive the bytes."""
    digest = hashlib.sha256(JPEG).hexdigest()
    item = await EvidenceService.attach(
        _upload(), "work_package", "WP-2026-0007",
        client_capture_id="cap-verified", capture_sha256=digest,
        site_id=SITE, user_id=USER,
    )
    assert item.capture_verified is True
    assert item.capture_sha256 == digest
    assert item.sha256 == digest


@pytest.mark.asyncio
async def test_a_mismatched_capture_hash_is_recorded_as_unverified(db):
    """Not refused. The file is still evidence of something, and an inspector
    whose upload is rejected at the end of a long day will find another way to
    submit it. It is recorded as unverified so a reviewer can see the gap."""
    item = await EvidenceService.attach(
        _upload(), "work_package", "WP-2026-0007",
        client_capture_id="cap-mismatch",
        capture_sha256="0" * 64,
        site_id=SITE, user_id=USER,
    )
    assert item.capture_verified is False
    assert item.sha256 != item.capture_sha256


@pytest.mark.asyncio
async def test_no_capture_hash_leaves_the_question_open(db):
    """None, not False. A browser upload never claimed a capture hash, and
    recording that as a failed verification would be a lie about it."""
    item = await EvidenceService.attach(
        _upload(), "work_package", "WP-2026-0007", site_id=SITE, user_id=USER,
    )
    assert item.capture_verified is None


@pytest.mark.asyncio
async def test_hash_comparison_ignores_case(db):
    """Platforms differ on hex case and an inspector should not lose a
    verification to that."""
    digest = hashlib.sha256(JPEG).hexdigest().upper()
    item = await EvidenceService.attach(
        _upload(), "work_package", "WP-2026-0007",
        capture_sha256=digest, site_id=SITE, user_id=USER,
    )
    assert item.capture_verified is True


# ------------------------------------------------------- what it records

@pytest.mark.asyncio
async def test_capture_and_upload_times_are_both_kept(db):
    """The gap between them is the thing an assessor asks about."""
    captured = datetime.now() - timedelta(hours=9)
    item = await EvidenceService.attach(
        _upload(), "work_package", "WP-2026-0007",
        captured_at=captured, client_capture_id="cap-times",
        site_id=SITE, user_id=USER,
    )
    assert item.captured_at == captured
    assert item.uploaded_at is not None
    assert item.uploaded_at > item.captured_at


@pytest.mark.asyncio
async def test_a_location_is_kept_with_its_accuracy(db):
    """A reading with no accuracy figure is not a location: a 2km-accurate
    fix should not be readable as a site coordinate."""
    item = await EvidenceService.attach(
        _upload(), "work_package", "WP-2026-0007",
        captured_latitude=17.2473, captured_longitude=80.1514,
        captured_accuracy_m=8.0, captured_device="Pixel 7a / Android 15",
        site_id=SITE, user_id=USER,
    )
    assert item.captured_latitude == pytest.approx(17.2473)
    assert item.captured_accuracy_m == 8.0
    assert item.captured_device == "Pixel 7a / Android 15"


@pytest.mark.asyncio
async def test_the_duplicate_check_runs_before_the_file_is_stored(db, tmp_path):
    """A retry must not leave an orphaned file behind each time. If the check
    ran after the write, four retries would leave four files and one record."""
    key = "cap-no-orphans"
    for _ in range(3):
        await EvidenceService.attach(
            _upload(), "work_package", "WP-2026-0007",
            client_capture_id=key, site_id=SITE, user_id=USER,
        )
    stored = list(tmp_path.rglob("*.jpg"))
    assert len(stored) == 1, f"{len(stored)} files left on disk for one record"
