"""Seed all 40 empty collections with realistic, cross-referenced test data.

Run:  cd backend && .venv/bin/python scripts/seed_remaining_collections.py

Uses pymongo (sync) to insert directly — no Beanie init required.
Existing collections are NOT touched; only empty ones are seeded.
"""
from __future__ import annotations

import hashlib
import random
from datetime import datetime, timedelta
from pymongo import MongoClient

import os

# Defaults are for a local dev box; on a container the backend's env points at
# the real instance and database, which is what we want to seed.
MONGO_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("MONGODB_DB_NAME", "iqeapp_dev")

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

now = datetime.now()


def dt(days_ago: int = 0, hours: int = 9) -> datetime:
    return now - timedelta(days=days_ago, hours=random.randint(0, 4)) + timedelta(hours=hours)


def skip_if_has_data(collection_name: str) -> bool:
    if db[collection_name].count_documents({}) > 0:
        print(f"  SKIP {collection_name} (already has data)")
        return True
    return False


# ---------------------------------------------------------------------------
# Fetch existing IDs for cross-referencing
# ---------------------------------------------------------------------------
print("Fetching existing data for cross-referencing...")

people_ids = [p["person_id"] for p in db["people"].find({}, {"person_id": 1}).limit(20)]
people_names = {
    p["person_id"]: p["full_name"]
    for p in db["people"].find({}, {"person_id": 1, "full_name": 1}).limit(20)
}

client_docs = list(db["clients"].find({}, {"client_id": 1, "name": 1}).limit(20))
client_ids = [c["client_id"] for c in client_docs]
client_names = {c["client_id"]: c["name"] for c in client_docs}

job_docs = list(db["jobs"].find({}, {"job_id": 1, "client_id": 1, "client_name": 1, "status": 1, "title": 1}).limit(20))
job_ids = [j["job_id"] for j in job_docs]

mfr_docs = list(db["manufacturers"].find({}, {"manufacturer_id": 1, "name": 1}).limit(10))
mfr_ids = [m["manufacturer_id"] for m in mfr_docs]

enquiry_docs = list(db["enquiries"].find({}, {"enquiry_id": 1, "client_id": 1, "status": 1}).limit(15))
enquiry_ids = [e["enquiry_id"] for e in enquiry_docs]

wp_docs = list(db["work_packages"].find({}, {"work_package_id": 1, "job_id": 1}).limit(15))
wp_ids = [w["work_package_id"] for w in wp_docs]

assignment_docs = list(db["assignments"].find({}, {"assignment_id": 1, "job_id": 1, "person_id": 1}).limit(15))

visit_docs = list(db["visits"].find({}, {"visit_id": 1, "job_id": 1}).limit(15))
visit_ids = [v["visit_id"] for v in visit_docs]

invoice_docs = list(db["invoices"].find({}, {"invoice_id": 1, "job_id": 1}).limit(10))

provider_docs = list(db["external_providers"].find({}, {"provider_id": 1, "name": 1, "category": 1}).limit(10))

equip_docs = list(db["equipment"].find({}, {"equipment_id": 1}).limit(10))
equip_ids = [e["equipment_id"] for e in equip_docs]

print(f"  People: {len(people_ids)}, Clients: {len(client_ids)}, Jobs: {len(job_ids)}")
print(f"  Enquiries: {len(enquiry_ids)}, WorkPkgs: {len(wp_ids)}, Visits: {len(visit_ids)}")

# ---------------------------------------------------------------------------
# 1. REGIONS
# ---------------------------------------------------------------------------
print("\n[1/40] Seeding regions...")
if not skip_if_has_data("regions"):
    regions = [
        {"region_code": "N", "name": "North Region", "head_office": False,
         "regional_head_person_id": people_ids[6] if len(people_ids) > 6 else None,
         "technical_manager_person_id": people_ids[7] if len(people_ids) > 7 else None,
         "is_active": True, "created_at": dt(90), "updated_at": dt(5)},
        {"region_code": "S", "name": "South Region", "head_office": True,
         "regional_head_person_id": people_ids[8] if len(people_ids) > 8 else None,
         "technical_manager_person_id": people_ids[9] if len(people_ids) > 9 else None,
         "is_active": True, "created_at": dt(90), "updated_at": dt(5)},
        {"region_code": "E", "name": "East Region", "head_office": False,
         "regional_head_person_id": people_ids[10] if len(people_ids) > 10 else None,
         "is_active": True, "created_at": dt(90), "updated_at": dt(5)},
        {"region_code": "W", "name": "West Region", "head_office": False,
         "regional_head_person_id": people_ids[11] if len(people_ids) > 11 else None,
         "is_active": True, "created_at": dt(90), "updated_at": dt(5)},
    ]
    db["regions"].insert_many(regions)
    print(f"  Inserted {len(regions)} regions")

# ---------------------------------------------------------------------------
# 2. OFFICES
# ---------------------------------------------------------------------------
print("[2/40] Seeding offices...")
if not skip_if_has_data("offices"):
    offices = [
        {"office_id": "OFF-S-01", "region_code": "S", "name": "Hyderabad Head Office",
         "address": "Plot 42, Jubilee Hills, Hyderabad", "city": "Hyderabad", "state": "Telangana",
         "is_head_office": True, "site_ids": ["SITE-01"], "is_active": True,
         "created_at": dt(90), "updated_at": dt(5)},
        {"office_id": "OFF-S-02", "region_code": "S", "name": "Chennai Branch",
         "address": "No 15, Anna Salai, Chennai", "city": "Chennai", "state": "Tamil Nadu",
         "is_head_office": False, "site_ids": [], "is_active": True,
         "created_at": dt(80), "updated_at": dt(5)},
        {"office_id": "OFF-N-01", "region_code": "N", "name": "New Delhi Office",
         "address": "A-12, Sector 62, Noida", "city": "Noida", "state": "Uttar Pradesh",
         "is_head_office": False, "site_ids": [], "is_active": True,
         "created_at": dt(80), "updated_at": dt(5)},
        {"office_id": "OFF-W-01", "region_code": "W", "name": "Mumbai Office",
         "address": "Godrej BKC, Bandra East, Mumbai", "city": "Mumbai", "state": "Maharashtra",
         "is_head_office": False, "site_ids": [], "is_active": True,
         "created_at": dt(80), "updated_at": dt(5)},
        {"office_id": "OFF-E-01", "region_code": "E", "name": "Kolkata Office",
         "address": "Salt Lake Sector V, Kolkata", "city": "Kolkata", "state": "West Bengal",
         "is_head_office": False, "site_ids": [], "is_active": True,
         "created_at": dt(80), "updated_at": dt(5)},
    ]
    db["offices"].insert_many(offices)
    print(f"  Inserted {len(offices)} offices")

# ---------------------------------------------------------------------------
# 3. INTER-OFFICE SETTLEMENTS
# ---------------------------------------------------------------------------
print("[3/40] Seeding inter_office_settlements...")
if not skip_if_has_data("inter_office_settlements"):
    settlements = []
    for m in range(7, 10):  # Jul, Aug, Sep 2026
        for r in ["N", "E", "W"]:
            fee = round(random.uniform(500000, 2000000), 2)
            ho_share = round(fee * 0.25, 2)
            region_share = round(fee * 0.75, 2)
            status = "settled" if m < 9 else "draft"
            settlements.append({
                "settlement_id": f"IOS-2627-{m:02d}-{r}",
                "period_month": m, "period_year": 2026,
                "from_region": r, "to_region": "S",
                "fee_collected": fee, "ho_pool_share": ho_share,
                "region_share": region_share, "adjustments": 0.0,
                "net_payable_to_ho": ho_share,
                "settled_by": people_ids[8] if status == "settled" else None,
                "settled_on": dt(30) if status == "settled" else None,
                "status": status,
                "created_by": people_ids[0], "created_at": dt(60 - m * 2), "updated_at": dt(5),
            })
    db["inter_office_settlements"].insert_many(settlements)
    print(f"  Inserted {len(settlements)} inter-office settlements")

# ---------------------------------------------------------------------------
# 4. INSPECTOR LOANS
# ---------------------------------------------------------------------------
print("[4/40] Seeding inspector_loans...")
if not skip_if_has_data("inspector_loans"):
    loans = [
        {"loan_id": "LOAN-2627-001", "inspector_person_id": people_ids[0],
         "home_region": "S", "borrowing_region": "W", "job_id": job_ids[0] if job_ids else None,
         "rate_card_rate": 4500.0, "start_date": dt(30), "end_date": dt(5),
         "status": "completed", "approved_by": people_ids[8] if len(people_ids) > 8 else None,
         "created_by": people_ids[0], "created_at": dt(35), "updated_at": dt(5)},
        {"loan_id": "LOAN-2627-002", "inspector_person_id": people_ids[1],
         "home_region": "S", "borrowing_region": "N", "job_id": job_ids[3] if len(job_ids) > 3 else None,
         "rate_card_rate": 5000.0, "start_date": dt(10), "end_date": None,
         "status": "active", "approved_by": people_ids[6] if len(people_ids) > 6 else None,
         "created_by": people_ids[1], "created_at": dt(12), "updated_at": dt(2)},
        {"loan_id": "LOAN-2627-003", "inspector_person_id": people_ids[3] if len(people_ids) > 3 else people_ids[0],
         "home_region": "W", "borrowing_region": "E", "job_id": job_ids[5] if len(job_ids) > 5 else None,
         "rate_card_rate": 4000.0, "start_date": dt(15), "end_date": None,
         "status": "active", "created_by": people_ids[0], "created_at": dt(16), "updated_at": dt(1)},
    ]
    db["inspector_loans"].insert_many(loans)
    print(f"  Inserted {len(loans)} inspector loans")

