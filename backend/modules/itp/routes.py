"""ITP, hold points and inspection calls. Access governed by core/policy.py."""
from fastapi import APIRouter, Body, Depends

from core.auth import get_current_user
from modules.itp import extraction
from modules.itp.service import ITPService

router = APIRouter(prefix="/itps", tags=["Inspection & Test Plans"])
calls = APIRouter(prefix="/inspection-calls", tags=["Inspection calls"])


def _ctx(user: dict) -> tuple[str, str]:
    return user.get("site_id", "SITE-01"), user.get("user_id", "USR-001")


# ------------------------------------------------------------------ plans

@router.get("/")
async def list_itps(job_id: str = "", user: dict = Depends(get_current_user)):
    site_id, _ = _ctx(user)
    return await ITPService.list(site_id, job_id)


@router.post("/")
async def create_itp(data: dict, user: dict = Depends(get_current_user)):
    site_id, user_id = _ctx(user)
    return await ITPService.create(data, site_id, user_id)


@router.post("/extract")
async def extract_itp(body: dict = Body(...), user: dict = Depends(get_current_user)):
    """Propose points from a document's text.

    Returns a draft and writes nothing. The plan cannot be approved until a
    person has confirmed what was read.
    """
    return await extraction.extract(
        body.get("document_text", ""), body.get("source"),
    )


@router.get("/{itp_id}")
async def get_itp(itp_id: str, user: dict = Depends(get_current_user)):
    site_id, _ = _ctx(user)
    plan = await ITPService.get(itp_id, site_id)
    return plan.model_dump(exclude={"id"})


@router.post("/{itp_id}/approve")
async def approve_itp(itp_id: str, user: dict = Depends(get_current_user)):
    site_id, user_id = _ctx(user)
    return await ITPService.approve(itp_id, site_id, user_id)


@router.post("/{itp_id}/confirm-extraction")
async def confirm_extraction(itp_id: str, user: dict = Depends(get_current_user)):
    """Record that a person has read the extracted points and stands behind
    them. Required before the plan can be approved."""
    site_id, user_id = _ctx(user)
    return await ITPService.confirm_extraction(itp_id, site_id, user_id)


# ------------------------------------------------------------------ calls

@calls.get("/")
async def list_calls(
    status: str = "", job_id: str = "", open_only: bool = False,
    user: dict = Depends(get_current_user),
):
    site_id, _ = _ctx(user)
    return await ITPService.list_calls(site_id, status, job_id, open_only)


@calls.get("/forecast")
async def forecast(days: int = 14, user: dict = Depends(get_current_user)):
    """What is coming, against the people available to meet it."""
    site_id, _ = _ctx(user)
    return await ITPService.forecast(site_id, days)


@calls.post("/sweep")
async def sweep(user: dict = Depends(get_current_user)):
    """Mark calls whose date has passed with nobody there, and report which
    hold points that leaves blocking work."""
    site_id, _ = _ctx(user)
    return await ITPService.sweep_missed(site_id)


@calls.post("/")
async def raise_call(data: dict, user: dict = Depends(get_current_user)):
    site_id, user_id = _ctx(user)
    return await ITPService.raise_call(data, site_id, user_id)


@calls.get("/{call_id}/suggest")
async def suggest(call_id: str, user: dict = Depends(get_current_user)):
    site_id, _ = _ctx(user)
    return await ITPService.suggest_inspector(call_id, site_id)


@calls.post("/{call_id}/assign")
async def assign(call_id: str, person_id: str, user: dict = Depends(get_current_user)):
    site_id, user_id = _ctx(user)
    return await ITPService.assign(call_id, person_id, site_id, user_id)


@calls.post("/{call_id}/attend")
async def attend(
    call_id: str, body: dict = Body(...), user: dict = Depends(get_current_user)
):
    site_id, user_id = _ctx(user)
    return await ITPService.record_attendance(call_id, body, site_id, user_id)


@calls.post("/{call_id}/waive")
async def waive(
    call_id: str, body: dict = Body(...), user: dict = Depends(get_current_user)
):
    """Release a point without attending. A hold point needs the client's
    authority."""
    site_id, user_id = _ctx(user)
    return await ITPService.waive(call_id, body, site_id, user_id)


@calls.post("/{call_id}/decline")
async def decline(
    call_id: str, body: dict = Body(...), user: dict = Depends(get_current_user)
):
    site_id, user_id = _ctx(user)
    return await ITPService.decline(call_id, body, site_id, user_id)
