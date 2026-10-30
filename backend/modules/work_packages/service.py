from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from fastapi import HTTPException

from modules.jobs.models import Job
from core.audit import AuditAction, record as audit
from core.sequences import next_identifier
from modules.work_packages.models import (
    ALLOWED_TRANSITIONS,
    StatusTransition,
    WorkPackage,
    WorkPackageStatus,
)

logger = logging.getLogger(__name__)
from modules.work_types.models import WorkTypeDefinition


async def _next_work_package_id(site_id: str) -> str:
    """WP-YYYY-NNNN, sequential within the current year for this site.

    Allocated through an atomic counter rather than max-plus-one, which raced
    under concurrent creates. See core/sequences.py.
    """
    return await next_identifier(
        WorkPackage, "work_package_id", site_id, "WP", kind="work_package"
    )


class WorkPackageService:

    @staticmethod
    async def list(
        site_id: str = "SITE-01",
        job_id: str = "",
        work_type_code: str = "",
        status: str = "",
        search: str = "",
        page: int = 1,
        per_page: int = 100,
    ):
        query: dict = {"site_id": site_id, "is_active": True}
        if job_id:
            query["job_id"] = job_id
        if work_type_code:
            query["work_type_code"] = work_type_code
        if status:
            query["status"] = status
        if search:
            query["$or"] = [
                {"work_package_id": {"$regex": search, "$options": "i"}},
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"location": {"$regex": search, "$options": "i"}},
                {"client_name": {"$regex": search, "$options": "i"}},
                {"manufacturer_name": {"$regex": search, "$options": "i"}},
            ]

        total = await WorkPackage.find(query).count()
        items = (
            await WorkPackage.find(query)
            .sort(-WorkPackage.created_at)
            .skip((page - 1) * per_page)
            .limit(per_page)
            .to_list()
        )
        return {
            "total": total,
            "page": page,
            "per_page": per_page,
            "data": [i.model_dump(exclude={"id"}) for i in items],
        }

    @staticmethod
    async def get(work_package_id: str, site_id: str = "SITE-01") -> WorkPackage:
        wp = await WorkPackage.find_one(
            WorkPackage.work_package_id == work_package_id,
            WorkPackage.site_id == site_id,
        )
        if not wp:
            raise HTTPException(404, f"Work package '{work_package_id}' not found")
        return wp

    @staticmethod
    async def _resolve_work_type(work_type_code: str, site_id: str) -> WorkTypeDefinition:
        wt = await WorkTypeDefinition.find_one(
            WorkTypeDefinition.work_type_code == work_type_code,
            WorkTypeDefinition.site_id == site_id,
        )
        if not wt:
            raise HTTPException(
                400,
                f"Unknown work_type_code '{work_type_code}'. "
                "Create it first, or POST /work-types/seed to load the default catalogue.",
            )
        if not wt.is_active:
            raise HTTPException(400, f"Work type '{work_type_code}' is inactive")
        return wt

    @staticmethod
    async def create(data: dict, site_id: str = "SITE-01", user_id: str = "USR-001"):
        for required in ("job_id", "work_type_code", "title"):
            value = data.get(required)
            if value is None or (isinstance(value, str) and not value.strip()):
                raise HTTPException(400, f"{required} is required")

        job = await Job.find_one(Job.job_id == data["job_id"], Job.site_id == site_id)
        if not job:
            raise HTTPException(400, f"Job '{data['job_id']}' not found")

        wt = await WorkPackageService._resolve_work_type(data["work_type_code"], site_id)

        # Inherit commercial and measurement defaults from the work type unless overridden.
        data.setdefault("rate_basis", wt.default_rate_basis)
        data.setdefault("planned_uom", wt.measurement_uom)
        # Inherit counterparty from the parent job where the caller did not supply it.
        for field in ("client_id", "client_name", "manufacturer_id", "manufacturer_name"):
            if not data.get(field) and getattr(job, field, None):
                data[field] = getattr(job, field)

        # The commercial envelope, where the package is drawn against an
        # order. Refused rather than warned about: a package raised past the
        # ceiling or after the order lapsed becomes work the client never
        # agreed to pay for, and that is discovered at invoice time, when
        # there is nothing left to negotiate with.
        #
        # Only enforced where there is an envelope to enforce. An order with
        # no terms set is not treated as an order with a zero ceiling, which
        # would refuse every package in the system the day this shipped.
        so_id = data.get("so_id")
        if so_id:
            draw = float(
                data.get("ceiling_value")
                or (float(data.get("rate") or 0) * float(data.get("planned_quantity") or 0))
            )
            try:
                from modules.commercial.service import CommercialService

                check = await CommercialService.check_draw(so_id, draw, site_id)
            except HTTPException:
                raise
            except Exception as e:  # noqa: BLE001
                # A broken envelope check must not stop legitimate work. It is
                # logged rather than swallowed silently.
                logger.warning("Envelope check skipped for %s: %s", so_id, e)
                check = None

            if check and not check["allowed"]:
                remedies = check.get("suggested_amendments") or []
                raise HTTPException(
                    409,
                    f"This package cannot be raised against {so_id}: "
                    + "; and ".join(check["blockers"])
                    + (
                        f". Raise a {' or '.join(r.replace('_', ' ').lower() for r in remedies)} "
                        f"and have the client authorise it first."
                        if remedies else "."
                    ),
                )

        data["site_id"] = site_id
        data["created_by"] = user_id
        data["work_package_id"] = data.get("work_package_id") or await _next_work_package_id(site_id)
        data["status"] = WorkPackageStatus.PLANNED.value
        data["status_history"] = [
            StatusTransition(
                from_status=None,
                to_status=WorkPackageStatus.PLANNED.value,
                changed_by=user_id,
                reason="created",
            ).model_dump()
        ]

        wp = WorkPackage(**data)
        await wp.insert()
        return wp

    @staticmethod
    async def update(work_package_id: str, data: dict, site_id: str = "SITE-01"):
        wp = await WorkPackageService.get(work_package_id, site_id)
        if "work_type_code" in data and data["work_type_code"] != wp.work_type_code:
            await WorkPackageService._resolve_work_type(data["work_type_code"], site_id)
        # status moves through transition(), never a blind field write
        for immutable in ("work_package_id", "site_id", "created_by", "created_at", "status",
                          "status_history", "id"):
            data.pop(immutable, None)
        for key, value in data.items():
            if hasattr(wp, key):
                setattr(wp, key, value)
        wp.updated_at = datetime.now()
        await wp.save()
        return wp

    @staticmethod
    async def transition(
        work_package_id: str,
        to_status: str,
        site_id: str = "SITE-01",
        user_id: str = "USR-001",
        reason: Optional[str] = None,
    ):
        wp = await WorkPackageService.get(work_package_id, site_id)
        valid_states = {s.value for s in WorkPackageStatus}
        if to_status not in valid_states:
            raise HTTPException(400, f"Unknown status '{to_status}'. Expected one of: {sorted(valid_states)}")

        allowed = ALLOWED_TRANSITIONS.get(wp.status, set())
        if to_status not in allowed:
            raise HTTPException(
                409,
                f"Cannot move work package from '{wp.status}' to '{to_status}'. "
                f"Allowed from '{wp.status}': {sorted(allowed) or 'none (terminal state)'}",
            )

        wp.status_history.append(
            StatusTransition(
                from_status=wp.status, to_status=to_status, changed_by=user_id, reason=reason
            )
        )
        from_status = wp.status
        wp.status = to_status
        if to_status == WorkPackageStatus.CLOSED.value:
            wp.percent_complete = 100.0
        wp.updated_at = datetime.now()
        await wp.save()

        await audit(
            "work_package", wp.work_package_id, AuditAction.STATUS_CHANGE,
            actor={"user_id": user_id},
            changes=None, before={"status": from_status}, after={"status": to_status},
            note=reason,
            context={"job_id": wp.job_id, "work_type_code": wp.work_type_code},
            site_id=site_id,
        )
        return wp

    @staticmethod
    async def deactivate(work_package_id: str, site_id: str = "SITE-01"):
        wp = await WorkPackageService.get(work_package_id, site_id)
        wp.is_active = False
        wp.updated_at = datetime.now()
        await wp.save()
        return wp

    @staticmethod
    async def migrate_from_job_sow(
        job_id: str,
        work_type_code: str,
        site_id: str = "SITE-01",
        user_id: str = "USR-001",
        dry_run: bool = True,
    ):
        """Promote a job's embedded scope_of_work items into work packages.

        Idempotent on migrated_from_sow_item_id, so re-running will not duplicate.
        Defaults to dry_run so the caller sees what would happen first.
        """
        job = await Job.find_one(Job.job_id == job_id, Job.site_id == site_id)
        if not job:
            raise HTTPException(404, f"Job '{job_id}' not found")
        await WorkPackageService._resolve_work_type(work_type_code, site_id)

        would_create, skipped = [], []
        for item in job.scope_of_work or []:
            item_id = getattr(item, "item_id", None)
            if not item_id:
                continue
            existing = await WorkPackage.find_one(
                WorkPackage.job_id == job_id,
                WorkPackage.migrated_from_sow_item_id == item_id,
            WorkPackage.site_id == site_id,
        )
            if existing:
                skipped.append({"sow_item_id": item_id, "work_package_id": existing.work_package_id})
                continue

            payload = {
                "job_id": job_id,
                "work_type_code": work_type_code,
                "title": getattr(item, "description", None) or item_id,
                "description": getattr(item, "notes", None),
                "discipline": getattr(item, "category", None),
                "migrated_from_sow_item_id": item_id,
            }
            if dry_run:
                would_create.append(payload)
            else:
                wp = await WorkPackageService.create(payload, site_id, user_id)
                # Carry completion state across rather than losing it.
                if getattr(item, "completed", False):
                    await WorkPackageService.transition(
                        wp.work_package_id, "assigned", site_id, user_id, "migrated: was completed"
                    )
                    await WorkPackageService.transition(
                        wp.work_package_id, "in_progress", site_id, user_id, "migrated: was completed"
                    )
                    await WorkPackageService.transition(
                        wp.work_package_id, "submitted", site_id, user_id, "migrated: was completed"
                    )
                would_create.append({"work_package_id": wp.work_package_id, **payload})

        return {
            "job_id": job_id,
            "dry_run": dry_run,
            "sow_items_found": len(job.scope_of_work or []),
            "created" if not dry_run else "would_create": would_create,
            "skipped_already_migrated": skipped,
        }

    @staticmethod
    async def summary(site_id: str = "SITE-01", job_id: str = ""):
        """Counts by status and by work type - backs the dashboard tiles."""
        query: dict = {"site_id": site_id, "is_active": True}
        if job_id:
            query["job_id"] = job_id
        items = await WorkPackage.find(query).to_list()

        by_status: dict[str, int] = {}
        by_type: dict[str, int] = {}
        for wp in items:
            by_status[wp.status] = by_status.get(wp.status, 0) + 1
            by_type[wp.work_type_code] = by_type.get(wp.work_type_code, 0) + 1

        unassigned = by_status.get(WorkPackageStatus.PLANNED.value, 0)
        awaiting_cert = by_status.get(WorkPackageStatus.UNDER_QC.value, 0)
        certified_unbilled = by_status.get(WorkPackageStatus.CERTIFIED.value, 0)

        return {
            "total": len(items),
            "by_status": by_status,
            "by_work_type": by_type,
            "unassigned": unassigned,
            "awaiting_certification": awaiting_cert,
            "certified_not_billed": certified_unbilled,
        }
