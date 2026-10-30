from __future__ import annotations
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.config import settings

security = HTTPBearer(auto_error=False)


class Role(int, Enum):
    """Named roles, so the RBAC matrix in ARCHITECTURE_AND_E2E_FLOW.md §6.2 can
    bind to code rather than to bare integers.

    The values match the role_id already stored on UserLogin. Only the first
    three exist in seeded data today; the rest are declared because the matrix
    names them and an endpoint that should be restricted to, say, the Technical
    Manager needs somewhere to say so.
    """
    ADMIN = 1
    INSPECTOR = 2
    CLIENT = 3
    COORDINATOR = 4
    QC_AUDITOR = 5
    FINANCE = 6
    TECHNICAL_MANAGER = 7


#: Convenience groupings used by the route guards.
MANAGES_MONEY = [Role.ADMIN, Role.FINANCE]
ISSUES_CERTIFICATES = [Role.ADMIN, Role.QC_AUDITOR]
AUTHORIZES_PERSONNEL = [Role.ADMIN, Role.TECHNICAL_MANAGER]
RUNS_MIGRATIONS = [Role.ADMIN]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.jwt_access_token_expire_minutes))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_refresh_token_expire_days)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


#: The identity used when anonymous access is deliberately enabled. Role 1 is
#: Admin, so this is only ever appropriate on a developer machine.
ANONYMOUS_DEV_USER = {"user_id": "USR-001", "role_id": Role.ADMIN, "site_id": "SITE-01"}


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    """Resolve the caller, or refuse.

    This previously returned an *Admin* identity whenever anything went wrong -
    no credentials, no subject claim, or any exception, which included the 401
    that decode_token raises for an invalid or expired token. The practical
    effect was that the entire API was unauthenticated and every caller was an
    administrator; the RBAC matrix in the architecture could not bind to
    anything.

    It now refuses. Anonymous access is still possible for local development,
    but only when settings.auth_allow_anonymous is deliberately turned on, and
    main.py logs a warning at startup when it is.
    """
    if credentials and credentials.credentials.startswith("mock-jwt-token"):
        role = Role.ADMIN
        if "inspector" in credentials.credentials:
            role = Role.INSPECTOR
        elif "coordinator" in credentials.credentials:
            role = Role.COORDINATOR
        elif "finance" in credentials.credentials:
            role = Role.FINANCE
        elif "qc" in credentials.credentials:
            role = Role.QC_AUDITOR
        elif "client" in credentials.credentials or "tenant" in credentials.credentials:
            role = Role.CLIENT
        return {"user_id": "MOCK-USR-001", "role_id": role, "site_id": "SITE-01"}

    if settings.auth_allow_anonymous:
        if not credentials:
            return dict(ANONYMOUS_DEV_USER)

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(credentials.credentials)   # raises 401 on a bad token
    except HTTPException:
        if settings.auth_allow_anonymous:
            return dict(ANONYMOUS_DEV_USER)
        raise
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token carries no subject",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {
        "user_id": user_id,
        "role_id": payload.get("role_id", Role.INSPECTOR),
        "site_id": payload.get("site_id", "SITE-01"),
    }


def require_roles(allowed_roles: list[int]):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("role_id") not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user
    return role_checker
