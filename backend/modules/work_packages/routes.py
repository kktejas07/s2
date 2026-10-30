from typing import Optional

from fastapi import APIRouter, Depends

from core.auth import get_current_user
from modules.work_packages.service import WorkPackageService

router = APIRouter(prefix="/work-packages", tags=["Work Packages"])


@router.get("", include_in_schema=False)
@router.get("/")
async def list_work_packages(
    job_id: str = "",
    work_type_code: str = "",
    status: str = "",
    search: str = "",
    page: int = 1,
    per_page: int = 100,
    user: dict = Depends(get_current_user),
):
    return await WorkPackageService.list(
        user.get("site_id", "SITE-01"), job_id, work_type_code, status, search, page, per_page
    )


@router.get("/summary")
async def work_package_summary(job_id: str = "", user: dict = Depends(get_current_user)):
    """Counts by status and work type - backs the coordinator dashboard tiles."""
    return await WorkPackageService.summary(user.get("site_id", "SITE-01"), job_id)


@router.post("/migrate-from-job/{job_id}")
async def migrate_from_job_sow(
    job_id: str,
    work_type_code: str,
    dry_run: bool = True,
    user: dict = Depends(get_current_user),
):
    """Promote Job.scope_of_work items into work packages. Defaults to a dry run."""
    return await WorkPackageService.migrate_from_job_sow(
        job_id, work_type_code, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"), dry_run
    )


@router.get("/{work_package_id}")
async def get_work_package(work_package_id: str, user: dict = Depends(get_current_user)):
    return await WorkPackageService.get(work_package_id, user.get("site_id", "SITE-01"))


@router.post("/")
async def create_work_package(data: dict, user: dict = Depends(get_current_user)):
    return await WorkPackageService.create(
        data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001")
    )


@router.put("/{work_package_id}")
async def update_work_package(
    work_package_id: str, data: dict, user: dict = Depends(get_current_user)
):
    return await WorkPackageService.update(work_package_id, data, user.get("site_id", "SITE-01"))


@router.patch("/{work_package_id}/status")
async def transition_work_package(
    work_package_id: str,
    to_status: str,
    reason: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    """Move a package through its lifecycle. Invalid transitions are rejected with 409."""
    return await WorkPackageService.transition(
        work_package_id, to_status, user.get("site_id", "SITE-01"),
        user.get("user_id", "USR-001"), reason
    )


@router.delete("/{work_package_id}")
async def deactivate_work_package(work_package_id: str, user: dict = Depends(get_current_user)):
    """Soft delete - assignments and certifications may still reference this package."""
    return await WorkPackageService.deactivate(work_package_id, user.get("site_id", "SITE-01"))
