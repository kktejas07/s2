#!/usr/bin/env python3
"""Mock data for the execution spine: people, packages, assignments,
certifications, invoices and reports.

The spine modules shipped with no data, so every new screen renders empty and
there is nothing to demo or sanity-check against. This fills them with a
coherent set: four jobs across the disciplines IQE actually works in, eleven
people spanning technical and non-technical categories, and work packages
spread deliberately across the lifecycle so each screen has something in every
state it can show.

Idempotent. Everything is keyed on a stable identifier, so running it twice
changes nothing and running it after a partial failure finishes the job.

    python scripts/seed_spine_demo.py            # seed
    python scripts/seed_spine_demo.py --wipe     # remove only what this seeded

--wipe deletes exactly the records carrying seed_ref/demo markers. It will not
touch anything you entered by hand, and it refuses to run against a database
whose name does not look like a development one unless you pass --force.
"""
from __future__ import annotations

import argparse
import asyncio
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from beanie import init_beanie  # noqa: E402
from pymongo import AsyncMongoClient  # noqa: E402

from core.audit import AuditEntry  # noqa: E402
from core.sequences import Sequence  # noqa: E402
from core.config import settings  # noqa: E402
from modules.assignments.models import Assignment  # noqa: E402
from modules.assignments.service import AssignmentService  # noqa: E402
from modules.billing.models import BillingTerms  # noqa: E402
from modules.billing.service import BillingService  # noqa: E402
from modules.certifications.models import Certification  # noqa: E402
from modules.certifications.service import CertificationService  # noqa: E402
from modules.invoices.models import Invoice  # noqa: E402
from modules.evidence.models import Evidence  # noqa: E402
from modules.jobs.models import Job  # noqa: E402
from modules.people.models import (  # noqa: E402
    Authorization,
    CompetenceProfile,
    ImpartialityDeclaration,
    Person,
)
from modules.people.service import PeopleService  # noqa: E402
from modules.reporting.models import ReportFormat  # noqa: E402
from modules.reporting.service import ReportingService  # noqa: E402
from modules.work_packages.models import WorkPackage  # noqa: E402
from modules.work_packages.service import WorkPackageService  # noqa: E402
from modules.work_types.models import WorkTypeDefinition  # noqa: E402
from modules.work_types.service import WorkTypeService  # noqa: E402

SITE = "SITE-01"
USER = "USR-SEED"
NOW = datetime.now()

DOCUMENT_MODELS = [
    Evidence,
    AuditEntry,
    Sequence,
    Job, WorkTypeDefinition, WorkPackage, Person, CompetenceProfile,
    Authorization, ImpartialityDeclaration, Assignment, Certification,
    Invoice, BillingTerms, ReportFormat,
]

# --------------------------------------------------------------------- jobs

JOBS = [
    {
        "job_id": "JOB-DEMO-0001",
        "title": "Penstock & gate fabrication inspection",
        "client_name": "Greenko Energies Pvt. Ltd.",
        "manufacturer_name": "MEIL Fabrication Yard, Bhootpur",
        "location_address": "Bhootpur, Mahbubnagar, Telangana",
    },
    {
        "job_id": "JOB-DEMO-0002",
        "title": "Sterile injectables facility - Schedule M verification",
        "client_name": "SunPharma BioTech Ltd.",
        "manufacturer_name": "Ideal Pharma EPC Solutions Pvt. Ltd.",
        "location_address": "Baddi Pharma Hub, Himachal Pradesh",
    },
    {
        "job_id": "JOB-DEMO-0003",
        "title": "Mudigonda CHC - RA bill verification",
        "client_name": "State Health Medical Infrastructure Corp.",
        "manufacturer_name": "Suguna Metals & Civil Contractors Ltd.",
        "location_address": "Mudigonda, Khammam, Telangana",
    },
    {
        "job_id": "JOB-DEMO-0004",
        "title": "220kV switchyard expansion - expediting & SAT",
        "client_name": "NTPC Limited",
        "manufacturer_name": "BHEL Hyderabad",
        "location_address": "Ramagundam, Peddapalli, Telangana",
    },
]

# ------------------------------------------------------------------- people
# "authorize" values must match required_authorization_types in
# modules/work_types/catalogue.py exactly - CODE_INSPECTION, QUANTITY_SURVEY,
# BILL_VERIFICATION, GMP_COMPLIANCE, VENDOR_AUDIT, EXPEDITING, SAT_WITNESS.
# An unrecognised value is not an error at authorization time; it simply fails
# the eligibility gate later, which is a confusing way to find out.
# Spans every PersonCategory on purpose: the request was people management for
# technical and non-technical resources alike, and a roster of only inspectors
# would not exercise the deployability gate (which should pass an office
# administrator for admin work and refuse them for inspection).

