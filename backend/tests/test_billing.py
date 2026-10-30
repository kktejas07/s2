"""Unit tests for billing arithmetic and terms.

compute_invoice_totals and the date helpers are pure, so the money and the
ageing logic are verified here without a database.
"""
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from modules.billing.models import (  # noqa: E402
    TERM_DAYS,
    BillingFrequency,
    InvoiceLineItem,
    PaymentTerms,
    ageing_bucket,
    due_date_for,
    is_overdue,
)
from modules.billing.service import compute_invoice_totals  # noqa: E402


def line(amount: float, line_id="IL-001") -> InvoiceLineItem:
    return InvoiceLineItem(line_id=line_id, description="Work", amount=amount)


# ------------------------------------------------------------ invoice totals

def test_intra_state_splits_gst_into_cgst_and_sgst():
    t = compute_invoice_totals([line(100_000.0)], gst_percentage=18.0, intra_state=True)
    assert t["cgst"] == 9_000.0
    assert t["sgst"] == 9_000.0
    assert t["igst"] == 0.0
    assert t["grand_total"] == 118_000.0


def test_inter_state_uses_igst_only():
    t = compute_invoice_totals([line(100_000.0)], gst_percentage=18.0, intra_state=False)
    assert t["igst"] == 18_000.0
    assert t["cgst"] == 0.0 and t["sgst"] == 0.0
    assert t["grand_total"] == 118_000.0


def test_cgst_plus_sgst_equals_igst_for_same_rate():
    intra = compute_invoice_totals([line(250_000.0)], gst_percentage=18.0, intra_state=True)
    inter = compute_invoice_totals([line(250_000.0)], gst_percentage=18.0, intra_state=False)
    assert round(intra["cgst"] + intra["sgst"], 2) == inter["igst"]
    assert intra["grand_total"] == inter["grand_total"]


def test_retention_comes_off_before_tax():
    t = compute_invoice_totals(
        [line(100_000.0)], gst_percentage=18.0, retention_pct=5.0, intra_state=True
    )
    assert t["retention_value"] == 5_000.0
    assert t["taxable_value"] == 95_000.0
    assert t["cgst"] == 8_550.0               # 18% of 95_000, halved
    assert t["grand_total"] == 112_100.0


def test_tds_is_withheld_from_the_gross():
    t = compute_invoice_totals(
        [line(100_000.0)], gst_percentage=18.0, tds_percentage=2.0, intra_state=True
    )
    assert t["tds"] == 2_360.0                # 2% of 118_000
    assert t["grand_total"] == 115_640.0


def test_advance_recovery_reduces_taxable_base():
    t = compute_invoice_totals(
        [line(200_000.0)], gst_percentage=18.0, advance_recovery_pct=10.0, intra_state=True
    )
    assert t["advance_recovery_value"] == 20_000.0
    assert t["taxable_value"] == 180_000.0


def test_multiple_lines_sum_into_subtotal():
    t = compute_invoice_totals(
        [line(40_000.0, "A"), line(35_000.0, "B"), line(25_000.0, "C")],
        gst_percentage=18.0,
    )
    assert t["subtotal"] == 100_000.0


def test_zero_lines_produce_zero_invoice():
    t = compute_invoice_totals([], gst_percentage=18.0)
    assert t["subtotal"] == 0.0
    assert t["grand_total"] == 0.0


def test_zero_gst_leaves_taxable_value_as_grand_total():
    t = compute_invoice_totals([line(50_000.0)], gst_percentage=0.0)
    assert t["grand_total"] == 50_000.0


def test_retention_and_advance_both_apply():
    t = compute_invoice_totals(
        [line(100_000.0)], gst_percentage=0.0,
        retention_pct=5.0, advance_recovery_pct=10.0,
    )
    assert t["taxable_value"] == 85_000.0
    assert t["grand_total"] == 85_000.0


# ----------------------------------------------------------------- due dates

def test_net_terms_add_their_days():
    base = datetime(2026, 4, 1)
    assert due_date_for(base, PaymentTerms.NET_30.value) == base + timedelta(days=30)
    assert due_date_for(base, PaymentTerms.NET_60.value) == base + timedelta(days=60)
    assert due_date_for(base, PaymentTerms.NET_90.value) == base + timedelta(days=90)


def test_on_certification_is_due_immediately():
    base = datetime(2026, 4, 1)
    assert due_date_for(base, PaymentTerms.ON_CERTIFICATION.value) == base


def test_custom_days_override_the_term():
    base = datetime(2026, 4, 1)
    assert due_date_for(base, PaymentTerms.NET_30.value, custom_days=7) == base + timedelta(days=7)


def test_unknown_term_falls_back_to_thirty_days():
    base = datetime(2026, 4, 1)
    assert due_date_for(base, "NET_WHENEVER") == base + timedelta(days=30)


def test_every_declared_term_has_day_mapping():
    for t in PaymentTerms:
        assert t.value in TERM_DAYS


# ------------------------------------------------------------------- ageing

def test_paid_invoice_is_never_overdue():
    past = datetime.now() - timedelta(days=120)
    assert is_overdue(past, "paid") is False
    assert ageing_bucket(past, "paid") == "paid"


def test_unpaid_past_due_is_overdue():
    past = datetime.now() - timedelta(days=5)
    assert is_overdue(past, "unpaid") is True


def test_future_due_date_is_current():
    future = datetime.now() + timedelta(days=10)
    assert is_overdue(future, "unpaid") is False
    assert ageing_bucket(future, "unpaid") == "current"


def test_ageing_buckets_by_days_overdue():
    now = datetime.now()
    cases = [(10, "1_30"), (45, "31_60"), (75, "61_90"), (200, "90_plus")]
    for days, expected in cases:
        assert ageing_bucket(now - timedelta(days=days), "unpaid", as_of=now) == expected


def test_missing_due_date_is_flagged_not_guessed():
    assert ageing_bucket(None, "unpaid") == "no_due_date"
    assert is_overdue(None, "unpaid") is False


# ------------------------------------------------------------------- enums

def test_term_and_frequency_values_are_distinct():
    assert len({t.value for t in PaymentTerms}) == len(list(PaymentTerms))
    assert len({f.value for f in BillingFrequency}) == len(list(BillingFrequency))