# ---------------------------------------------------------------------------
# 5. DEPUTY COVERAGES
# ---------------------------------------------------------------------------
print("[5/40] Seeding deputy_coverages...")
if not skip_if_has_data("deputy_coverages"):
    deps = [
        {"coverage_id": "DEP-2627-001", "absent_role": "TM", "absent_person_id": people_ids[7] if len(people_ids) > 7 else None,
         "region_code": "S", "deputy_person_id": people_ids[8] if len(people_ids) > 8 else people_ids[0],
         "deputy_role": "RH", "scope_limits": "within authorised scope only",
         "valid_from": dt(20), "valid_until": dt(5), "is_active": False,
         "arranged_by": "Country Manager", "created_at": dt(22), "updated_at": dt(5)},
        {"coverage_id": "DEP-2627-002", "absent_role": "IC", "region_code": "N",
         "deputy_person_id": people_ids[6] if len(people_ids) > 6 else people_ids[0],
         "deputy_role": "RH", "valid_from": dt(3), "is_active": True,
         "notes": "IC on medical leave — RH scheduling, TM confirms",
         "created_at": dt(3), "updated_at": dt(1)},
        {"coverage_id": "DEP-2627-003", "absent_role": "BD", "region_code": "W",
         "deputy_person_id": people_ids[11] if len(people_ids) > 11 else people_ids[0],
         "deputy_role": "RH", "valid_from": dt(7), "is_active": True,
         "created_at": dt(7), "updated_at": dt(1)},
    ]
    db["deputy_coverages"].insert_many(deps)
    print(f"  Inserted {len(deps)} deputy coverages")

# ---------------------------------------------------------------------------
# 6. MANPOWER REQUESTS
# ---------------------------------------------------------------------------
print("[6/40] Seeding manpower_requests...")
if not skip_if_has_data("manpower_requests"):
    mprs = [
        {"request_id": "MPR-2026-0001", "site_id": "SITE-01", "job_id": job_ids[0] if job_ids else None,
         "region_code": "S", "requested_by": people_ids[8] if len(people_ids) > 8 else people_ids[0],
         "position_title": "Inspection Engineer — Pressure Vessels", "category": "TECHNICAL_INSPECTION",
         "engagement_type": "PERMANENT", "required_qualifications": ["B.Tech Mechanical", "ASNT Level II"],
         "required_experience_years": 5.0, "required_authorization_types": ["CODE_INSP"],
         "headcount": 2, "budget_per_head": 720000.0, "within_budget": True, "budget_approved": True,
         "priority": "urgent", "status": "sourcing", "filled_count": 0,
         "target_date": dt(-30), "created_by": people_ids[0], "created_at": dt(60), "updated_at": dt(10)},
        {"request_id": "MPR-2026-0002", "site_id": "SITE-01", "job_id": job_ids[3] if len(job_ids) > 3 else None,
         "region_code": "N", "requested_by": people_ids[6] if len(people_ids) > 6 else people_ids[0],
         "position_title": "Quantity Surveyor", "category": "TECHNICAL_ENGINEERING",
         "engagement_type": "CONTRACT", "required_experience_years": 3.0,
         "headcount": 1, "budget_per_head": 600000.0, "within_budget": True, "budget_approved": True,
         "priority": "normal", "status": "filled", "filled_count": 1,
         "created_by": people_ids[0], "created_at": dt(90), "updated_at": dt(30)},
        {"request_id": "MPR-2026-0003", "site_id": "SITE-01",
         "region_code": "W", "requested_by": people_ids[11] if len(people_ids) > 11 else people_ids[0],
         "position_title": "NDT Inspector — Radiography", "category": "TECHNICAL_INSPECTION",
         "engagement_type": "ASSOCIATE", "required_qualifications": ["ASNT Level III RT"],
         "required_experience_years": 8.0, "headcount": 1, "budget_per_head": 900000.0,
         "within_budget": False, "budget_approved": False, "budget_remarks": "Pending MD approval — exceeds budget",
         "priority": "normal", "status": "pending_budget",
         "created_by": people_ids[0], "created_at": dt(15), "updated_at": dt(10)},
    ]
    db["manpower_requests"].insert_many(mprs)
    print(f"  Inserted {len(mprs)} manpower requests")

# ---------------------------------------------------------------------------
# 7. CANDIDATES
# ---------------------------------------------------------------------------
print("[7/40] Seeding candidates...")
if not skip_if_has_data("candidates"):
    candidates = [
        {"candidate_id": "CND-2026-0001", "site_id": "SITE-01", "request_id": "MPR-2026-0001",
         "full_name": "Arvind Kumar Mishra", "email": "arvind.mishra@gmail.example",
         "phone": "+91-9876543210", "source": "portal", "source_detail": "Naukri.com",
         "qualifications": [{"name": "B.Tech Mechanical", "issuing_body": "NIT Warangal", "year": 2018},
                            {"name": "ASNT Level II UT/RT", "issuing_body": "ASNT", "year": 2020}],
         "experience_years": 6.0, "current_employer": "Bureau Veritas India",
         "current_designation": "QC Inspector", "expected_ctc": 850000.0,
         "status": "technically_fit", "screening_notes": "Strong NDT background",
         "created_by": people_ids[0], "created_at": dt(45), "updated_at": dt(20)},
        {"candidate_id": "CND-2026-0002", "site_id": "SITE-01", "request_id": "MPR-2026-0001",
         "full_name": "Deepa Srinivasan", "email": "deepa.srini@yahoo.example",
         "phone": "+91-9012345678", "source": "referral", "source_detail": "Ref by EMP-00001",
         "qualifications": [{"name": "B.E. Metallurgy", "issuing_body": "Anna University", "year": 2017}],
         "experience_years": 7.0, "current_employer": "TÜV SÜD South Asia",
         "current_designation": "Senior Inspector", "expected_ctc": 960000.0,
         "status": "offer_sent",
         "created_by": people_ids[0], "created_at": dt(40), "updated_at": dt(10)},
        {"candidate_id": "CND-2026-0003", "site_id": "SITE-01", "request_id": "MPR-2026-0001",
         "full_name": "Ravi Shankar Tiwari", "email": "ravi.tiwari@outlook.example",
         "phone": "+91-8765432109", "source": "pool",
         "qualifications": [{"name": "Diploma Mechanical"}],
         "experience_years": 3.0, "expected_ctc": 480000.0,
         "status": "not_fit", "screening_notes": "Insufficient experience for PV role",
         "created_by": people_ids[0], "created_at": dt(42), "updated_at": dt(38)},
        {"candidate_id": "CND-2026-0004", "site_id": "SITE-01", "request_id": "MPR-2026-0002",
         "full_name": "Pooja Deshmukh", "email": "pooja.d@gmail.example",
         "phone": "+91-7654321098", "source": "portal",
         "qualifications": [{"name": "B.Tech Civil", "issuing_body": "VJTI Mumbai", "year": 2020}],
         "experience_years": 4.0, "expected_ctc": 600000.0,
         "status": "joined",
         "created_by": people_ids[0], "created_at": dt(80), "updated_at": dt(30)},
        {"candidate_id": "CND-2026-0005", "site_id": "SITE-01", "request_id": "MPR-2026-0001",
         "full_name": "Karthik Narayanan", "email": "karthik.n@gmail.example",
         "source": "portal", "experience_years": 5.0, "expected_ctc": 750000.0,
         "status": "screening",
         "created_by": people_ids[0], "created_at": dt(10), "updated_at": dt(5)},
    ]
    db["candidates"].insert_many(candidates)
    print(f"  Inserted {len(candidates)} candidates")