PEOPLE = [
    # --- technical inspection: authorized, deployable
    {
        "employee_code": "IQE-INS-001", "full_name": "Rajesh Sharma",
        "category": "TECHNICAL_INSPECTION", "engagement_type": "PERMANENT",
        "designation": "Senior Inspection Engineer", "department": "Technical",
        "base_location": "Hyderabad", "prof_qualification": "B.E. Mechanical",
        "experience_text": "14", "inspector_code": "INS-001",
        "skill_sets": "Welding inspection, UT, RT film interpretation",
        "certifications_text": "ASNT NDT Level II (UT, RT, MT, PT), CSWIP 3.1",
        "phone": "+91 90000 10001", "email": "rajesh.sharma@iqe.example",
        "authorize": ["CODE_INSPECTION", "VENDOR_AUDIT"],
    },
    {
        "employee_code": "IQE-INS-002", "full_name": "Venkat Reddy Gade",
        "category": "TECHNICAL_INSPECTION", "engagement_type": "PERMANENT",
        "designation": "Inspection Engineer", "department": "Technical",
        "base_location": "Bhootpur, Telangana", "prof_qualification": "B.Tech Mechanical",
        "experience_text": "8", "inspector_code": "INS-002",
        "skill_sets": "Dimensional inspection, hydrotest witnessing",
        "certifications_text": "ASNT NDT Level II (UT, MT)",
        "phone": "+91 90000 10002", "email": "venkat.gade@iqe.example",
        "authorize": ["CODE_INSPECTION"],
    },
    {
        "employee_code": "IQE-INS-003", "full_name": "Sunita Nair",
        "category": "TECHNICAL_INSPECTION", "engagement_type": "PERMANENT",
        "designation": "QA/QC Lead - Pharma", "department": "Technical",
        "base_location": "Baddi, Himachal Pradesh", "prof_qualification": "M.Pharm",
        "experience_text": "11", "inspector_code": "INS-003",
        "skill_sets": "Schedule M / WHO-GMP audits, cleanroom qualification",
        "certifications_text": "Certified GMP Auditor, ISPE member",
        "phone": "+91 90000 10003", "email": "sunita.nair@iqe.example",
        "authorize": ["GMP_COMPLIANCE", "CODE_INSPECTION"],
    },
    {
        "employee_code": "IQE-INS-004", "full_name": "Mohammed Irfan",
        "category": "TECHNICAL_INSPECTION", "engagement_type": "ASSOCIATE",
        "designation": "Associate NDT Specialist", "department": "Technical",
        "base_location": "Chennai", "prof_qualification": "Diploma Mechanical",
        "experience_text": "22", "inspector_code": "INS-004",
        "associate_name": "Spectra NDT Services",
        "skill_sets": "Phased array UT, TOFD",
        "certifications_text": "ASNT NDT Level III (UT)",
        "phone": "+91 90000 10004", "email": "irfan@spectrandt.example",
        "authorize": ["CODE_INSPECTION"], "auth_valid_days": 25,
    },
    # --- quantity surveying / bill verification
    {
        "employee_code": "IQE-QS-001", "full_name": "Prakash Rao Kolli",
        "category": "TECHNICAL_ENGINEERING", "engagement_type": "PERMANENT",
        "designation": "Senior Quantity Surveyor", "department": "Quantity & Billing",
        "base_location": "Khammam, Telangana", "prof_qualification": "B.E. Civil",
        "experience_text": "16", "inspector_code": "QS-001",
        "skill_sets": "BOQ reconciliation, RA bill verification, IS 1200 measurement",
        "certifications_text": "RICS Associate",
        "phone": "+91 90000 20001", "email": "prakash.kolli@iqe.example",
        "authorize": ["QUANTITY_SURVEY", "BILL_VERIFICATION"],
    },
    {
        "employee_code": "IQE-QS-002", "full_name": "Anita Deshmukh",
        "category": "TECHNICAL_ENGINEERING", "engagement_type": "PERMANENT",
        "designation": "Quantity Surveyor - Reviewer", "department": "Quantity & Billing",
        "base_location": "Hyderabad", "prof_qualification": "B.Tech Civil",
        "experience_text": "9", "inspector_code": "QS-002",
        "skill_sets": "Measurement review, wastage analysis, material reconciliation",
        "phone": "+91 90000 20002", "email": "anita.deshmukh@iqe.example",
        "authorize": ["QUANTITY_SURVEY", "BILL_VERIFICATION"],
    },
    # --- technical engineering / electrical
    {
        "employee_code": "IQE-ENG-001", "full_name": "Suresh Babu Yadav",
        "category": "TECHNICAL_ENGINEERING", "engagement_type": "CONTRACT",
        "designation": "Electrical Commissioning Engineer", "department": "Technical",
        "base_location": "Ramagundam, Telangana", "prof_qualification": "B.E. Electrical",
        "experience_text": "12", "inspector_code": "ENG-001",
        "skill_sets": "Switchgear SAT, protection relay testing, HV commissioning",
        "contract_end": (NOW + timedelta(days=240)).isoformat(),
        "phone": "+91 90000 30001", "email": "suresh.yadav@iqe.example",
        "authorize": ["EXPEDITING", "SAT_WITNESS", "CODE_INSPECTION"],
        "auth_valid_days": 48,
    },
    # --- site labour (non-technical, the request's "construction guy"/technician)
    {
        "employee_code": "IQE-LAB-001", "full_name": "Ramulu Bhukya",
        "category": "SITE_LABOUR", "engagement_type": "DAILY_WAGE",
        "designation": "Site Technician", "department": "Site Operations",
        "base_location": "Mudigonda, Telangana", "prof_qualification": "ITI Fitter",
        "experience_text": "6", "phone": "+91 90000 40001",
        "skill_sets": "Measurement assistance, scaffolding, test rig setup",
    },
    {
        "employee_code": "IQE-LAB-002", "full_name": "Lakshmi Devi",
        "category": "SITE_LABOUR", "engagement_type": "DAILY_WAGE",
        "designation": "Site Helper", "department": "Site Operations",
        "base_location": "Mudigonda, Telangana",
        "experience_text": "3", "phone": "+91 90000 40002",
    },
    # --- awaiting a competence decision: the Technical Manager's queue
    {
        "employee_code": "IQE-INS-005", "full_name": "Kiran Kumar Puli",
        "category": "TECHNICAL_INSPECTION", "engagement_type": "TRAINEE",
        "designation": "Trainee Inspection Engineer", "department": "Technical",
        "base_location": "Hyderabad", "prof_qualification": "B.Tech Mechanical",
        "experience_text": "1", "inspector_code": "INS-005",
        "skill_sets": "Visual inspection (under supervision)",
        "phone": "+91 90000 10005", "email": "kiran.puli@iqe.example",
        "authorize": ["CODE_INSPECTION"], "auth_pending": True,
        "auth_evidence": {
            "qualification_verified": True,
            "training_completed": True,
            "supervised_inspections_count": 1,
            "supervised_required": 3,
            "witnessed_assessment_passed": False,
        },
    },
    # --- admin support (the request's "office boy")
    {
        "employee_code": "IQE-ADM-001", "full_name": "Srinivas Pothuraju",
        "category": "ADMIN_SUPPORT", "engagement_type": "PERMANENT",
        "designation": "Office Administrator", "department": "Administration",
        "base_location": "Hyderabad", "prof_qualification": "B.Com",
        "experience_text": "7", "phone": "+91 90000 50001",
        "email": "srinivas.p@iqe.example",
        "skill_sets": "Document control, report despatch, travel coordination",
    },
    # --- corporate function (the request's HR and software roles)
    {
        "employee_code": "IQE-COR-001", "full_name": "Divya Menon",
        "category": "CORPORATE_FUNCTION", "engagement_type": "PERMANENT",
        "designation": "HR Manager", "department": "Human Resources",
        "base_location": "Hyderabad", "prof_qualification": "MBA HR",
        "experience_text": "10", "phone": "+91 90000 60001",
        "email": "divya.menon@iqe.example",
        "skill_sets": "Recruitment, statutory compliance, onboarding",
    },
    {
        "employee_code": "IQE-COR-002", "full_name": "Arjun Kaushik",
        "category": "CORPORATE_FUNCTION", "engagement_type": "PERMANENT",
        "designation": "Software Engineer", "department": "IT",
        "base_location": "Hyderabad", "prof_qualification": "B.Tech CSE",
        "experience_text": "5", "phone": "+91 90000 60002",
        "email": "arjun.kaushik@iqe.example",
        "skill_sets": "Python, React, MongoDB",
    },
]

