from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.jobs.service import JobService

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("", include_in_schema=False)
@router.get("/")
async def list(search: str = "", status: str = "", page: int = 1, per_page: int = 100, user: dict = Depends(get_current_user)):
    return await JobService.list(user.get("site_id", "SITE-01"), search, status, page, per_page)


@router.get("/dashboard")
async def dashboard(user: dict = Depends(get_current_user)):
    return await JobService.dashboard(user.get("site_id", "SITE-01"))


@router.get("/sow-templates")
async def get_sow_templates():
    return await JobService.get_sow_templates()


@router.post("/{job_id}/apply-sow-template")
async def apply_sow_template_to_job(
    job_id: str,
    data: dict,
    user: dict = Depends(get_current_user)
):
    return await JobService.apply_sow_template_to_job(
        job_id,
        data.get("template_code", "PV-ASME"),
        data.get("append", True),
        user.get("site_id", "SITE-01")
    )


@router.get("/{job_id}/roadmap")
async def get_roadmap(job_id: str, user: dict = Depends(get_current_user)):
    return await JobService.get_assignment_roadmap(job_id, user.get("site_id", "SITE-01"))


@router.get("/{job_id}")
async def get(job_id: str, include: str = "", user: dict = Depends(get_current_user)):
    return await JobService.get(job_id, user.get("site_id", "SITE-01"), include)


@router.post("", include_in_schema=False)
@router.post("/")
async def create(data: dict, user: dict = Depends(get_current_user)):
    return await JobService.create(data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-01"))


@router.post("/{job_id}/assign-inspector")
async def assign_inspector_for_approval(
    job_id: str,
    data: dict,
    user: dict = Depends(get_current_user)
):
    return await JobService.assign_inspector_for_approval(
        job_id,
        data.get("inspector_id"),
        data.get("inspector_name"),
        data.get("certifications", []),
        data.get("experience_years", 10),
        user.get("site_id", "SITE-01")
    )


@router.post("/{job_id}/client-approval")
async def client_approve_inspector(
    job_id: str,
    data: dict,
    user: dict = Depends(get_current_user)
):
    return await JobService.client_approve_inspector(
        job_id,
        data.get("approved", True),
        data.get("remarks", ""),
        user.get("site_id", "SITE-01")
    )


@router.post("/{job_id}/budget-schedule")
async def update_budget_and_schedule(
    job_id: str,
    data: dict,
    user: dict = Depends(get_current_user)
):
    return await JobService.update_budget_and_schedule(
        job_id,
        float(data.get("contract_amount", 0.0)),
        float(data.get("inspector_fee", 0.0)),
        float(data.get("travel_allowance", 0.0)),
        data.get("start_date"),
        data.get("end_date"),
        user.get("site_id", "SITE-01")
    )


@router.post("/{job_id}/scope-of-work")
async def update_scope_of_work(
    job_id: str,
    data: dict,
    user: dict = Depends(get_current_user)
):
    return await JobService.update_scope_of_work(
        job_id,
        data.get("sow_items", []),
        user.get("site_id", "SITE-01")
    )


@router.put("/{job_id}")
async def update(job_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await JobService.update(job_id, data, user.get("site_id", "SITE-01"))

