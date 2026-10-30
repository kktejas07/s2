"""Shared test setup.

The rate limiter counts in process memory, which the whole test session
shares. Without this, a file that makes eleven login calls starts getting 429s
partway through - and because the counter carries across files, which test
fails depends on the order pytest happened to collect them. That is the kind
of failure someone spends an afternoon on.

Counters are cleared before every test, so each one starts with a full
allowance. Tests that mean to exercise the limiter exhaust it themselves.
"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


@pytest.fixture(autouse=True)
def _clear_rate_limit_counters():
    from core import ratelimit

    ratelimit.reset()
    yield
    ratelimit.reset()
