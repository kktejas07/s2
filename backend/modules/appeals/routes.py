from typing import Optional

from fastapi import APIRouter, Body, Depends

from core.auth import get_current_user
from modules.appeals.service import AppealService

router = APIRouter(prefix="/appeals", tags=["Appeals"])


@router.get("", include_in_schema=False)
@router.get("/")
async def list_appeals(
    status: str = "",
    entity_type: str = "",
    entity_id: str = "",
    user: dict = Depends(get_current_user),
):
    return await AppealService.list_appeals(
        user.get("site_id", "SITE-01"), status, entity_type, entity_id
    )


@router.get("/summary")
async def appeal_summary(user: dict = Depends(get_current_user)):
    """How many, how long, and how often the original decision was wrong -
    what a management review asks for."""
    return await AppealService.summary(user.get("site_id", "SITE-01"))


@router.post("", include_in_schema=False)
@router.post("/")
async def raise_appeal(data: dict = Body(...), user: dict = Depends(get_current_user)):
    """Contest an inspection decision. Distinct from a complaint, which is
    about service rather than the technical conclusion."""
    appeal = await AppealService.raise_appeal(
        data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001")
    )
    return appeal.model_dump(exclude={"id"})


@router.get("/{appeal_id}")
async def get_appeal(appeal_id: str, user: dict = Depends(get_current_user)):
    appeal = await AppealService.get(appeal_id, user.get("site_id", "SITE-01"))
    return appeal.model_dump(exclude={"id"})


@router.post("/{appeal_id}/reviewers")
async def assign_reviewers(
    appeal_id: str,
    reviewer_person_ids: list[str] = Body(..., embed=True),
    user: dict = Depends(get_current_user),
):
    """Assign an independent panel. Anyone who took part in the original
    decision is refused."""
    appeal = await AppealService.assign_reviewers(
        appeal_id, reviewer_person_ids,
        user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )
    return appeal.model_dump(exclude={"id"})


@router.post("/{appeal_id}/decide")
async def decide_appeal(
    appeal_id: str,
    status: str,
    outcome: str = Body(..., embed=True),
    decided_by: str = Body(..., embed=True),
    remedy_reference: Optional[str] = Body(None, embed=True),
    user: dict = Depends(get_current_user),
):
    appeal = await AppealService.decide(
        appeal_id, status, outcome, decided_by,
        user.get("site_id", "SITE-01"), remedy_reference,
    )
    return appeal.model_dump(exclude={"id"})
