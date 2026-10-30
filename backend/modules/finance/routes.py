from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.finance.service import FinanceService

router = APIRouter(prefix="/finance", tags=["Finance & AR/AP"])


# ACCOUNTS RECEIVABLE (Debtors Modernization)
@router.get("/accounts-receivable")
async def list_ar(
    search: str = "",
    alpha: str = "",
    status: str = "",
    page: int = 1,
    per_page: int = 100,
    user: dict = Depends(get_current_user)
):
    return await FinanceService.list_ar(
        user.get("site_id", "SITE-01"),
        search,
        alpha,
        status,
        page,
        per_page
    )


@router.post("/accounts-receivable")
async def create_ar(data: dict, user: dict = Depends(get_current_user)):
    return await FinanceService.create_ar(data, user.get("site_id", "SITE-01"))


@router.post("/accounts-receivable/{ar_id}/settle")
async def record_ar_settlement(
    ar_id: str,
    paid_amount: float,
    payment_mode: str = "NEFT",
    transaction_ref: str = "TXN-AR",
    user: dict = Depends(get_current_user)
):
    return await FinanceService.record_ar_settlement(ar_id, paid_amount, payment_mode, transaction_ref, user.get("site_id", "SITE-01"))


# ACCOUNTS PAYABLE (Creditors Modernization)
@router.get("/accounts-payable")
async def list_ap(
    search: str = "",
    alpha: str = "",
    status: str = "",
    page: int = 1,
    per_page: int = 100,
    user: dict = Depends(get_current_user)
):
    return await FinanceService.list_ap(
        user.get("site_id", "SITE-01"),
        search,
        alpha,
        status,
        page,
        per_page
    )


@router.post("/accounts-payable")
async def create_ap(data: dict, user: dict = Depends(get_current_user)):
    return await FinanceService.create_ap(data, user.get("site_id", "SITE-01"))


@router.post("/accounts-payable/{ap_id}/disburse")
async def record_ap_disbursement(
    ap_id: str,
    paid_amount: float,
    payment_mode: str = "NEFT",
    transaction_ref: str = "TXN-AP",
    user: dict = Depends(get_current_user)
):
    return await FinanceService.record_ap_disbursement(ap_id, paid_amount, payment_mode, transaction_ref, user.get("site_id", "SITE-01"))


@router.get("/aging-sentinel")
async def get_aging_sentinel(user: dict = Depends(get_current_user)):
    return await FinanceService.aging_sentinel(user.get("site_id", "SITE-01"))


@router.get("/aging-sentinel/", include_in_schema=False)
async def get_aging_sentinel_slash(user: dict = Depends(get_current_user)):
    return await FinanceService.aging_sentinel(user.get("site_id", "SITE-01"))
