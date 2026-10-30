from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.invoices.service import InvoiceService

router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.get("", include_in_schema=False)
@router.get("/")
async def list(
    search: str = "",
    alpha: str = "",
    payment_status: str = "",
    status: str = "",
    job_id: str = "",
    page: int = 1,
    per_page: int = 100,
    user: dict = Depends(get_current_user)
):
    return await InvoiceService.list(
        user.get("site_id", "SITE-01"),
        search,
        alpha,
        payment_status,
        status,
        job_id,
        page,
        per_page
    )


@router.get("/eligible-visits")
async def eligible_visits(user: dict = Depends(get_current_user)):
    return {"data": await InvoiceService.get_eligible_visits(user.get("site_id", "SITE-01"))}


@router.get("/{invoice_id}")
async def get(invoice_id: str, user: dict = Depends(get_current_user)):
    return await InvoiceService.get(invoice_id, user.get("site_id", "SITE-01"))


@router.post("/")
async def create(data: dict, user: dict = Depends(get_current_user)):
    return await InvoiceService.create(data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-01"))


@router.post("/{invoice_id}/record-payment")
async def record_payment(
    invoice_id: str,
    payment_mode: str = "NEFT",
    transaction_ref: str = "TXN-MANUAL",
    payment_date: str = "",
    user: dict = Depends(get_current_user)
):
    return await InvoiceService.record_payment(invoice_id, payment_mode, transaction_ref, payment_date, user.get("site_id", "SITE-01"))


@router.post("/{invoice_id}/cancel")
async def cancel(invoice_id: str, reason: str, user: dict = Depends(get_current_user)):
    return await InvoiceService.cancel(invoice_id, reason, user.get("user_id", "USR-01"))


@router.post("/{invoice_id}/toggle-freeze")
async def toggle_freeze(invoice_id: str, user: dict = Depends(get_current_user)):
    return await InvoiceService.toggle_freeze(invoice_id, user.get("site_id", "SITE-01"))
