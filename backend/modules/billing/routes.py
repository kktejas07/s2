from typing import Optional

from fastapi import APIRouter, Depends

from core.auth import MANAGES_MONEY, get_current_user, require_roles
from modules.billing.service import BillingService

router = APIRouter(prefix="/billing", tags=["Billing"])


@router.get("/term-options")
async def term_options(user: dict = Depends(get_current_user)):
    """Valid payment terms and billing frequencies, for form dropdowns."""
    return await BillingService.term_options()


@router.get("/queue")
async def billable_queue(job_id: str = "", user: dict = Depends(get_current_user)):
    """Certifications issued and not yet invoiced, grouped by job."""
    return await BillingService.billable_queue(user.get("site_id", "SITE-01"), job_id)


@router.get("/receivables")
async def receivables(user: dict = Depends(get_current_user)):
    """Outstanding invoices by ageing bucket."""
    return await BillingService.receivables(user.get("site_id", "SITE-01"))


@router.get("/terms/{so_id}")
async def get_terms(so_id: str, user: dict = Depends(get_current_user)):
    terms = await BillingService.get_terms(so_id, user.get("site_id", "SITE-01"))
    return terms or {"so_id": so_id, "terms": None}


@router.put("/terms/{so_id}")
async def set_terms(so_id: str, data: dict, user: dict = Depends(get_current_user)):
    """Create or update the commercial terms on a service order."""
    return await BillingService.set_terms(
        so_id, data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001")
    )


@router.post("/invoices/from-certifications")
async def raise_invoice(
    data: dict,
    # Raising an invoice is a Finance action in the RBAC matrix.
    user: dict = Depends(require_roles(MANAGES_MONEY)),
):
    """Raise a draft invoice from issued certifications.

    Body: {certification_ids: [...], so_id?: str, intra_state?: bool}
    """
    return await BillingService.raise_invoice_from_certifications(
        data.get("certification_ids") or [],
        user.get("site_id", "SITE-01"),
        user.get("user_id", "USR-001"),
        data.get("so_id"),
        bool(data.get("intra_state", True)),
    )
