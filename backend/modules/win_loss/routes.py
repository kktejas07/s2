from typing import Optional
from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.win_loss.service import WinLossService

router = APIRouter(prefix="/win-loss", tags=["Win-Loss Analysis"])


@router.post("/")
async def create_record(data: dict, user: dict = Depends(get_current_user)):
    return await WinLossService.create(data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.get("/")
async def list_records(
    outcome: Optional[str] = None,
    region_code: Optional[str] = None,
    client_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    page: int = 1,
    per_page: int = 50,
    user: dict = Depends(get_current_user),
):
    return await WinLossService.list(
        user.get("site_id", "SITE-01"), outcome, region_code, client_id, date_from, date_to, page, per_page,
    )


@router.get("/summary")
async def summary(region_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    return await WinLossService.summary(user.get("site_id", "SITE-01"), region_code)


@router.get("/by-region")
async def by_region(user: dict = Depends(get_current_user)):
    return await WinLossService.by_region(user.get("site_id", "SITE-01"))


@router.get("/by-sector")
async def by_sector(user: dict = Depends(get_current_user)):
    return await WinLossService.by_sector(user.get("site_id", "SITE-01"))


@router.get("/{record_id}")
async def get_record(record_id: str, user: dict = Depends(get_current_user)):
    return await WinLossService.get(record_id, user.get("site_id", "SITE-01"))
