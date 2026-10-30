import asyncio
import random
from datetime import datetime, timedelta
from pymongo import AsyncMongoClient
from beanie import init_beanie
from core.config import settings
from core.auth import hash_password
from modules.auth.models import UserLogin
from modules.users.models import Competency, InspectorRate
from modules.jobs.models import Job
from modules.clients.models import Client
from core.audit import AuditEntry
from core.sequences import Sequence

FIRST_NAMES = [
    "Rajesh", "Vikram", "Anil", "Suresh", "Priya", "Deepak", "Sanjay", "Rohan", "Sunil", "Meena",
    "Arjun", "Karan", "Kavita", "Nitin", "Manoj", "Alok", "Pankaj", "Tarun", "Gaurav", "Sneha",
    "Manish", "Vijay", "Aakash", "Pradeep", "Harish", "Ramesh", "Dinesh", "Siddharth", "Vivek", "Divya",
]

LAST_NAMES = [
    "Sharma", "Patel", "Verma", "Rao", "Nair", "Deshmukh", "Gupta", "Joshi", "Kumar", "Singh",
    "Reddy", "Mehta", "Chawla", "Bhasin", "Kulkarni", "Iyer", "Pillai", "Agarwal", "Bansal", "Choudhury",
]

JOB_TITLES = [
    "Boiler & Pressure Vessel Weld Quality Audit",
    "Cross-Country Pipeline NDT Radiography Testing",
    "Heavy Fabrication Structural Integrity Inspection",
    "Steam Turbine Alignment & Vibration Audit",
    "Offshore Wellhead Valve Acceptance Sign-off",
    "Substation Transformer & Switchgear Inspection",
    "Chemical Reactor Vessel Hydrostatic Testing",
    "Refinery Piping System Thermal Expansion Inspection",
    "Heat Exchanger Tube Bundle Eddy Current Testing",
    "Gas Compressor Skid Operational Performance Check",
    "Solar PV Module & Inverter Station Audit",
    "Storage Tank Ultrasonic Thickness Measurement",
    "Cryogenic LNG Tank Fabrication Quality Check",
    "Power Plant Piping Hanger & Support Inspection",
    "Pump Station Alignment & Dynamic Balancing",
    "Ex-Proof Motor & Switchboard Certification",
    "Offshore Platform Structural Corrosion Assessment",
    "High Pressure Gas Pipeline Hydro-test Verification",
    "Wind Turbine Gearbox & Generator Inspection",
    "Civil Foundation & Grouting Structural Audit",
]

DISCIPLINES = [
    "Pressure Vessels & Boilers", "Welding & NDT", "Piping & Valves",
    "Rotating Equipment", "Electrical & Switchgears", "Civil & Structural",
]


async def seed():
    print("Connecting to MongoDB for Inspector & Job seeding...")
    client = AsyncMongoClient(settings.mongodb_url)
    await init_beanie(database=client[settings.mongodb_db_name], document_models=[
            AuditEntry,
            Sequence,UserLogin, Competency, InspectorRate, Job, Client])

    site_id = "SITE-01"
    random.seed(42)

    # 1. Seed 200 Inspectors
    print("Seeding 200 Inspector Profiles (INS-001 to INS-200)...")
    # Delete existing inspector records (role_id=2)
    await UserLogin.find(UserLogin.role_id == 2).delete()

    users_to_insert = []
    competencies_to_insert = []
    rates_to_insert = []

    pwd_hash = hash_password("password123")

    for i in range(1, 201):
        ins_code = f"INS-{i:03d}"
        user_id = f"USR-INS-{i:03d}"
        fname = f"{FIRST_NAMES[(i - 1) % len(FIRST_NAMES)]} {LAST_NAMES[(i - 1) % len(LAST_NAMES)]}"
        email = f"inspector{i}@iqeapp.com"
        disc = DISCIPLINES[i % len(DISCIPLINES)]

        u = UserLogin(
            user_id=user_id,
            site_id=site_id,
            login_name=f"inspector{i}",
            login_password=pwd_hash,
            email=email,
            full_name=fname,
            role_id=2,
            role_name="Inspector",
            employee_code=f"EMP-INS-{1000 + i}",
            inspector_code=ins_code,
            is_active=True,
        )
        users_to_insert.append(u)

        comp = Competency(
            competency_id=f"COMP-{i:03d}",
            user_id=user_id,
            site_id=site_id,
            pressure_vessels=(i % 2 == 0),
            boilers=(i % 3 == 0),
            welding=(i % 2 == 1),
            nde=(i % 3 == 1),
            rotating_equipment_turbines=(i % 4 == 0),
            switchboards_pmccs_mccs=(i % 5 == 0),
        )
        competencies_to_insert.append(comp)

        rate = InspectorRate(
            rate_id=f"RATE-{i:03d}",
            user_id=user_id,
            site_id=site_id,
            discipline=disc,
            currency="INR",
            inspection_fee_per_day=float(random.randint(4000, 12000)),
            inspection_fee_per_hour=float(random.randint(500, 1500)),
            mileage_per_km=12.0,
            is_active=True,
        )
        rates_to_insert.append(rate)

    await UserLogin.insert_many(users_to_insert)
    await Competency.insert_many(competencies_to_insert)
    await InspectorRate.insert_many(rates_to_insert)
    print(f"Successfully seeded 200 Inspectors in MongoDB!")

    # 2. Seed 50 Jobs
    print("Seeding 50 Inspection & Manufacturing Jobs (JOB-001 to JOB-050)...")
    await Job.find_all().delete()

    clients = await Client.find_all().limit(50).to_list()
    jobs_to_insert = []

    now = datetime.now()
    statuses = ["open", "in_progress", "completed", "qc_pending"]

    for i in range(1, 51):
        job_id = f"JOB-{i:03d}"
        client_obj = clients[(i - 1) % len(clients)] if clients else None
        title = JOB_TITLES[(i - 1) % len(JOB_TITLES)]

        j = Job(
            job_id=job_id,
            site_id=site_id,
            title=f"{title} #{i}",
            description=f"Comprehensive {title.lower()} at client facility including NDT, hydro test, and QA checklist signoff.",
            client_id=client_obj.client_id if client_obj else f"C-{(i % 100) + 1:03d}",
            client_name=client_obj.name if client_obj else f"Apex Engineering #{i}",
            job_type="inspection" if i % 2 == 0 else "manufacturing",
            budget=float(random.randint(100000, 850000)),
            currency="INR",
            requested_start=now + timedelta(days=i),
            requested_end=now + timedelta(days=i + 7),
            status=statuses[i % len(statuses)],
            created_by="admin",
        )
        jobs_to_insert.append(j)

    await Job.insert_many(jobs_to_insert)
    print(f"Successfully seeded 50 Jobs in MongoDB!")


if __name__ == "__main__":
    asyncio.run(seed())