# ----------------------------------------------------------- work packages
# "path" is where each package ends up. Spread across the lifecycle on purpose
# so the console, dashboards and billing queue each have live rows: a package
# that is only ever 'planned' leaves the certification and billing screens as
# empty as they were before.

PACKAGES = [
    # --- JOB 1: fabrication inspection
    {
        "key": "DEMO-WP-01", "job_id": "JOB-DEMO-0001", "work_type_code": "CODE_INSP",
        "title": "Penstock shell weld inspection - Lot 1", "discipline": "Mechanical",
        "location": "MEIL Yard, Bhootpur", "rate": 12000.0, "quantity": 6.0,
        "start_in": -18, "days": 9, "path": ["assigned", "in_progress", "submitted", "under_qc", "certified"],
        "assign": "IQE-INS-001",
        "certify": {
            "reference_bill_no": "IQE/RA/2026/011", "retention_pct": 5.0,
            "certified_by": "IQE-INS-002",
            "lines": [
                {"line_id": "L1", "description": "Shell weld UT - 6 visits", "uom": "visit",
                 "rate": 12000.0, "claimed": 6.0, "certified": 6.0},
            ],
            "invoice": True,
        },
    },
    {
        "key": "DEMO-WP-02", "job_id": "JOB-DEMO-0001", "work_type_code": "CODE_INSP",
        "title": "Gate assembly dimensional & hydrotest witness", "discipline": "Mechanical",
        "location": "MEIL Yard, Bhootpur", "rate": 12000.0, "quantity": 4.0,
        "start_in": -4, "days": 10, "path": ["assigned", "in_progress"],
        "assign": "IQE-INS-002",
    },
    {
        "key": "DEMO-WP-03", "job_id": "JOB-DEMO-0001", "work_type_code": "CODE_INSP",
        "title": "Penstock shell weld inspection - Lot 2", "discipline": "Mechanical",
        "location": "MEIL Yard, Bhootpur", "rate": 12000.0, "quantity": 6.0,
        "start_in": 9, "days": 12, "path": [],
    },
    # --- JOB 2: Schedule M pharma
    {
        "key": "DEMO-WP-14", "job_id": "JOB-DEMO-0001", "work_type_code": "CODE_INSP",
        "title": "Trunnion & lifting lug weld inspection", "discipline": "Mechanical",
        "location": "MEIL Yard, Bhootpur", "rate": 12000.0, "quantity": 3.0,
        "start_in": -8, "days": 6, "path": ["assigned", "in_progress"],
        "assign": "IQE-INS-001",
        # planned_finish is in the past while the package is still in_progress,
        # which is what makes it show as overdue rather than merely open.
    },
    {
        "key": "DEMO-WP-04", "job_id": "JOB-DEMO-0002", "work_type_code": "GMP_SCHEDM",
        "title": "HVAC & cleanroom Schedule M verification", "discipline": "HVAC",
        "location": "Baddi, Himachal Pradesh", "rate": 18000.0, "quantity": 12.0,
        "start_in": -30, "days": 20, "path": ["assigned", "in_progress", "submitted", "under_qc"],
        "assign": "IQE-INS-003",
    },
    {
        "key": "DEMO-WP-05", "job_id": "JOB-DEMO-0002", "work_type_code": "GMP_SCHEDM",
        "title": "Process & piping - passivation and slope verification",
        "discipline": "Process & Piping", "location": "Baddi, Himachal Pradesh",
        "rate": 18000.0, "quantity": 8.0,
        "start_in": -6, "days": 15, "path": ["assigned", "in_progress"],
        "assign": "IQE-INS-003",
    },
    {
        "key": "DEMO-WP-06", "job_id": "JOB-DEMO-0002", "work_type_code": "BILL_VERIF",
        "title": "RA Bill 03 - cleanroom package verification", "discipline": "Civil",
        "location": "Baddi, Himachal Pradesh", "rate": 1.0,
        "start_in": -12, "days": 7,
        "path": ["assigned", "in_progress", "submitted", "under_qc", "certified"],
        "assign": "IQE-QS-001",
        "certify": {
            "reference_bill_no": "RA-03-CLEANROOM", "retention_pct": 5.0,
            "certified_by": "IQE-QS-002",
            "lines": [
                {"line_id": "L1", "description": "Modular wall panels - supply & erect",
                 "uom": "sqm", "rate": 4800.0, "claimed": 420.0, "certified": 398.0},
                {"line_id": "L2", "description": "Epoxy flooring - 3mm self levelling",
                 "uom": "sqm", "rate": 1650.0, "claimed": 610.0, "certified": 610.0},
                {"line_id": "L3", "description": "Coved skirting - SS 304",
                 "uom": "rmt", "rate": 2100.0, "claimed": 240.0, "certified": 226.0},
            ],
            "deductions": [
                {"reason_code": "MEASUREMENT_VARIANCE", "value": 105600.0,
                 "narrative": "22 sqm of wall panel not supported by joint measurement sheet"},
                {"reason_code": "DOCUMENTATION_MISSING", "value": 29400.0,
                 "narrative": "14 rmt skirting without material test certificate"},
            ],
            "invoice": True,
        },
    },
    # --- JOB 3: construction bill verification
    {
        "key": "DEMO-WP-07", "job_id": "JOB-DEMO-0003", "work_type_code": "BILL_VERIF",
        "title": "RA Bill 04 - material reconciliation & wastage", "discipline": "Civil",
        "location": "Mudigonda, Khammam", "rate": 1.0,
        "start_in": -9, "days": 5,
        "path": ["assigned", "in_progress", "submitted", "under_qc", "certified"],
        "assign": "IQE-QS-002",
        "certify": {
            "reference_bill_no": "RA-CBV-2026-004", "retention_pct": 10.0,
            "certified_by": "IQE-QS-001",
            "lines": [
                {"line_id": "CEM-01", "description": "Cement OPC 53 grade", "uom": "bags",
                 "rate": 400.0, "claimed": 1000.0, "certified": 950.0},
                {"line_id": "STL-01", "description": "TMT steel 12mm", "uom": "MT",
                 "rate": 65000.0, "claimed": 10.0, "certified": 10.0},
                {"line_id": "AGG-01", "description": "20mm metal aggregate", "uom": "cum",
                 "rate": 1450.0, "claimed": 320.0, "certified": 296.0},
            ],
            "deductions": [
                {"reason_code": "MATERIAL_SHORTFALL", "value": 20000.0,
                 "narrative": "50 bags cement unaccounted against consumption ledger"},
                {"reason_code": "MEASUREMENT_VARIANCE", "value": 34800.0,
                 "narrative": "24 cum aggregate wastage beyond 5% theoretical allowance"},
            ],
        },
    },
    {
        "key": "DEMO-WP-08", "job_id": "JOB-DEMO-0003", "work_type_code": "BOQ_RECON",
        "title": "Block B BOQ reconciliation - structure", "discipline": "Civil",
        "location": "Mudigonda, Khammam", "rate": 1.0,
        "start_in": -2, "days": 11, "path": ["assigned", "in_progress"],
        "assign": "IQE-QS-002",
    },
    {
        "key": "DEMO-WP-09", "job_id": "JOB-DEMO-0003", "work_type_code": "BILL_VERIF",
        "title": "RA Bill 05 - finishing works", "discipline": "Civil",
        "location": "Mudigonda, Khammam", "rate": 1.0,
        "start_in": 14, "days": 6, "path": [],
    },
    # --- JOB 4: expediting and SAT
    {
        "key": "DEMO-WP-10", "job_id": "JOB-DEMO-0004", "work_type_code": "EXPEDITING",
        "title": "220kV switchgear delivery expediting", "discipline": "Electrical",
        "location": "BHEL Hyderabad", "rate": 9000.0, "quantity": 5.0,
        "start_in": -22, "days": 25, "path": ["assigned", "in_progress", "submitted"],
        "assign": "IQE-ENG-001",
    },
    {
        "key": "DEMO-WP-11", "job_id": "JOB-DEMO-0004", "work_type_code": "SAT_COMM",
        "title": "Protection relay SAT - bay 3 & 4", "discipline": "Electrical",
        "location": "Ramagundam, Peddapalli", "rate": 15000.0, "quantity": 3.0,
        "start_in": 6, "days": 8, "path": ["assigned"],
        "assign": "IQE-ENG-001",
    },
    {
        "key": "DEMO-WP-12", "job_id": "JOB-DEMO-0004", "work_type_code": "VENDOR_AUDIT",
        "title": "Transformer vendor capability assessment", "discipline": "Electrical",
        "location": "Hyderabad", "rate": 25000.0, "quantity": 1.0,
        "start_in": -40, "days": 3,
        "path": ["assigned", "in_progress", "submitted", "under_qc", "certified"],
        "assign": "IQE-INS-001",
        "certify": {
            "reference_bill_no": "IQE/VA/2026/004", "retention_pct": 0.0,
            "certified_by": "IQE-INS-002",
            "lines": [
                {"line_id": "L1", "description": "Vendor assessment - lump sum", "uom": "nos",
                 "rate": 25000.0, "claimed": 1.0, "certified": 1.0},
            ],
        },
    },
    {
        "key": "DEMO-WP-13", "job_id": "JOB-DEMO-0004", "work_type_code": "STAFF_DEPUT",
        "title": "Site QA engineer deputation - October", "discipline": "Electrical",
        "location": "Ramagundam, Peddapalli", "rate": 4500.0, "quantity": 26.0,
        "start_in": -20, "days": 26, "path": ["assigned", "in_progress"],
        "assign": "IQE-INS-004",
    },
]