# ---------------------------------------------------------------------------
# 8. TECHNICAL INTERVIEWS
# ---------------------------------------------------------------------------
print("[8/40] Seeding technical_interviews...")
if not skip_if_has_data("technical_interviews"):
    interviews = [
        {"interview_id": "INT-2026-0001", "candidate_id": "CND-2026-0001",
         "request_id": "MPR-2026-0001", "site_id": "SITE-01",
         "interviewer_person_id": people_ids[9] if len(people_ids) > 9 else people_ids[0],
         "interview_date": dt(25), "interview_mode": "video",
         "technical_score": 8, "domain_knowledge": 9, "practical_assessment": 7, "communication": 8,
         "overall_recommendation": "fit", "remarks": "Excellent PV knowledge, ASME Section VIII strong",
         "created_by": people_ids[0], "created_at": dt(25)},
        {"interview_id": "INT-2026-0002", "candidate_id": "CND-2026-0002",
         "request_id": "MPR-2026-0001", "site_id": "SITE-01",
         "interviewer_person_id": people_ids[9] if len(people_ids) > 9 else people_ids[0],
         "interview_date": dt(18), "interview_mode": "in_person",
         "technical_score": 9, "domain_knowledge": 8, "practical_assessment": 8, "communication": 9,
         "overall_recommendation": "fit", "remarks": "Strong metallurgy background, recommended for immediate offer",
         "created_by": people_ids[0], "created_at": dt(18)},
        {"interview_id": "INT-2026-0003", "candidate_id": "CND-2026-0004",
         "request_id": "MPR-2026-0002", "site_id": "SITE-01",
         "interviewer_person_id": people_ids[7] if len(people_ids) > 7 else people_ids[0],
         "interview_date": dt(70), "interview_mode": "video",
         "technical_score": 7, "domain_knowledge": 7, "practical_assessment": 6, "communication": 8,
         "overall_recommendation": "conditional",
         "condition_notes": "Needs BOQ training, otherwise technically sound",
         "created_by": people_ids[0], "created_at": dt(70)},
    ]
    db["technical_interviews"].insert_many(interviews)
    print(f"  Inserted {len(interviews)} technical interviews")

# ---------------------------------------------------------------------------
# 9. OFFER LETTERS
# ---------------------------------------------------------------------------
print("[9/40] Seeding offer_letters...")
if not skip_if_has_data("offer_letters"):
    offers = [
        {"offer_id": "OFR-2026-0001", "candidate_id": "CND-2026-0002",
         "request_id": "MPR-2026-0001", "site_id": "SITE-01",
         "offer_type": "appointment", "designation": "Inspection Engineer",
         "department": "Technical - South", "engagement_type": "PERMANENT",
         "ctc_offered": 900000.0, "joining_date": dt(-5), "probation_months": 6,
         "reporting_to_person_id": people_ids[9] if len(people_ids) > 9 else people_ids[0],
         "status": "sent", "sent_on": dt(8),
         "created_by": people_ids[0], "created_at": dt(10), "updated_at": dt(8)},
        {"offer_id": "OFR-2026-0002", "candidate_id": "CND-2026-0004",
         "request_id": "MPR-2026-0002", "site_id": "SITE-01",
         "offer_type": "appointment", "designation": "Quantity Surveyor",
         "department": "Technical - North", "engagement_type": "CONTRACT",
         "ctc_offered": 600000.0, "joining_date": dt(40), "probation_months": 3,
         "status": "accepted", "sent_on": dt(55), "responded_on": dt(50),
         "person_id": people_ids[4] if len(people_ids) > 4 else None,
         "created_by": people_ids[0], "created_at": dt(58), "updated_at": dt(50)},
    ]
    db["offer_letters"].insert_many(offers)
    print(f"  Inserted {len(offers)} offer letters")

# ---------------------------------------------------------------------------
# 10. INDUCTION CHECKLISTS
# ---------------------------------------------------------------------------
print("[10/40] Seeding induction_checklists...")
if not skip_if_has_data("induction_checklists"):
    default_items = [
        {"item_code": "WELCOME", "description": "Welcome briefing and office tour", "completed": True, "completed_on": dt(38).isoformat()},
        {"item_code": "QMS_INTRO", "description": "QMS manual and quality policy introduction", "completed": True, "completed_on": dt(37).isoformat()},
        {"item_code": "SAFETY", "description": "Safety and emergency procedures briefing", "completed": True, "completed_on": dt(37).isoformat()},
        {"item_code": "IT_ACCESS", "description": "IT systems access and training", "completed": True, "completed_on": dt(36).isoformat()},
        {"item_code": "TOOLS", "description": "Equipment and tools familiarisation", "completed": True, "completed_on": dt(35).isoformat()},
        {"item_code": "REPORTING", "description": "Reporting procedures and formats", "completed": True, "completed_on": dt(35).isoformat()},
        {"item_code": "CONFID", "description": "Confidentiality agreement (MS-10)", "completed": True, "completed_on": dt(38).isoformat()},
        {"item_code": "IMPART", "description": "Impartiality declaration (cl. 4.1, 4.2)", "completed": True, "completed_on": dt(38).isoformat()},
        {"item_code": "CODE", "description": "Code of conduct acknowledgement", "completed": True, "completed_on": dt(38).isoformat()},
        {"item_code": "ID_CARD", "description": "ID card and PPE issued", "completed": True, "completed_on": dt(36).isoformat()},
    ]
    inductions = [
        {"induction_id": "IND-2026-0001", "person_id": people_ids[4] if len(people_ids) > 4 else people_ids[0],
         "site_id": "SITE-01", "checklist_items": default_items,
         "confidentiality_signed": True, "confidentiality_signed_on": dt(38),
         "impartiality_declared": True, "safety_briefing_done": True,
         "it_access_provisioned": True, "id_card_issued": True,
         "completed": True, "completed_on": dt(35),
         "inducted_by": people_ids[0], "created_by": people_ids[0],
         "created_at": dt(40), "updated_at": dt(35)},
        {"induction_id": "IND-2026-0002", "person_id": people_ids[3] if len(people_ids) > 3 else people_ids[0],
         "site_id": "SITE-01",
         "checklist_items": [
             {"item_code": "WELCOME", "description": "Welcome briefing", "completed": True, "completed_on": dt(8).isoformat()},
             {"item_code": "QMS_INTRO", "description": "QMS manual", "completed": True, "completed_on": dt(7).isoformat()},
             {"item_code": "SAFETY", "description": "Safety briefing", "completed": False},
             {"item_code": "IT_ACCESS", "description": "IT systems", "completed": False},
         ],
         "confidentiality_signed": True, "safety_briefing_done": False,
         "completed": False, "inducted_by": people_ids[0],
         "created_by": people_ids[0], "created_at": dt(10), "updated_at": dt(5)},
    ]
    db["induction_checklists"].insert_many(inductions)
    print(f"  Inserted {len(inductions)} induction checklists")

# ---------------------------------------------------------------------------
# 11. LEAVE REQUESTS
# ---------------------------------------------------------------------------
print("[11/40] Seeding leave_requests...")
if not skip_if_has_data("leave_requests"):
    leaves = []
    leave_types = ["casual", "sick", "earned", "unpaid", "comp_off"]
    statuses = ["approved", "approved", "approved", "pending", "rejected"]
    for i in range(15):
        pid = people_ids[i % len(people_ids)]
        lt = leave_types[i % len(leave_types)]
        st = statuses[i % len(statuses)]
        days = random.choice([1, 1, 2, 3, 5])
        start = dt(random.randint(5, 60))
        leaves.append({
            "leave_id": f"LV-2026-{i+1:04d}", "person_id": pid, "site_id": "SITE-01",
            "leave_type": lt, "from_date": start, "to_date": start + timedelta(days=days - 1),
            "days": float(days), "reason": f"Personal {lt} leave" if lt != "sick" else "Medical appointment",
            "approved_by": people_ids[8] if st == "approved" and len(people_ids) > 8 else None,
            "approved_on": start - timedelta(days=1) if st == "approved" else None,
            "status": st, "created_by": pid,
            "created_at": start - timedelta(days=3), "updated_at": start - timedelta(days=1),
        })
    db["leave_requests"].insert_many(leaves)
    print(f"  Inserted {len(leaves)} leave requests")

# ---------------------------------------------------------------------------
# 12. ATTENDANCE RECORDS
# ---------------------------------------------------------------------------
print("[12/40] Seeding attendance_records...")
if not skip_if_has_data("attendance_records"):
    records = []
    att_statuses = ["present", "present", "present", "present", "half_day", "on_leave", "weekly_off"]
    regions = ["S", "S", "N", "W", "E"]
    for pid_idx in range(min(5, len(people_ids))):
        pid = people_ids[pid_idx]
        for day_offset in range(1, 22):  # ~3 weeks
            d = now - timedelta(days=day_offset)
            weekday = d.weekday()
            if weekday == 6:
                st = "weekly_off"
            else:
                st = random.choice(att_statuses)
            checkin = d.replace(hour=9, minute=random.randint(0, 30))
            checkout = d.replace(hour=17 + random.randint(0, 2), minute=random.randint(0, 59))
            hours = round((checkout - checkin).seconds / 3600, 1) if st == "present" else 0.0
            records.append({
                "attendance_id": f"ATT-{d.strftime('%Y%m%d')}-{pid_idx+1:03d}",
                "person_id": pid, "site_id": "SITE-01", "date": d,
                "status": st, "check_in": checkin if st == "present" else None,
                "check_out": checkout if st == "present" else None,
                "hours_worked": hours,
                "job_id": job_ids[pid_idx % len(job_ids)] if job_ids and st == "present" else None,
                "region_code": regions[pid_idx % len(regions)],
                "created_at": d,
            })
    db["attendance_records"].insert_many(records)
    print(f"  Inserted {len(records)} attendance records")

