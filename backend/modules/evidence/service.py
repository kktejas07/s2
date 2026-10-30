"""Storing and serving inspection evidence.

The storage rules here exist because the previous upload path had none: it
joined a caller-supplied `section_id` straight onto a filesystem path, so
`section_id=../../etc` wrote outside the uploads directory, and it accepted any
file of any size and recorded nothing in the database.
"""
from __future__ import annotations

import hashlib
import os
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile

from core.audit import AuditAction, record as audit
from core.sequences import next_identifier
from modules.evidence.models import Evidence, EvidenceKind, EvidenceStatus

#: Everything is written beneath this, and nothing is allowed to escape it.
UPLOAD_ROOT = Path(os.environ.get("IQE_UPLOAD_ROOT", "uploads")).resolve()

MAX_BYTES = int(os.environ.get("IQE_MAX_UPLOAD_BYTES", 25 * 1024 * 1024))

#: An allowlist, not a denylist. Evidence is photographs, scans and documents;
#: anything else arriving here is either a mistake or an attempt.
ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/heic": ".heic",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
    "video/mp4": ".mp4",
    "text/csv": ".csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
}

VALID_ENTITY_TYPES = {"work_package", "certification", "visit", "job"}
VALID_KINDS = {k.value for k in EvidenceKind}

_SAFE_SEGMENT = re.compile(r"^[A-Za-z0-9._-]+$")


def _safe_segment(value: str, label: str) -> str:
    """A path segment that cannot climb out of the uploads root."""
    cleaned = (value or "").strip()
    if not cleaned or not _SAFE_SEGMENT.match(cleaned) or cleaned in {".", ".."}:
        raise HTTPException(400, f"Invalid {label}: {value!r}")
    return cleaned


def _resolve_within_root(*segments: str) -> Path:
    """Build a path under UPLOAD_ROOT, refusing anything that escapes it.

    Belt and braces: the segments are already validated, and the resolved
    result is checked against the root as well, so a future change to the
    validation cannot silently reopen traversal.
    """
    candidate = UPLOAD_ROOT.joinpath(*segments).resolve()
    if candidate != UPLOAD_ROOT and UPLOAD_ROOT not in candidate.parents:
        raise HTTPException(400, "Resolved path escapes the uploads directory")
    return candidate


