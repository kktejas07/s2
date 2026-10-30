from fastapi import APIRouter, Depends

from core.auth import RUNS_MIGRATIONS, require_roles
from modules.migration import service

router = APIRouter(prefix="/migration", tags=["Migration"])


@router.post("/tpi")
async def migrate_tpi(
    dry_run: bool = True,
    limit: int = 0,
    user: dict = Depends(require_roles(RUNS_MIGRATIONS)),
):
    """Promote TPI reports onto the execution spine. Dry run by default."""
    return await service.migrate_tpi_reports(
        user.get("site_id", "SITE-01"), user.get("user_id", "USR-MIGRATION"), dry_run, limit
    )


@router.post("/schedule-m")
async def migrate_schedule_m(dry_run: bool = True, user: dict = Depends(require_roles(RUNS_MIGRATIONS))):
    """Promote Schedule M pharma EPC projects. Dry run by default."""
    return await service.migrate_schedule_m_projects(
        user.get("site_id", "SITE-01"), user.get("user_id", "USR-MIGRATION"), dry_run
    )


@router.post("/construction-bill-verification")
async def migrate_cbv(dry_run: bool = True, user: dict = Depends(require_roles(RUNS_MIGRATIONS))):
    """Promote construction bill verification records. Dry run by default."""
    return await service.migrate_construction_bill_verifications(
        user.get("site_id", "SITE-01"), user.get("user_id", "USR-MIGRATION"), dry_run
    )


@router.post("/all")
async def migrate_all(dry_run: bool = True, user: dict = Depends(require_roles(RUNS_MIGRATIONS))):
    """All three verticals in one pass. Dry run by default.

    Safe to re-run: everything written is idempotent on migrated_from_ref.
    """
    return await service.migrate_all(
        user.get("site_id", "SITE-01"), user.get("user_id", "USR-MIGRATION"), dry_run
    )
