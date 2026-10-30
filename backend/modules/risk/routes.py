"""Risk register and risk-based internal audit. Access governed by core/policy.py."""
from fastapi import APIRouter, Body, Depends

from core.auth import get_current_user
from modules.risk.service import AuditPlanService, RiskService

router = APIRouter(prefix="/risks", tags=["Risk register"])


def _ctx(user: dict) -> tuple[str, str]:
    return user.get("site_id", "SITE-01"), user.get("user_id", "USR-001")


@router.get("/")
async def list_risks(
    category: str = "",
    status: str = "",
    material_only: bool = False,
    user: dict = Depends(get_current_user),
):
    site_id, _ = _ctx(user)
    return await RiskService.list(site_id, category, status, material_only)


@router.get("/overdue")
async def overdue(user: dict = Depends(get_current_user)):
    """Where the register itself is failing."""
    site_id, _ = _ctx(user)
    return await RiskService.overdue(site_id)


@router.post("/")
async def create_risk(data: dict, user: dict = Depends(get_current_user)):
    site_id, user_id = _ctx(user)
    return await RiskService.create(data, site_id, user_id)


@router.get("/{risk_id}")
async def get_risk(risk_id: str, user: dict = Depends(get_current_user)):
    site_id, _ = _ctx(user)
    return await RiskService.detail(risk_id, site_id)


@router.post("/{risk_id}/review")
async def review_risk(
    risk_id: str, body: dict = Body(...), user: dict = Depends(get_current_user)
):
    site_id, user_id = _ctx(user)
    return await RiskService.review(risk_id, body, site_id, user_id)


audits = APIRouter(prefix="/internal-audits", tags=["Internal audits"])


@audits.get("/plan")
async def propose_plan(slots: int = 4, user: dict = Depends(get_current_user)):
    """What to audit next, derived from the register."""
    site_id, _ = _ctx(user)
    return await AuditPlanService.propose_plan(site_id, slots)


@audits.post("/")
async def plan_audit(body: dict = Body(...), user: dict = Depends(get_current_user)):
    site_id, user_id = _ctx(user)
    return await AuditPlanService.plan_audit(body, site_id, user_id)


@audits.post("/{audit_id}/complete")
async def complete_audit(
    audit_id: str, body: dict = Body(...), user: dict = Depends(get_current_user)
):
    site_id, user_id = _ctx(user)
    return await AuditPlanService.complete_audit(audit_id, body, site_id, user_id)


# ---------------------------------------------------------- impartiality

@router.get("/impartiality/exposure")
async def impartiality_exposure(
    window_days: int = 365, user: dict = Depends(get_current_user)
):
    """Client revenue concentration crossed with inspector dependence.

    Both halves of this already existed in the system and nothing joined
    them, which is why no screen could show the condition an assessor asks
    about by name.
    """
    from modules.risk.impartiality import ImpartialityExposure

    site_id = user.get("site_id", "SITE-01")
    return await ImpartialityExposure.compute(site_id, window_days=window_days)


@router.get("/impartiality/proposals")
async def impartiality_proposals(
    window_days: int = 365, user: dict = Depends(get_current_user)
):
    """Register entries the exposure suggests. Proposed, never written."""
    from modules.risk.impartiality import ImpartialityExposure

    site_id = user.get("site_id", "SITE-01")
    return await ImpartialityExposure.propose_risks(
        site_id, window_days=window_days
    )
