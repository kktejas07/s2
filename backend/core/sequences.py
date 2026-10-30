"""Atomic identifier sequences.

Every ID generator in this codebase was originally read-then-write: find the
highest existing ID, add one, insert. That is correct when requests arrive one
at a time, which is how every test exercises it and how mongomock behaves. It
is a race under real concurrency - two requests read the same maximum and both
write it, so two work packages get WP-2026-0007 and one of them loses a unique
index collision or, worse, silently shares an identifier with the other.

The suite could not catch this: mongomock has no real concurrency, so the race
has no way to appear. `scripts/verify_against_real_db.py` probes for it against
a real server.

This module replaces that pattern with a counter document updated by a single
`findAndModify`, which MongoDB applies atomically. Concurrent callers queue on
the document and each receives a distinct value.

Existing data is handled by seeding: the first time a counter is used it is
created from the highest ID already present, so numbering continues from where
the old generator left off rather than restarting at 1. Seeding uses
`$setOnInsert`, so it happens exactly once however many callers race into it.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from beanie import Document
from pydantic import Field
from pymongo import ReturnDocument


class Sequence(Document):
    """One counter. `key` is scoped by site, kind and (where relevant) year."""

    key: str
    value: int = 0
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "sequences"
        indexes = ["key"]


async def _highest_existing(model, field: str, site_id: str, prefix: str) -> int:
    """The largest sequence number already used, for seeding a new counter."""
    rows = (
        await model.find(
            model.site_id == site_id,
            {field: {"$regex": f"^{prefix}"}},
        )
        .sort(f"-{field}")
        .limit(1)
        .to_list()
    )
    if not rows:
        return 0
    try:
        return int(str(getattr(rows[0], field)).rsplit("-", 1)[1])
    except (IndexError, ValueError):
        # A malformed existing identifier must not stall allocation. Counting is
        # a weaker guarantee than the maximum, but it still moves forward.
        return await model.find(model.site_id == site_id).count()


async def next_value(key: str, seed: int = 0) -> int:
    """Atomically reserve and return the next value for `key`.

    `seed` is the highest number already in use; it is applied only when the
    counter is created, so passing it on every call is harmless.
    """
    collection = Sequence.get_pymongo_collection()

    # Create the counter at the seed if it does not exist. $setOnInsert makes
    # this a no-op for everyone after the first caller, so a race here resolves
    # to one insert rather than several.
    await collection.update_one(
        {"key": key},
        {"$setOnInsert": {"key": key, "value": seed}},
        upsert=True,
    )

    doc = await collection.find_one_and_update(
        {"key": key},
        {"$inc": {"value": 1}, "$set": {"updated_at": datetime.now()}},
        return_document=ReturnDocument.AFTER,
    )
    return int(doc["value"])


async def next_identifier(
    model,
    field: str,
    site_id: str,
    prefix: str,
    *,
    year_scoped: bool = True,
    width: int = 4,
    kind: Optional[str] = None,
) -> str:
    """Allocate the next identifier of the form PREFIX-YYYY-NNNN.

    `model` and `field` are used only to seed a brand-new counter from existing
    records; once seeded, allocation never scans the collection again.
    """
    if year_scoped:
        root = f"{prefix}-{datetime.now().year}-"
    else:
        root = f"{prefix}-"

    key = f"{site_id}:{kind or prefix}:{root}"
    seed = await _highest_existing(model, field, site_id, root)
    seq = await next_value(key, seed=seed)
    return f"{root}{seq:0{width}d}"
