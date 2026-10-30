from typing import Optional

from fastapi import APIRouter, Depends

from core.auth import get_current_user
from modules.work_types.service import WorkTypeService

router = APIRouter(prefix="/work-types", tags=["Work Types"])


@router.get("", include_in_schema=False)
@router.get("/")
async def list_work_types(
    search: str = "",
    is_active: Optional[bool] = None,
    page: int = 1,
    per_page: int = 100,
    user: dict = Depends(get_current_user),
):
    return await WorkTypeService.list(user.get("site_id", "SITE-01"), search, is_active, page, per_page)


@router.get("/enums")
async def list_enums(user: dict = Depends(get_current_user)):
    """Valid rate bases and AI assists, for populating form dropdowns."""
    return await WorkTypeService.rate_bases()


@router.post("/seed")
async def seed_catalogue(user: dict = Depends(get_current_user)):
    """Seed the default work-type catalogue. Idempotent per site."""
    return await WorkTypeService.seed_catalogue(
        user.get("site_id", "SITE-01"), user.get("user_id", "USR-001")
    )


@router.get("/{work_type_code}")
async def get_work_type(work_type_code: str, user: dict = Depends(get_current_user)):
    return await WorkTypeService.get(work_type_code, user.get("site_id", "SITE-01"))


@router.post("/")
async def create_work_type(data: dict, user: dict = Depends(get_current_user)):
    return await WorkTypeService.create(
        data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001")
    )


@router.put("/{work_type_code}")
async def update_work_type(work_type_code: str, data: dict, user: dict = Depends(get_current_user)):
    return await WorkTypeService.update(work_type_code, data, user.get("site_id", "SITE-01"))


@router.patch("/{work_type_code}/status")
async def set_work_type_status(
    work_type_code: str, is_active: bool, user: dict = Depends(get_current_user)
):
    return await WorkTypeService.set_active(work_type_code, is_active, user.get("site_id", "SITE-01"))
