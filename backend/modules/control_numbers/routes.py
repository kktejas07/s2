from typing import Optional
from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.control_numbers.service import ControlNumberService

router = APIRouter(prefix="/control-numbers", tags=["Control Numbers"])


@router.get("", include_in_schema=False)
@router.get("/")
async def list_control_numbers(
    search: str = "", 
    alpha: str = "", 
    is_active: Optional[bool] = None, 
    page: int = 1, 
    per_page: int = 100, 
    user: dict = Depends(get_current_user)
):
    return await ControlNumberService.list(user.get("site_id", "SITE-01"), search, alpha, is_active, page, per_page)


@router.get("/{cn_id}")
async def get_control_number(cn_id: str, user: dict = Depends(get_current_user)):
    return await ControlNumberService.get(cn_id, user.get("site_id", "SITE-01"))


@router.post("/")
async def create_control_number(data: dict, user: dict = Depends(get_current_user)):
    return await ControlNumberService.create(data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.put("/{cn_id}")
async def update_control_number(cn_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await ControlNumberService.update(cn_id, data)


@router.patch("/{cn_id}/status")
async def toggle_control_number_status(cn_id: str, is_active: bool, user: dict = Depends(get_current_user)):
    return await ControlNumberService.toggle_status(cn_id, is_active, user.get("site_id", "SITE-01"))


@router.post("/{cn_id}/reassign")
async def reassign_control_number(cn_id: str, new_cn_id: str, reason: str, user: dict = Depends(get_current_user)):
    return await ControlNumberService.reassign(cn_id, new_cn_id, reason, user.get("user_id", "USR-001"))
