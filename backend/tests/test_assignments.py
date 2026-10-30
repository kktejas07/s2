"""Unit tests for the assignment engine.

The central claim under test: competence is a precondition, not a weighted
factor. A perfectly convenient inspector who is not authorized must be
excluded, never merely out-ranked.
"""
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from modules.assignments.models import (  # noqa: E402
    ALLOWED_TRANSITIONS,
    WEIGHTS,
    AssignmentRole,
    AssignmentStatus,
    check_eligibility,
    score_candidate,
    should_auto_assign,
)

NOW = datetime(2026, 10, 21)
WORK_START = NOW + timedelta(days=7)


def person(deployable=True, reason=None):
    return {"deployable": deployable, "deployability_reason": reason}


def auth(types=("CODE_INSPECTION",), valid_until=NOW + timedelta(days=365)):
    return {"inspection_types": list(types), "valid_until": valid_until}


def eligible(**over):
    args = {
        "person": person(),
        "authorization": auth(),
        "required_inspection_types": ["CODE_INSPECTION"],
        "work_from": WORK_START,
        "has_impartiality_conflict": False,
        "has_calendar_clash": False,
    }
    args.update(over)
    return check_eligibility(**args)


# ---------------------------------------------------------- the hard gate

def test_authorized_available_person_is_eligible():
    ok, reason = eligible()
    assert ok is True and reason is None


def test_not_deployable_is_excluded():
    ok, reason = eligible(person=person(False, "Authorization has expired"))
    assert ok is False
    assert reason == "Authorization has expired"


def test_no_authorization_is_excluded():
    ok, reason = eligible(authorization=None)
    assert ok is False
    assert reason == "No current authorization"


def test_wrong_inspection_type_is_excluded():
    """The case weighted scoring gets wrong: convenient but not authorized."""
    ok, reason = eligible(
        authorization=auth(types=("VENDOR_AUDIT",)),
        required_inspection_types=["CODE_INSPECTION"],
    )
    assert ok is False
    assert "Not authorized for CODE_INSPECTION" in reason


def test_partial_authorization_is_still_excluded():
    ok, reason = eligible(
        authorization=auth(types=("CODE_INSPECTION",)),
        required_inspection_types=["CODE_INSPECTION", "SAT_WITNESS"],
    )
    assert ok is False
    assert "SAT_WITNESS" in reason


def test_authorization_lapsing_before_work_starts_is_excluded():
    """Valid today but not on the day of the work is not valid."""
    ok, reason = eligible(authorization=auth(valid_until=WORK_START - timedelta(days=1)))
    assert ok is False
    assert "lapses" in reason


def test_authorization_valid_through_the_window_is_fine():
    ok, _ = eligible(authorization=auth(valid_until=WORK_START + timedelta(days=1)))
    assert ok is True


def test_impartiality_conflict_is_excluded():
    ok, reason = eligible(has_impartiality_conflict=True)
    assert ok is False
    assert "Impartiality" in reason


def test_calendar_clash_is_excluded():
    ok, reason = eligible(has_calendar_clash=True)
    assert ok is False
    assert "Already committed" in reason


def test_no_required_types_still_needs_an_authorization():
    ok, reason = eligible(required_inspection_types=[], authorization=None)
    assert ok is False
    assert reason == "No current authorization"


def test_every_exclusion_gives_a_reason():
    for over in (
        {"person": person(False, "Employment status is exited")},
        {"authorization": None},
        {"authorization": auth(types=("OTHER",))},
        {"has_impartiality_conflict": True},
        {"has_calendar_clash": True},
    ):
        ok, reason = eligible(**over)
        assert ok is False and reason, over


# -------------------------------------------------------------- scoring

def test_weights_sum_to_one():
    assert round(sum(WEIGHTS.values()), 6) == 1.0


def test_perfect_candidate_scores_one():
    b = score_candidate(1, 1, 1, 1, 1)
    assert b.total == 1.0


def test_worst_candidate_scores_zero():
    assert score_candidate(0, 0, 0, 0, 0).total == 0.0


def test_skill_dominates_proximity():
    """Skill is weighted 0.40 against proximity 0.25."""
    skilled_far = score_candidate(1, 0, 0.5, 0.5, 0.5)
    unskilled_near = score_candidate(0, 1, 0.5, 0.5, 0.5)
    assert skilled_far.total > unskilled_near.total


def test_inputs_are_clamped_not_trusted():
    assert score_candidate(5, -3, 99, 1, 1).total <= 1.0
    assert score_candidate(-1, -1, -1, -1, -1).total == 0.0


def test_breakdown_parts_sum_to_total():
    b = score_candidate(0.8, 0.6, 0.9, 0.4, 0.7)
    parts = b.skill_depth + b.proximity + b.availability + b.workload + b.past_performance
    assert round(parts, 4) == b.total


# ---------------------------------------------------------- auto-assign

def test_auto_assign_off_by_default():
    ranked = [{"score": 0.99}, {"score": 0.2}]
    ok, reason = should_auto_assign(ranked, threshold=None)
    assert ok is False
    assert "off" in reason


def test_auto_assign_needs_the_threshold_cleared():
    ok, reason = should_auto_assign([{"score": 0.6}], threshold=0.8)
    assert ok is False
    assert "below" in reason


def test_auto_assign_refuses_a_near_tie():
    """A close call is a decision for a coordinator, not a machine."""
    ok, reason = should_auto_assign(
        [{"score": 0.91}, {"score": 0.90}], threshold=0.8
    )
    assert ok is False
    assert "too close" in reason


def test_auto_assign_allowed_with_clear_margin():
    ok, _ = should_auto_assign([{"score": 0.92}, {"score": 0.60}], threshold=0.8)
    assert ok is True


def test_auto_assign_with_a_single_candidate_clears():
    ok, _ = should_auto_assign([{"score": 0.85}], threshold=0.8)
    assert ok is True


def test_auto_assign_with_no_candidates_refuses():
    ok, reason = should_auto_assign([], threshold=0.5)
    assert ok is False
    assert "No eligible" in reason


# ------------------------------------------------------- state machine

def test_every_status_has_transitions_defined():
    for s in AssignmentStatus:
        assert s.value in ALLOWED_TRANSITIONS


def test_transition_targets_are_real_statuses():
    valid = {s.value for s in AssignmentStatus}
    for origin, targets in ALLOWED_TRANSITIONS.items():
        assert targets <= valid, origin


def test_terminal_states_are_terminal():
    assert ALLOWED_TRANSITIONS["completed"] == set()
    assert ALLOWED_TRANSITIONS["withdrawn"] == set()


def test_client_rejection_allows_proposing_someone_else():
    assert "proposed" in ALLOWED_TRANSITIONS["rejected"]


def test_work_cannot_go_active_without_being_accepted():
    for origin in ("proposed", "pending_client_approval", "rejected"):
        assert "active" not in ALLOWED_TRANSITIONS[origin], origin
    assert "active" in ALLOWED_TRANSITIONS["accepted"]


def test_roles_are_distinct():
    values = [r.value for r in AssignmentRole]
    assert len(values) == len(set(values))
