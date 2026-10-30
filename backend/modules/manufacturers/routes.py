from typing import Optional
from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.manufacturers.service import ManufacturerService

router = APIRouter(prefix="/manufacturers", tags=["Manufacturers"])


@router.get("", include_in_schema=False)
@router.get("/")
async def list_manufacturers(
    search: str = "", 
    alpha: str = "", 
    is_active: Optional[bool] = None, 
    page: int = 1, 
    per_page: int = 100, 
    user: dict = Depends(get_current_user)
):
    return await ManufacturerService.list(user.get("site_id", "SITE-01"), search, alpha, is_active, page, per_page)


@router.get("/{mfr_id}")
async def get_manufacturer(mfr_id: str, user: dict = Depends(get_current_user)):
    return await ManufacturerService.get(mfr_id, user.get("site_id", "SITE-01"))


@router.post("/")
async def create_manufacturer(data: dict, user: dict = Depends(get_current_user)):
    return await ManufacturerService.create(data, user.get("site_id", "SITE-01"))


@router.put("/{mfr_id}")
async def update_manufacturer(mfr_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await ManufacturerService.update(mfr_id, data, user.get("site_id", "SITE-01"))


@router.patch("/{mfr_id}/status")
async def toggle_manufacturer_status(mfr_id: str, is_active: bool, user: dict = Depends(get_current_user)):
    return await ManufacturerService.toggle_status(mfr_id, is_active, user.get("site_id", "SITE-01"))


@router.get("/{mfr_id}/units")
async def list_manufacturer_units(mfr_id: str, region: str = "", unit_type: str = "", user: dict = Depends(get_current_user)):
    return await ManufacturerService.list_units(mfr_id, user.get("site_id", "SITE-01"), region, unit_type)


@router.post("/{mfr_id}/units")
async def create_manufacturer_unit(mfr_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await ManufacturerService.create_unit(mfr_id, data, user.get("site_id", "SITE-01"))
