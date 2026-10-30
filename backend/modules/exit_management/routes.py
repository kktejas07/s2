from typing import Optional
from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.exit_management.service import ExitService

router = APIRouter(prefix="/exit", tags=["Exit Management"])


@router.post("/")
async def initiate_exit(data: dict, user: dict = Depends(get_current_user)):
    return await ExitService.initiate_exit(data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.get("/")
async def list_exits(
    status: Optional[str] = None, page: int = 1, per_page: int = 100,
    user: dict = Depends(get_current_user),
):
    return await ExitService.list_exits(user.get("site_id", "SITE-01"), status, page, per_page)


@router.get("/{exit_id}")
async def get_exit(exit_id: str, user: dict = Depends(get_current_user)):
    return await ExitService.get_exit(exit_id, user.get("site_id", "SITE-01"))


@router.patch("/{exit_id}/checklist")
async def update_checklist_item(exit_id: str, item_code: str, completed: bool = True, user: dict = Depends(get_current_user)):
    return await ExitService.update_checklist_item(exit_id, item_code, completed, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.patch("/{exit_id}/withdraw-authorization")
async def withdraw_authorizations(exit_id: str, user: dict = Depends(get_current_user)):
    return await ExitService.withdraw_authorizations(exit_id, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.patch("/{exit_id}/settle")
async def calculate_settlement(exit_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await ExitService.calculate_settlement(exit_id, data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.patch("/{exit_id}/complete")
async def complete_exit(exit_id: str, user: dict = Depends(get_current_user)):
    return await ExitService.complete_exit(exit_id, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))