# ---------------------------------------------------------------------------
# 13. TIMESHEETS
# ---------------------------------------------------------------------------
print("[13/40] Seeding timesheets...")
if not skip_if_has_data("timesheets"):
    sheets = []
    for pid_idx in range(min(5, len(people_ids))):
        pid = people_ids[pid_idx]
        for month in [8, 9]:  # Aug, Sep 2026
            entries = []
            total_hrs = 0
            for day in range(1, 23):
                hrs = random.choice([8, 8, 8, 9, 4, 0])
                if hrs > 0:
                    entries.append({
                        "date": datetime(2026, month, day).isoformat(),
                        "job_id": job_ids[pid_idx % len(job_ids)] if job_ids else None,
                        "hours": float(hrs),
                        "activity_type": random.choice(["inspection", "inspection", "travel", "admin"]),
                    })
                    total_hrs += hrs
            sheets.append({
                "timesheet_id": f"TS-2026-{month:02d}-{pid_idx+1:03d}",
                "person_id": pid, "site_id": "SITE-01",
                "period_month": month, "period_year": 2026,
                "home_region": "S", "working_region": ["S", "S", "N", "W", "E"][pid_idx % 5],
                "entries": entries,
                "total_days": len(entries), "total_hours": float(total_hrs),
                "approved_by": people_ids[8] if len(people_ids) > 8 else None,
                "status": "approved" if month == 8 else "submitted",
                "created_by": pid, "created_at": dt(60 if month == 8 else 30),
                "updated_at": dt(50 if month == 8 else 20),
            })
    db["timesheets"].insert_many(sheets)
    print(f"  Inserted {len(sheets)} timesheets")

# ---------------------------------------------------------------------------
# 14. PAYROLL RUNS
# ---------------------------------------------------------------------------
print("[14/40] Seeding payroll_runs...")
if not skip_if_has_data("payroll_runs"):
    runs = []
    for month in [7, 8, 9]:
        status = "disbursed" if month <= 8 else "approved"
        headcount = random.randint(35, 50)
        total_gross = round(headcount * random.uniform(55000, 75000), 2)
        total_ded = round(total_gross * 0.22, 2)
        runs.append({
            "run_id": f"PR-2026-{month:02d}", "site_id": "SITE-01",
            "region_code": None, "period_month": month, "period_year": 2026,
            "status": status, "total_gross": total_gross,
            "total_deductions": total_ded, "total_net": round(total_gross - total_ded, 2),
            "headcount": headcount,
            "processed_by": people_ids[0], "processed_on": dt(90 - month * 8),
            "approved_by": people_ids[8] if len(people_ids) > 8 else people_ids[0],
            "approved_on": dt(88 - month * 8),
            "disbursed_on": dt(85 - month * 8) if status == "disbursed" else None,
            "created_by": people_ids[0], "created_at": dt(92 - month * 8), "updated_at": dt(5),
        })
    db["payroll_runs"].insert_many(runs)
    print(f"  Inserted {len(runs)} payroll runs")

# ---------------------------------------------------------------------------
# 15. PAYSLIPS
# ---------------------------------------------------------------------------
print("[15/40] Seeding payslips...")
if not skip_if_has_data("payslips"):
    slips = []
    for month in [7, 8, 9]:
        run_id = f"PR-2026-{month:02d}"
        for pid_idx in range(min(8, len(people_ids))):
            pid = people_ids[pid_idx]
            basic = round(random.uniform(30000, 60000), 0)
            hra = round(basic * 0.40, 0)
            conv = 1600.0
            special = round(basic * 0.20, 0)
            gross = basic + hra + conv + special
            pf_emp = round(basic * 0.12, 0)
            pf_er = round(basic * 0.12, 0)
            esi_emp = round(gross * 0.0075, 0) if gross < 21000 else 0
            pt = 200.0
            tds = round(gross * 0.10, 0)
            total_ded = pf_emp + esi_emp + pt + tds
            slips.append({
                "payslip_id": f"PS-2026-{month:02d}-{pid_idx+1:03d}",
                "run_id": run_id, "person_id": pid, "site_id": "SITE-01",
                "period_month": month, "period_year": 2026,
                "basic_salary": basic, "hra": hra, "conveyance": conv,
                "special_allowance": special, "other_earnings": 0.0, "gross_salary": gross,
                "pf_employee": pf_emp, "pf_employer": pf_er,
                "esi_employee": esi_emp, "esi_employer": 0.0,
                "professional_tax": pt, "tds": tds, "other_deductions": 0.0,
                "total_deductions": total_ded, "net_salary": round(gross - total_ded, 2),
                "days_present": 22.0, "days_absent": 0.0, "leaves_taken": 1.0,
                "loss_of_pay_days": 0.0,
                "payment_mode": "NEFT", "payment_ref": f"NEFT-{month:02d}-{pid_idx+1:04d}",
                "paid_on": dt(85 - month * 8) if month <= 8 else None,
                "created_at": dt(90 - month * 8), "updated_at": dt(5),
            })
    db["payslips"].insert_many(slips)
    print(f"  Inserted {len(slips)} payslips")

# ---------------------------------------------------------------------------
# 16. APPRAISALS
# ---------------------------------------------------------------------------
print("[16/40] Seeding appraisals...")
if not skip_if_has_data("appraisals"):
    appraisals = []
    kpi_templates = [
        {"kpi_code": "INSP_VOL", "kpi_name": "Inspection Volume", "weight": 2.0},
        {"kpi_code": "REPORT_QUALITY", "kpi_name": "Report Quality", "weight": 2.0},
        {"kpi_code": "CLIENT_FB", "kpi_name": "Client Feedback", "weight": 1.5},
        {"kpi_code": "TIMELINESS", "kpi_name": "Timeliness of Delivery", "weight": 1.5},
        {"kpi_code": "SAFETY", "kpi_name": "Safety Compliance", "weight": 1.0},
    ]
    for i in range(min(10, len(people_ids))):
        pid = people_ids[i]
        scores = []
        for kpi in kpi_templates:
            s = random.randint(3, 5)
            scores.append({**kpi, "target": "100%", "actual": f"{random.randint(80, 100)}%", "score": s})
        overall = round(sum(s["score"] * s["weight"] for s in scores) / sum(s["weight"] for s in scores))
        status = random.choice(["completed", "completed", "manager_review", "self_review"])
        appraisals.append({
            "appraisal_id": f"APR-2026-{i+1:04d}", "person_id": pid, "site_id": "SITE-01",
            "appraisal_period": "2025-2026",
            "reviewer_person_id": people_ids[8] if len(people_ids) > 8 else people_ids[0],
            "kpi_scores": scores, "overall_rating": overall,
            "strengths": "Strong technical knowledge, reliable field performance" if overall >= 4 else "Adequate performance",
            "improvement_areas": "Report formatting consistency" if overall < 5 else None,
            "training_needs": ["Advanced NDT Level III"] if i % 3 == 0 else [],
            "authorization_recommendation": "extend" if overall >= 4 else "maintain",
            "status": status, "completed_on": dt(30) if status == "completed" else None,
            "created_by": people_ids[0], "created_at": dt(90), "updated_at": dt(15),
        })
    db["appraisals"].insert_many(appraisals)
    print(f"  Inserted {len(appraisals)} appraisals")

# ---------------------------------------------------------------------------
# 17. WITNESSED INSPECTIONS
# ---------------------------------------------------------------------------
print("[17/40] Seeding witnessed_inspections...")
if not skip_if_has_data("witnessed_inspections"):
    witnessed = []
    for i in range(8):
        pid = people_ids[i % len(people_ids)]
        witness_by = people_ids[(i + 5) % len(people_ids)]
        witnessed.append({
            "witness_id": f"WIT-2026-{i+1:04d}", "person_id": pid, "site_id": "SITE-01",
            "witnessed_by": witness_by,
            "visit_id": visit_ids[i % len(visit_ids)] if visit_ids else None,
            "job_id": job_ids[i % len(job_ids)] if job_ids else None,
            "inspection_type": random.choice(["CODE_INSP", "BOQ_RECON", "VENDOR_AUDIT"]),
            "date": dt(random.randint(10, 60)),
            "competence_areas": [
                {"area": "Technical Knowledge", "rating": random.randint(3, 5)},
                {"area": "Documentation", "rating": random.randint(3, 5)},
                {"area": "Safety Awareness", "rating": random.randint(4, 5)},
            ],
            "overall_result": random.choice(["satisfactory", "satisfactory", "satisfactory", "needs_improvement"]),
            "follow_up_required": i == 3,
            "follow_up_notes": "Needs refresher on weld acceptance criteria" if i == 3 else None,
            "created_by": witness_by, "created_at": dt(random.randint(10, 60)),
        })
    db["witnessed_inspections"].insert_many(witnessed)
    print(f"  Inserted {len(witnessed)} witnessed inspections")

