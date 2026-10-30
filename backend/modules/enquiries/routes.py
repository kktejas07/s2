"""Pre-sales API. See PEOPLE_AND_PRESALES_SPEC.md §5.5.

Access is governed by the matrix in core/policy.py, applied once on the
application, so there are no per-route role guards here.
"""
from fastapi import APIRouter, Body, Depends

from core.auth import get_current_user
from modules.enquiries.reason_codes import ReasonCode, seed as seed_reason_codes
from modules.enquiries.service import EnquiryService, PipelineService

router = APIRouter(prefix="/enquiries", tags=["Enquiries"])


def _ctx(user: dict) -> tuple[str, str]:
    return user.get("site_id", "SITE-01"), user.get("user_id", "USR-001")


@router.get("", include_in_schema=False)
@router.get("/")
async def list_enquiries(
    status: str = "",
    client_id: str = "",
    page: int = 1,
    per_page: int = 25,
    user: dict = Depends(get_current_user),
):
    site_id, _ = _ctx(user)
    return await EnquiryService.list(site_id, status, client_id, page, per_page)


@router.get("/reason-codes")
async def reason_codes(user: dict = Depends(get_current_user)):
    """The taxonomy behind every no-go and loss. Seeded on first read so a
    fresh deployment is not asked to invent it."""
    site_id, _ = _ctx(user)
    await seed_reason_codes(site_id)
    items = await ReasonCode.find(
        ReasonCode.site_id == site_id, ReasonCode.is_active == True  # noqa: E712
    ).to_list()
    return {
        "total": len(items),
        "data": [r.model_dump(exclude={"id"}) for r in items],
    }


@router.post("/")
async def create_enquiry(data: dict, user: dict = Depends(get_current_user)):
    site_id, user_id = _ctx(user)
    eq = await EnquiryService.create(data, site_id, user_id)
    return eq.model_dump(exclude={"id"})


@router.get("/{enquiry_id}")
async def get_enquiry(enquiry_id: str, user: dict = Depends(get_current_user)):
    """The enquiry with its decisions and revisions: the question asked of
    this screen is almost always how it got here, not what it is now."""
    site_id, _ = _ctx(user)
    return await EnquiryService.detail(enquiry_id, site_id)


@router.post("/{enquiry_id}/advance")
async def advance(
    enquiry_id: str, body: dict = Body(...), user: dict = Depends(get_current_user)
):
    site_id, user_id = _ctx(user)
    return await EnquiryService.advance(
        enquiry_id, body.get("to_status", ""), site_id, user_id, body.get("note")
    )


# --------------------------------------------------------------- gate 1

@router.post("/{enquiry_id}/scorecard")
async def build_scorecard(
    enquiry_id: str,
    auto_score: bool = True,
    user: dict = Depends(get_current_user),
):
    site_id, user_id = _ctx(user)
    return await EnquiryService.build_scorecard(enquiry_id, site_id, user_id, auto_score)


@router.post("/{enquiry_id}/decision")
async def decide(
    enquiry_id: str, body: dict = Body(...), user: dict = Depends(get_current_user)
):
    site_id, user_id = _ctx(user)
    return await EnquiryService.decide(enquiry_id, body, site_id, user_id)


@router.post("/{enquiry_id}/remediate")
async def remediate(
    enquiry_id: str, body: dict = Body(...), user: dict = Depends(get_current_user)
):
    site_id, user_id = _ctx(user)
    return await EnquiryService.remediate(enquiry_id, body, site_id, user_id)


# --------------------------------------------------------------- gate 2

@router.post("/{enquiry_id}/proposals")
async def create_proposal(
    enquiry_id: str, body: dict = Body(default={}), user: dict = Depends(get_current_user)
):
    site_id, user_id = _ctx(user)
    return await EnquiryService.create_proposal(enquiry_id, body, site_id, user_id)


@router.post("/{enquiry_id}/outcome")
async def record_outcome(
    enquiry_id: str, body: dict = Body(...), user: dict = Depends(get_current_user)
):
    site_id, user_id = _ctx(user)
    return await EnquiryService.record_outcome(enquiry_id, body, site_id, user_id)


@router.post("/{enquiry_id}/revive")
async def revive(
    enquiry_id: str, body: dict = Body(default={}), user: dict = Depends(get_current_user)
):
    site_id, user_id = _ctx(user)
    return await EnquiryService.revive(enquiry_id, body, site_id, user_id)


@router.post("/{enquiry_id}/close")
async def close(
    enquiry_id: str, body: dict = Body(default={}), user: dict = Depends(get_current_user)
):
    site_id, user_id = _ctx(user)
    return await EnquiryService.close(enquiry_id, body, site_id, user_id)


@router.post("/{enquiry_id}/convert")
async def convert(
    enquiry_id: str, body: dict = Body(default={}), user: dict = Depends(get_current_user)
):
    site_id, user_id = _ctx(user)
    return await EnquiryService.convert(enquiry_id, body, site_id, user_id)


# ------------------------------------------------------------- proposals

proposals = APIRouter(prefix="/proposals", tags=["Proposals"])


@proposals.post("/{proposal_id}/revisions")
async def add_revision(
    proposal_id: str, body: dict = Body(...), user: dict = Depends(get_current_user)
):
    site_id, user_id = _ctx(user)
    return await EnquiryService.add_revision(proposal_id, body, site_id, user_id)


@proposals.post("/{proposal_id}/revisions/{revision_no}/issue")
async def issue_revision(
    proposal_id: str, revision_no: int, user: dict = Depends(get_current_user)
):
    site_id, user_id = _ctx(user)
    return await EnquiryService.issue_revision(proposal_id, revision_no, site_id, user_id)


# -------------------------------------------------------------- pipeline

pipeline = APIRouter(prefix="/pipeline", tags=["Pipeline"])


@pipeline.get("/summary")
async def pipeline_summary(user: dict = Depends(get_current_user)):
    site_id, _ = _ctx(user)
    return await PipelineService.summary(site_id)


@pipeline.get("/loss-analysis")
async def loss_analysis(user: dict = Depends(get_current_user)):
    site_id, _ = _ctx(user)
    return await PipelineService.loss_analysis(site_id)
