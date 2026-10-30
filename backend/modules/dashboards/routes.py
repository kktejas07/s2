from typing import Optional

from fastapi import APIRouter, Depends

from core.auth import get_current_user
from modules.dashboards.service import ROLES, DashboardService

router = APIRouter(prefix="/dashboards", tags=["Dashboards"])


@router.get("/roles")
async def list_roles(user: dict = Depends(get_current_user)):
    return {"roles": ROLES}


@router.get("/{role}")
async def dashboard_for_role(
    role: str,
    person_id: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    """Role-scoped view over the execution spine.

    inspection_officer needs person_id; the others are site-wide.
    """
    return await DashboardService.for_role(
        role, user.get("site_id", "SITE-01"), person_id or user.get("person_id")
    )
