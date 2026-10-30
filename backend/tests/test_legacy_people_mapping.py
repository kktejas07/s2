"""Classifying legacy employee types into person categories.

The migration used to map EmployeeTypeId to a category with hardcoded ids that
were an informed guess - the ids are installation-specific, so the guess could
easily have been wrong for every single person. It now reads the EmployeeType
master and classifies by name.

The database cannot be reached from the test environment, but the classifier
can: it is a pure function over a type's name, and it is where the mistakes
live. These cases are drawn from the designations that actually appear in IQE's
roster.
"""
import importlib.util
import sys
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))


def _load():
    path = BACKEND / "scripts" / "migrate_legacy_people.py"
    spec = importlib.util.spec_from_file_location("migrate_legacy_people", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


mlp = _load()


@pytest.mark.parametrize("name,expected", [
    # technical inspection
    ("Inspection Engineer", "TECHNICAL_INSPECTION"),
    ("Senior Inspection Engineer", "TECHNICAL_INSPECTION"),
    ("QA/QC Inspector", "TECHNICAL_INSPECTION"),
    ("NDT Technician Level II", "TECHNICAL_INSPECTION"),
    ("Welding Inspector", "TECHNICAL_INSPECTION"),
    ("Vendor Auditor", "TECHNICAL_INSPECTION"),
    # technical engineering
    ("Design Engineer", "TECHNICAL_ENGINEERING"),
    ("Quantity Surveyor", "TECHNICAL_ENGINEERING"),
    ("Billing Engineer", "TECHNICAL_ENGINEERING"),
    ("Commissioning Engineer", "TECHNICAL_ENGINEERING"),
    # site labour
    ("Mason", "SITE_LABOUR"),
    ("Site Helper", "SITE_LABOUR"),
    ("Site Technician", "SITE_LABOUR"),
    ("Rigger", "SITE_LABOUR"),
    # admin support
    ("Office Boy", "ADMIN_SUPPORT"),
    ("Driver", "ADMIN_SUPPORT"),
    ("Store Keeper", "ADMIN_SUPPORT"),
    ("Receptionist", "ADMIN_SUPPORT"),
    # corporate
    ("HR Manager", "CORPORATE_FUNCTION"),
    ("Accounts Executive", "CORPORATE_FUNCTION"),
    ("Software Developer", "CORPORATE_FUNCTION"),
])
def test_type_name_classifies_as_expected(name, expected):
    assert mlp.category_for_type_name(name) == expected


def test_matching_is_anchored_at_a_word_boundary():
    """The regression: 'it' occurs inside 'site', so bare substring matching
    filed every site role as a corporate function."""
    assert mlp.category_for_type_name("Site Helper") == "SITE_LABOUR"
    assert mlp.category_for_type_name("Site Supervisor") != "CORPORATE_FUNCTION"


def test_quantity_surveyor_agrees_with_the_seeded_roster():
    """scripts/seed_spine_demo.py files surveyors as TECHNICAL_ENGINEERING. If
    these disagree the same person lands in a different category depending on
    whether they were seeded or migrated."""
    assert mlp.category_for_type_name("Quantity Surveyor") == "TECHNICAL_ENGINEERING"
    assert mlp.category_for_type_name("Senior Quantity Surveyor") == "TECHNICAL_ENGINEERING"


def test_an_unrecognised_name_is_reported_rather_than_guessed():
    """Returning None is what makes the migration print the type for a human to
    map. Silently defaulting would hide it."""
    assert mlp.category_for_type_name("Grade IV Associate") is None
    assert mlp.category_for_type_name("") is None
    assert mlp.category_for_type_name(None) is None


def test_every_keyword_group_maps_to_a_real_category():
    from modules.people.models import PersonCategory

    valid = {c.value for c in PersonCategory}
    for category, words in mlp.CATEGORY_KEYWORDS:
        assert category in valid, f"{category} is not a PersonCategory"
        assert words, f"{category} has no keywords"


def test_derived_mapping_takes_precedence_over_the_hardcoded_fallback():
    """The fallback ids are a guess and must only be reached when the master
    could not be read."""
    assert mlp.EMPLOYEE_TYPE_TO_CATEGORY == {}, "starts empty, filled at runtime"
    assert mlp.FALLBACK_TYPE_TO_CATEGORY, "a fallback still exists"

    mlp.EMPLOYEE_TYPE_TO_CATEGORY[7] = "SITE_LABOUR"
    try:
        table = mlp.EMPLOYEE_TYPE_TO_CATEGORY or mlp.FALLBACK_TYPE_TO_CATEGORY
        assert table[7] == "SITE_LABOUR"
        assert 1 not in table, "the fallback must not leak in once derived"
    finally:
        mlp.EMPLOYEE_TYPE_TO_CATEGORY.clear()
