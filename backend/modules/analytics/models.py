from __future__ import annotations
from typing import Optional, Dict, Any
from datetime import datetime
from beanie import Document
from pydantic import BaseModel, Field


class AnalyticsEvent(Document):
    event_id: str
    event_type: str  # e.g., "button_click", "page_view", "legacy_job_migrated", "invoice_issued", "tpi_billing_edit"
    element_id: Optional[str] = None
    element_key: Optional[str] = None
    element_name: Optional[str] = None
    category: Optional[str] = "general"
    page_route: Optional[str] = None
    user_id: Optional[str] = "anonymous"
    user_role: Optional[str] = "guest"
    site_id: Optional[str] = "SITE-01"
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "analytics_events"


class EventTrackPayload(BaseModel):
    event_type: str
    element_id: Optional[str] = None
    element_key: Optional[str] = None
    element_name: Optional[str] = None
    category: Optional[str] = "general"
    page_route: Optional[str] = None
    user_id: Optional[str] = "anonymous"
    user_role: Optional[str] = "guest"
    site_id: Optional[str] = "SITE-01"
    metadata: Dict[str, Any] = Field(default_factory=dict)
