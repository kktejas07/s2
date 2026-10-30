"""Provider register API. Access governed by core/policy.py."""
from fastapi import APIRouter, Body, Depends

from core.auth import get_current_user
from modules.providers.service import ProviderService

router = APIRouter(prefix="/providers", tags=["External providers"])


def _ctx(user: dict) -> tuple[str, str]:
    return user.get("site_id", "SITE-01"), user.get("user_id", "USR-001")


@router.get("/")
async def list_providers(
    category: str = "",
    status: str = "",
    usable_only: bool = False,
    user: dict = Depends(get_current_user),
):
    site_id, _ = _ctx(user)
    return await ProviderService.list(site_id, category, status, usable_only)


@router.get("/review-due")
async def review_due(horizon_days: int = 60, user: dict = Depends(get_current_user)):
    """What is already unusable, and what becomes unusable soon."""
    site_id, _ = _ctx(user)
    return await ProviderService.due_for_review(site_id, horizon_days)


@router.post("/")
async def register_provider(data: dict, user: dict = Depends(get_current_user)):
    site_id, user_id = _ctx(user)
    return await ProviderService.register(data, site_id, user_id)


@router.get("/{provider_id}")
async def get_provider(provider_id: str, user: dict = Depends(get_current_user)):
    site_id, _ = _ctx(user)
    return await ProviderService.detail(provider_id, site_id)


@router.post("/{provider_id}/evaluate")
async def evaluate(
    provider_id: str, body: dict = Body(...), user: dict = Depends(get_current_user)
):
    site_id, user_id = _ctx(user)
    return await ProviderService.evaluate(provider_id, body, site_id, user_id)


@router.post("/{provider_id}/performance")
async def record_performance(
    provider_id: str, body: dict = Body(...), user: dict = Depends(get_current_user)
):
    site_id, user_id = _ctx(user)
    return await ProviderService.record_performance(provider_id, body, site_id, user_id)


@router.patch("/{provider_id}/status")
async def set_status(
    provider_id: str,
    status: str,
    reason: str = "",
    user: dict = Depends(get_current_user),
):
    site_id, user_id = _ctx(user)
    return await ProviderService.set_status(provider_id, status, reason, site_id, user_id)


@router.post("/consent")
async def record_consent(body: dict = Body(...), user: dict = Depends(get_current_user)):
    """The client's agreement to subcontracted inspection on a job."""
    site_id, user_id = _ctx(user)
    return await ProviderService.record_consent(body, site_id, user_id)


@router.get("/check/{job_id}/{provider_id}")
async def check_may_subcontract(
    job_id: str,
    provider_id: str,
    service: str = "",
    user: dict = Depends(get_current_user),
):
    """Whether this provider may be used on this job, and if not, why."""
    site_id, _ = _ctx(user)
    return await ProviderService.check_may_subcontract(
        job_id, provider_id, site_id, service or None
    )
