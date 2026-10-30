"""Who did what, to which record, and when.

ISO/IEC 17020 requires an inspection body to keep records of its decisions and
of the people who made them. The spine carried fragments of this - a work
package keeps its status history, a certification records who prepared and who
certified - but there was no system-wide trail, so most actions left no
evidence at all that they had happened.

Design decisions worth knowing:

* **Append-only.** There is no update or delete path. A trail that can be
  rewritten is not evidence, and an assessor will ask.
* **Recording never fails the action.** A write that cannot be audited is
  logged loudly and the action still completes. The alternative - refusing to
  issue a certification because an audit insert timed out - trades a real
  operational failure for a bookkeeping one. Where that trade is wrong, a
  caller can await the result and decide for itself.
* **Values are summarised, not copied.** Storing whole before/after documents
  would put client names, rates and personal data into a second collection with
  its own retention story. The trail records which fields changed and their
  scalar values; the record itself remains the source of truth.
* **The actor is the authenticated caller**, never a value from the request
  body. That distinction is the whole point: the old code let a request claim
  any identity it liked.
"""
from __future__ import annotations

import logging
from datetime import datetime
from enum import Enum
from typing import Any, Optional

from beanie import Document
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

#: Values longer than this are truncated rather than stored whole.
MAX_VALUE_CHARS = 300


class AuditAction(str, Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    STATUS_CHANGE = "STATUS_CHANGE"
    ISSUE = "ISSUE"
    REVISE = "REVISE"
    DISPUTE = "DISPUTE"
    ASSIGN = "ASSIGN"
    AUTHORIZE = "AUTHORIZE"
    BILL = "BILL"
    DELETE = "DELETE"
    MIGRATE = "MIGRATE"
    SEED = "SEED"
    LOGIN = "LOGIN"
    EXPORT = "EXPORT"


class ChangedField(BaseModel):
    field: str
    before: Optional[str] = None
    after: Optional[str] = None


class AuditEntry(Document):
    audit_id: str
    site_id: str = "SITE-01"

    #: What was touched. entity_type is the collection-ish name ("certification",
    #: "work_package"), entity_id its business identifier.
    entity_type: str
    entity_id: str
    action: str

    #: Who. Taken from the authenticated caller, never from a request body.
    actor_user_id: Optional[str] = None
    actor_role_id: Optional[int] = None

    changes: list[ChangedField] = []
    note: Optional[str] = None

    #: Free-form context a caller considers material - a reason code, the job
    #: an action belonged to. Kept small deliberately.
    context: dict[str, Any] = {}

    at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "audit_entries"
        indexes = ["site_id", "entity_type", "entity_id", "actor_user_id", "action", "at"]


def _scalar(value: Any) -> Optional[str]:
    """Audit values are summaries, not copies."""
    if value is None:
        return None
    if isinstance(value, (list, tuple, set)):
        return f"{len(value)} item(s)"
    if isinstance(value, dict):
        return f"{len(value)} key(s)"
    text = str(value)
    return text if len(text) <= MAX_VALUE_CHARS else text[: MAX_VALUE_CHARS - 1] + "…"


def diff_fields(
    before: Optional[dict],
    after: Optional[dict],
    *,
    ignore: tuple[str, ...] = ("updated_at", "created_at", "id", "_id"),
) -> list[ChangedField]:
    """Which fields actually changed. Unchanged fields are not recorded.

    A trail that logs every field on every save buries the one that matters.
    """
    before = before or {}
    after = after or {}
    changed: list[ChangedField] = []
    for key in sorted(set(before) | set(after)):
        if key in ignore:
            continue
        b, a = before.get(key), after.get(key)
        if b == a:
            continue
        changed.append(ChangedField(field=key, before=_scalar(b), after=_scalar(a)))
    return changed


async def record(
    entity_type: str,
    entity_id: str,
    action: str | AuditAction,
    *,
    actor: Optional[dict] = None,
    changes: Optional[list[ChangedField]] = None,
    before: Optional[dict] = None,
    after: Optional[dict] = None,
    note: Optional[str] = None,
    context: Optional[dict] = None,
    site_id: str = "SITE-01",
) -> Optional[AuditEntry]:
    """Append one entry. Returns it, or None if the trail could not be written.

    `actor` is the dict that get_current_user returns. Pass `before`/`after`
    documents to have the changed fields worked out, or pass `changes` directly.
    """
    try:
        from core.sequences import next_value

        if changes is None and (before is not None or after is not None):
            changes = diff_fields(before, after)

        seq = await next_value(f"{site_id}:audit:{datetime.now().year}")
        entry = AuditEntry(
            audit_id=f"AUD-{datetime.now().year}-{seq:06d}",
            site_id=site_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action.value if isinstance(action, AuditAction) else str(action),
            actor_user_id=(actor or {}).get("user_id"),
            actor_role_id=(actor or {}).get("role_id"),
            changes=changes or [],
            note=note,
            context=context or {},
        )
        await entry.insert()
        return entry
    except Exception as exc:  # noqa: BLE001
        # Deliberate: an unrecordable action is a bookkeeping failure, and
        # refusing the action would turn it into an operational one. Loud, not
        # silent, so it cannot go unnoticed.
        logger.error(
            "AUDIT WRITE FAILED for %s %s (%s): %s",
            entity_type, entity_id, action, exc, exc_info=True,
        )
        return None


async def history(
    entity_type: str,
    entity_id: str,
    site_id: str = "SITE-01",
    limit: int = 200,
) -> list[AuditEntry]:
    """Everything recorded against one record, oldest first - the order an
    assessor reads it in."""
    return (
        await AuditEntry.find(
            AuditEntry.entity_type == entity_type,
            AuditEntry.entity_id == entity_id,
            AuditEntry.site_id == site_id,
        )
        .sort(AuditEntry.at)
        .limit(limit)
        .to_list()
    )
