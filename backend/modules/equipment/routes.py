from typing import Optional

from fastapi import APIRouter, Body, Depends

from core.auth import get_current_user
from modules.equipment.service import EquipmentService, calibration_state, is_usable

router = APIRouter(prefix="/equipment", tags=["Equipment"])


@router.get("", include_in_schema=False)
@router.get("/")
async def list_equipment(
    status: str = "",
    work_type_code: str = "",
    due_within_days: Optional[int] = None,
    user: dict = Depends(get_current_user),
):
    return await EquipmentService.list_equipment(
        user.get("site_id", "SITE-01"), status, work_type_code, due_within_days
    )


@router.get("/calibration-due")
async def calibration_due(horizon_days: int = 30, user: dict = Depends(get_current_user)):
    """What is lapsed now and what lapses soon - two different problems."""
    return await EquipmentService.due_for_calibration(
        user.get("site_id", "SITE-01"), horizon_days
    )


@router.post("", include_in_schema=False)
@router.post("/")
async def register_equipment(data: dict = Body(...), user: dict = Depends(get_current_user)):
    item = await EquipmentService.create(
        data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001")
    )
    return item.model_dump(exclude={"id"})


@router.get("/{equipment_id}")
async def get_equipment(equipment_id: str, user: dict = Depends(get_current_user)):
    item = await EquipmentService.get(equipment_id, user.get("site_id", "SITE-01"))
    usable, reason = is_usable(item)
    return {
        **item.model_dump(exclude={"id"}),
        "calibration": calibration_state(item),
        "usable": usable,
        "unusable_reason": reason,
    }


@router.post("/{equipment_id}/calibration")
async def record_calibration(
    equipment_id: str, data: dict = Body(...), user: dict = Depends(get_current_user)
):
    """Record a calibration. A failure quarantines the instrument and names the
    work it touched since it was last known good."""
    return await EquipmentService.record_calibration(
        equipment_id, data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001")
    )


@router.get("/{equipment_id}/calibration")
async def calibration_history(equipment_id: str, user: dict = Depends(get_current_user)):
    return await EquipmentService.calibration_history(
        equipment_id, user.get("site_id", "SITE-01")
    )


@router.post("/{equipment_id}/usage")
async def record_usage(
    equipment_id: str,
    work_package_id: Optional[str] = None,
    job_id: Optional[str] = None,
    used_by_person_id: Optional[str] = None,
    allow_out_of_calibration: bool = False,
    user: dict = Depends(get_current_user),
):
    """Log that an instrument was used on a piece of work."""
    usage = await EquipmentService.record_usage(
        equipment_id, work_package_id, job_id, used_by_person_id,
        user.get("site_id", "SITE-01"), allow_out_of_calibration,
    )
    return usage.model_dump(exclude={"id"})


@router.patch("/{equipment_id}/status")
async def set_status(
    equipment_id: str,
    status: str,
    reason: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    item = await EquipmentService.set_status(
        equipment_id, status, reason,
        user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"),
    )
    return item.model_dump(exclude={"id"})


@router.get("/usage/work-package/{work_package_id}")
async def usage_for_package(work_package_id: str, user: dict = Depends(get_current_user)):
    return await EquipmentService.usage_for_work_package(
        work_package_id, user.get("site_id", "SITE-01")
    )
