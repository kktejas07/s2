from __future__ import annotations
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from beanie import Document
from pydantic import BaseModel, Field


class TpiPhoto(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slot: int = 1
    url: str
    caption: str = ""


class TpiSignature(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    party: str  # SUPPLIER or IQE
    name: str
    designation: str
    signed_at: datetime = Field(default_factory=datetime.utcnow)
    signature_image_url: Optional[str] = None
    stamp_image_url: Optional[str] = None


class TpiReport(Document):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    form_code: str  # TP02, TP03, TP04, TP05
    report_no: str  # IQE-<FORM>-<YYYY>-<####>
    revision: str = "00"
    status: str = "DRAFT"  # DRAFT, SUBMITTED, SIGNED, ISSUED, SUPERSEDED
    project_id: Optional[str] = None
    customer: Optional[str] = None
    supplier: Optional[str] = None
    po_no: Optional[str] = None
    created_by: Optional[str] = "TPI Lead Inspector"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    issued_at: Optional[datetime] = None
    data: Dict[str, Any] = Field(default_factory=dict)
    pdf_url: Optional[str] = None
    photos: List[TpiPhoto] = Field(default_factory=list)
    signatures: List[TpiSignature] = Field(default_factory=list)

    class Settings:
        name = "tpi_reports"
