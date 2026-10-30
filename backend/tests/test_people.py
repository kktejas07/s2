"""Unit tests for the deployability gate and legacy mapping.

evaluate_deployability is pure, so the ISO/IEC 17020 rule - onboarded is not
the same as deployable - is verified without a database.
"""
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from modules.people.models import (  # noqa: E402
    DEPLOYABLE_STATUSES,
    EXPIRY_CRITICAL_TYPES,
    AuthorizationStatus,
    EmploymentStatus,
    EngagementType,
    PersonCategory,
    QualificationType,
    evaluate_deployability,
)
from scripts.migrate_legacy_people import (  # noqa: E402
    EMPLOYEE_TYPE_TO_CATEGORY,
    map_row,
)

NOW = datetime(2026, 10, 21)


def good_auth(**over):
    base = {
        "status": AuthorizationStatus.AUTHORIZED.value,
        "valid_until": NOW + timedelta(days=365),
        "inspection_types": ["CODE_INSPECTION"],
    }
    base.update(over)
    return base


def qual(name="ASNT NDT Level II", qtype=QualificationType.CERTIFICATION.value, expires=None):
    return {"qualification_type": qtype, "name": name, "expires_on": expires}


# ----------------------------------------------------------- the happy path

def test_authorized_and_current_is_deployable():
    ok, reason = evaluate_deployability(
        EmploymentStatus.ACTIVE.value, good_auth(),
        [qual(expires=NOW + timedelta(days=200))], as_of=NOW,
    )
    assert ok is True
    assert reason == "Authorized and current"


def test_all_deployable_statuses_pass():
    for status in DEPLOYABLE_STATUSES:
        ok, _ = evaluate_deployability(status, good_auth(), [], as_of=NOW)
        assert ok is True, status


# ------------------------------------------------------- the gate in action

def test_onboarding_is_not_deployable_even_when_authorized():
    """The whole point of the gate: onboarded does not mean deployable."""
    ok, reason = evaluate_deployability(
        EmploymentStatus.ONBOARDING.value, good_auth(), [], as_of=NOW
    )
    assert ok is False
    assert "onboarding" in reason


def test_no_authorization_blocks_deployment():
    ok, reason = evaluate_deployability(EmploymentStatus.ACTIVE.value, None, [], as_of=NOW)
    assert ok is False
    assert reason == "No authorization on record"


def test_pending_authorization_blocks_deployment():
    ok, reason = evaluate_deployability(
        EmploymentStatus.ACTIVE.value,
        good_auth(status=AuthorizationStatus.PENDING.value), [], as_of=NOW,
    )
    assert ok is False
    assert "pending" in reason


def test_suspended_authorization_blocks_deployment():
    ok, _ = evaluate_deployability(
        EmploymentStatus.ACTIVE.value,
        good_auth(status=AuthorizationStatus.SUSPENDED.value), [], as_of=NOW,
    )
    assert ok is False


def test_expired_authorization_blocks_deployment():
    ok, reason = evaluate_deployability(
        EmploymentStatus.ACTIVE.value,
        good_auth(valid_until=NOW - timedelta(days=1)), [], as_of=NOW,
    )
    assert ok is False
    assert reason == "Authorization has expired"


def test_exited_person_is_never_deployable():
    ok, _ = evaluate_deployability(EmploymentStatus.EXITED.value, good_auth(), [], as_of=NOW)
    assert ok is False


def test_suspended_person_is_not_deployable():
    ok, _ = evaluate_deployability(EmploymentStatus.SUSPENDED.value, good_auth(), [], as_of=NOW)
    assert ok is False


# ------------------------------------------------------ qualification lapse

def test_lapsed_certification_blocks_deployment():
    ok, reason = evaluate_deployability(
        EmploymentStatus.ACTIVE.value, good_auth(),
        [qual("CSWIP 3.1", expires=NOW - timedelta(days=3))], as_of=NOW,
    )
    assert ok is False
    assert "CSWIP 3.1" in reason and "lapsed" in reason


def test_lapsed_licence_also_blocks():
    ok, _ = evaluate_deployability(
        EmploymentStatus.ACTIVE.value, good_auth(),
        [qual("Site licence", QualificationType.LICENCE.value, NOW - timedelta(days=1))],
        as_of=NOW,
    )
    assert ok is False