BILLING_TERMS = [
    {"so_id": "JOB-DEMO-0001", "job_id": "JOB-DEMO-0001", "payment_terms_code": "NET_45",
     "retention_pct": 5.0, "gst_percentage": 18.0, "tds_percentage": 2.0},
    {"so_id": "JOB-DEMO-0002", "job_id": "JOB-DEMO-0002", "payment_terms_code": "NET_60",
     "retention_pct": 5.0, "advance_pct": 10.0, "gst_percentage": 18.0, "tds_percentage": 2.0},
    {"so_id": "JOB-DEMO-0003", "job_id": "JOB-DEMO-0003", "payment_terms_code": "NET_30",
     "retention_pct": 10.0, "gst_percentage": 18.0, "tds_percentage": 2.0},
    {"so_id": "JOB-DEMO-0004", "job_id": "JOB-DEMO-0004", "payment_terms_code": "NET_30",
     "retention_pct": 0.0, "gst_percentage": 18.0, "tds_percentage": 2.0},
]


# ------------------------------------------------------------------ seeding

async def seed_jobs(log) -> int:
    created = 0
    for spec in JOBS:
        if await Job.find_one(Job.job_id == spec["job_id"]):
            continue
        await Job(site_id=SITE, status="active", **spec).insert()
        created += 1
        log(f"  job {spec['job_id']}  {spec['title']}")
    return created


