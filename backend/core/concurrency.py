"""Optimistic locking for records two people edit at once.

Two QC reviewers opening the same certification, each changing a different
line, each saving: the second save overwrote the first and neither was told.
Nothing in the stack prevented it - Beanie's save() writes the whole document.

The fix is a version counter the caller must present. A save carrying a stale
version is refused rather than applied, so the loser of a race finds out at the
moment it matters rather than discovering a missing deduction weeks later in a
dispute.

This is advisory by design: a caller that passes no version is not blocked.
Forcing every internal call site to thread a version through would be a large
change for little benefit, and most writes have a single author. The protection
is applied where concurrent editing is real - certifications under QC review -
and is available anywhere else that wants it.
"""
from __future__ import annotations

from typing import Any, Optional

from fastapi import HTTPException


class StaleWriteError(HTTPException):
    """Raised when a caller's version no longer matches the stored record."""

    def __init__(self, entity: str, entity_id: str, expected: int, actual: int):
        super().__init__(
            status_code=409,
            detail=(
                f"{entity} {entity_id} was changed by someone else while you were "
                f"editing it (you have version {expected}, the current version is "
                f"{actual}). Reload it, re-apply your change and save again - "
                f"saving now would discard their edit."
            ),
        )
        self.expected = expected
        self.actual = actual


def check_version(record: Any, expected: Optional[int], entity: str = "Record") -> None:
    """Refuse a write whose base version is out of date.

    `expected` of None means the caller is not participating in locking, which
    is allowed - see the module docstring.
    """
    if expected is None:
        return
    actual = getattr(record, "version", 0) or 0
    if int(expected) != int(actual):
        identifier = (
            getattr(record, "certification_id", None)
            or getattr(record, "work_package_id", None)
            or getattr(record, "id", "")
        )
        raise StaleWriteError(entity, str(identifier), int(expected), int(actual))


def bump(record: Any) -> int:
    """Advance the version. Call immediately before saving."""
    current = getattr(record, "version", 0) or 0
    record.version = int(current) + 1
    return record.version
