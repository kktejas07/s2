from datetime import timedelta, datetime
from fastapi import HTTPException
from core.auth import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from modules.auth.models import UserLogin


class AuthService:

    @staticmethod
    async def login(login_name: str, password: str):
        user = await UserLogin.find_one(UserLogin.login_name == login_name)
        if not user or not verify_password(password, user.login_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is inactive")
        token_data = {"sub": user.user_id, "role_id": user.role_id, "site_id": user.site_id}
        return {
            "access_token": create_access_token(token_data),
            "refresh_token": create_refresh_token(token_data),
            "token_type": "bearer",
            "user_id": user.user_id,
            "full_name": user.full_name,
            "role_id": user.role_id,
            "site_id": user.site_id,
        }

    @staticmethod
    async def refresh(refresh_token: str):
        payload = decode_token(refresh_token)
        user = await UserLogin.find_one(UserLogin.user_id == payload.get("sub"))
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        token_data = {"sub": user.user_id, "role_id": user.role_id, "site_id": user.site_id}
        return {"access_token": create_access_token(token_data), "token_type": "bearer"}

    @staticmethod
    async def change_password(user_id: str, old_password: str, new_password: str):
        user = await UserLogin.find_one(UserLogin.user_id == user_id)
        if not user or not verify_password(old_password, user.login_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        user.login_password = hash_password(new_password)
        user.is_password_update = True
        user.updated_at = datetime.now()
        await user.save()
        return {"message": "Password changed successfully"}