async def seed_people(log) -> dict[str, str]:
    """Returns employee_code -> person_id for everyone, new or existing."""
    index: dict[str, str] = {}
    for spec in PEOPLE:
        spec = dict(spec)
        code = spec["employee_code"]
        authorize = spec.pop("authorize", None)
        auth_valid_days = spec.pop("auth_valid_days", 365)
        auth_pending = spec.pop("auth_pending", False)
        auth_evidence = spec.pop("auth_evidence", None)

        existing = await Person.find_one(
            Person.employee_code == code, Person.site_id == SITE
        )
        if existing:
            index[code] = existing.person_id
            continue

        person = await PeopleService.create(
            {**spec, "employment_status": "active",
             "date_of_joining": (NOW - timedelta(days=400)).isoformat()},
            SITE, USER,
        )
        index[code] = person.person_id
        log(f"  person {code}  {spec['full_name']} ({spec['category']})")

        # Impartiality first: an authorization granted before the declaration
        # exists would be a grant with no impartiality record behind it, which
        # is the exact gap 17020 asks you to close.
        await PeopleService.declare_impartiality(
            person.person_id,
            {
                "declaration_date": NOW - timedelta(days=30),
                "has_conflict": False,
                "previous_employers": [],
                "declared_relationships": [],
                "valid_until": NOW + timedelta(days=335),
            },
            SITE,
        )

        if authorize:
            evidence = auth_evidence or {
                "qualification_verified": True,
                "training_completed": True,
                "supervised_inspections_count": 5,
                "supervised_required": 3,
                "witnessed_assessment_passed": True,
            }
            auth = await PeopleService.create_authorization(
                person.person_id,
                {
                    "inspection_types": authorize,
                    "valid_until": NOW + timedelta(days=auth_valid_days),
                    **evidence,
                },
                SITE, USER,
            )
            # Left undecided on purpose for the trainee: decide_authorization
            # refuses to authorize on incomplete evidence, and that refusal is
            # the behaviour worth being able to see.
            if not auth_pending:
                await PeopleService.decide_authorization(
                    auth.authorization_id, "authorized", SITE, USER,
                    "seeded: competence evidence on file",
                )
    return index