# ---------------------------------------------------------------------------
# 18. EXIT PROCESSES (only one — most people are active)
# ---------------------------------------------------------------------------
print("[18/40] Seeding exit_processes...")
if not skip_if_has_data("exit_processes"):
    exits = [
        {"exit_id": "EXT-2026-0001",
         "person_id": people_ids[19] if len(people_ids) > 19 else people_ids[-1],
         "site_id": "SITE-01", "exit_type": "resignation",
         "last_working_date": dt(-10), "reason": "Pursuing higher education",
         "notice_period_days": 30, "status": "in_progress",
         "checklist": [
             {"item_code": "HANDOVER", "description": "Work handover", "completed": True, "completed_on": dt(5).isoformat()},
             {"item_code": "ASSETS", "description": "Return company assets", "completed": True, "completed_on": dt(3).isoformat()},
             {"item_code": "IT_REVOKE", "description": "Revoke IT access", "completed": False},
             {"item_code": "ID_CARD", "description": "Return ID card", "completed": False},
             {"item_code": "FNF", "description": "Full and final settlement", "completed": False},
         ],
         "initiated_by": people_ids[0], "approved_by": people_ids[8] if len(people_ids) > 8 else people_ids[0],
         "created_by": people_ids[0], "created_at": dt(25), "updated_at": dt(3)},
    ]
    db["exit_processes"].insert_many(exits)
    print(f"  Inserted {len(exits)} exit processes")

# ---------------------------------------------------------------------------
# 19. RFIs
# ---------------------------------------------------------------------------
print("[19/40] Seeding rfis...")
if not skip_if_has_data("rfis"):
    rfis = []
    rfi_statuses = ["open", "scheduled", "inspected", "closed", "closed"]
    for i in range(10):
        jid = job_ids[i % len(job_ids)] if job_ids else "JOB-001"
        st = rfi_statuses[i % len(rfi_statuses)]
        rfis.append({
            "rfi_id": f"RFI-2026-{i+1:04d}", "site_id": "SITE-01",
            "job_id": jid,
            "work_package_id": wp_ids[i % len(wp_ids)] if wp_ids else None,
            "contractor_name": f"Contractor {chr(65 + i % 5)}",
            "raised_by": f"Site Eng {i+1}",
            "raised_on": dt(30 - i * 2),
            "inspection_point_type": ["hold", "witness", "surveillance", "review"][i % 4],
            "discipline": random.choice(["Mechanical", "Piping", "Structural", "Electrical"]),
            "description": [
                "Hydrostatic test of pressure vessel V-101",
                "Radiography review of butt welds at joint J-42",
                "Dimensional check of structural steel columns",
                "Visual inspection of pipe spool fabrication",
                "DPT on fillet welds at nozzle N-3",
                "Post-weld heat treatment verification",
                "Foundation bolt torque check",
                "Cable tray installation inspection",
                "Paint DFT measurement on external surfaces",
                "Final alignment check of rotating equipment",
            ][i],
            "scheduled_date": dt(25 - i * 2) if st != "open" else None,
            "inspector_person_id": people_ids[i % len(people_ids)] if st != "open" else None,
            "tm_confirmed": st in ("inspected", "closed"),
            "inspection_date": dt(24 - i * 2) if st in ("inspected", "closed") else None,
            "result": "accepted" if st == "closed" else ("conditional" if st == "inspected" else None),
            "turnaround_hours": round(random.uniform(24, 72), 1) if st in ("inspected", "closed") else None,
            "status": st,
            "created_at": dt(30 - i * 2), "updated_at": dt(max(1, 25 - i * 2)),
        })
    db["rfis"].insert_many(rfis)
    print(f"  Inserted {len(rfis)} RFIs")

# ---------------------------------------------------------------------------
# 20. PUNCH ITEMS
# ---------------------------------------------------------------------------
print("[20/40] Seeding punch_items...")
if not skip_if_has_data("punch_items"):
    punches = []
    categories = ["A", "A", "B", "B", "B", "C", "C"]
    punch_statuses = ["open", "corrected", "re_inspected", "closed", "open", "corrected", "waived"]
    for i in range(12):
        jid = job_ids[i % len(job_ids)] if job_ids else "JOB-001"
        cat = categories[i % len(categories)]
        st = punch_statuses[i % len(punch_statuses)]
        punches.append({
            "punch_id": f"PUN-2026-{i+1:04d}", "site_id": "SITE-01",
            "job_id": jid,
            "work_package_id": wp_ids[i % len(wp_ids)] if wp_ids else None,
            "category": cat,
            "description": [
                "Missing fire-stop seal at pipe penetration in firewall FW-03",
                "Paint damage on column C-12 base plate",
                "Bolt torque below specification at flange F-201",
                "Cable gland not properly sealed at JB-05",
                "Surface preparation inadequate — mill scale visible on beam B-4",
                "Gasket misalignment at heat exchanger E-102 channel cover",
                "Weld undercut at joint W-156 exceeds code limit",
                "Grounding lug missing on motor M-301",
                "Hydro test witness documentation incomplete",
                "Nameplate missing on relief valve RV-004",
                "Insulation thickness below spec at pipe rack section PR-2",
                "Drainage slope incorrect at sump S-01",
            ][i],
            "raised_by": people_ids[i % len(people_ids)],
            "raised_on": dt(20 - i),
            "assigned_to": people_ids[(i + 2) % len(people_ids)] if st != "open" else None,
            "due_date": dt(10 - i) if cat == "A" else dt(5 - i),
            "corrected_on": dt(15 - i) if st in ("corrected", "re_inspected", "closed") else None,
            "re_inspected_on": dt(12 - i) if st in ("re_inspected", "closed") else None,
            "re_inspected_by": people_ids[0] if st in ("re_inspected", "closed") else None,
            "status": st,
            "created_at": dt(20 - i), "updated_at": dt(max(1, 12 - i)),
        })
    db["punch_items"].insert_many(punches)
    print(f"  Inserted {len(punches)} punch items")

# ---------------------------------------------------------------------------
# 21. INSPECTION RELEASE NOTES
# ---------------------------------------------------------------------------
print("[21/40] Seeding inspection_release_notes...")
if not skip_if_has_data("inspection_release_notes"):
    irns = []
    irn_statuses = ["released", "approved", "recommended", "draft", "preconditions_checked"]
    for i in range(5):
        jid = job_ids[i % len(job_ids)] if job_ids else "JOB-001"
        st = irn_statuses[i]
        irns.append({
            "irn_id": f"IRN-2026-{i+1:04d}", "site_id": "SITE-01",
            "job_id": jid,
            "work_package_id": wp_ids[i % len(wp_ids)] if wp_ids else None,
            "description": f"Release note for {jid} — Work Package {i+1}",
            "scope_summary": "Fabrication and inspection of pressure vessel internals",
            "hold_points_signed": st != "draft",
            "hold_points_count": 5, "hold_points_signed_count": 5 if st != "draft" else 3,
            "ncrs_closed": st not in ("draft", "preconditions_checked"),
            "ncr_total": 2, "ncr_closed_count": 2 if st not in ("draft",) else 1, "ncr_open_ids": [],
            "cat_a_punch_closed": st not in ("draft", "preconditions_checked"),
            "cat_a_total": 1, "cat_a_closed_count": 1 if st not in ("draft",) else 0,
            "recommended_by": people_ids[9] if len(people_ids) > 9 and st in ("recommended", "approved", "released") else None,
            "recommended_on": dt(15) if st in ("recommended", "approved", "released") else None,
            "approved_by": people_ids[8] if len(people_ids) > 8 and st in ("approved", "released") else None,
            "approved_on": dt(12) if st in ("approved", "released") else None,
            "released": st == "released",
            "release_date": dt(10) if st == "released" else None,
            "status": st,
            "created_at": dt(30), "updated_at": dt(5),
        })
    db["inspection_release_notes"].insert_many(irns)
    print(f"  Inserted {len(irns)} inspection release notes")

# ---------------------------------------------------------------------------
# 22. INSPECTION CALLS
# ---------------------------------------------------------------------------
print("[22/40] Seeding inspection_calls...")
if not skip_if_has_data("inspection_calls"):
    calls = []
    call_statuses = ["RAISED", "ACKNOWLEDGED", "CONFIRMED", "ATTENDED", "ATTENDED", "DECLINED", "WAIVED", "MISSED"]
    outcomes = [None, None, None, "ACCEPTED", "ACCEPTED_WITH_COMMENTS", None, None, None]
    for i in range(8):
        jid = job_ids[i % len(job_ids)] if job_ids else "JOB-001"
        calls.append({
            "call_id": f"ICN-2026-{i+1:04d}", "site_id": "SITE-01",
            "itp_id": None,  # ITPs exist but we'll link to job
            "job_id": jid,
            "itp_line_ref": f"ITP-L-{i+1:03d}",
            "activity_description": f"Hold/Witness point call for activity {i+1}",
            "intervention_type": ["H", "W", "R", "M"][i % 4],
            "contractor_name": f"Contractor {chr(65 + i % 4)}",
            "raised_by": f"Site QC {i+1}",
            "raised_on": dt(20 - i),
            "proposed_date": dt(18 - i),
            "confirmed_date": dt(17 - i) if call_statuses[i] in ("CONFIRMED", "ATTENDED") else None,
            "inspector_person_id": people_ids[i % len(people_ids)],
            "outcome": outcomes[i],
            "outcome_remarks": "All tests passed" if outcomes[i] == "ACCEPTED" else None,
            "status": call_statuses[i],
            "created_at": dt(20 - i), "updated_at": dt(max(1, 15 - i)),
        })
    db["inspection_calls"].insert_many(calls)
    print(f"  Inserted {len(calls)} inspection calls")

