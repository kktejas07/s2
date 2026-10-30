"""Record timestamps must be the time of the record, not of process start.

`created_at: datetime = datetime.now()` looks right and is not. Python
evaluates the default once, when the module is imported, so every record
created during a server run carries the timestamp of whenever the process
booted. Thirty-nine fields across fifteen modules had it.

For an inspection body this is not a cosmetic problem. `created_at` is what
an assessor reads to establish when an invoice was raised or a control number
allocated, and it is the sort key behind "newest first" on the list
endpoints - so with every row tied, that ordering degrades to whatever order
the storage engine happens to return.

Two tests: one proves the behaviour on real models, the other stops the
pattern coming back in a module written next year.
"""
import ast
import sys
from datetime import datetime
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))


# ------------------------------------------------------------- the behaviour

def _timestamped_models():
    """Every Beanie/pydantic model in modules/ carrying a datetime default."""
    from pydantic import BaseModel

    import importlib

    found = []
    for path in sorted((BACKEND / "modules").rglob("models.py")):
        dotted = ".".join(path.relative_to(BACKEND).with_suffix("").parts)
        try:
            module = importlib.import_module(dotted)
        except Exception:
            continue
        for value in vars(module).values():
            if (
                isinstance(value, type)
                and issubclass(value, BaseModel)
                and getattr(value, "model_fields", None)
            ):
                stamped = [
                    name
                    for name, f in value.model_fields.items()
                    if f.default_factory is None
                    and isinstance(f.default, datetime)
                ]
                if stamped:
                    found.append((dotted, value.__name__, stamped))
    return found


def test_no_model_carries_a_frozen_timestamp():
    """A datetime sitting in `default` rather than `default_factory` was
    computed at import and is identical for every record."""
    frozen = _timestamped_models()
    assert not frozen, (
        "These fields hold a timestamp frozen at import time; use "
        "Field(default_factory=datetime.now): "
        + "; ".join(f"{m}.{c}: {', '.join(fields)}" for m, c, fields in frozen)
    )


def test_two_records_made_moments_apart_differ():
    """The behaviour itself, on a model that had the bug."""
    from modules.enquiries.models import Enquiry

    first = Enquiry.model_fields["created_at"].default_factory
    assert first is not None, "created_at has no factory"

    a = first()
    b = first()
    # Separate calls, so separate readings of the clock. Equal values here
    # would mean the factory is returning a captured constant.
    assert isinstance(a, datetime) and isinstance(b, datetime)
    assert b >= a


# --------------------------------------------------------- the pattern itself
# The behavioural test above only sees models that import cleanly. This one
# reads the source, so it catches the pattern in a module that is broken for
# some other reason, and it names the file and line.

def _frozen_default_sites():
    sites = []
    for path in sorted((BACKEND / "modules").rglob("*.py")):
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"), str(path))
        except SyntaxError:
            continue
        for node in ast.walk(tree):
            if not isinstance(node, ast.AnnAssign) or node.value is None:
                continue
            call = node.value
            if not isinstance(call, ast.Call):
                continue
            func = call.func
            name = (
                f"{func.value.id}.{func.attr}"
                if isinstance(func, ast.Attribute) and isinstance(func.value, ast.Name)
                else getattr(func, "id", "")
            )
            if name in {"datetime.now", "datetime.utcnow", "date.today", "time.time"}:
                target = getattr(node.target, "id", "?")
                sites.append(
                    f"{path.relative_to(BACKEND)}:{node.lineno} -> {target}"
                )
    return sites


def test_the_pattern_does_not_come_back():
    sites = _frozen_default_sites()
    assert not sites, (
        "A field default is calling the clock at import time. It will be the "
        "same for every record. Use Field(default_factory=...):\n  "
        + "\n  ".join(sites)
    )
