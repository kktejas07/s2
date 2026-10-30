from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import HTTPException

from modules.work_types.catalogue import DEFAULT_CATALOGUE
from modules.work_types.models import AIAssist, RateBasis, WorkTypeDefinition

VALID_RATE_BASES = {r.value for r in RateBasis}
VALID_AI_ASSISTS = {a.value for a in AIAssist}


def _validate(data: dict) -> None:
    """Reject unknown enum values early rather than storing junk."""
    rb = data.get("default_rate_basis")
    if rb is not None and rb not in VALID_RATE_BASES:
        raise HTTPException(
            400, f"Invalid default_rate_basis '{rb}'. Expected one of: {sorted(VALID_RATE_BASES)}"
        )
    for assist in data.get("ai_assists") or []:
        if assist not in VALID_AI_ASSISTS:
            raise HTTPException(
                400, f"Invalid ai_assist '{assist}'. Expected one of: {sorted(VALID_AI_ASSISTS)}"
            )
    threshold = data.get("auto_assign_threshold")
    if threshold is not None and not (0.0 <= float(threshold) <= 1.0):
        raise HTTPException(400, "auto_assign_threshold must be between 0.0 and 1.0, or null to disable")


class WorkTypeService:

    @staticmethod
    async def list(
        site_id: str = "SITE-01",
        search: str = "",
        is_active: Optional[bool] = None,
        page: int = 1,
        per_page: int = 100,
    ):
        query: dict = {"site_id": site_id}
        if is_active is not None:
            query["is_active"] = is_active
        if search:
            query["$or"] = [
                {"work_type_code": {"$regex": search, "$options": "i"}},
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"discipline_tags": {"$regex": search, "$options": "i"}},
            ]

        total = await WorkTypeDefinition.find(query).count()
        items = (
            await WorkTypeDefinition.find(query)
            .sort(WorkTypeDefinition.work_type_code)
            .skip((page - 1) * per_page)
            .limit(per_page)
            .to_list()
        )
        return {
            "total": total,
            "page": page,
            "per_page": per_page,
            "data": [i.model_dump(exclude={"id"}) for i in items],
        }

    @staticmethod
    async def get(work_type_code: str, site_id: str = "SITE-01") -> WorkTypeDefinition:
        wt = await WorkTypeDefinition.find_one(
            WorkTypeDefinition.work_type_code == work_type_code,
            WorkTypeDefinition.site_id == site_id,
        )
        if not wt:
            raise HTTPException(404, f"Work type '{work_type_code}' not found")
        return wt

    @staticmethod
    async def create(data: dict, site_id: str = "SITE-01", user_id: str = "USR-001"):
        code = (data.get("work_type_code") or "").strip().upper()
        if not code:
            raise HTTPException(400, "work_type_code is required")
        if not (data.get("name") or "").strip():
            raise HTTPException(400, "name is required")

        existing = await WorkTypeDefinition.find_one(
            WorkTypeDefinition.work_type_code == code,
            WorkTypeDefinition.site_id == site_id,
        )
        if existing:
            raise HTTPException(409, f"Work type '{code}' already exists for this site")

        _validate(data)
        data["work_type_code"] = code
        data["site_id"] = site_id
        data["created_by"] = user_id
        wt = WorkTypeDefinition(**data)
        await wt.insert()
        return wt

    @staticmethod
    async def update(work_type_code: str, data: dict, site_id: str = "SITE-01"):
        wt = await WorkTypeService.get(work_type_code, site_id)
        _validate(data)
        # identity and provenance are not editable
        for immutable in ("work_type_code", "site_id", "created_by", "created_at", "id"):
            data.pop(immutable, None)
        for key, value in data.items():
            if hasattr(wt, key):
                setattr(wt, key, value)
        wt.updated_at = datetime.now()
        await wt.save()
        return wt

    @staticmethod
    async def set_active(work_type_code: str, is_active: bool, site_id: str = "SITE-01"):
        """Deactivate rather than delete - existing work packages still reference the code."""
        wt = await WorkTypeService.get(work_type_code, site_id)
        wt.is_active = is_active
        wt.updated_at = datetime.now()
        await wt.save()
        return wt

    @staticmethod
    async def seed_catalogue(site_id: str = "SITE-01", user_id: str = "USR-001"):
        """Idempotent: inserts only work types this site does not already have."""
        created, skipped = [], []
        for entry in DEFAULT_CATALOGUE:
            code = entry["work_type_code"]
            existing = await WorkTypeDefinition.find_one(
                WorkTypeDefinition.work_type_code == code,
                WorkTypeDefinition.site_id == site_id,
            )
            if existing:
                skipped.append(code)
                continue
            wt = WorkTypeDefinition(**{**entry, "site_id": site_id, "created_by": user_id})
            await wt.insert()
            created.append(code)
        return {
            "created": created,
            "skipped_existing": skipped,
            "total_in_catalogue": len(DEFAULT_CATALOGUE),
        }

    @staticmethod
    async def rate_bases():
        return {"rate_bases": sorted(VALID_RATE_BASES), "ai_assists": sorted(VALID_AI_ASSISTS)}
