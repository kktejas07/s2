from typing import Optional
from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.regions.service import RegionService

router = APIRouter(prefix="/regions", tags=["Regions & Organization"])


# ── Regions ──────────────────────────────────────────────────────────

@router.get("/")
async def list_regions(user: dict = Depends(get_current_user)):
    return await RegionService.list_regions()


@router.get("/lookup/site/{site_id}")
async def get_region_for_site(site_id: str, user: dict = Depends(get_current_user)):
    region_code = await RegionService.get_region_for_site(site_id)
    return {"site_id": site_id, "region_code": region_code}


@router.post("/")
async def create_region(data: dict, user: dict = Depends(get_current_user)):
    return await RegionService.create_region(data, user.get("user_id", "USR-001"))


@router.get("/{region_code}")
async def get_region(region_code: str, user: dict = Depends(get_current_user)):
    return await RegionService.get_region(region_code)


@router.put("/{region_code}")
async def update_region(region_code: str, data: dict, user: dict = Depends(get_current_user)):
    return await RegionService.update_region(region_code, data, user.get("user_id", "USR-001"))


# ── Offices ──────────────────────────────────────────────────────────

@router.get("/{region_code}/offices")
async def list_offices(region_code: str, user: dict = Depends(get_current_user)):
    return await RegionService.list_offices(region_code)


@router.post("/{region_code}/offices")
async def create_office(region_code: str, data: dict, user: dict = Depends(get_current_user)):
    return await RegionService.create_office(region_code, data, user.get("user_id", "USR-001"))


# ── Inter-office settlements ─────────────────────────────────────────

@router.get("/settlements/list")
async def list_settlements(
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
    region: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    return await RegionService.list_settlements(period_year, period_month, region)


@router.post("/settlements")
async def create_settlement(data: dict, user: dict = Depends(get_current_user)):
    return await RegionService.create_settlement(data, user.get("user_id", "USR-001"))


@router.patch("/settlements/{settlement_id}/settle")
async def settle(settlement_id: str, user: dict = Depends(get_current_user)):
    return await RegionService.settle(settlement_id, user.get("user_id", "USR-001"))


# ── Inspector loans ──────────────────────────────────────────────────

@router.get("/loans/list")
async def list_loans(
    status: Optional[str] = None,
    home_region: Optional[str] = None,
    borrowing_region: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    return await RegionService.list_loans(status, home_region, borrowing_region)


@router.post("/loans")
async def create_loan(data: dict, user: dict = Depends(get_current_user)):
    return await RegionService.create_loan(data, user.get("user_id", "USR-001"))


@router.patch("/loans/{loan_id}/end")
async def end_loan(loan_id: str, user: dict = Depends(get_current_user)):
    return await RegionService.end_loan(loan_id, user.get("user_id", "USR-001"))


# ── Deputy coverage ──────────────────────────────────────────────────

@router.get("/deputies/list")
async def list_deputies(
    region_code: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    return await RegionService.list_active_deputies(region_code)


@router.post("/deputies")
async def set_deputy(data: dict, user: dict = Depends(get_current_user)):
    return await RegionService.set_deputy(data, user.get("user_id", "USR-001"))


@router.get("/deputies/chain/{role}/{region_code}")
async def get_escalation_chain(role: str, region_code: str, user: dict = Depends(get_current_user)):
    return await RegionService.get_escalation_chain(role, region_code)


# ── Cross-region audit validation ────────────────────────────────────

@router.get("/audit-check/{auditor_person_id}/{target_region_code}")
async def validate_cross_region_audit(
    auditor_person_id: str,
    target_region_code: str,
    user: dict = Depends(get_current_user),
):
    return await RegionService.validate_cross_region_audit(auditor_person_id, target_region_code)
