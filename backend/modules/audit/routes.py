from typing import Optional

from fastapi import APIRouter, Depends

from core.audit import AuditEntry, history
from core.auth import Role, get_current_user, require_roles

router = APIRouter(prefix="/audit", tags=["Audit"])

#: Reading the trail is itself a privileged act - it shows who did what.
MAY_READ_AUDIT = [Role.ADMIN, Role.QC_AUDITOR, Role.TECHNICAL_MANAGER]


@router.get("/{entity_type}/{entity_id}")
async def entity_history(
    entity_type: str,
    entity_id: str,
    limit: int = 200,
    user: dict = Depends(get_current_user),
):
    """Everything recorded against one record, oldest first.

    Not role-restricted: a person looking at a certification should be able to
    see its own history, and that is the trail's main day-to-day use.
    """
    entries = await history(entity_type, entity_id, user.get("site_id", "SITE-01"), limit)
    return {"total": len(entries), "data": [e.model_dump(exclude={"id"}) for e in entries]}


@router.get("")
async def search_audit(
    entity_type: str = "",
    action: str = "",
    actor_user_id: str = "",
    per_page: int = 100,
    page: int = 1,
    user: dict = Depends(require_roles(MAY_READ_AUDIT)),
):
    """Search across the trail. Restricted: this answers 'what has this person
    been doing', which is not a question every role should be able to ask."""
    query: dict = {"site_id": user.get("site_id", "SITE-01")}
    if entity_type:
        query["entity_type"] = entity_type
    if action:
        query["action"] = action
    if actor_user_id:
        query["actor_user_id"] = actor_user_id

    total = await AuditEntry.find(query).count()
    items = (
        await AuditEntry.find(query)
        .sort(-AuditEntry.at)
        .skip(max(0, (page - 1)) * per_page)
        .limit(per_page)
        .to_list()
    )
    return {
        "total": total, "page": page, "per_page": per_page,
        "data": [i.model_dump(exclude={"id"}) for i in items],
    }