def test_expired_degree_does_not_block():
    """A degree does not lapse; only certifications and licences gate deployment."""
    ok, _ = evaluate_deployability(
        EmploymentStatus.ACTIVE.value, good_auth(),
        [qual("B.Tech Mech", QualificationType.DEGREE.value, NOW - timedelta(days=4000))],
        as_of=NOW,
    )
    assert ok is True


def test_qualification_with_no_expiry_does_not_block():
    ok, _ = evaluate_deployability(
        EmploymentStatus.ACTIVE.value, good_auth(), [qual(expires=None)], as_of=NOW
    )
    assert ok is True


def test_one_lapsed_among_many_still_blocks():
    ok, _ = evaluate_deployability(
        EmploymentStatus.ACTIVE.value, good_auth(),
        [
            qual("Current cert", expires=NOW + timedelta(days=100)),
            qual("Lapsed cert", expires=NOW - timedelta(days=1)),
        ],
        as_of=NOW,
    )
    assert ok is False


def test_expiry_critical_types_are_the_lapsing_ones():
    assert EXPIRY_CRITICAL_TYPES == {
        QualificationType.CERTIFICATION.value, QualificationType.LICENCE.value
    }


# ------------------------------------------------------------ legacy mapping

def legacy_row(**over):
    base = {
        "UserId": 42, "FirstName": "Rajesh", "LastName": "Sharma",
        "EmailId": "rajesh@example.com", "LoginName": "rsharma",
        "EmployeeTypeId": 1, "IsUserActive": True, "IsSecondment": False,
        "AssociateId": None, "AssociateName": None,
        "EmployeeCode": "IQE/EMP/001", "InspectorCode": "STAMP-17",
        "BankAcc": "123456789", "PAN": "ABCDE1234F", "ESI": "ESI-9",
        "City": "Hyderabad", "CityName": "Hyderabad",
    }
    base.update(over)
    return base


def test_mapping_preserves_statutory_and_banking_fields():
    """These are exactly what the first rewrite dropped."""
    m = map_row(legacy_row(), "SITE-01")
    assert m["bank_account"] == "123456789"
    assert m["pan"] == "ABCDE1234F"
    assert m["esi_no"] == "ESI-9"
    assert m["inspector_code"] == "STAMP-17"
    assert m["employee_code"] == "IQE/EMP/001"


def test_mapping_builds_full_name_from_parts():
    assert map_row(legacy_row(), "SITE-01")["full_name"] == "Rajesh Sharma"


def test_mapping_falls_back_to_login_name_when_unnamed():
    m = map_row(legacy_row(FirstName=None, LastName=None), "SITE-01")
    assert m["full_name"] == "rsharma"


def test_secondment_flag_becomes_engagement_type():
    m = map_row(legacy_row(IsSecondment=True), "SITE-01")
    assert m["engagement_type"] == EngagementType.SECONDMENT.value


def test_associate_link_becomes_associate_engagement():
    m = map_row(legacy_row(AssociateName="Velosi"), "SITE-01")
    assert m["engagement_type"] == EngagementType.ASSOCIATE.value


def test_unmapped_employee_type_defaults_rather_than_failing():
    m = map_row(legacy_row(EmployeeTypeId=99), "SITE-01")
    assert m["category"] == PersonCategory.TECHNICAL_INSPECTION.value


def test_inactive_user_maps_to_exited():
    assert map_row(legacy_row(IsUserActive=False), "SITE-01")["employment_status"] == "exited"
    assert map_row(legacy_row(IsUserActive=True), "SITE-01")["employment_status"] == "active"


def test_legacy_id_is_carried_for_idempotency():
    assert map_row(legacy_row(), "SITE-01")["migrated_from_legacy_user_id"] == 42


def test_blank_strings_become_none_not_empty():
    m = map_row(legacy_row(PAN="   ", BankAcc=""), "SITE-01")
    assert m["pan"] is None
    assert m["bank_account"] is None


def test_category_mapping_targets_are_all_real():
    valid = {c.value for c in PersonCategory}
    assert set(EMPLOYEE_TYPE_TO_CATEGORY.values()) <= valid
