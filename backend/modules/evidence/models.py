"""Evidence: the files that back an inspection.

Every report format declares a `photographs` section and the work type
catalogue sets `requires_photos`, but nothing linked an uploaded file to a work
package or a certification - so reports rendered with empty photo grids and the
field workflow had nowhere to put what it captured.

An inspection body's evidence has requirements beyond "a file was uploaded":

* It must be attributable - who captured it, when, at which stage of the work.
* It must be tamper-evident. A SHA-256 of the content is stored so a file can
  be shown to be the one that was captured, not a later substitution. This is
  not DRM; it is the difference between "here is a photo" and "here is the
  photo that was taken on the day".
* It must be removable without being erased. Evidence is withdrawn with a
  reason and stays in the record, because deleting the photo that contradicted
  a conclusion is exactly what an assessor is looking for.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import Field


class EvidenceKind(str, Enum):
    PHOTO = "PHOTO"                  # site or material photograph
    DOCUMENT = "DOCUMENT"            # MTC, drawing, test certificate
    MEASUREMENT = "MEASUREMENT"      # joint measurement sheet, survey data
    SIGNATURE = "SIGNATURE"          # a signed acceptance
    VIDEO = "VIDEO"
    OTHER = "OTHER"


class EvidenceStatus(str, Enum):
    ACTIVE = "ACTIVE"
    WITHDRAWN = "WITHDRAWN"          # superseded or captured in error


class Evidence(Document):
    evidence_id: str
    site_id: str = "SITE-01"

    #: What this evidence belongs to. Mirrors the audit trail's addressing, so
    #: one model serves work packages, certifications and visits rather than
    #: three near-identical ones.
    entity_type: str                 # work_package | certification | visit | job
    entity_id: str
    job_id: Optional[str] = None     # denormalised so a job's evidence is one query

    kind: str = EvidenceKind.PHOTO.value
    #: Which declared report section this belongs under, so the renderer can
    #: place it without the capturer having to know the template.
    section: Optional[str] = None

    filename: str
    stored_path: str                 # relative to the uploads root
    content_type: str
    size_bytes: int
    sha256: str                      # integrity, not security

    caption: Optional[str] = None
    captured_at: Optional[datetime] = None     # when the photo was taken
    captured_by_person_id: Optional[str] = None
    location: Optional[str] = None

    status: str = EvidenceStatus.ACTIVE.value
    withdrawn_reason: Optional[str] = None
    withdrawn_by: Optional[str] = None
    withdrawn_at: Optional[datetime] = None

    # ---- offline capture --------------------------------------------------
    # Evidence from a site is captured on a phone with no signal and uploaded
    # hours later, so three things that were implicit have to become explicit.

    #: The capturing device's own key for this item, unique per device. A
    #: retry after an ambiguous failure - the request arrived, the reply did
    #: not - presents the same key and gets the same record back instead of
    #: creating a second one. Without it an inspector in a tunnel produces
    #: duplicates every time the queue retries.
    client_capture_id: Optional[str] = None

    #: The hash the device computed at the moment of capture, before the file
    #: ever left the phone. `sha256` above is computed on receipt and proves
    #: only that the bytes have not changed since the server got them; for
    #: evidence that sat in an outbox overnight that is the wrong claim. When
    #: both are present and equal, the chain reaches back to the capture.
    capture_sha256: Optional[str] = None
    #: Whether they matched. Stored rather than recomputed because the answer
    #: is about a moment, not about the file as it is now.
    capture_verified: Optional[bool] = None

    captured_latitude: Optional[float] = None
    captured_longitude: Optional[float] = None
    #: Metres. A reading with no accuracy figure is not a location, and a
    #: 2km-accurate fix should not look like a site coordinate.
    captured_accuracy_m: Optional[float] = None
    captured_device: Optional[str] = None
    #: When the queued item actually reached the server, which is not when it
    #: was captured. The gap is the thing an assessor asks about.
    uploaded_at: Optional[datetime] = None

    uploaded_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "evidence"
        indexes = [
            "site_id", "entity_type", "entity_id", "job_id", "status",
            "evidence_id", "client_capture_id",
        ]
