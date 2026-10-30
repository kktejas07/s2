from typing import Optional
from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.clients.service import ClientService

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("", include_in_schema=False)
@router.get("/")
async def list_clients(
    search: str = "", 
    alpha: str = "", 
    is_active: Optional[bool] = None, 
    page: int = 1, 
    per_page: int = 100, 
    user: dict = Depends(get_current_user)
):
    return await ClientService.list(user.get("site_id", "SITE-01"), search, alpha, is_active, page, per_page)


@router.get("/{client_id}")
async def get_client(client_id: str, user: dict = Depends(get_current_user)):
    return await ClientService.get(client_id, user.get("site_id", "SITE-01"))


@router.post("/")
async def create_client(data: dict, user: dict = Depends(get_current_user)):
    return await ClientService.create(data, user.get("site_id", "SITE-01"))


@router.put("/{client_id}")
async def update_client(client_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await ClientService.update(client_id, data, user.get("site_id", "SITE-01"))


@router.patch("/{client_id}/status")
async def toggle_client_status(client_id: str, is_active: bool, user: dict = Depends(get_current_user)):
    return await ClientService.toggle_status(client_id, is_active, user.get("site_id", "SITE-01"))


@router.get("/{client_id}/units")
async def list_client_units(client_id: str, region: str = "", unit_type: str = "", user: dict = Depends(get_current_user)):
    return await ClientService.list_units(client_id, user.get("site_id", "SITE-01"), region, unit_type)


@router.post("/{client_id}/units")
async def create_client_unit(client_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await ClientService.create_unit(client_id, data, user.get("site_id", "SITE-01"))
