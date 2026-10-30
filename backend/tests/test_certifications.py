"""Unit tests for certification arithmetic and validation.

compute_totals is deliberately pure, so the money calculation is verified here
without a database connection.
"""
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from modules.certifications.models import (  # noqa: E402
    CertificationLineItem,
    CertificationStatus,
    DeductionReason,
)
from modules.certifications.service import (  # noqa: E402
    _validate_deductions,
    _validate_lines,
    compute_totals,
)


def lines(*specs) -> list[CertificationLineItem]:
    out = []
    for i, (desc, rate, claimed, certified) in enumerate(specs, start=1):
        out.append(
            CertificationLineItem(
                line_id=f"L{i}", description=desc, rate=rate,
                claimed_quantity=claimed, certified_quantity=certified,
            )
        )
    return out


# ----------------------------------------------------------------- rollups

def test_rollup_sums_claimed_and_certified():
    t = compute_totals(lines(
        ("Excavation", 250.0, 100.0, 90.0),
        ("PCC 1:4:8", 4800.0, 20.0, 20.0),
    ))
    assert t["claimed_quantity"] == 120.0
    assert t["certified_quantity"] == 110.0
    assert t["rejected_quantity"] == 10.0
    assert t["claimed_value"] == 100 * 250 + 20 * 4800      # 121_000
    assert t["certified_value"] == 90 * 250 + 20 * 4800     # 118_500
    assert t["deduction_value"] == 2_500.0


def test_full_certification_leaves_no_deduction():
    t = compute_totals(lines(("Plastering", 180.0, 500.0, 500.0)))
    assert t["deduction_value"] == 0.0
    assert t["rejected_quantity"] == 0.0
    assert t["certified_value"] == t["claimed_value"]


def test_nothing_certified_deducts_everything():
    t = compute_totals(lines(("Not executed", 1000.0, 50.0, 0.0)))
    assert t["certified_value"] == 0.0
    assert t["deduction_value"] == 50_000.0
    assert t["net_payable_value"] == 0.0


def test_empty_certification_is_all_zero():
    t = compute_totals([])
    assert t["claimed_value"] == 0.0
    assert t["certified_value"] == 0.0
    assert t["deduction_value"] == 0.0
    assert t["net_payable_value"] == 0.0


def test_claimed_minus_certified_always_equals_deduction():
    """The identity the whole billing gate rests on."""
    for spec in (
        [("A", 100.0, 10.0, 10.0)],
        [("A", 100.0, 10.0, 0.0)],
        [("A", 250.5, 33.3, 21.1), ("B", 99.9, 7.0, 7.0)],
        [("A", 1.0, 0.0, 0.0)],
    ):
        t = compute_totals(lines(*spec))
        assert round(t["claimed_value"] - t["certified_value"], 2) == t["deduction_value"]


# --------------------------------------------------------------- retention

def test_retention_reduces_net_payable_not_certified_value():
    t = compute_totals(lines(("Steel", 100.0, 1000.0, 1000.0)), retention_pct=5.0)
    assert t["certified_value"] == 100_000.0     # unchanged by retention
    assert t["retention_value"] == 5_000.0
    assert t["net_payable_value"] == 95_000.0


def test_zero_retention_pays_full_certified_value():
    t = compute_totals(lines(("Steel", 100.0, 10.0, 10.0)), retention_pct=0.0)
    assert t["net_payable_value"] == t["certified_value"]


def test_retention_applies_to_certified_not_claimed():
    """Retention on a part-certified bill must not be taken on rejected work."""
    t = compute_totals(lines(("Brickwork", 500.0, 100.0, 80.0)), retention_pct=10.0)
    assert t["certified_value"] == 40_000.0
    assert t["retention_value"] == 4_000.0       # 10% of 40_000, not of 50_000
    assert t["net_payable_value"] == 36_000.0


def test_compute_totals_is_pure_and_repeatable():
    li = lines(("Backfill", 90.0, 300.0, 275.0))
    first = compute_totals(li, retention_pct=10.0)
    assert compute_totals(li, retention_pct=10.0) == first
    assert compute_totals(li, retention_pct=10.0) == first


# -------------------------------------------------------------- line items

def test_line_item_derived_properties():
    li = CertificationLineItem(
        line_id="L1", description="Shuttering", uom="sqm", rate=320.0,
        claimed_quantity=150.0, certified_quantity=140.0,
    )
    assert li.rejected_quantity == 10.0
    assert li.claimed_value == 48_000.0
    assert li.certified_value == 44_800.0


def test_certified_cannot_exceed_claimed():
    with pytest.raises(HTTPException) as exc:
        _validate_lines([{"claimed_quantity": 10.0, "certified_quantity": 12.0, "rate": 100.0}])
    assert exc.value.status_code == 400
    assert "cannot exceed claimed" in exc.value.detail


def test_negative_quantities_rejected():
    for bad in (
        {"claimed_quantity": -5.0, "certified_quantity": 0.0, "rate": 10.0},
        {"claimed_quantity": 5.0, "certified_quantity": -1.0, "rate": 10.0},
        {"claimed_quantity": 5.0, "certified_quantity": 5.0, "rate": -10.0},
    ):
        with pytest.raises(HTTPException):
            _validate_lines([bad])


def test_equal_claimed_and_certified_is_valid():
    _validate_lines([{"claimed_quantity": 7.5, "certified_quantity": 7.5, "rate": 60.0}])


def test_validation_reports_the_offending_line_number():
    with pytest.raises(HTTPException) as exc:
        _validate_lines([
            {"claimed_quantity": 5.0, "certified_quantity": 5.0, "rate": 10.0},
            {"claimed_quantity": 5.0, "certified_quantity": 9.0, "rate": 10.0},
        ])
    assert "Line 2" in exc.value.detail


# -------------------------------------------------------------- deductions

def test_unknown_deduction_reason_rejected():
    with pytest.raises(HTTPException) as exc:
        _validate_deductions([{"reason_code": "BECAUSE_I_SAID_SO"}])
    assert exc.value.status_code == 400


def test_every_declared_reason_is_accepted():
    _validate_deductions([{"reason_code": r.value} for r in DeductionReason])


def test_deduction_reasons_are_distinct():
    values = [r.value for r in DeductionReason]
    assert len(values) == len(set(values))


# ------------------------------------------------------------------ status

def test_status_values_are_distinct():
    values = [s.value for s in CertificationStatus]
    assert len(values) == len(set(values))


def test_draft_is_the_entry_status():
    assert CertificationStatus.DRAFT.value == "draft"
    assert {"issued", "disputed", "superseded"} <= {s.value for s in CertificationStatus}
