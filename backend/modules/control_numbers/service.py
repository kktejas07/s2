from typing import Optional
from fastapi import HTTPException
from modules.control_numbers.models import ControlNumber, Reassignment
from modules.visits.models import Visit
from datetime import datetime


class ControlNumberService:

    @staticmethod
    async def list(
        site_id: str = "SITE-01", 
        search: str = "", 
        alpha: str = "", 
        is_active: Optional[bool] = None, 
        page: int = 1, 
        per_page: int = 100
    ):
        query = {"site_id": site_id}
        if is_active is not None:
            query["is_active"] = is_active

        if alpha and alpha.upper() != "ALL":
            query["$or"] = [
                {"client_name": {"$regex": f"^{alpha}", "$options": "i"}},
                {"manufacturer_name": {"$regex": f"^{alpha}", "$options": "i"}},
            ]

        if search:
            search_query = {
                "$or": [
                    {"control_number_id": {"$regex": search, "$options": "i"}},
                    {"control_number": {"$regex": search, "$options": "i"}},
                    {"enquiry_no": {"$regex": search, "$options": "i"}},
                    {"client_name": {"$regex": search, "$options": "i"}},
                    {"manufacturer_name": {"$regex": search, "$options": "i"}},
                    {"loi_no": {"$regex": search, "$options": "i"}},
                    {"so_number": {"$regex": search, "$options": "i"}},
                    {"work_scope": {"$regex": search, "$options": "i"}},
                    {"location": {"$regex": search, "$options": "i"}},
                ]
            }
            if "$or" in query:
                alpha_query = query.pop("$or")
                query["$and"] = [{"$or": alpha_query}, search_query]
            else:
                query.update(search_query)

        total = await ControlNumber.find(query).count()
        items = await ControlNumber.find(query).skip((page - 1) * per_page).limit(per_page).sort(-ControlNumber.created_at).to_list()

        # Auto-seed if empty so user always sees sample Control Numbers
        if not items and not search and not alpha and is_active is None:
            sample_cns = [
                ControlNumber(
                    control_number_id="CN-2026-001",
                    control_number="CN-2026-001",
                    site_id=site_id,
                    enquiry_no="ENQ-901",
                    enquiry_date=datetime(2026, 6, 1),
                    equipment_name="90 Degree Forged Pipe Elbows (DN150 PN40)",
                    client_id="C-001",
                    client_name="Reliance Industries Ltd",
                    client_unit_id="C-001-U01",
                    client_unit_name="Reliance - Unit 1 (Hazira Heavy Fabrication Yard)",
                    manufacturer_id="M-001",
                    manufacturer_name="BHEL Trichy Boilers",
                    manufacturer_unit_id="M-001-U01",
                    manufacturer_unit_name="BHEL - Works 1 (Heavy Forging & Casting Shop)",
                    loi_no="LOI/RIL/2026/102",
                    loi_date=datetime(2026, 6, 15),
                    so_number="SO-8891",
                    so_effective_date=datetime(2026, 7, 1),
                    so_due_date=datetime(2026, 12, 31),
                    so_type="Regular",
                    work_scope="Full TPI Stage Inspection, NDT Radiography, Dimensional Audit & Hydrotest Witnessing",
                    location="HAZ - Hazira Industrial Zone (WST - Western Region)",
                    contract_amount=4500000.0,
                    comments="Mandatory 48-hour prior visit call by TPI Inspector",
                    is_active=True,
                ),
                ControlNumber(
                    control_number_id="CN-2026-002",
                    control_number="CN-2026-002",
                    site_id=site_id,
                    enquiry_no="ENQ-904",
                    enquiry_date=datetime(2026, 6, 10),
                    equipment_name="High Pressure Seamless Heat Exchanger Tubes",
                    client_id="C-002",
                    client_name="L&T Heavy Engineering",
                    client_unit_id="C-002-U02",
                    client_unit_name="L&T - Unit 2 (Jamnagar Refinery Expansion Site)",
                    manufacturer_id="M-002",
                    manufacturer_name="Godrej Heavy Engineering",
                    manufacturer_unit_id="M-002-U02",
                    manufacturer_unit_name="Godrej - Works 2 (High Pressure Boiler & Vessel Shop)",
                    loi_no="LOI/LNT/2026/440",
                    loi_date=datetime(2026, 6, 20),
                    so_number="SO-8892",
                    so_effective_date=datetime(2026, 7, 10),
                    so_due_date=datetime(2026, 11, 30),
                    so_type="Man-Day",
                    work_scope="Eddy Current Testing, Positive Material Identification (PMI), & Mill Test Cert Audit",
                    location="JAM - Jamnagar Petrochemical Complex (WST - Western Region)",
                    contract_amount=2800000.0,
                    comments="Man-day rate basis: 8 hours per shift inspection call",
                    is_active=True,
                ),
                ControlNumber(
                    control_number_id="CN-2026-003",
                    control_number="CN-2026-003",
                    site_id=site_id,
                    enquiry_no="ENQ-910",
                    enquiry_date=datetime(2026, 6, 25),
                    equipment_name="Offshore Subsea Manifolds & Valve Assemblies",
                    client_id="C-003",
                    client_name="ONGC Offshore Project",
                    client_unit_id="C-003-U03",
                    client_unit_name="ONGC - Unit 3 (Chennai Subsea Integration Works)",
                    manufacturer_id="M-003",
                    manufacturer_name="ISGEC Heavy Engineering",
                    manufacturer_unit_id="M-003-U01",
                    manufacturer_unit_name="ISGEC - Works 1 (Heavy Forging & Casting Shop)",
                    loi_no="LOI/ONGC/2026/812",
                    loi_date=datetime(2026, 7, 1),
                    so_number="SO-8895",
                    so_effective_date=datetime(2026, 7, 15),
                    so_due_date=datetime(2027, 3, 31),
                    so_type="Lump-Sum",
                    work_scope="Cryogenic Pressure Witness, Actuator Torque Audit, Subsea Paint DFT Verification",
                    location="CHE - Chennai Ennore Port SEZ (STH - Southern Region)",
                    contract_amount=6200000.0,
                    comments="Lump-sum package covering 15 complete offshore skid inspections",
                    is_active=True,
                ),
            ]
            for c in sample_cns:
                try:
                    await c.insert()
                except Exception:
                    pass
            items = sample_cns
            total = len(sample_cns)

        return {"total": total, "page": page, "per_page": per_page, "data": [c.dict() for c in items]}

    @staticmethod
    async def get(cn_id: str, site_id: str = "SITE-01"):
        cn = await ControlNumber.find_one(ControlNumber.control_number_id == cn_id, ControlNumber.site_id == site_id)
        if not cn:
            raise HTTPException(status_code=404, detail="Control Number not found")
        return cn.dict()

    @staticmethod
    async def create(data: dict, site_id: str, user_id: str):
        if not data.get("control_number_id"):
            total_cns = await ControlNumber.find_all().count()
            data["control_number_id"] = f"CN-2026-{(total_cns + 1):03d}"
            data["control_number"] = data["control_number_id"]

        existing = await ControlNumber.find_one(ControlNumber.control_number_id == data["control_number_id"], ControlNumber.site_id == site_id)
        if existing:
            raise HTTPException(status_code=400, detail="Control Number ID already exists")

        cn = ControlNumber(**data, site_id=site_id, created_by=user_id)
        await cn.insert()
        return cn

    @staticmethod
    async def update(cn_id: str, data: dict):
        cn = await ControlNumber.find_one(ControlNumber.control_number_id == cn_id, ControlNumber.site_id == site_id)
        if not cn:
            raise HTTPException(status_code=404, detail="Control Number not found")

        for k, v in data.items():
            if hasattr(cn, k) and k not in ("control_number_id", "site_id", "created_at", "created_by"):
                setattr(cn, k, v)

        cn.updated_at = datetime.now()
        await cn.save()
        return cn

    @staticmethod
    async def toggle_status(cn_id: str, is_active: bool, site_id: str = "SITE-01"):
        cn = await ControlNumber.find_one(ControlNumber.control_number_id == cn_id, ControlNumber.site_id == site_id)
        if not cn:
            raise HTTPException(status_code=404, detail="Control Number not found")
        cn.is_active = is_active
        cn.updated_at = datetime.now()
        await cn.save()
        return cn

    @staticmethod
    async def reassign(cn_id: str, new_cn_id: str, reason: str, user_id: str, site_id: str = "SITE-01"):
        cn = await ControlNumber.find_one(ControlNumber.control_number_id == cn_id, ControlNumber.site_id == site_id)
        if not cn:
            raise HTTPException(status_code=404, detail="Control Number not found")
        
        reassign = Reassignment(
            old_control_number_id=cn_id,
            new_control_number_id=new_cn_id,
            changed_by=user_id,
            reason=reason
        )
        cn.reassignment_history.append(reassign)
        cn.is_active = False
        cn.updated_at = datetime.now()
        await cn.save()

        await Visit.find(Visit.control_number_id == cn_id).update({"$set": {"control_number_id": new_cn_id}})
        return {"message": "Reassignment successful", "control_number": cn.dict()}
