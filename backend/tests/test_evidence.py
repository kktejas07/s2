"""Inspection evidence.

Every report format declares a photographs section and the work type catalogue
sets requires_photos, but nothing linked an uploaded file to a work package, so
reports rendered with empty grids.

The storage rules here are tested because the path they replaced had none: the
old upload service joined a caller-supplied section_id straight onto a
filesystem path, accepted any file of any size, and recorded nothing.
"""
import hashlib
import io
import sys
from datetime import datetime
from pathlib import Path

import pytest
import pytest_asyncio
from beanie import init_beanie
from fastapi import HTTPException, UploadFile
from mongomock_motor import AsyncMongoMockClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.audit import AuditEntry, history  # noqa: E402
from core.sequences import Sequence  # noqa: E402
from modules.evidence.models import Evidence  # noqa: E402
from modules.evidence import service as evidence_service  # noqa: E402
from modules.evidence.service import EvidenceService  # noqa: E402

SITE = "SITE-01"
USER = "USR-FIELD"

PNG = b"\x89PNG\r\n\x1a\n" + b"pretend image bytes" * 20


def upload(name="weld.png", content=PNG, content_type="image/png") -> UploadFile:
    return UploadFile(filename=name, file=io.BytesIO(content),
                      headers={"content-type": content_type})


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
    # Every test writes into its own temporary uploads root.
    monkeypatch.setattr(evidence_service, "UPLOAD_ROOT", tmp_path.resolve())
    _patch_mongomock()
    client = AsyncMongoMockClient()
    await init_beanie(
        database=client["evidence_test"],
        document_models=[Evidence, AuditEntry, Sequence],
    )
    yield tmp_path


# ------------------------------------------------------------- attaching

@pytest.mark.asyncio
async def test_a_photo_attaches_to_a_work_package(db):
    item = await EvidenceService.attach(
        upload(), "work_package", "WP-2026-0001",
        caption="Root pass, weld 12", captured_by_person_id="EMP-00001",
        job_id="JOB-2026-0001", site_id=SITE, user_id=USER,
    )
    assert item.evidence_id.startswith("EV-")
    assert item.entity_id == "WP-2026-0001"
    assert item.sha256 == hashlib.sha256(PNG).hexdigest()
    assert item.size_bytes == len(PNG)
    assert (db / item.stored_path).is_file()


@pytest.mark.asyncio
async def test_attaching_is_recorded_in_the_audit_trail(db):
    item = await EvidenceService.attach(
        upload(), "work_package", "WP-2026-0002", site_id=SITE, user_id=USER
    )
    entries = await history("work_package", "WP-2026-0002", SITE)
    assert len(entries) == 1
    assert entries[0].context["evidence_id"] == item.evidence_id
    assert entries[0].context["sha256"] == item.sha256
    assert entries[0].actor_user_id == USER


# --------------------------------------------------------- storage rules

@pytest.mark.asyncio
async def test_a_traversing_identifier_cannot_escape_the_uploads_root(db):
    """The defect in the path this replaces: section_id went straight onto the
    filesystem path, so '../../etc' wrote outside the uploads directory."""
    for nasty in ("../../etc", "..", "../sibling", "a/b", "with space", ""):
        with pytest.raises(HTTPException) as exc:
            await EvidenceService.attach(
                upload(), "work_package", nasty, site_id=SITE, user_id=USER
            )
        assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_nothing_is_written_outside_the_root(db, tmp_path):
    await EvidenceService.attach(
        upload(), "work_package", "WP-1", site_id=SITE, user_id=USER
    )
    written = [p for p in tmp_path.rglob("*") if p.is_file()]
    assert written, "nothing was written at all"
    for p in written:
        assert tmp_path.resolve() in p.resolve().parents


@pytest.mark.asyncio
async def test_only_allowlisted_content_types_are_accepted(db):
    with pytest.raises(HTTPException) as exc:
        await EvidenceService.attach(
            upload("payload.exe", b"MZ...", "application/x-msdownload"),
            "work_package", "WP-1", site_id=SITE, user_id=USER,
        )
    assert exc.value.status_code == 415


@pytest.mark.asyncio
async def test_the_extension_comes_from_the_content_type_not_the_filename(db):
    """A file called photo.jpg.exe is stored as .png when it declares itself a
    PNG, so nothing downstream is tricked by the name."""
    item = await EvidenceService.attach(
        upload("photo.jpg.exe", PNG, "image/png"),
        "work_package", "WP-1", site_id=SITE, user_id=USER,
    )
    assert item.stored_path.endswith(".png")
    assert item.filename == "photo.jpg.exe", "the original name is still recorded"


@pytest.mark.asyncio
async def test_an_empty_file_is_refused(db):
    with pytest.raises(HTTPException) as exc:
        await EvidenceService.attach(
            upload("empty.png", b"", "image/png"), "work_package", "WP-1",
            site_id=SITE, user_id=USER,
        )
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_an_oversized_file_is_refused(db, monkeypatch):
    monkeypatch.setattr(evidence_service, "MAX_BYTES", 100)
    with pytest.raises(HTTPException) as exc:
        await EvidenceService.attach(
            upload("big.png", b"x" * 500, "image/png"), "work_package", "WP-1",
            site_id=SITE, user_id=USER,
        )
    assert exc.value.status_code == 413