# ---------------------------------------------------------------------------
# 23. REPORT SIGNOFFS
# ---------------------------------------------------------------------------
print("[23/40] Seeding report_signoffs...")
if not skip_if_has_data("report_signoffs"):
    signoffs = []
    results = ["approved", "approved", "rework_required", "pending", "approved"]
    for i in range(5):
        jid = job_ids[i % len(job_ids)] if job_ids else "JOB-001"
        r = results[i]
        signoffs.append({
            "signoff_id": f"SGN-2026-{i+1:04d}", "site_id": "SITE-01",
            "job_id": jid,
            "visit_id": visit_ids[i % len(visit_ids)] if visit_ids else None,
            "report_ref": f"RPT-{jid}-{i+1:03d}",
            "assigned_tm_person_id": people_ids[9] if len(people_ids) > 9 else people_ids[0],
            "signed_by_person_id": people_ids[9] if len(people_ids) > 9 and r == "approved" else None,
            "signed_by_name": people_names.get(people_ids[9], "TM") if len(people_ids) > 9 and r == "approved" else None,
            "signed_by_role": "tm", "is_deputy": False,
            "review_date": dt(10 - i) if r != "pending" else None,
            "result": r,
            "rework_notes": "Please add section 5.3 dimensional data to appendix" if r == "rework_required" else None,
            "rework_count": 1 if r == "rework_required" else 0,
            "scope_verified": r != "pending",
            "coi_checked": r != "pending",
            "signed_on": dt(8 - i) if r == "approved" else None,
            "status": "approved" if r == "approved" else ("rework" if r == "rework_required" else "pending"),
            "created_by": people_ids[0], "created_at": dt(15), "updated_at": dt(5),
        })
    db["report_signoffs"].insert_many(signoffs)
    print(f"  Inserted {len(signoffs)} report signoffs")

# ---------------------------------------------------------------------------
# 24. CLIENT FEEDBACK
# ---------------------------------------------------------------------------
print("[24/40] Seeding client_feedback...")
if not skip_if_has_data("client_feedback"):
    feedbacks = []
    for i in range(8):
        cid = client_ids[i % len(client_ids)] if client_ids else "C-001"
        jid = job_ids[i % len(job_ids)] if job_ids else "JOB-001"
        overall = random.randint(3, 5)
        feedbacks.append({
            "feedback_id": f"FBK-2026-{i+1:04d}", "site_id": "SITE-01",
            "client_id": cid, "client_name": client_names.get(cid, "Client"),
            "job_id": jid, "feedback_date": dt(random.randint(10, 50)),
            "overall_rating": overall,
            "timeliness_rating": random.randint(3, 5),
            "report_quality_rating": random.randint(3, 5),
            "inspector_competence_rating": random.randint(4, 5),
            "communication_rating": random.randint(3, 5),
            "comments": "Professional service, timely reports" if overall >= 4 else "Delays noted in report submission",
            "improvement_suggestions": "Faster turnaround on revision requests" if overall < 5 else None,
            "requires_escalation": overall <= 2,
            "escalated_to_mrm": False,
            "responded_by": people_ids[0] if overall < 4 else None,
            "response_notes": "Follow-up meeting scheduled" if overall < 4 else None,
            "created_at": dt(random.randint(10, 50)), "updated_at": dt(5),
        })
    db["client_feedback"].insert_many(feedbacks)
    print(f"  Inserted {len(feedbacks)} client feedback entries")

# ---------------------------------------------------------------------------
# 25. MRM AGENDA
# ---------------------------------------------------------------------------
print("[25/40] Seeding mrm_agenda...")
if not skip_if_has_data("mrm_agenda"):
    mrm_items = [
        {"mrm_id": "MRM-2026-0001", "site_id": "SITE-01", "meeting_date": dt(15),
         "period": "2026-Q3", "category": "kpi",
         "title": "Q3 Inspection Volume & Revenue KPIs",
         "description": "Review quarterly inspection targets vs actuals",
         "presenter": people_ids[0], "decision": "Increase North region allocation by 15%",
         "action_items": ["RH-North to submit revised plan by Oct 15"], "status": "actioned",
         "created_at": dt(20), "updated_at": dt(10)},
        {"mrm_id": "MRM-2026-0002", "site_id": "SITE-01", "meeting_date": dt(15),
         "period": "2026-Q3", "category": "complaints",
         "title": "Customer Complaints Analysis — Q3",
         "description": "3 complaints received, 2 resolved, 1 pending",
         "presenter": people_ids[8] if len(people_ids) > 8 else people_ids[0],
         "status": "presented", "created_at": dt(20), "updated_at": dt(10)},
        {"mrm_id": "MRM-2026-0003", "site_id": "SITE-01", "meeting_date": dt(15),
         "period": "2026-Q3", "category": "win_loss",
         "title": "Win/Loss Review — Q3 Pipeline",
         "description": "Won 8 of 12 enquiries, lost 2, 2 no-go",
         "status": "presented", "created_at": dt(20), "updated_at": dt(10)},
        {"mrm_id": "MRM-2026-0004", "site_id": "SITE-01", "meeting_date": dt(15),
         "period": "2026-Q3", "category": "manpower",
         "title": "Recruitment Pipeline Status",
         "description": "2 open positions, 1 offer pending, 1 sourcing",
         "status": "draft", "created_at": dt(18), "updated_at": dt(10)},
    ]
    db["mrm_agenda"].insert_many(mrm_items)
    print(f"  Inserted {len(mrm_items)} MRM agenda items")

# ---------------------------------------------------------------------------
# 26. JOB CONVERSIONS
# ---------------------------------------------------------------------------
print("[26/40] Seeding job_conversions...")
if not skip_if_has_data("job_conversions"):
    conversions = []
    for i in range(5):
        eid = enquiry_ids[i] if i < len(enquiry_ids) else f"ENQ-2026-{i+1:04d}"
        jid = job_ids[i] if i < len(job_ids) else f"JOB-DEMO-{i+1:04d}"
        conversions.append({
            "conversion_id": f"CNV-2026-{i+1:04d}", "site_id": "SITE-01",
            "enquiry_id": eid, "job_id": jid,
            "j_no": f"S-2627-{i+1:04d}",
            "award_value": round(random.uniform(500000, 5000000), 2),
            "converted_by": people_ids[0],
            "converted_on": dt(50 - i * 5),
            "remarks": f"Enquiry {eid} converted to job {jid}",
            "created_by": people_ids[0], "created_at": dt(50 - i * 5), "updated_at": dt(5),
        })
    db["job_conversions"].insert_many(conversions)
    print(f"  Inserted {len(conversions)} job conversions")

# ---------------------------------------------------------------------------
# 27. WIN/LOSS RECORDS
# ---------------------------------------------------------------------------
print("[27/40] Seeding win_loss_records...")
if not skip_if_has_data("win_loss_records"):
    wl_records = []
    outcomes = ["won", "won", "won", "lost", "lost", "no_go", "closed_no_bid", "won"]
    sectors = ["oil_gas", "pharma", "power", "infrastructure", "chemicals", "metals", "oil_gas", "pharma"]
    for i in range(8):
        eid = enquiry_ids[i] if i < len(enquiry_ids) else f"ENQ-2026-{i+1:04d}"
        outcome = outcomes[i]
        cid = client_ids[i % len(client_ids)] if client_ids else "C-001"
        wl_records.append({
            "record_id": f"WL-2026-{i+1:04d}", "site_id": "SITE-01",
            "enquiry_id": eid, "client_id": cid,
            "client_name": client_names.get(cid, "Client"),
            "outcome": outcome,
            "outcome_date": dt(40 - i * 3),
            "j_no": f"S-2627-{i+1:04d}" if outcome == "won" else None,
            "award_value": round(random.uniform(1000000, 5000000), 2) if outcome == "won" else 0.0,
            "competitor_name": "Bureau Veritas" if outcome == "lost" else None,
            "lost_reason_codes": ["price_high"] if outcome == "lost" else [],
            "price_gap_pct": 12.5 if outcome == "lost" else None,
            "no_go_reason_codes": ["conflict_of_interest"] if outcome == "no_go" else [],
            "service_line": random.choice(["PART_A", "PART_B", "PART_C"]),
            "region_code": ["S", "N", "W", "E"][i % 4],
            "sector": sectors[i],
            "proposal_value": round(random.uniform(800000, 4000000), 2),
            "margin_pct": round(random.uniform(15, 35), 1),
            "cycle_days": random.randint(15, 60),
            "created_by": people_ids[0], "created_at": dt(40 - i * 3),
        })
    db["win_loss_records"].insert_many(wl_records)
    print(f"  Inserted {len(wl_records)} win/loss records")

