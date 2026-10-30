from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import Field


class UserLogin(Document):
    user_id: str
    site_id: str
    login_name: str
    login_password: str
    email: str
    full_name: str
    role_id: int
    role_name: Optional[str] = None
    employee_code: Optional[str] = None
    inspector_code: Optional[str] = None
    is_active: bool = True
    is_password_update: bool = False
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "users"
