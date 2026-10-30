from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import Field


class ManufacturerUnit(Document):
    manufacturer_unit_id: str
    manufacturer_id: str
    site_id: str
    name: str
    unit_type: Optional[str] = "Forging & Casting Shop"
    region: Optional[str] = "Western Region"
    location: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    phone: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    custom_category: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "manufacturer_units"


class Manufacturer(Document):
    manufacturer_id: str
    site_id: str
    name: str
    code: Optional[str] = None
    equipment_category: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[str] = None
    contact_person: Optional[str] = None
    gst: Optional[str] = None
    sgst: float = 0.0
    cgst: float = 0.0
    igst: float = 0.0
    is_sez: bool = False
    is_overseas: bool = False
    total_units: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "manufacturers"
        indexes = ["site_id", "is_active", "created_at", "manufacturer_id"]