async def seed_packages(people: dict[str, str], log) -> dict:
    counts = {"packages": 0, "assignments": 0, "certifications": 0, "invoices": 0}

    for spec in PACKAGES:
        ref = f"seed:{spec['key']}"
        if await WorkPackage.find_one(
            WorkPackage.migrated_from_ref == ref, WorkPackage.site_id == SITE
        ):
            continue

        payload = {
            "job_id": spec["job_id"],
            "work_type_code": spec["work_type_code"],
            "title": spec["title"],
            "discipline": spec.get("discipline"),
            "location": spec.get("location"),
            "planned_start": NOW + timedelta(days=spec["start_in"]),
            "planned_finish": NOW + timedelta(days=spec["start_in"] + spec["days"]),
            "rate": spec.get("rate"),
            "quantity": spec.get("quantity"),
            "migrated_from_ref": ref,
        }
        wp = await WorkPackageService.create(payload, SITE, USER)
        counts["packages"] += 1
        log(f"  package {wp.work_package_id}  {spec['title']}")

        path = list(spec.get("path") or [])
        assignee_code = spec.get("assign")

        for to in path:
            # Assign at the point the lifecycle says someone took it on, so the
            # assignment's own eligibility re-check happens against a package
            # in the state it was really in.
            if to == "assigned" and assignee_code:
                await AssignmentService.assign(
                    wp.work_package_id, people[assignee_code], SITE, USER,
                )
                counts["assignments"] += 1
            else:
                await WorkPackageService.transition(wp.work_package_id, to, SITE, USER)

        cert_spec = spec.get("certify")
        if not cert_spec:
            continue

        cert = await CertificationService.create(
            {
                "work_package_id": wp.work_package_id,
                "reference_bill_no": cert_spec["reference_bill_no"],
                "retention_pct": cert_spec.get("retention_pct", 0.0),
                "prepared_by": people[assignee_code] if assignee_code else USER,
                "line_items": [
                    {
                        "line_id": ln["line_id"], "description": ln["description"],
                        "uom": ln["uom"], "rate": ln["rate"],
                        "claimed_quantity": ln["claimed"],
                        "certified_quantity": ln["certified"],
                    }
                    for ln in cert_spec["lines"]
                ],
                "deductions": cert_spec.get("deductions", []),
            },
            SITE, USER,
        )
        # Certified by someone other than the preparer - the separation of
        # duties the spine enforces.
        cert = await CertificationService.issue(
            cert.certification_id, people[cert_spec["certified_by"]], SITE, USER,
        )
        counts["certifications"] += 1
        log(f"    certification {cert.certification_id}  "
            f"claimed {cert.claimed_value:,.0f} -> certified {cert.certified_value:,.0f}")

        if cert_spec.get("invoice"):
            inv = await BillingService.raise_invoice_from_certifications(
                [cert.certification_id], SITE, USER, so_id=spec["job_id"],
            )
            counts["invoices"] += 1
            inv_no = getattr(inv, "invoice_no", None) or getattr(inv, "invoice_id", "invoice")
            log(f"    invoice {inv_no}")

    return counts


