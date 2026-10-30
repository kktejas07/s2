from typing import Optional
from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.payments.service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments & Collections"])


@router.get("/")
async def list_payments(
    client_id: str = "",
    invoice_id: str = "",
    page: int = 1,
    per_page: int = 100,
    user: dict = Depends(get_current_user),
):
    return await PaymentService.list(
        user.get("site_id", "SITE-01"), client_id, invoice_id, page, per_page,
    )


@router.get("/{payment_id}")
async def get_payment(payment_id: str, user: dict = Depends(get_current_user)):
    return await PaymentService.get(payment_id, user.get("site_id", "SITE-01"))


@router.post("/")
async def create_payment(data: dict, user: dict = Depends(get_current_user)):
    return await PaymentService.create(
        data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )


@router.put("/{payment_id}")
async def update_payment(payment_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await PaymentService.update(payment_id, data, user.get("site_id", "SITE-01"))


@router.patch("/{payment_id}/tds-reconcile")
async def reconcile_tds(payment_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await PaymentService.reconcile_tds(payment_id, data, user.get("site_id", "SITE-01"))


# Dunning / collections

@router.get("/dunning/")
async def list_dunning(
    invoice_id: str = "",
    status: str = "",
    page: int = 1,
    per_page: int = 50,
    user: dict = Depends(get_current_user),
):
    return await PaymentService.list_dunning(
        user.get("site_id", "SITE-01"), invoice_id, status, page, per_page,
    )


@router.post("/dunning/")
async def create_dunning(data: dict, user: dict = Depends(get_current_user)):
    return await PaymentService.create_dunning(
        data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )


@router.patch("/dunning/{dunning_id}/resolve")
async def resolve_dunning(dunning_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await PaymentService.resolve_dunning(dunning_id, data, user.get("site_id", "SITE-01"))
