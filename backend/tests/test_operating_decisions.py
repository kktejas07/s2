"""The operating decisions IQE made, asserted as configuration.

These are not invariants of the domain - they are choices, and IQE can change
them. They are tested because they are easy to flip by accident (a catalogue
edit, a default change) and because flipping them silently changes who may
certify work and what the roster is allowed to do without a human. A failure
here means someone changed policy; the right response is to confirm the change
was intended and update this file, not to "fix" the test.

Recorded 2026-10-23. See SOW_EXECUTION_ARCHITECTURE.md section 11.
"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from modules.assignments.models import should_auto_assign  # noqa: E402
from modules.work_types.catalogue import DEFAULT_CATALOGUE  # noqa: E402

#: Scopes where IQE's accredited practice places certifying authority with the
#: person who performed the work.
SELF_CERTIFYING = {"CODE_INSP", "EXPEDITING", "STAFF_DEPUT"}

BY_CODE = {w["work_type_code"]: w for w in DEFAULT_CATALOGUE}


@pytest.mark.parametrize("code", sorted(BY_CODE))
def test_self_certification_matches_the_recorded_decision(code):
    allowed = BY_CODE[code].get("allow_self_certification", False)
    assert allowed is (code in SELF_CERTIFYING), (
        f"{code} self-certification is {allowed}; the recorded decision is "
        f"{code in SELF_CERTIFYING}. If this changed on purpose, update "
        f"SELF_CERTIFYING and the architecture doc."
    )


def test_bill_verification_never_self_certifies():
    """Called out separately because it is the one that matters most: a
    surveyor certifying their own measurement of a contractor's claim is the
    scenario the separation of duties exists for."""
    for code in ("BILL_VERIF", "BOQ_RECON"):
        assert BY_CODE[code].get("allow_self_certification", False) is False


def test_every_work_type_is_full_auto():
    """IQE chose full auto wherever eligible. 0.0 is that mode; None would be
    recommend-only and a positive value a confidence threshold."""
    for code, wt in BY_CODE.items():
        assert wt.get("auto_assign_threshold") == 0.0, (
            f"{code} has threshold {wt.get('auto_assign_threshold')}, not full auto"
        )


def test_full_auto_assigns_the_top_candidate_when_anyone_is_eligible():
    ranked = [{"person_id": "EMP-1", "score": 0.81}, {"person_id": "EMP-2", "score": 0.44}]
    ok, reason = should_auto_assign(ranked, 0.0)
    assert ok is True
    assert "Full auto" in reason


def test_full_auto_still_refuses_when_nobody_is_eligible():
    """Full auto relaxes the review, never the eligibility gate. With no
    eligible candidate there is nobody to assign, and inventing one would put
    unqualified personnel on site."""
    ok, reason = should_auto_assign([], 0.0)
    assert ok is False
    assert "No eligible candidates" in reason


def test_full_auto_does_not_stall_on_a_tie():
    """A near-tie blocks a threshold-mode auto-assign. Under full auto that
    would make the mode quietly partial - two equally ranked eligible people
    are both correct choices."""
    tied = [{"person_id": "EMP-1", "score": 0.70}, {"person_id": "EMP-2", "score": 0.70}]
    assert should_auto_assign(tied, 0.0)[0] is True
    # The same tie under threshold mode still goes to a human.
    assert should_auto_assign(tied, 0.5)[0] is False


def test_recommend_only_remains_available():
    """Dialling back to recommend-only must stay a configuration change, not a
    code change - that is what makes the full-auto decision reversible."""
    ranked = [{"person_id": "EMP-1", "score": 0.99}]
    ok, reason = should_auto_assign(ranked, None)
    assert ok is False
    assert "off for this work type" in reason