@pytest.mark.asyncio
async def test_an_unknown_entity_type_is_refused(db):
    with pytest.raises(HTTPException) as exc:
        await EvidenceService.attach(
            upload(), "random_thing", "X-1", site_id=SITE, user_id=USER
        )
    assert exc.value.status_code == 400


# ---------------------------------------------------------- integrity

@pytest.mark.asyncio
async def test_integrity_check_passes_for_an_untouched_file(db):
    item = await EvidenceService.attach(
        upload(), "work_package", "WP-1", site_id=SITE, user_id=USER
    )
    result = await EvidenceService.verify_integrity(item.evidence_id, SITE)
    assert result["intact"] is True


@pytest.mark.asyncio
async def test_integrity_check_catches_a_substituted_file(db):
    """The point of storing a hash: showing this is the photo taken on the day,
    not a later substitution."""
    item = await EvidenceService.attach(
        upload(), "work_package", "WP-1", site_id=SITE, user_id=USER
    )
    (db / item.stored_path).write_bytes(b"a different image entirely")

    result = await EvidenceService.verify_integrity(item.evidence_id, SITE)
    assert result["intact"] is False
    assert result["recorded_sha256"] != result["actual_sha256"]


@pytest.mark.asyncio
async def test_integrity_check_reports_a_missing_file(db):
    item = await EvidenceService.attach(
        upload(), "work_package", "WP-1", site_id=SITE, user_id=USER
    )
    (db / item.stored_path).unlink()
    result = await EvidenceService.verify_integrity(item.evidence_id, SITE)
    assert result["intact"] is False
    assert "missing" in result["reason"]


# ---------------------------------------------------------- withdrawal

@pytest.mark.asyncio
async def test_evidence_is_withdrawn_not_deleted(db):
    """Deleting the photograph that contradicted a conclusion is what an
    assessor looks for, so the record stays."""
    item = await EvidenceService.attach(
        upload(), "work_package", "WP-1", site_id=SITE, user_id=USER
    )
    await EvidenceService.withdraw(item.evidence_id, "Captured on the wrong joint", SITE, USER)

    still_there = await EvidenceService.get(item.evidence_id, SITE)
    assert still_there.status == "WITHDRAWN"
    assert still_there.withdrawn_reason == "Captured on the wrong joint"
    assert (db / item.stored_path).is_file(), "the file itself is kept too"


@pytest.mark.asyncio
async def test_withdrawn_evidence_leaves_the_default_listing(db):
    a = await EvidenceService.attach(upload("a.png"), "work_package", "WP-1",
                                     site_id=SITE, user_id=USER)
    await EvidenceService.attach(upload("b.png"), "work_package", "WP-1",
                                 site_id=SITE, user_id=USER)
    await EvidenceService.withdraw(a.evidence_id, "superseded", SITE, USER)

    active = await EvidenceService.list_for("work_package", "WP-1", SITE)
    assert active["total"] == 1
    everything = await EvidenceService.list_for("work_package", "WP-1", SITE,
                                                include_withdrawn=True)
    assert everything["total"] == 2


@pytest.mark.asyncio
async def test_withdrawing_needs_a_reason(db):
    item = await EvidenceService.attach(upload(), "work_package", "WP-1",
                                        site_id=SITE, user_id=USER)
    with pytest.raises(HTTPException) as exc:
        await EvidenceService.withdraw(item.evidence_id, "   ", SITE, USER)
    assert exc.value.status_code == 400


# ------------------------------------------------------- report feeding

@pytest.mark.asyncio
async def test_photos_reach_the_report_in_capture_order(db):
    for n in ("first.png", "second.png", "third.png"):
        await EvidenceService.attach(upload(n), "job", "JOB-1", caption=n,
                                     site_id=SITE, user_id=USER)
    photos = await EvidenceService.photos_for_report("job", "JOB-1", SITE)
    assert [p["caption"] for p in photos] == ["first.png", "second.png", "third.png"]
    assert all(Path(p["url"]).is_file() for p in photos)


@pytest.mark.asyncio
async def test_withdrawn_photos_do_not_reach_the_report(db):
    item = await EvidenceService.attach(upload(), "job", "JOB-1", site_id=SITE, user_id=USER)
    await EvidenceService.withdraw(item.evidence_id, "wrong site", SITE, USER)
    assert await EvidenceService.photos_for_report("job", "JOB-1", SITE) == []


@pytest.mark.asyncio
async def test_only_photographs_reach_the_photo_grid(db):
    await EvidenceService.attach(upload("mtc.pdf", b"%PDF-1.4 fake", "application/pdf"),
                                 "job", "JOB-1", kind="DOCUMENT", site_id=SITE, user_id=USER)
    await EvidenceService.attach(upload("site.png"), "job", "JOB-1",
                                 kind="PHOTO", site_id=SITE, user_id=USER)
    photos = await EvidenceService.photos_for_report("job", "JOB-1", SITE)
    assert len(photos) == 1
    assert photos[0]["caption"] == "site.png"
