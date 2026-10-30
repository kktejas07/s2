from typing import Optional
from fastapi import APIRouter, Body, Depends
from core.auth import get_current_user
from modules.recruitment.service import RecruitmentService

router = APIRouter(prefix="/recruitment", tags=["Recruitment & Onboarding"])


# ------------------------------------------------------------------
# H1 + H2: Manpower Requests
# ------------------------------------------------------------------

@router.get("/manpower-requests")
async def list_manpower_requests(
    status: Optional[str] = None, page: int = 1, per_page: int = 50,
    user: dict = Depends(get_current_user),
):
    return await RecruitmentService.list_manpower_requests(
        user.get("site_id", "SITE-01"), status, page, per_page,
    )


@router.post("/manpower-requests")
async def create_manpower_request(data: dict, user: dict = Depends(get_current_user)):
    return await RecruitmentService.create_manpower_request(
        data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )


@router.get("/manpower-requests/{request_id}")
async def get_manpower_request(request_id: str, user: dict = Depends(get_current_user)):
    return await RecruitmentService.get_manpower_request(request_id, user.get("site_id", "SITE-01"))


@router.patch("/manpower-requests/{request_id}/approve-budget")
async def approve_budget(
    request_id: str, body: dict = Body(default={}), user: dict = Depends(get_current_user),
):
    return await RecruitmentService.approve_budget(
        request_id, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
        body.get("remarks"),
    )


@router.patch("/manpower-requests/{request_id}/reject-budget")
async def reject_budget(
    request_id: str, body: dict = Body(default={}), user: dict = Depends(get_current_user),
):
    return await RecruitmentService.reject_budget(
        request_id, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
        body.get("remarks"),
    )


# ------------------------------------------------------------------
# H3: Candidates
# ------------------------------------------------------------------

@router.get("/candidates")
async def list_candidates(
    request_id: Optional[str] = None, status: Optional[str] = None, search: str = "",
    page: int = 1, per_page: int = 50, user: dict = Depends(get_current_user),
):
    return await RecruitmentService.list_candidates(
        user.get("site_id", "SITE-01"), request_id, status, search, page, per_page,
    )


@router.post("/candidates")
async def create_candidate(data: dict, user: dict = Depends(get_current_user)):
    return await RecruitmentService.create_candidate(
        data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )


@router.get("/candidates/{candidate_id}")
async def get_candidate(candidate_id: str, user: dict = Depends(get_current_user)):
    return await RecruitmentService.get_candidate(candidate_id, user.get("site_id", "SITE-01"))


@router.patch("/candidates/{candidate_id}/status")
async def update_candidate_status(
    candidate_id: str, body: dict = Body(...), user: dict = Depends(get_current_user),
):
    return await RecruitmentService.update_candidate_status(
        candidate_id, body["status"], user.get("site_id", "SITE-01"),
        user.get("user_id", "USR-001"), body.get("notes"),
    )


# ------------------------------------------------------------------
# H4: Technical Interviews
# ------------------------------------------------------------------

@router.get("/interviews")
async def list_interviews(
    candidate_id: Optional[str] = None, page: int = 1, per_page: int = 50,
    user: dict = Depends(get_current_user),
):
    return await RecruitmentService.list_interviews(
        user.get("site_id", "SITE-01"), candidate_id, page, per_page,
    )


@router.post("/interviews")
async def create_interview(data: dict, user: dict = Depends(get_current_user)):
    return await RecruitmentService.create_interview(
        data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )


@router.patch("/interviews/{interview_id}/result")
async def record_interview_result(
    interview_id: str, body: dict = Body(...), user: dict = Depends(get_current_user),
):
    return await RecruitmentService.record_interview_result(
        interview_id, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
        body["recommendation"], body.get("scores", {}), body.get("remarks"),
    )


# ------------------------------------------------------------------
# H5: Offer Letters
# ------------------------------------------------------------------

@router.get("/offers")
async def list_offers(
    candidate_id: Optional[str] = None, status: Optional[str] = None,
    page: int = 1, per_page: int = 50, user: dict = Depends(get_current_user),
):
    return await RecruitmentService.list_offers(
        user.get("site_id", "SITE-01"), candidate_id, status, page, per_page,
    )


@router.post("/offers")
async def create_offer(data: dict, user: dict = Depends(get_current_user)):
    return await RecruitmentService.create_offer(
        data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )


@router.patch("/offers/{offer_id}/send")
async def send_offer(offer_id: str, user: dict = Depends(get_current_user)):
    return await RecruitmentService.send_offer(
        offer_id, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )


@router.patch("/offers/{offer_id}/respond")
async def record_offer_response(
    offer_id: str, body: dict = Body(...), user: dict = Depends(get_current_user),
):
    return await RecruitmentService.record_offer_response(
        offer_id, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
        body["accepted"], body.get("decline_reason"),
    )


# ------------------------------------------------------------------
# H6: Induction
# ------------------------------------------------------------------

@router.post("/inductions")
async def create_induction(data: dict, user: dict = Depends(get_current_user)):
    return await RecruitmentService.create_induction(
        data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )


@router.get("/inductions/by-person/{person_id}")
async def get_induction_by_person(person_id: str, user: dict = Depends(get_current_user)):
    return await RecruitmentService.get_induction_by_person(person_id, user.get("site_id", "SITE-01"))


@router.get("/inductions/{induction_id}")
async def get_induction(induction_id: str, user: dict = Depends(get_current_user)):
    return await RecruitmentService.get_induction(induction_id, user.get("site_id", "SITE-01"))


@router.patch("/inductions/{induction_id}/item")
async def update_induction_item(
    induction_id: str, body: dict = Body(...), user: dict = Depends(get_current_user),
):
    return await RecruitmentService.update_induction_item(
        induction_id, body["item_code"], body.get("completed", True),
        user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )


@router.patch("/inductions/{induction_id}/complete")
async def complete_induction(induction_id: str, user: dict = Depends(get_current_user)):
    return await RecruitmentService.complete_induction(
        induction_id, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )
