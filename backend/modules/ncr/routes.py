"""Endpoints for nonconformity reports."""
from fastapi import APIRouter, Body, Depends

from core.auth import get_current_user
from modules.ncr.service import NCRService

router = APIRouter(prefix="/ncrs", tags=["ncrs"])


def _ctx(user: dict) -> tuple[str, str]:
    return user.get("site_id", "SITE-01"), user.get("user_id", "USR-001")


@router.get("", include_in_schema=False)
@router.get("/")
async def list_ncrs(
    status: str = "", job_id: str = "", severity: str = "",
    open_only: bool = False, user: dict = Depends(get_current_user),
):
    site_id, _ = _ctx(user)
    return await NCRService.list_ncrs(site_id, status, job_id, severity, open_only)


@router.post("/")
async def raise_ncr(data: dict = Body(...), user: dict = Depends(get_current_user)):
    site_id, user_id = _ctx(user)
    return await NCRService.raise_ncr(data, site_id, user_id)


@router.get("/gate")
async def gate(
    job_id: str = "", work_package_id: str = "",
    user: dict = Depends(get_current_user),
):
    """Whether open nonconformities would block a certificate."""
    site_id, _ = _ctx(user)
    return await NCRService.open_against(
        site_id, job_id=job_id or None, work_package_id=work_package_id or None
    )


@router.get("/{ncr_id}")
async def get_ncr(ncr_id: str, user: dict = Depends(get_current_user)):
    site_id, _ = _ctx(user)
    found = await NCRService.get(ncr_id, site_id)
    return found.model_dump(exclude={"id"})


@router.post("/{ncr_id}/disposition")
async def propose_disposition(
    ncr_id: str, data: dict = Body(...), user: dict = Depends(get_current_user)
):
    site_id, user_id = _ctx(user)
    return await NCRService.propose_disposition(ncr_id, data, site_id, user_id)


@router.post("/{ncr_id}/accept")
async def accept(
    ncr_id: str, data: dict = Body(default={}),
    user: dict = Depends(get_current_user),
):
    site_id, user_id = _ctx(user)
    return await NCRService.accept_disposition(ncr_id, data, site_id, user_id)


@router.post("/{ncr_id}/submit")
async def submit(
    ncr_id: str, data: dict = Body(...), user: dict = Depends(get_current_user)
):
    site_id, user_id = _ctx(user)
    return await NCRService.submit_for_verification(ncr_id, data, site_id, user_id)


@router.post("/{ncr_id}/verify")
async def verify(
    ncr_id: str, data: dict = Body(...), user: dict = Depends(get_current_user)
):
    site_id, user_id = _ctx(user)
    return await NCRService.verify(ncr_id, data, site_id, user_id)


@router.post("/{ncr_id}/void")
async def void(
    ncr_id: str, data: dict = Body(...), user: dict = Depends(get_current_user)
):
    site_id, user_id = _ctx(user)
    return await NCRService.void(ncr_id, data, site_id, user_id)
