from typing import Optional

from fastapi import APIRouter, Depends

from core.auth import AUTHORIZES_PERSONNEL, get_current_user, require_roles
from modules.people.service import PeopleService

router = APIRouter(prefix="/people", tags=["People"])


@router.get("/")
async def list_people(
    category: str = "",
    employment_status: str = "",
    deployable: Optional[bool] = None,
    discipline: str = "",
    search: str = "",
    page: int = 1,
    per_page: int = 100,
    user: dict = Depends(get_current_user),
):
    return await PeopleService.list(
        user.get("site_id", "SITE-01"), category, employment_status,
        deployable, discipline, search, page, per_page,
    )


@router.get("/options")
async def people_options(user: dict = Depends(get_current_user)):
    return await PeopleService.options()


@router.get("/summary")
async def people_summary(user: dict = Depends(get_current_user)):
    return await PeopleService.summary(user.get("site_id", "SITE-01"))


@router.get("/deployable")
async def deployable_pool(
    inspection_type: str = "",
    discipline: str = "",
    user: dict = Depends(get_current_user),
):
    """The assignment pool - only people past the authorization gate."""
    return await PeopleService.deployable_pool(
        user.get("site_id", "SITE-01"), inspection_type, discipline
    )


@router.get("/expiring")
async def expiring(days: int = 60, user: dict = Depends(get_current_user)):
    """Certifications and authorizations lapsing within the horizon."""
    return await PeopleService.expiring(user.get("site_id", "SITE-01"), days)


@router.post("/")
async def create_person(data: dict, user: dict = Depends(get_current_user)):
    return await PeopleService.create(
        data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001")
    )


@router.get("/{person_id}")
async def get_person(person_id: str, user: dict = Depends(get_current_user)):
    return await PeopleService.get(person_id, user.get("site_id", "SITE-01"))


@router.put("/{person_id}")
async def update_person(person_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await PeopleService.update(person_id, data, user.get("site_id", "SITE-01"))


@router.post("/{person_id}/refresh-deployability")
async def refresh_deployability(person_id: str, user: dict = Depends(get_current_user)):
    return await PeopleService.refresh_deployability(person_id, user.get("site_id", "SITE-01"))


@router.get("/{person_id}/profile")
async def get_profile(person_id: str, user: dict = Depends(get_current_user)):
    return await PeopleService.get_profile(person_id, user.get("site_id", "SITE-01"))


@router.post("/{person_id}/qualifications")
async def add_qualification(person_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await PeopleService.add_qualification(person_id, data, user.get("site_id", "SITE-01"))


@router.get("/{person_id}/authorizations")
async def list_authorizations(person_id: str, user: dict = Depends(get_current_user)):
    return await PeopleService.list_authorizations(person_id, user.get("site_id", "SITE-01"))


@router.post("/{person_id}/authorizations")
async def create_authorization(person_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await PeopleService.create_authorization(
        person_id, data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001")
    )


@router.patch("/authorizations/{authorization_id}")
async def decide_authorization(
    authorization_id: str,
    status: str,
    reason: Optional[str] = None,
    # Under ISO/IEC 17020 the authority to authorize inspection personnel sits
    # with a named competent technical function, not an administrative
    # permission - so this is the one action Admin alone should not hold.
    user: dict = Depends(require_roles(AUTHORIZES_PERSONNEL)),
):
    """Authorize, suspend or withdraw. Authorizing checks the evidence is complete."""
    return await PeopleService.decide_authorization(
        authorization_id, status, user.get("site_id", "SITE-01"),
        user.get("user_id", "USR-001"), reason,
    )


@router.post("/{person_id}/impartiality")
async def declare_impartiality(person_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await PeopleService.declare_impartiality(person_id, data, user.get("site_id", "SITE-01"))
