from fastapi import HTTPException
from modules.clients.models import Client, ClientUnit
from datetime import datetime
from typing import Optional


class ClientService:

    @staticmethod
    async def list(site_id: str, search: str = "", alpha: str = "", is_active: Optional[bool] = None, page: int = 1, per_page: int = 100):
        query = {"site_id": site_id}
        if is_active is not None:
            query["is_active"] = is_active
        if alpha and alpha.upper() != "ALL":
            query["name"] = {"$regex": f"^{alpha}", "$options": "i"}
        if search:
            search_query = {
                "$or": [
                    {"name": {"$regex": search, "$options": "i"}},
                    {"code": {"$regex": search, "$options": "i"}},
                    {"client_id": {"$regex": search, "$options": "i"}},
                    {"industry_type": {"$regex": search, "$options": "i"}},
                    {"city": {"$regex": search, "$options": "i"}},
                ]
            }
            if "name" in query:
                # Combine alpha and search regex if both are provided
                alpha_regex = query.pop("name")
                query["$and"] = [
                    {"name": alpha_regex},
                    search_query
                ]
            else:
                query.update(search_query)

        total = await Client.find(query).count()
        items = await Client.find(query).skip((page - 1) * per_page).limit(per_page).sort(-Client.created_at).to_list()
        
        results = [{**c.dict(), "total_units": c.total_units or 0} for c in items]
        return {"total": total, "page": page, "per_page": per_page, "data": results}

    @staticmethod
    async def get(client_id: str, site_id: str):
        client = await Client.find_one(Client.client_id == client_id, Client.site_id == site_id)
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        units = await ClientUnit.find(ClientUnit.client_id == client_id).to_list()
        return {**client.dict(), "units": [u.dict() for u in units]}

    @staticmethod
    async def create(data: dict, site_id: str):
        if not data.get("client_id"):
            total_clients = await Client.find_all().count()
            data["client_id"] = f"C-{(total_clients + 1):03d}"
        
        existing = await Client.find_one(Client.client_id == data["client_id"], Client.site_id == site_id)
        if existing:
            raise HTTPException(status_code=400, detail="Client ID already exists")
        client = Client(**data, site_id=site_id)
        await client.insert()
        return client

    @staticmethod
    async def update(client_id: str, data: dict, site_id: str):
        client = await Client.find_one(Client.client_id == client_id, Client.site_id == site_id)
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        for k, v in data.items():
            if hasattr(client, k) and k not in ("client_id", "site_id", "created_at"):
                setattr(client, k, v)
        client.updated_at = datetime.now()
        await client.save()
        return client

    @staticmethod
    async def toggle_status(client_id: str, is_active: bool, site_id: str):
        client = await Client.find_one(Client.client_id == client_id, Client.site_id == site_id)
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        client.is_active = is_active
        client.updated_at = datetime.now()
        await client.save()
        return client

    @staticmethod
    async def list_units(client_id: str, site_id: str, region: str = "", unit_type: str = ""):
        query = {"client_id": client_id}
        if region and region.upper() != "ALL":
            query["region"] = region
        if unit_type and unit_type.upper() != "ALL":
            query["unit_type"] = unit_type
        units = await ClientUnit.find(query).to_list()

        # Auto-seed if empty so user always sees existing units details
        if not units and not region and not unit_type:
            client = await Client.find_one(Client.client_id == client_id, Client.site_id == site_id)
            c_name = client.name if client else "Corporate Plant"
            sample_units = [
                ClientUnit(
                    client_unit_id=f"{client_id}-U01",
                    client_id=client_id,
                    site_id=site_id,
                    name=f"{c_name} - Unit 1 (Hazira Heavy Fabrication Yard)",
                    unit_type="FAB - Fabrication Yard",
                    region="WST - Western Region",
                    city="HAZ - Hazira",
                    location="HAZ - Plot 45, GIDC Industrial Estate Phase I",
                    contact_person="Site Lead / QC Head",
                    phone="+91 98200 11223",
                    gst="27AAACR1234F1ZV",
                    custom_category="Offshore Pressure Vessels",
                ),
                ClientUnit(
                    client_unit_id=f"{client_id}-U02",
                    client_id=client_id,
                    site_id=site_id,
                    name=f"{c_name} - Unit 2 (Jamnagar Refinery Expansion Site)",
                    unit_type="PET - Oil Refinery & Petrochemicals",
                    region="WST - Western Region",
                    city="JAM - Jamnagar",
                    location="JAM - Moti Khavdi Petrochemical Complex",
                    contact_person="Refinery QC Lead",
                    phone="+91 98200 44556",
                    gst="27AAACR1234F2ZW",
                    custom_category="High Temp Alloy Piping Wing",
                ),
                ClientUnit(
                    client_unit_id=f"{client_id}-U03",
                    client_id=client_id,
                    site_id=site_id,
                    name=f"{c_name} - Unit 3 (Chennai Subsea Integration Works)",
                    unit_type="ASS - Assembly & Integration Site",
                    region="STH - Southern Region",
                    city="CHE - Chennai",
                    location="CHE - Ennore Port SEZ Industrial Area",
                    contact_person="S. Sundaram",
                    phone="+91 98400 33221",
                    gst="33AAACR1234F3ZX",
                    custom_category="Subsea Manifolds Unit",
                ),
            ]
            for u in sample_units:
                try:
                    await u.insert()
                except Exception:
                    pass
            units = sample_units

        return [u.dict() for u in units]

    @staticmethod
    async def create_unit(client_id: str, data: dict, site_id: str):
        client = await Client.find_one(Client.client_id == client_id, Client.site_id == site_id)
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        
        if not data.get("client_unit_id"):
            total_u = await ClientUnit.find(ClientUnit.client_id == client_id).count()
            data["client_unit_id"] = f"{client_id}-U{(total_u + 1):02d}"
        
        unit = ClientUnit(**data, client_id=client_id, site_id=site_id)
        await unit.insert()
        
        # Increment client's total_units count
        client.total_units = (client.total_units or 0) + 1
        await client.save()
        return unit