async def apply_exception_states(log) -> dict:
    """Put a few records into the states the exception screens exist for.

    Seeded data in which nothing is ever late, disputed or overdue teaches the
    wrong thing: the ageing buckets, the dispute note and the overdue queue all
    render as though those paths never fire.
    """
    applied = {"disputed": 0, "overdue_invoices": 0}

    # The vendor assessment certification is contested by the client.
    cert = await Certification.find_one(
        Certification.reference_bill_no == "IQE/VA/2026/004",
        Certification.site_id == SITE,
    )
    if cert and cert.status == "issued" and not cert.billed_invoice_id:
        await CertificationService.dispute(
            cert.certification_id,
            "Client disputes the assessment fee basis: PO states a lump sum of "
            "INR 20,000 against the INR 25,000 claimed. Awaiting PO amendment.",
            SITE,
        )
        applied["disputed"] += 1
        log(f"  disputed {cert.certification_id}")

    # The first invoice is backdated so it sits past its NET_45 due date, which
    # is how the ageing buckets and the overdue queue get a row.
    inv = await Invoice.find_one(
        Invoice.site_id == SITE, Invoice.job_id == "JOB-DEMO-0001",
        {"cancelled": {"$ne": True}},
    )
    if inv and inv.due_date and inv.due_date > NOW:
        inv.invoice_date = NOW - timedelta(days=72)
        inv.due_date = NOW - timedelta(days=27)
        inv.payment_status = inv.payment_status or "unpaid"
        inv.updated_at = NOW
        await inv.save()
        applied["overdue_invoices"] += 1
        log(f"  backdated {getattr(inv, 'invoice_no', None) or inv.invoice_id} to 27 days overdue")

    return applied


async def seed_billing_terms(log) -> int:
    created = 0
    for spec in BILLING_TERMS:
        existing = await BillingTerms.find_one(
            BillingTerms.so_id == spec["so_id"], BillingTerms.site_id == SITE
        )
        if existing:
            continue
        await BillingService.set_terms(spec["so_id"], dict(spec), SITE, USER)
        created += 1
        log(f"  billing terms {spec['so_id']}  {spec['payment_terms_code']}")
    return created