class EvidenceService:

    @staticmethod
    async def attach(
        file: UploadFile,
        entity_type: str,
        entity_id: str,
        *,
        kind: str = EvidenceKind.PHOTO.value,
        section: Optional[str] = None,
        caption: Optional[str] = None,
        captured_by_person_id: Optional[str] = None,
        captured_at: Optional[datetime] = None,
        location: Optional[str] = None,
        job_id: Optional[str] = None,
        client_capture_id: Optional[str] = None,
        capture_sha256: Optional[str] = None,
        captured_latitude: Optional[float] = None,
        captured_longitude: Optional[float] = None,
        captured_accuracy_m: Optional[float] = None,
        captured_device: Optional[str] = None,
        site_id: str = "SITE-01",
        user_id: str = "USR-001",
    ) -> Evidence:
        if entity_type not in VALID_ENTITY_TYPES:
            raise HTTPException(
                400, f"Invalid entity_type '{entity_type}'. Expected one of: "
                     f"{sorted(VALID_ENTITY_TYPES)}",
            )
        if kind not in VALID_KINDS:
            raise HTTPException(400, f"Invalid kind '{kind}'. Expected one of: {sorted(VALID_KINDS)}")
        if not file or not file.filename:
            raise HTTPException(400, "No file provided")

        # Idempotency first, before the file is read or anything is written.
        # A queued upload that timed out mid-flight retries with the same key;
        # returning the existing record is what stops one photograph becoming
        # four over a bad afternoon.
        if client_capture_id:
            existing = await Evidence.find_one(
                Evidence.client_capture_id == client_capture_id,
                Evidence.site_id == site_id,
            )
            if existing is not None:
                return existing

        content = await file.read()
        if not content:
            raise HTTPException(400, "File is empty")
        if len(content) > MAX_BYTES:
            raise HTTPException(
                413, f"File is {len(content) // 1024 // 1024}MB; the limit is "
                     f"{MAX_BYTES // 1024 // 1024}MB",
            )

        content_type = (file.content_type or "").split(";")[0].strip().lower()
        if content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                415, f"'{content_type or 'unknown'}' is not an accepted evidence type. "
                     f"Accepted: {sorted(ALLOWED_CONTENT_TYPES)}",
            )

        # The extension comes from the allowlist, not from the filename, so a
        # file called "photo.jpg.exe" is stored as .jpg and nothing downstream
        # is tricked by the name.
        extension = ALLOWED_CONTENT_TYPES[content_type]
        digest = hashlib.sha256(content).hexdigest()

        folder = _resolve_within_root(
            _safe_segment(site_id, "site_id"),
            _safe_segment(entity_type, "entity_type"),
            _safe_segment(entity_id, "entity_id"),
        )
        folder.mkdir(parents=True, exist_ok=True)
        stored_name = f"{uuid.uuid4().hex}{extension}"
        (folder / stored_name).write_bytes(content)

        evidence = Evidence(
            evidence_id=await next_identifier(
                Evidence, "evidence_id", site_id, "EV", kind="evidence", width=5
            ),
            site_id=site_id,
            entity_type=entity_type,
            entity_id=entity_id,
            job_id=job_id,
            kind=kind,
            section=section,
            filename=file.filename,
            stored_path=str((folder / stored_name).relative_to(UPLOAD_ROOT)),
            content_type=content_type,
            size_bytes=len(content),
            sha256=digest,
            client_capture_id=client_capture_id,
            capture_sha256=capture_sha256,
            # Compared here and the answer stored, because the question is
            # about a moment - did these bytes reach us as they left the
            # phone - not about the file as it stands now.
            capture_verified=(
                None if not capture_sha256
                else capture_sha256.lower() == digest.lower()
            ),
            captured_latitude=captured_latitude,
            captured_longitude=captured_longitude,
            captured_accuracy_m=captured_accuracy_m,
            captured_device=captured_device,
            uploaded_at=datetime.now(),
            caption=caption,
            captured_at=captured_at,
            captured_by_person_id=captured_by_person_id,
            location=location,
            uploaded_by=user_id,
        )
        await evidence.insert()

        await audit(
            entity_type, entity_id, AuditAction.CREATE,
            actor={"user_id": user_id},
            note=f"Evidence attached: {file.filename}",
            context={
                "evidence_id": evidence.evidence_id, "kind": kind,
                "sha256": digest, "size_bytes": len(content),
            },
            site_id=site_id,
        )
        return evidence

    @staticmethod
    async def list_for(
        entity_type: str,
        entity_id: str,
        site_id: str = "SITE-01",
        include_withdrawn: bool = False,
    ):
        query: dict = {
            "site_id": site_id, "entity_type": entity_type, "entity_id": entity_id,
        }
        if not include_withdrawn:
            query["status"] = EvidenceStatus.ACTIVE.value
        items = await Evidence.find(query).sort(Evidence.created_at).to_list()
        return {"total": len(items), "data": [i.model_dump(exclude={"id"}) for i in items]}

    @staticmethod
    async def for_job(job_id: str, site_id: str = "SITE-01"):
        items = await Evidence.find(
            Evidence.job_id == job_id,
            Evidence.site_id == site_id,
            Evidence.status == EvidenceStatus.ACTIVE.value,
        ).sort(Evidence.created_at).to_list()
        return {"total": len(items), "data": [i.model_dump(exclude={"id"}) for i in items]}

    @staticmethod
    async def get(evidence_id: str, site_id: str = "SITE-01") -> Evidence:
        item = await Evidence.find_one(
            Evidence.evidence_id == evidence_id, Evidence.site_id == site_id
        )
        if not item:
            raise HTTPException(404, f"Evidence '{evidence_id}' not found")
        return item

    @staticmethod
    async def verify_integrity(evidence_id: str, site_id: str = "SITE-01") -> dict:
        """Re-hash the stored file and compare. Answers "is this the file that
        was captured" - the question that makes a photograph evidence."""
        item = await EvidenceService.get(evidence_id, site_id)
        path = _resolve_within_root(*Path(item.stored_path).parts)
        if not path.is_file():
            return {"evidence_id": evidence_id, "intact": False, "reason": "file is missing"}
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        return {
            "evidence_id": evidence_id,
            "intact": actual == item.sha256,
            "recorded_sha256": item.sha256,
            "actual_sha256": actual,
        }

    @staticmethod
    async def withdraw(
        evidence_id: str,
        reason: str,
        site_id: str = "SITE-01",
        user_id: str = "USR-001",
    ) -> Evidence:
        """Withdraw, never delete.

        Removing the photograph that contradicted a conclusion is exactly what
        an assessor looks for, so the record stays and carries the reason it
        was set aside.
        """
        if not (reason or "").strip():
            raise HTTPException(400, "Withdrawing evidence needs a reason")
        item = await EvidenceService.get(evidence_id, site_id)
        if item.status == EvidenceStatus.WITHDRAWN.value:
            raise HTTPException(409, f"{evidence_id} is already withdrawn")

        item.status = EvidenceStatus.WITHDRAWN.value
        item.withdrawn_reason = reason.strip()
        item.withdrawn_by = user_id
        item.withdrawn_at = datetime.now()
        item.updated_at = datetime.now()
        await item.save()

        await audit(
            item.entity_type, item.entity_id, AuditAction.UPDATE,
            actor={"user_id": user_id},
            note=f"Evidence withdrawn: {reason.strip()}",
            context={"evidence_id": evidence_id},
            site_id=site_id,
        )
        return item

    @staticmethod
    async def photos_for_report(
        entity_type: str, entity_id: str, site_id: str = "SITE-01"
    ) -> list[dict]:
        """Shaped for the PDF renderer's photo grid, which expects url/caption."""
        items = await Evidence.find(
            Evidence.site_id == site_id,
            Evidence.entity_type == entity_type,
            Evidence.entity_id == entity_id,
            Evidence.kind == EvidenceKind.PHOTO.value,
            Evidence.status == EvidenceStatus.ACTIVE.value,
        ).sort(Evidence.created_at).to_list()

        return [
            {
                "url": str(_resolve_within_root(*Path(i.stored_path).parts)),
                "caption": i.caption or i.filename,
                "captured_at": i.captured_at,
            }
            for i in items
        ]
