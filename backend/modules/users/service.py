from fastapi import HTTPException
from modules.users.models import Competency, InspectorRate, Associate
from core.auth import hash_password
from modules.auth.models import UserLogin
from datetime import datetime


class UserService:

    @staticmethod
    async def list(site_id: str, role_id: int = None, page: int = 1, per_page: int = 25):
        query = {"site_id": site_id}
        if role_id: query["role_id"] = role_id
        total = await UserLogin.find(query).count()
        items = await UserLogin.find(query).skip((page - 1) * per_page).limit(per_page).to_list()
        return {"total": total, "page": page, "per_page": per_page, "data": [u.dict() for u in items]}

    @staticmethod
    async def get(user_id: str, site_id: str):
        user = await UserLogin.find_one(UserLogin.user_id == user_id, UserLogin.site_id == site_id)
        if not user: raise HTTPException(404, "User not found")
        comp = await Competency.find_one(Competency.user_id == user_id, Competency.site_id == site_id)
        rate = await InspectorRate.find_one(InspectorRate.user_id == user_id, InspectorRate.site_id == site_id)
        return {**user.dict(), "competency": comp.dict() if comp else None, "rate": rate.dict() if rate else None}

    @staticmethod
    async def create(data: dict, site_id: str):
        data["site_id"] = site_id
        data["login_password"] = hash_password(data["login_password"])
        existing = await UserLogin.find_one(UserLogin.login_name == data["login_name"])
        if existing: raise HTTPException(400, "Login name already exists")
        user = UserLogin(**data)
        await user.insert()
        return user

    @staticmethod
    async def update(user_id: str, data: dict, site_id: str):
        user = await UserLogin.find_one(UserLogin.user_id == user_id, UserLogin.site_id == site_id)
        if not user: raise HTTPException(404, "User not found")
        if "login_password" in data:
            data["login_password"] = hash_password(data["login_password"])
        for k, v in data.items():
            if hasattr(user, k) and k not in ("user_id", "site_id", "created_at", "login_name"):
                setattr(user, k, v)
        user.updated_at = datetime.now()
        await user.save()
        return user