async def run_seed(log) -> dict:
    log("Work type catalogue…")
    wt = await WorkTypeService.seed_catalogue(SITE, USER)
    log(f"  {len(wt['created'])} created, {len(wt['skipped_existing'])} already present")

    log("Report formats…")
    rf = await ReportingService.seed_formats(SITE)
    log(f"  {len(rf['created'])} created, {len(rf['skipped_existing'])} already present")

    log("Jobs…")
    jobs = await seed_jobs(log)

    log("People…")
    people = await seed_people(log)

    log("Billing terms…")
    terms = await seed_billing_terms(log)

    log("Work packages, assignments, certifications, invoices…")
    counts = await seed_packages(people, log)

    log("Exception states (disputed, overdue)…")
    exceptions = await apply_exception_states(log)

    return {
        "work_types_created": len(wt["created"]),
        "report_formats_created": len(rf["created"]),
        "jobs_created": jobs,
        "people_total": len(people),
        "billing_terms_created": terms,
        **counts,
        **exceptions,
    }


# -------------------------------------------------------------------- wipe

async def run_wipe(log) -> dict:
    """Removes only what this script seeded, identified by its own markers."""
    removed = {"invoices": 0, "certifications": 0, "assignments": 0,
               "packages": 0, "people": 0, "jobs": 0, "billing_terms": 0}

    demo_job_ids = [j["job_id"] for j in JOBS]
    packages = await WorkPackage.find(
        WorkPackage.site_id == SITE,
        {"migrated_from_ref": {"$regex": "^seed:DEMO-WP-"}},
    ).to_list()
    package_ids = [p.work_package_id for p in packages]

    # Child-first, so nothing is left pointing at a record that is gone.
    for inv in await Invoice.find(
        Invoice.site_id == SITE, {"job_id": {"$in": demo_job_ids}}
    ).to_list():
        await inv.delete()
        removed["invoices"] += 1

    for cert in await Certification.find(
        Certification.site_id == SITE, {"work_package_id": {"$in": package_ids}}
    ).to_list():
        await cert.delete()
        removed["certifications"] += 1

    for a in await Assignment.find(
        Assignment.site_id == SITE, {"work_package_id": {"$in": package_ids}}
    ).to_list():
        await a.delete()
        removed["assignments"] += 1

    for p in packages:
        await p.delete()
        removed["packages"] += 1

    codes = [spec["employee_code"] for spec in PEOPLE]
    for person in await Person.find(
        Person.site_id == SITE, {"employee_code": {"$in": codes}}
    ).to_list():
        for model in (Authorization, ImpartialityDeclaration, CompetenceProfile):
            for rec in await model.find(model.person_id == person.person_id).to_list():
                await rec.delete()
        await person.delete()
        removed["people"] += 1

    for t in await BillingTerms.find(
        BillingTerms.site_id == SITE, {"so_id": {"$in": demo_job_ids}}
    ).to_list():
        await t.delete()
        removed["billing_terms"] += 1

    for job in await Job.find({"job_id": {"$in": demo_job_ids}}).to_list():
        await job.delete()
        removed["jobs"] += 1

    for k, v in removed.items():
        log(f"  removed {v} {k}")
    return removed


# --------------------------------------------------------------------- main

PROD_LOOKING = ("prod", "production", "live")


async def main(wipe: bool, force: bool, quiet: bool) -> int:
    def log(msg: str) -> None:
        if not quiet:
            print(msg)

    db_name = settings.mongodb_db_name
    if not force and any(tag in db_name.lower() for tag in PROD_LOOKING):
        print(
            f"Refusing to touch database '{db_name}': the name looks like production. "
            "Pass --force if you are certain.",
            file=sys.stderr,
        )
        return 2

    client = AsyncMongoClient(settings.mongodb_url)
    await init_beanie(database=client[db_name], document_models=DOCUMENT_MODELS)

    log(f"{'Wiping' if wipe else 'Seeding'} demo data in '{db_name}'…\n")
    result = await run_wipe(log) if wipe else await run_seed(log)

    log("")
    for k, v in result.items():
        log(f"{k:28} {v}")
    log("\nDone." if wipe else "\nDone. Open /console, /work-packages, /certifications, "
        "/billing and /reports to see it.")
    await client.close()
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--wipe", action="store_true",
                    help="remove the records this script seeded, instead of seeding")
    ap.add_argument("--force", action="store_true",
                    help="proceed even if the database name looks like production")
    ap.add_argument("--quiet", action="store_true", help="only print the summary")
    args = ap.parse_args()
    raise SystemExit(asyncio.run(main(args.wipe, args.force, args.quiet)))
