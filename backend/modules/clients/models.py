from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field


class ClientUnit(Document):
    client_unit_id: str
    client_id: str
    site_id: str
    name: str
    unit_type: Optional[str] = "Fabrication Yard"
    region: Optional[str] = "Western Region"
    location: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    phone: Optional[str] = None
    contact_person: Optional[str] = None
    gst: Optional[str] = None
    sgst: float = 0.0
    cgst: float = 0.0
    igst: float = 0.0
    is_sez: bool = False
    is_overseas: bool = False
    custom_category: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "client_units"


class Client(Document):
    client_id: str
    site_id: str
    name: str
    code: Optional[str] = None
    industry_type: Optional[str] = None
    annual_revenue: Optional[float] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    total_units: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "clients"
        indexes = ["site_id", "is_active", "created_at", "client_id"]
