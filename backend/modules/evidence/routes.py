from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import FileResponse

from core.auth import get_current_user
from modules.evidence.service import EvidenceService, _resolve_within_root
from pathlib import Path

router = APIRouter(prefix="/evidence", tags=["Evidence"])


@router.post("/{entity_type}/{entity_id}")
async def attach_evidence(
    entity_type: str,
    entity_id: str,
    file: UploadFile = File(...),
    kind: str = Form("PHOTO"),
    section: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
    captured_by_person_id: Optional[str] = Form(None),
    captured_at: Optional[datetime] = Form(None),
    location: Optional[str] = Form(None),
    job_id: Optional[str] = Form(None),
    # Offline capture. A phone on a site has no signal, so these describe the
    # moment of capture rather than the moment of upload.
    client_capture_id: Optional[str] = Form(None),
    capture_sha256: Optional[str] = Form(None),
    captured_latitude: Optional[float] = Form(None),
    captured_longitude: Optional[float] = Form(None),
    captured_accuracy_m: Optional[float] = Form(None),
    captured_device: Optional[str] = Form(None),
    user: dict = Depends(get_current_user),
):
    """Attach a photograph, certificate or measurement sheet to a record.

    Safe to retry: an upload carrying a `client_capture_id` the server has
    already stored returns that record rather than creating a second one, so
    a queue draining after a bad connection cannot duplicate evidence.
    """
    item = await EvidenceService.attach(
        file, entity_type, entity_id,
        kind=kind, section=section, caption=caption,
        captured_by_person_id=captured_by_person_id, captured_at=captured_at,
        location=location, job_id=job_id,
        client_capture_id=client_capture_id,
        capture_sha256=capture_sha256,
        captured_latitude=captured_latitude,
        captured_longitude=captured_longitude,
        captured_accuracy_m=captured_accuracy_m,
        captured_device=captured_device,
        site_id=user.get("site_id", "SITE-01"),
        user_id=user.get("user_id", "USR-001"),
    )
    return item.model_dump(exclude={"id"})


@router.get("/{entity_type}/{entity_id}")
async def list_evidence(
    entity_type: str,
    entity_id: str,
    include_withdrawn: bool = False,
    user: dict = Depends(get_current_user),
):
    return await EvidenceService.list_for(
        entity_type, entity_id, user.get("site_id", "SITE-01"), include_withdrawn
    )


@router.get("/job/{job_id}")
async def job_evidence(job_id: str, user: dict = Depends(get_current_user)):
    return await EvidenceService.for_job(job_id, user.get("site_id", "SITE-01"))


@router.get("/item/{evidence_id}/file")
async def download_evidence(evidence_id: str, user: dict = Depends(get_current_user)):
    item = await EvidenceService.get(evidence_id, user.get("site_id", "SITE-01"))
    path = _resolve_within_root(*Path(item.stored_path).parts)
    return FileResponse(path, media_type=item.content_type, filename=item.filename)


@router.get("/item/{evidence_id}/verify")
async def verify_evidence(evidence_id: str, user: dict = Depends(get_current_user)):
    """Re-hash the stored file: is this the file that was captured?"""
    return await EvidenceService.verify_integrity(evidence_id, user.get("site_id", "SITE-01"))


@router.patch("/item/{evidence_id}/withdraw")
async def withdraw_evidence(
    evidence_id: str,
    reason: str,
    user: dict = Depends(get_current_user),
):
    """Withdraw evidence with a reason. It stays in the record."""
    item = await EvidenceService.withdraw(
        evidence_id, reason, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001")
    )
    return item.model_dump(exclude={"id"})
