from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.auth.service import AuthService
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginReq(BaseModel):
    login_name: str
    password: str

class RefreshReq(BaseModel):
    refresh_token: str

class ChangePwdReq(BaseModel):
    old_password: str
    new_password: str


@router.post("/login")
async def login(req: LoginReq):
    return await AuthService.login(req.login_name, req.password)


@router.post("/refresh")
async def refresh(req: RefreshReq):
    return await AuthService.refresh(req.refresh_token)


@router.post("/change-password")
async def change_password(req: ChangePwdReq, current_user: dict = Depends(get_current_user)):
    return await AuthService.change_password(current_user["user_id"], req.old_password, req.new_password)
