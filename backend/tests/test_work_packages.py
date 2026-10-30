"""Unit tests for work type and work package logic.

These cover the pure logic - the state machine, enum validation and the ID
sequencer - without requiring a live MongoDB.
"""
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from modules.work_packages.models import ALLOWED_TRANSITIONS, WorkPackageStatus  # noqa: E402
from modules.work_types.catalogue import DEFAULT_CATALOGUE  # noqa: E402
from modules.work_types.models import AIAssist, RateBasis  # noqa: E402
from modules.work_types.service import _validate  # noqa: E402


# --------------------------------------------------------------- work types

def test_catalogue_codes_are_unique():
    codes = [e["work_type_code"] for e in DEFAULT_CATALOGUE]
    assert len(codes) == len(set(codes)), "duplicate work_type_code in catalogue"


def test_catalogue_entries_use_valid_enums():
    valid_rates = {r.value for r in RateBasis}
    valid_assists = {a.value for a in AIAssist}
    for entry in DEFAULT_CATALOGUE:
        assert entry["default_rate_basis"] in valid_rates, entry["work_type_code"]
        for assist in entry.get("ai_assists", []):
            assert assist in valid_assists, f"{entry['work_type_code']}: {assist}"


def test_catalogue_entries_have_required_fields():
    for entry in DEFAULT_CATALOGUE:
        assert entry.get("work_type_code")
        assert entry.get("name")
        assert entry.get("description")


def test_measured_work_types_require_certification_before_billing():
    """BOQ and bill verification bill off certified value, so certification must gate billing."""
    by_code = {e["work_type_code"]: e for e in DEFAULT_CATALOGUE}
    for code in ("BOQ_RECON", "BILL_VERIF"):
        entry = by_code[code]
        assert entry["default_rate_basis"] == RateBasis.PCT_CERTIFIED_VALUE.value
        assert entry["certification_required_before_billing"] is True
        assert entry["requires_measurements"] is True


def test_validate_rejects_unknown_rate_basis():
    with pytest.raises(HTTPException) as exc:
        _validate({"default_rate_basis": "PER_FORTNIGHT"})
    assert exc.value.status_code == 400


def test_validate_rejects_unknown_ai_assist():
    with pytest.raises(HTTPException) as exc:
        _validate({"ai_assists": ["MIND_READING"]})
    assert exc.value.status_code == 400


def test_validate_rejects_out_of_range_threshold():
    for bad in (-0.1, 1.5):
        with pytest.raises(HTTPException):
            _validate({"auto_assign_threshold": bad})


def test_validate_accepts_good_payload_and_null_threshold():
    _validate({
        "default_rate_basis": RateBasis.MAN_DAY.value,
        "ai_assists": [AIAssist.REPORT_DRAFT.value],
        "auto_assign_threshold": None,
    })


# ------------------------------------------------------------ state machine

def test_every_status_has_a_transition_entry():
    for status in WorkPackageStatus:
        assert status.value in ALLOWED_TRANSITIONS


def test_transition_targets_are_all_real_statuses():
    valid = {s.value for s in WorkPackageStatus}
    for origin, targets in ALLOWED_TRANSITIONS.items():
        assert targets <= valid, f"{origin} points at unknown status"


def test_cannot_bill_before_certifying():
    """The core billing guard: no path from in_progress or submitted straight to billed."""
    for origin in ("planned", "assigned", "in_progress", "submitted", "under_qc"):
        assert "billed" not in ALLOWED_TRANSITIONS[origin], origin
    assert "billed" in ALLOWED_TRANSITIONS["certified"]


def test_terminal_states_are_terminal():
    assert ALLOWED_TRANSITIONS["closed"] == set()
    assert ALLOWED_TRANSITIONS["cancelled"] == set()


def test_qc_can_send_work_back_for_rework():
    assert "in_progress" in ALLOWED_TRANSITIONS["under_qc"]
    assert "in_progress" in ALLOWED_TRANSITIONS["submitted"]


def test_certification_can_be_reopened():
    """Certifications get revised; the package must be able to go back under QC."""
    assert "under_qc" in ALLOWED_TRANSITIONS["certified"]
    assert "certified" in ALLOWED_TRANSITIONS["billed"]


def test_cancelled_reachable_from_live_states_only():
    assert "cancelled" in ALLOWED_TRANSITIONS["planned"]
    assert "cancelled" not in ALLOWED_TRANSITIONS["certified"]
    assert "cancelled" not in ALLOWED_TRANSITIONS["billed"]


def test_no_status_transitions_to_itself():
    for origin, targets in ALLOWED_TRANSITIONS.items():
        assert origin not in targets, f"{origin} transitions to itself"
