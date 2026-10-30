"""Public verification. Unauthenticated by design - a client scanning a QR
code off a certificate has no IQE account and should not need one.

Listed in core/policy.py's UNAUTHENTICATED_PATHS and rate limited in
core/ratelimit.py, because an open endpoint keyed on a document reference is
an enumeration surface.
"""
from fastapi import APIRouter

from modules.verification.service import VerificationService

router = APIRouter(prefix="/verify", tags=["Public verification"])


@router.get("/{reference:path}")
async def verify(reference: str, site_id: str = ""):
    """Does IQE stand behind this document right now?

    Answers in one shape whether or not the reference exists, so the endpoint
    cannot be used to discover which references are real.
    """
    return await VerificationService.verify(reference, site_id or None)
