"""Tests for dashboard role routing and shape.

The aggregation itself needs a database, so these cover the parts that can be
reasoned about on their own: the role list, the routing contract and the
per-person guard.
"""
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from modules.dashboards.service import ROLES, DashboardService  # noqa: E402


@pytest.mark.asyncio
async def test_unknown_role_is_rejected_with_the_valid_list():
    with pytest.raises(HTTPException) as exc:
        await DashboardService.for_role("ceo")
    assert exc.value.status_code == 400
    assert "coordinator" in exc.value.detail


@pytest.mark.asyncio
async def test_officer_dashboard_requires_a_person():
    """A per-person view with no person is a bug, not an empty dashboard."""
    with pytest.raises(HTTPException) as exc:
        await DashboardService.inspection_officer("SITE-01", person_id=None)
    assert exc.value.status_code == 400
    assert "person_id" in exc.value.detail


def test_every_role_has_a_handler():
    for role in ROLES:
        assert hasattr(DashboardService, role), f"no handler for {role}"


def test_roles_cover_the_rbac_matrix():
    """Matches the roles in ARCHITECTURE_AND_E2E_FLOW.md section 6.2."""
    assert set(ROLES) == {
        "coordinator", "inspection_officer", "qc_reviewer",
        "finance", "technical_manager", "management",
    }


def test_role_list_has_no_duplicates():
    assert len(ROLES) == len(set(ROLES))