# ---------------------------------------------------------------------------
# 28. COMPETENCE PROFILES
# ---------------------------------------------------------------------------
print("[28/40] Seeding competence_profiles...")
if not skip_if_has_data("competence_profiles"):
    profiles = []
    for i in range(min(10, len(people_ids))):
        pid = people_ids[i]
        profiles.append({
            "profile_id": f"CP-{i+1:04d}", "person_id": pid, "site_id": "SITE-01",
            "qualifications": [
                {"name": "B.Tech Mechanical Engineering", "qualification_type": "DEGREE",
                 "issuing_body": random.choice(["NIT Warangal", "IIT Madras", "VJTI Mumbai", "BIT Mesra"]),
                 "year_obtained": random.randint(2010, 2020)},
                {"name": "ASNT Level II UT/RT", "qualification_type": "CERTIFICATION",
                 "issuing_body": "ASNT", "year_obtained": random.randint(2018, 2024)},
            ],
            "years_experience": round(random.uniform(3, 15), 1),
            "disciplines": random.sample(["Pressure Vessels", "Piping", "Structural", "Rotating Equipment",
                                           "Electrical", "Welding", "NDT"], k=random.randint(2, 4)),
            "created_at": dt(90), "updated_at": dt(10),
        })
    db["competence_profiles"].insert_many(profiles)
    print(f"  Inserted {len(profiles)} competence profiles")

# ---------------------------------------------------------------------------
# 29. EVIDENCE
# ---------------------------------------------------------------------------
print("[29/40] Seeding evidence...")
if not skip_if_has_data("evidence"):
    evidences = []
    for i in range(15):
        jid = job_ids[i % len(job_ids)] if job_ids else "JOB-001"
        vid = visit_ids[i % len(visit_ids)] if visit_ids else None
        kind = random.choice(["PHOTO", "PHOTO", "PHOTO", "DOCUMENT", "MEASUREMENT"])
        content = f"evidence-content-{i+1}-{random.randint(1000,9999)}"
        evidences.append({
            "evidence_id": f"EVD-2026-{i+1:04d}", "site_id": "SITE-01",
            "entity_type": random.choice(["visit", "work_package", "certification"]),
            "entity_id": vid or f"WP-2026-{i+1:04d}",
            "job_id": jid,
            "kind": kind,
            "section": "photographs" if kind == "PHOTO" else "documents",
            "filename": f"{'IMG' if kind == 'PHOTO' else 'DOC'}_{i+1:04d}.{'jpg' if kind == 'PHOTO' else 'pdf'}",
            "stored_path": f"uploads/2026/10/{jid}/{'IMG' if kind == 'PHOTO' else 'DOC'}_{i+1:04d}.{'jpg' if kind == 'PHOTO' else 'pdf'}",
            "content_type": "image/jpeg" if kind == "PHOTO" else "application/pdf",
            "size_bytes": random.randint(200000, 5000000),
            "sha256": hashlib.sha256(content.encode()).hexdigest(),
            "caption": f"Site photo {i+1} — {'weld joint' if i % 3 == 0 else 'equipment nameplate' if i % 3 == 1 else 'material certificate'}",
            "captured_at": dt(random.randint(5, 30)),
            "captured_by_person_id": people_ids[i % len(people_ids)],
            "location": random.choice(["Bay 1", "Module A", "Pipe Rack PR-2", "Column C-12 area"]),
            "status": "ACTIVE",
            "captured_latitude": round(17.385 + random.uniform(-0.01, 0.01), 6),
            "captured_longitude": round(78.486 + random.uniform(-0.01, 0.01), 6),
            "captured_accuracy_m": round(random.uniform(3, 15), 1),
            "uploaded_at": dt(random.randint(3, 28)),
            "uploaded_by": people_ids[i % len(people_ids)],
            "created_at": dt(random.randint(5, 30)), "updated_at": dt(3),
        })
    db["evidence"].insert_many(evidences)
    print(f"  Inserted {len(evidences)} evidence records")

# ---------------------------------------------------------------------------
# 30. CALIBRATION RECORDS
# ---------------------------------------------------------------------------
print("[30/40] Seeding calibration_records...")
if not skip_if_has_data("calibration_records"):
    cal_records = []
    for i in range(min(8, len(equip_ids))):
        eid = equip_ids[i]
        cal_records.append({
            "calibration_id": f"CAL-2026-{i+1:04d}", "site_id": "SITE-01",
            "equipment_id": eid,
            "calibrated_by": random.choice(["NABL Lab Hyderabad", "Precision Calibration Services", "In-House Metrology"]),
            "calibration_date": dt(random.randint(30, 90)),
            "next_due_date": dt(-random.randint(30, 180)),
            "certificate_number": f"NABL/CAL/{2026}/{i+1:05d}",
            "result": random.choice(["PASS", "PASS", "PASS", "PASS_WITH_ADJUSTMENT"]),
            "deviation_notes": "Adjusted zero offset by 0.02mm" if i == 3 else None,
            "document_id": None,
            "created_by": people_ids[0], "created_at": dt(random.randint(30, 90)),
            "updated_at": dt(5),
        })
    db["calibration_records"].insert_many(cal_records)
    print(f"  Inserted {len(cal_records)} calibration records")

# ---------------------------------------------------------------------------
# 31. EQUIPMENT USAGE
# ---------------------------------------------------------------------------
print("[31/40] Seeding equipment_usage...")
if not skip_if_has_data("equipment_usage"):
    usages = []
    for i in range(min(10, len(equip_ids))):
        eid = equip_ids[i % len(equip_ids)]
        usages.append({
            "usage_id": f"EQU-2026-{i+1:04d}", "site_id": "SITE-01",
            "equipment_id": eid,
            "job_id": job_ids[i % len(job_ids)] if job_ids else None,
            "person_id": people_ids[i % len(people_ids)],
            "issued_on": dt(random.randint(10, 40)),
            "returned_on": dt(random.randint(1, 9)) if i < 7 else None,
            "condition_on_return": "good" if i < 5 else ("minor_damage" if i < 7 else None),
            "remarks": None,
            "created_at": dt(random.randint(10, 40)),
        })
    db["equipment_usage"].insert_many(usages)
    print(f"  Inserted {len(usages)} equipment usage records")

# ---------------------------------------------------------------------------
# 32. RATE FLOORS
# ---------------------------------------------------------------------------
print("[32/40] Seeding rate_floors...")
if not skip_if_has_data("rate_floors"):
    floors = [
        {"floor_id": "RF-001", "site_id": "SITE-01", "work_type_code": "CODE_INSP",
         "service_line": "PART_B", "direct_cost": 3500.0, "overhead_percent": 35.0,
         "target_margin_percent": 20.0, "floor_rate": round(3500 * 1.35 * 1.20, 2),
         "created_at": dt(90), "updated_at": dt(5)},
        {"floor_id": "RF-002", "site_id": "SITE-01", "work_type_code": "BOQ_RECON",
         "service_line": "PART_B", "direct_cost": 4000.0, "overhead_percent": 30.0,
         "target_margin_percent": 18.0, "floor_rate": round(4000 * 1.30 * 1.18, 2),
         "created_at": dt(90), "updated_at": dt(5)},
        {"floor_id": "RF-003", "site_id": "SITE-01", "work_type_code": "VENDOR_AUDIT",
         "service_line": "PART_A", "direct_cost": 5000.0, "overhead_percent": 25.0,
         "target_margin_percent": 25.0, "floor_rate": round(5000 * 1.25 * 1.25, 2),
         "created_at": dt(90), "updated_at": dt(5)},
        {"floor_id": "RF-004", "site_id": "SITE-01", "work_type_code": "EXPEDITING",
         "service_line": "PART_A", "direct_cost": 3000.0, "overhead_percent": 30.0,
         "target_margin_percent": 20.0, "floor_rate": round(3000 * 1.30 * 1.20, 2),
         "created_at": dt(90), "updated_at": dt(5)},
    ]
    db["rate_floors"].insert_many(floors)
    print(f"  Inserted {len(floors)} rate floors")

# ---------------------------------------------------------------------------
# 33. RISK REVIEWS
# ---------------------------------------------------------------------------
print("[33/40] Seeding risk_reviews...")
if not skip_if_has_data("risk_reviews"):
    risk_ids_list = [r["risk_id"] for r in db["risks"].find({}, {"risk_id": 1}).limit(5)]
    reviews = []
    for i, rid in enumerate(risk_ids_list[:5]):
        reviews.append({
            "review_id": f"RRV-2026-{i+1:04d}", "site_id": "SITE-01",
            "risk_id": rid, "review_date": dt(random.randint(10, 40)),
            "reviewed_by": people_ids[0],
            "previous_risk_level": random.choice(["high", "medium"]),
            "current_risk_level": random.choice(["medium", "low"]),
            "treatment_effective": True,
            "remarks": "Mitigation measures working as intended",
            "next_review_date": dt(-60),
            "created_at": dt(random.randint(10, 40)),
        })
    if reviews:
        db["risk_reviews"].insert_many(reviews)
    print(f"  Inserted {len(reviews)} risk reviews")

