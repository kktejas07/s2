from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.users.service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", include_in_schema=False)
@router.get("/")
async def list(role_id: int = None, page: int = 1, per_page: int = 25, user: dict = Depends(get_current_user)):
    return await UserService.list(user["site_id"], role_id, page, per_page)


@router.get("/{user_id}")
async def get(user_id: str, user: dict = Depends(get_current_user)):
    return await UserService.get(user_id, user["site_id"])


@router.post("/")
async def create(data: dict, user: dict = Depends(get_current_user)):
    return await UserService.create(data, user["site_id"])


@router.put("/{user_id}")
async def update(user_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await UserService.update(user_id, data, user["site_id"])
