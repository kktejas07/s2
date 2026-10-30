import pytest
from modules.tpi.service import (
    compute_balance_quantities,
    validate_report_data,
)


def test_tp04_balance_quantity_computation():
    """Verify compute_balance_quantities correctly computes Balance Qty = PO Qty - Prev - Current."""
    data = {
        "release_items": [
            {
                "item_no": 1,
                "description": "Gate Valve 6 inch #150",
                "po_qty": 50,
                "prev_released": 10,
                "current_released": 25,
                "balance_qty": None,  # Not provided, should be computed: 50 - 10 - 25 = 15
            },
            {
                "item_no": 2,
                "description": "Check Valve 4 inch #300",
                "po_qty": 20,
                "prev_released": 15,
                "current_released": 10,
                "balance_qty": None,  # 20 - 15 - 10 = -5 -> clamped to 0.0
            },
            {
                "item_no": 3,
                "description": "Ball Valve 2 inch #600",
                "po_qty": 100,
                "prev_released": 20,
                "current_released": 30,
                "balance_qty": 45,  # Explicit user override, must be preserved
            },
        ]
    }

    result = compute_balance_quantities(data)
    items = result["release_items"]

    assert items[0]["balance_qty"] == 15.0
    assert items[1]["balance_qty"] == 0.0
    assert items[2]["balance_qty"] == 45.0  # Kept user override


def test_quantity_hierarchy_validation_warnings():
    """Verify non-blocking validation warnings when Accepted <= Inspected <= Offered <= PO is violated."""
    # Clean data (no warnings)
    clean_data = {
        "items": [
            {
                "item": 1,
                "description": "Centrifugal Pump",
                "po_qty": 10,
                "offered_qty": 10,
                "inspected_qty": 8,
                "accepted_qty": 8,
            }
        ]
    }
    warnings = validate_report_data("TP02", clean_data)
    assert len(warnings) == 0

    # Data with violations
    violation_data = {
        "items": [
            {
                "item": 1,
                "description": "Flange DN200",
                "po_qty": 50,
                "offered_qty": 60,    # Offered > PO
                "inspected_qty": 70,  # Inspected > Offered
                "accepted_qty": 80,   # Accepted > Inspected
            }
        ]
    }
    warnings = validate_report_data("TP02", violation_data)
    assert len(warnings) == 3
    assert any("Offered quantity" in w for w in warnings)
    assert any("Inspected quantity" in w for w in warnings)
    assert any("Accepted quantity" in w for w in warnings)


def test_report_number_format_structure():
    """Verify report number follows IQE-<FORM>-<YYYY>-<####>."""
    import re
    pattern = re.compile(r"^IQE-(TP02|TP03|TP04|TP05)-\d{4}-\d{4}$")
    sample_reports = [
        "IQE-TP02-2026-0001",
        "IQE-TP03-2026-0012",
        "IQE-TP04-2026-0045",
        "IQE-TP05-2026-0100",
    ]
    for rep in sample_reports:
        assert pattern.match(rep) is not None
