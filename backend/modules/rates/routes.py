"""Endpoints for rate cards and the floor."""
from fastapi import APIRouter, Body, Depends

from core.auth import get_current_user
from modules.rates.service import RateService

router = APIRouter(prefix="/rates", tags=["rates"])


def _ctx(user: dict) -> tuple[str, str]:
    return user.get("site_id", "SITE-01"), user.get("user_id", "USR-001")


@router.get("/cards")
async def list_cards(
    client_id: str = "", status: str = "", user: dict = Depends(get_current_user)
):
    site_id, _ = _ctx(user)
    return await RateService.list_cards(site_id, client_id, status)


@router.post("/cards")
async def create_card(data: dict = Body(...), user: dict = Depends(get_current_user)):
    site_id, user_id = _ctx(user)
    return await RateService.create_card(data, site_id, user_id)


@router.get("/cards/expiring")
async def expiring(days: int = 45, user: dict = Depends(get_current_user)):
    """Cards about to lapse, and ones that already have."""
    site_id, _ = _ctx(user)
    return await RateService.expiring(site_id, days)


@router.get("/cards/{card_id}")
async def get_card(card_id: str, user: dict = Depends(get_current_user)):
    site_id, _ = _ctx(user)
    card = await RateService.get_card(card_id, site_id)
    return card.model_dump(exclude={"id"})


@router.post("/cards/{card_id}/activate")
async def activate(
    card_id: str, data: dict = Body(default={}),
    user: dict = Depends(get_current_user),
):
    site_id, user_id = _ctx(user)
    return await RateService.activate(card_id, data, site_id, user_id)


@router.get("/floors")
async def list_floors(user: dict = Depends(get_current_user)):
    site_id, _ = _ctx(user)
    return await RateService.list_floors(site_id)


@router.put("/floors")
async def set_floor(data: dict = Body(...), user: dict = Depends(get_current_user)):
    site_id, user_id = _ctx(user)
    return await RateService.set_floor(data, site_id, user_id)


@router.get("/resolve")
async def resolve(
    work_type_code: str, client_id: str = "", discipline: str = "",
    user: dict = Depends(get_current_user),
):
    """What this work prices at, from the card in force."""
    site_id, _ = _ctx(user)
    out = await RateService.resolve(
        work_type_code, client_id=client_id or None,
        discipline=discipline or None, site_id=site_id,
    )
    return out.model_dump()


@router.post("/check")
async def check(data: dict = Body(...), user: dict = Depends(get_current_user)):
    """The gate-1 check: does a proposed rate clear the floor?"""
    site_id, _ = _ctx(user)
    return await RateService.check_proposed(
        data["work_type_code"], float(data["rate"]),
        client_id=data.get("client_id"), discipline=data.get("discipline"),
        site_id=site_id,
    )
