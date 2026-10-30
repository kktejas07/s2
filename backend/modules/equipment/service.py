"""Equipment register, calibration and usage."""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException

from core.audit import AuditAction, record as audit
from core.sequences import next_identifier
from modules.equipment.models import (
    CalibrationRecord,
    CalibrationResult,
    Equipment,
    EquipmentStatus,
    EquipmentUsage,
)

VALID_STATUSES = {s.value for s in EquipmentStatus}
VALID_RESULTS = {r.value for r in CalibrationResult}

#: Statuses from which an instrument may legitimately be used.
USABLE_STATUSES = {EquipmentStatus.IN_SERVICE.value}


def calibration_state(item: Equipment, at: Optional[datetime] = None) -> dict:
    """Derived, never stored: a stored flag is wrong the morning after.

    Returns the facts a caller needs to decide, rather than a bare boolean, so
    a screen can show "due in 9 days" instead of just "ok".
    """
    now = at or datetime.now()
    due = item.calibration_due_on
    if due is None:
        return {
            "in_calibration": False,
            "reason": "no calibration recorded",
            "days_remaining": None,
            "due_on": None,
        }
    days = (due - now).days
    return {
        "in_calibration": due >= now,
        "reason": None if due >= now else f"calibration lapsed on {due:%Y-%m-%d}",
        "days_remaining": days,
        "due_on": due,
    }


def is_usable(item: Equipment, at: Optional[datetime] = None) -> tuple[bool, Optional[str]]:
    """Whether this instrument may be used for inspection work right now."""
    if not item.is_active:
        return False, "equipment is not active"
    if item.status not in USABLE_STATUSES:
        return False, f"equipment is {item.status.replace('_', ' ').lower()}"
    state = calibration_state(item, at)
    if not state["in_calibration"]:
        return False, state["reason"]
    return True, None