# ---------------------------------------------------------------------------
# 34. INTERNAL AUDITS
# ---------------------------------------------------------------------------
print("[34/40] Seeding internal_audits...")
if not skip_if_has_data("internal_audits"):
    audits = [
        {"audit_id": "IA-2026-0001", "site_id": "SITE-01",
         "audit_type": "system", "scope": "QMS clauses 7, 8 — Competence and Operations",
         "planned_date": dt(45), "actual_date": dt(42),
         "lead_auditor_person_id": people_ids[0],
         "auditors": [people_ids[0], people_ids[5] if len(people_ids) > 5 else people_ids[1]],
         "department": "Technical - South",
         "findings_count": 3, "minor_nc_count": 2, "major_nc_count": 0, "observations": 1,
         "status": "COMPLETED",
         "summary": "Two minor NCs on record retention, one observation on training records. Overall compliant.",
         "corrective_actions_due": dt(-15),
         "created_by": people_ids[0], "created_at": dt(50), "updated_at": dt(30)},
        {"audit_id": "IA-2026-0002", "site_id": "SITE-01",
         "audit_type": "process", "scope": "Inspection Release Note process",
         "planned_date": dt(15), "lead_auditor_person_id": people_ids[0],
         "status": "PLANNED",
         "created_by": people_ids[0], "created_at": dt(20), "updated_at": dt(15)},
    ]
    db["internal_audits"].insert_many(audits)
    print(f"  Inserted {len(audits)} internal audits")

# ---------------------------------------------------------------------------
# 35. PROVIDER EVALUATIONS
# ---------------------------------------------------------------------------
print("[35/40] Seeding provider_evaluations...")
if not skip_if_has_data("provider_evaluations"):
    evals = []
    for i, pdoc in enumerate(provider_docs[:5]):
        evals.append({
            "evaluation_id": f"PEV-2026-{i+1:04d}", "site_id": "SITE-01",
            "provider_id": pdoc["provider_id"],
            "evaluation_date": dt(random.randint(30, 60)),
            "evaluator_person_id": people_ids[0],
            "technical_score": random.randint(6, 10),
            "quality_score": random.randint(7, 10),
            "delivery_score": random.randint(5, 10),
            "overall_score": random.randint(7, 10),
            "outcome": random.choice(["APPROVED", "APPROVED", "APPROVED_WITH_CONDITIONS"]),
            "conditions": "Annual re-evaluation required" if i == 2 else None,
            "valid_until": dt(-365),
            "created_by": people_ids[0], "created_at": dt(random.randint(30, 60)),
        })
    if evals:
        db["provider_evaluations"].insert_many(evals)
    print(f"  Inserted {len(evals)} provider evaluations")

# ---------------------------------------------------------------------------
# 36. PROVIDER PERFORMANCE
# ---------------------------------------------------------------------------
print("[36/40] Seeding provider_performance...")
if not skip_if_has_data("provider_performance"):
    perfs = []
    for i, pdoc in enumerate(provider_docs[:5]):
        perfs.append({
            "performance_id": f"PPF-2026-{i+1:04d}", "site_id": "SITE-01",
            "provider_id": pdoc["provider_id"],
            "period": "2026-Q3",
            "jobs_assigned": random.randint(2, 8),
            "jobs_completed": random.randint(1, 7),
            "on_time_pct": round(random.uniform(75, 100), 1),
            "quality_rating": random.randint(3, 5),
            "issues_reported": random.randint(0, 2),
            "reviewer_person_id": people_ids[0],
            "review_date": dt(10),
            "created_at": dt(15),
        })
    if perfs:
        db["provider_performance"].insert_many(perfs)
    print(f"  Inserted {len(perfs)} provider performance records")

# ---------------------------------------------------------------------------
# 37. SUBCONTRACT CONSENTS
# ---------------------------------------------------------------------------
print("[37/40] Seeding subcontract_consents...")
if not skip_if_has_data("subcontract_consents"):
    consents = []
    for i in range(3):
        cid = client_ids[i % len(client_ids)] if client_ids else "C-001"
        consents.append({
            "consent_id": f"SCC-2026-{i+1:04d}", "site_id": "SITE-01",
            "client_id": cid, "client_name": client_names.get(cid, "Client"),
            "job_id": job_ids[i] if i < len(job_ids) else None,
            "provider_id": provider_docs[i]["provider_id"] if i < len(provider_docs) else None,
            "provider_name": provider_docs[i]["name"] if i < len(provider_docs) else None,
            "scope_of_subcontract": f"NDT services for job {i+1}",
            "consent_status": "approved",
            "consented_by": client_names.get(cid, "Client PM"),
            "consented_on": dt(40 - i * 10),
            "created_by": people_ids[0], "created_at": dt(45 - i * 10), "updated_at": dt(5),
        })
    db["subcontract_consents"].insert_many(consents)
    print(f"  Inserted {len(consents)} subcontract consents")

# ---------------------------------------------------------------------------
# 38. EMAIL LOGS
# ---------------------------------------------------------------------------
print("[38/40] Seeding email_logs...")
if not skip_if_has_data("email_logs"):
    logs = []
    subjects = [
        "Visit Scheduled — JOB-001 at Mumbai", "Invoice INV-2026-001 raised",
        "Payment Received — INV-2026-002", "Leave Request Approved",
        "NCR Raised — NCR-2026-001", "RFI Scheduled — RFI-2026-0001",
        "Authorization Expiry Reminder — EMP-00003",
        "Monthly Report — September 2026",
    ]
    for i, subj in enumerate(subjects):
        logs.append({
            "email_id": f"EML-2026-{i+1:04d}", "site_id": "SITE-01",
            "channel": "email",
            "to_address": f"user{i+1}@iqe.example",
            "from_address": "noreply@iqeapp.com",
            "subject": subj,
            "category": ["visit_schedule", "invoice_raised", "payment_received",
                         "leave_approved", "ncr_raised", "rfi_scheduled",
                         "authorization_expiry", "general"][i],
            "delivery_status": random.choice(["delivered", "delivered", "delivered", "sent"]),
            "sent_at": dt(random.randint(1, 30)),
            "delivered_at": dt(random.randint(1, 30)),
            "created_at": dt(random.randint(1, 30)),
        })
    db["email_logs"].insert_many(logs)
    print(f"  Inserted {len(logs)} email logs")

# ---------------------------------------------------------------------------
# 39. NOTIFICATION PREFERENCES
# ---------------------------------------------------------------------------
print("[39/40] Seeding notification_preferences...")
if not skip_if_has_data("notification_preferences"):
    prefs = []
    for i in range(min(5, len(people_ids))):
        pid = people_ids[i]
        prefs.append({
            "preference_id": f"NP-{pid}", "person_id": pid, "site_id": "SITE-01",
            "channels": {
                "visit_schedule": ["email", "in_app"],
                "invoice_raised": ["email"],
                "payment_received": ["email", "in_app"],
                "leave_approved": ["in_app"],
                "ncr_raised": ["email", "in_app", "sms"],
                "general": ["in_app"],
            },
            "email_enabled": True, "sms_enabled": i < 2, "whatsapp_enabled": False,
            "quiet_hours_start": "22:00", "quiet_hours_end": "07:00",
            "created_at": dt(60), "updated_at": dt(5),
        })
    db["notification_preferences"].insert_many(prefs)
    print(f"  Inserted {len(prefs)} notification preferences")

# ---------------------------------------------------------------------------
# 40. IN-APP NOTIFICATIONS
# ---------------------------------------------------------------------------
print("[40/40] Seeding in_app_notifications...")
if not skip_if_has_data("in_app_notifications"):
    notifs = []
    messages = [
        ("Visit VST-2026-001 scheduled for tomorrow", "visit_schedule"),
        ("Invoice INV-2026-001 has been raised for JOB-001", "invoice_raised"),
        ("Payment of ₹2,50,000 received against INV-2026-002", "payment_received"),
        ("Your leave request LV-2026-0001 has been approved", "leave_approved"),
        ("NCR-2026-0001 raised — Critical severity on job JOB-003", "ncr_raised"),
        ("RFI-2026-0001 scheduled for inspection on Oct 20", "rfi_scheduled"),
        ("Authorization ATH-2026-0003 expires in 30 days", "authorization_expiry"),
        ("Punch item PUN-2026-0001 (Cat A) requires attention", "punch_item_raised"),
        ("Release note IRN-2026-0001 approved by CM", "release_note_approved"),
        ("Report signoff SGN-2026-0004 pending your review", "signoff_pending"),
    ]
    for i, (msg, cat) in enumerate(messages):
        notifs.append({
            "notification_id": f"NTF-2026-{i+1:04d}", "site_id": "SITE-01",
            "person_id": people_ids[i % len(people_ids)],
            "category": cat,
            "title": msg[:60],
            "message": msg,
            "link": f"/jobs/{job_ids[i % len(job_ids)]}" if job_ids else None,
            "is_read": i < 5,
            "read_at": dt(random.randint(1, 5)) if i < 5 else None,
            "created_at": dt(random.randint(1, 15)),
        })
    db["in_app_notifications"].insert_many(notifs)
    print(f"  Inserted {len(notifs)} in-app notifications")


# ---------------------------------------------------------------------------
# SUMMARY
# ---------------------------------------------------------------------------
print("\n" + "=" * 60)
print("SEED COMPLETE — Summary:")
print("=" * 60)
total_inserted = 0
all_collections = sorted(db.list_collection_names())
for name in all_collections:
    count = db[name].count_documents({})
    if count > 0:
        total_inserted += 1
print(f"Collections with data: {total_inserted} / {len(all_collections)}")
print("Done!")
