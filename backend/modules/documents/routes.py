from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.documents.service import DocumentService

router = APIRouter(prefix="/documents", tags=["Documents"])
@router.get("/")
async def list(category: str = "", page: int = 1, per_page: int = 25, user: dict = Depends(get_current_user)):
    return await DocumentService.list(user["site_id"], category, page, per_page)
@router.post("/")
async def create(data: dict, user: dict = Depends(get_current_user)):
    return await DocumentService.create(data, user["site_id"], user["user_id"])