class EquipmentService:

    @staticmethod
    async def create(data: dict, site_id: str = "SITE-01", user_id: str = "USR-001") -> Equipment:
        if not (data.get("asset_tag") or "").strip():
            raise HTTPException(400, "Equipment needs an asset tag - it is what an inspector writes on the report")
        if not (data.get("name") or "").strip():
            raise HTTPException(400, "Equipment needs a name")

        existing = await Equipment.find_one(
            Equipment.asset_tag == data["asset_tag"].strip(), Equipment.site_id == site_id
        )
        if existing:
            raise HTTPException(409, f"Asset tag '{data['asset_tag']}' is already registered")

        data = dict(data)
        data["site_id"] = site_id
        data["created_by"] = user_id
        data["equipment_id"] = await next_identifier(
            Equipment, "equipment_id", site_id, "EQP", year_scoped=False, width=5, kind="equipment"
        )
        item = Equipment(**data)
        await item.insert()

        await audit("equipment", item.equipment_id, AuditAction.CREATE,
                    actor={"user_id": user_id}, note=f"Registered {item.asset_tag}",
                    site_id=site_id)
        return item

    @staticmethod
    async def get(equipment_id: str, site_id: str = "SITE-01") -> Equipment:
        item = await Equipment.find_one(
            Equipment.equipment_id == equipment_id, Equipment.site_id == site_id
        )
        if not item:
            raise HTTPException(404, f"Equipment '{equipment_id}' not found")
        return item

    @staticmethod
    async def list_equipment(
        site_id: str = "SITE-01",
        status: str = "",
        work_type_code: str = "",
        due_within_days: Optional[int] = None,
    ):
        query: dict = {"site_id": site_id, "is_active": True}
        if status:
            query["status"] = status
        if work_type_code:
            query["applicable_work_types"] = work_type_code
        if due_within_days is not None:
            query["calibration_due_on"] = {
                "$lte": datetime.now() + timedelta(days=due_within_days)
            }

        items = await Equipment.find(query).sort(Equipment.calibration_due_on).to_list()
        return {
            "total": len(items),
            "data": [
                {**i.model_dump(exclude={"id"}), "calibration": calibration_state(i)}
                for i in items
            ],
        }

    @staticmethod
    async def due_for_calibration(site_id: str = "SITE-01", horizon_days: int = 30):
        """What is lapsed now, and what lapses soon - the two different
        problems a technical manager has."""
        items = await Equipment.find(
            Equipment.site_id == site_id, Equipment.is_active == True  # noqa: E712
        ).to_list()
        now = datetime.now()
        lapsed, soon, uncalibrated = [], [], []
        for i in items:
            state = calibration_state(i, now)
            row = {
                "equipment_id": i.equipment_id, "asset_tag": i.asset_tag,
                "name": i.name, "status": i.status, **state,
            }
            if state["due_on"] is None:
                uncalibrated.append(row)
            elif not state["in_calibration"]:
                lapsed.append(row)
            elif state["days_remaining"] is not None and state["days_remaining"] <= horizon_days:
                soon.append(row)
        return {
            "lapsed": lapsed,
            "due_within_horizon": soon,
            "never_calibrated": uncalibrated,
            "horizon_days": horizon_days,
        }

    @staticmethod
    async def record_calibration(
        equipment_id: str, data: dict, site_id: str = "SITE-01", user_id: str = "USR-001"
    ) -> dict:
        """Record a calibration event and move the due date forward."""
        item = await EquipmentService.get(equipment_id, site_id)

        result = data.get("result") or CalibrationResult.PASS.value
        if result not in VALID_RESULTS:
            raise HTTPException(400, f"Invalid result '{result}'. Expected one of: {sorted(VALID_RESULTS)}")

        calibrated_on = data.get("calibrated_on") or datetime.now()
        if isinstance(calibrated_on, str):
            calibrated_on = datetime.fromisoformat(calibrated_on)
        interval = int(data.get("interval_months") or item.calibration_interval_months or 12)
        due_on = data.get("due_on") or (calibrated_on + timedelta(days=interval * 30))
        if isinstance(due_on, str):
            due_on = datetime.fromisoformat(due_on)

        record = CalibrationRecord(
            record_id=await next_identifier(
                CalibrationRecord, "record_id", site_id, "CAL", kind="calibration"
            ),
            site_id=site_id,
            equipment_id=equipment_id,
            calibrated_on=calibrated_on,
            due_on=due_on,
            result=result,
            certificate_no=data.get("certificate_no"),
            calibrated_by=data.get("calibrated_by"),
            traceable_to=data.get("traceable_to"),
            deviation_found=data.get("deviation_found"),
            impact_assessment=data.get("impact_assessment"),
            recorded_by=user_id,
        )
        await record.insert()

        affected: list[str] = []
        if result == CalibrationResult.FAIL.value:
            # A failed calibration casts doubt backwards. Quarantine the
            # instrument and name the work it touched since it was last known
            # good, rather than leaving someone to work that out by hand.
            item.status = EquipmentStatus.QUARANTINED.value
            item.quarantine_reason = (
                f"Calibration {record.record_id} failed on {calibrated_on:%Y-%m-%d}"
            )
            affected = await EquipmentService._work_since(
                equipment_id, item.last_calibrated_on, site_id
            )
        else:
            item.last_calibrated_on = calibrated_on
            item.calibration_due_on = due_on
            item.calibration_certificate_no = record.certificate_no
            item.calibrated_by = record.calibrated_by
            item.traceable_to = record.traceable_to
            if item.status == EquipmentStatus.OUT_FOR_CALIBRATION.value:
                item.status = EquipmentStatus.IN_SERVICE.value

        item.updated_at = datetime.now()
        await item.save()

        await audit(
            "equipment", equipment_id, AuditAction.UPDATE,
            actor={"user_id": user_id},
            note=f"Calibration {result} - certificate {record.certificate_no or 'n/a'}",
            context={
                "record_id": record.record_id, "result": result,
                "due_on": str(due_on), "affected_work_packages": affected,
            },
            site_id=site_id,
        )
        return {
            "record": record.model_dump(exclude={"id"}),
            "equipment": item.model_dump(exclude={"id"}),
            "calibration": calibration_state(item),
            "affected_work_packages": affected,
        }

    @staticmethod
    async def _work_since(
        equipment_id: str, since: Optional[datetime], site_id: str
    ) -> list[str]:
        query: dict = {"site_id": site_id, "equipment_id": equipment_id}
        if since:
            query["used_on"] = {"$gte": since}
        rows = await EquipmentUsage.find(query).to_list()
        return sorted({r.work_package_id for r in rows if r.work_package_id})

    @staticmethod
    async def calibration_history(equipment_id: str, site_id: str = "SITE-01"):
        rows = (
            await CalibrationRecord.find(
                CalibrationRecord.equipment_id == equipment_id,
                CalibrationRecord.site_id == site_id,
            )
            .sort(-CalibrationRecord.calibrated_on)
            .to_list()
        )
        return {"total": len(rows), "data": [r.model_dump(exclude={"id"}) for r in rows]}

    @staticmethod
    async def record_usage(
        equipment_id: str,
        work_package_id: Optional[str] = None,
        job_id: Optional[str] = None,
        used_by_person_id: Optional[str] = None,
        site_id: str = "SITE-01",
        allow_out_of_calibration: bool = False,
    ) -> EquipmentUsage:
        """Log that an instrument was used, refusing one that should not be.

        `allow_out_of_calibration` exists because reality intrudes - an
        instrument may be used before a lapse is noticed, and the record should
        reflect what happened. It is recorded as such rather than hidden.
        """
        item = await EquipmentService.get(equipment_id, site_id)
        usable, reason = is_usable(item)
        if not usable and not allow_out_of_calibration:
            raise HTTPException(
                409,
                f"{item.asset_tag} cannot be used: {reason}. A measurement taken with "
                f"it would not be defensible. Pass allow_out_of_calibration=true only "
                f"to record a use that has already happened.",
            )

        state = calibration_state(item)
        usage = EquipmentUsage(
            usage_id=await next_identifier(
                EquipmentUsage, "usage_id", site_id, "USE", kind="equipment_usage", width=5
            ),
            site_id=site_id,
            equipment_id=equipment_id,
            work_package_id=work_package_id,
            job_id=job_id,
            used_by_person_id=used_by_person_id,
            calibration_due_at_use=item.calibration_due_on,
            was_in_calibration=bool(state["in_calibration"]),
            notes=None if usable else f"Recorded despite: {reason}",
        )
        await usage.insert()
        return usage

    @staticmethod
    async def usage_for_work_package(work_package_id: str, site_id: str = "SITE-01"):
        rows = await EquipmentUsage.find(
            EquipmentUsage.work_package_id == work_package_id,
            EquipmentUsage.site_id == site_id,
        ).to_list()
        return {"total": len(rows), "data": [r.model_dump(exclude={"id"}) for r in rows]}

    @staticmethod
    async def set_status(
        equipment_id: str, status: str, reason: Optional[str] = None,
        site_id: str = "SITE-01", user_id: str = "USR-001",
    ) -> Equipment:
        if status not in VALID_STATUSES:
            raise HTTPException(400, f"Invalid status '{status}'. Expected one of: {sorted(VALID_STATUSES)}")
        item = await EquipmentService.get(equipment_id, site_id)
        previous = item.status
        item.status = status
        if status == EquipmentStatus.QUARANTINED.value:
            if not (reason or "").strip():
                raise HTTPException(400, "Quarantining equipment needs a reason")
            item.quarantine_reason = reason.strip()
        item.updated_at = datetime.now()
        await item.save()

        await audit("equipment", equipment_id, AuditAction.STATUS_CHANGE,
                    actor={"user_id": user_id},
                    before={"status": previous}, after={"status": status},
                    note=reason, site_id=site_id)
        return item
