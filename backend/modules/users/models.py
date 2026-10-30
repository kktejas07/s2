from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import Field


class Competency(Document):
    competency_id: str
    user_id: str
    site_id: str
    materials: bool = False; welding: bool = False; nde: bool = False
    line_pipe_inspection: bool = False; fabricated_piping: bool = False
    valves_actuators: bool = False; fittings: bool = False; gaskets: bool = False
    coatings_painting: bool = False; steel_structures_fabrication: bool = False
    pressure_vessels: bool = False; heat_exchangers: bool = False
    boilers: bool = False; tanks: bool = False; skid_packages: bool = False
    rotating_equipment_pumps: bool = False; rotating_equipment_compressors: bool = False
    rotating_equipment_turbines: bool = False; rotating_equipment_gears: bool = False
    hvac: bool = False; lifting_equipment: bool = False
    generators: bool = False; motors: bool = False
    switchboards_pmccs_mccs: bool = False; transformers: bool = False
    switchgears_switchyard_substation: bool = False; cables_conductors: bool = False
    ac_dc_drives: bool = False; battery_chargers_ups: bool = False
    battery_cells_banks: bool = False; capacitors: bool = False
    ex_equipment: bool = False; dg_sets: bool = False; solar_pv_modules: bool = False
    control_systems: bool = False; field_instruments: bool = False
    dcs_plc_scada: bool = False; onshore: bool = False; offshore: bool = False
    civil_infrastructure: bool = False; others: bool = False
    others_text: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    class Settings: name = "competencies"


class InspectorRate(Document):
    rate_id: str; user_id: str; site_id: str
    discipline: Optional[str] = None; currency: str = "INR"
    inspection_fee_per_hour: float = 0.0; inspection_fee_per_day: float = 0.0
    travel_charges_per_hour: float = 0.0; travel_charges_lumsum: float = 0.0
    mileage_per_km: float = 0.0; mileage_beyond_50km: float = 0.0
    other_charges: float = 0.0; is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)
    class Settings: name = "inspector_rates"


class Associate(Document):
    associate_id: str; site_id: str; name: str
    contact_person: Optional[str] = None; contact_number: Optional[str] = None
    email: Optional[str] = None; currency: str = "INR"
    mileage_per_km: float = 0.0; cost: float = 0.0
    bank_account: Optional[str] = None; ifsc_code: Optional[str] = None
    pan: Optional[str] = None; aadhar: Optional[str] = None
    is_active: bool = True; created_at: datetime = Field(default_factory=datetime.now)
    class Settings: name = "associates"
