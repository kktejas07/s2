from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import Field

class Document(Document):
    document_id: str; site_id: str; category: Optional[str] = None
    name: str; number: Optional[str] = None; issue_no: Optional[str] = None
    issue_date: Optional[datetime] = None; revision_no: Optional[str] = None
    revision_date: Optional[datetime] = None; responsibility: Optional[str] = None
    retention_period: Optional[str] = None; is_active: bool = True
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now); updated_at: datetime = Field(default_factory=datetime.now)
    class Settings: name = "documents"
