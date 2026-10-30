from __future__ import annotations
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore", env_file=".env")
    app_name: str = "IQEApp API"
    debug: bool = False

    #: Accept unauthenticated requests as an Admin. Development only - with
    #: this on, every endpoint is open to anyone who can reach the port.
    auth_allow_anonymous: bool = False
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "iqeapp_dev"
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 7
    azure_storage_connection_string: Optional[str] = None
    azure_storage_container_name: str = "iqeapp-files"
    azure_openai_endpoint: Optional[str] = None
    azure_openai_api_key: Optional[str] = None
    azure_openai_deployment: str = "gpt-4o"
    azure_openai_embedding_deployment: str = "text-embedding-3-large"
    sendgrid_api_key: Optional[str] = None
    sendgrid_from_email: str = "noreply@iqeapp.com"
    redis_url: str = "redis://localhost:6379/0"
    # Public base URLs encoded in document QR codes (must be reachable from a phone).
    # Unset = auto-detect this machine's LAN IP (dev on the same Wi-Fi).
    public_web_url: Optional[str] = None
    public_api_url: Optional[str] = None
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3005",
        "http://localhost:3006",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "https://iqe.forgetechno.com",
        "https://www.iqe.forgetechno.com",
        "https://api-iqe.forgetechno.com",
        "*"
    ]

    

settings = Settings()
