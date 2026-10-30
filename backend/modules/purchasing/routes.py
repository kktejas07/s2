from typing import Optional
from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.purchasing.service import PurchasingService

router = APIRouter(prefix="/purchasing", tags=["Purchasing & Vendor Payments"])


# --- Requisitions ---

@router.get("/")
async def list_requisitions(
    status: str = "",
    vendor_type: str = "",
    page: int = 1,
    per_page: int = 50,
    user: dict = Depends(get_current_user),
):
    return await PurchasingService.list_requisitions(
        user.get("site_id", "SITE-01"), status, vendor_type, page, per_page,
    )


@router.get("/{requisition_id}")
async def get_requisition(requisition_id: str, user: dict = Depends(get_current_user)):
    return await PurchasingService.get_requisition(
        requisition_id, user.get("site_id", "SITE-01"),
    )


@router.post("/")
async def create_requisition(data: dict, user: dict = Depends(get_current_user)):
    return await PurchasingService.create_requisition(
        data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )


@router.patch("/{requisition_id}/approve")
async def approve_requisition(
    requisition_id: str, data: dict = {}, user: dict = Depends(get_current_user),
):
    return await PurchasingService.approve_requisition(
        requisition_id, data,
        user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )


@router.patch("/{requisition_id}/reject")
async def reject_requisition(
    requisition_id: str, data: dict = {}, user: dict = Depends(get_current_user),
):
    return await PurchasingService.reject_requisition(
        requisition_id, data,
        user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )


# --- Vendor payments ---

@router.get("/vendor-payments/")
async def list_vendor_payments(
    vendor_type: str = "",
    status: str = "",
    page: int = 1,
    per_page: int = 50,
    user: dict = Depends(get_current_user),
):
    return await PurchasingService.list_vendor_payments(
        user.get("site_id", "SITE-01"), vendor_type, status, page, per_page,
    )


@router.post("/vendor-payments/")
async def create_vendor_payment(data: dict, user: dict = Depends(get_current_user)):
    return await PurchasingService.create_vendor_payment(
        data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )


@router.patch("/vendor-payments/{vp_id}/approve")
async def approve_vendor_payment(
    vp_id: str, data: dict = {}, user: dict = Depends(get_current_user),
):
    return await PurchasingService.approve_vendor_payment(
        vp_id, data,
        user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )


@router.patch("/vendor-payments/{vp_id}/pay")
async def pay_vendor(
    vp_id: str, data: dict = {}, user: dict = Depends(get_current_user),
):
    return await PurchasingService.pay_vendor(
        vp_id, data,
        user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )


@router.get("/vendor-payments/msme-alerts")
async def msme_alerts(user: dict = Depends(get_current_user)):
    return await PurchasingService.msme_alerts(user.get("site_id", "SITE-01"))
