from fastapi import APIRouter, UploadFile, File, Depends
from core.auth import get_current_user
from modules.file_upload.service import FileUploadService

router = APIRouter(prefix="/files", tags=["Files"])


@router.post("/upload")
async def upload(file: UploadFile = File(...), section_id: str = "0",
                generic_id: str = "", user: dict = Depends(get_current_user)):
    return await FileUploadService.upload(file, section_id, generic_id)


@router.get("/mime/{filename:path}")
async def mime_type(filename: str, user: dict = Depends(get_current_user)):
    return {"mime": await FileUploadService.get_mime_type(filename)}
