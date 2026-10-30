from typing import Optional

from fastapi import APIRouter, Depends

from core.auth import get_current_user
from modules.assignments.service import AssignmentService

router = APIRouter(prefix="/assignments", tags=["Assignments"])


@router.get("", include_in_schema=False)
@router.get("/")
async def list_assignments(
    work_package_id: str = "",
    person_id: str = "",
    status: str = "",
    page: int = 1,
    per_page: int = 100,
    user: dict = Depends(get_current_user),
):
    return await AssignmentService.list(
        user.get("site_id", "SITE-01"), work_package_id, person_id, status, page, per_page
    )


@router.get("/roster")
async def roster(person_id: str = "", user: dict = Depends(get_current_user)):
    """Live assignments with their windows, for the calendar view."""
    return await AssignmentService.roster(user.get("site_id", "SITE-01"), person_id)


@router.get("/recommend/{work_package_id}")
async def recommend(
    work_package_id: str, top_n: int = 5, user: dict = Depends(get_current_user)
):
    """Rank eligible officers. Everyone excluded is listed with the reason."""
    return await AssignmentService.recommend(
        work_package_id, user.get("site_id", "SITE-01"), top_n
    )


@router.post("/assign")
async def assign(data: dict, user: dict = Depends(get_current_user)):
    """Assign a person. Eligibility is re-checked at this moment, not trusted
    from the recommendation that produced it."""
    return await AssignmentService.assign(
        data["work_package_id"],
        data["person_id"],
        user.get("site_id", "SITE-01"),
        user.get("user_id", "USR-001"),
        data.get("role", "INSPECTION_OFFICER"),
        data.get("method", "manual"),
        bool(data.get("client_approval_required", False)),
        data.get("supervised_by_person_id"),
    )


@router.post("/auto-assign/{work_package_id}")
async def auto_assign(work_package_id: str, user: dict = Depends(get_current_user)):
    """Assign the top candidate, where the work type permits it."""
    return await AssignmentService.auto_assign(
        work_package_id, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001")
    )


@router.get("/{assignment_id}")
async def get_assignment(assignment_id: str, user: dict = Depends(get_current_user)):
    return await AssignmentService.get(assignment_id, user.get("site_id", "SITE-01"))


@router.patch("/{assignment_id}/status")
async def transition(
    assignment_id: str,
    to_status: str,
    reason: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    return await AssignmentService.transition(
        assignment_id, to_status, user.get("site_id", "SITE-01"), reason
    )
