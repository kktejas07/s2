import asyncio
import random
from pymongo import AsyncMongoClient
from beanie import init_beanie
from core.config import settings
from modules.clients.models import Client, ClientUnit
from modules.manufacturers.models import Manufacturer, ManufacturerUnit
from core.audit import AuditEntry
from core.sequences import Sequence

CITIES_STATES = [
    ("Mumbai", "Maharashtra"),
    ("Pune", "Maharashtra"),
    ("Vadodara", "Gujarat"),
    ("Ahmedabad", "Gujarat"),
    ("Chennai", "Tamil Nadu"),
    ("Coimbatore", "Tamil Nadu"),
    ("Bengaluru", "Karnataka"),
    ("Hyderabad", "Telangana"),
    ("New Delhi", "Delhi"),
    ("Kolkata", "West Bengal"),
    ("Visakhapatnam", "Andhra Pradesh"),
    ("Jamshedpur", "Jharkhand"),
    ("Surat", "Gujarat"),
    ("Nagpur", "Maharashtra"),
    ("Indore", "Madhya Pradesh"),
]

CLIENT_PREFIXES = [
    "Apex", "Bharat Heavy", "Reliance", "Larsen & Toubro", "Tata", "Jindal", "Thermax",
    "Kirloskar", "Godrej", "Siemens", "ABB", "Triveni", "ISGEC", "Toyo", "Technip",
    "Fluor", "Engineers India", "GAIL", "ONGC", "HPCL", "IOCL", "Adani", "Welspun",
    "Astral", "CG Power", "Escorts", "Suzlon", "Inox Wind", "BEML", "Mahindra", "Torishima",
    "Schlumberger", "Baker Hughes", "Halliburton", "TechnipFMC", "Saipem", "Petrofac", "McDermott",
    "Bechtel", "Hyundai Heavy", "Doosan", "Mitsubishi Power", "Hitachi Zosen", "Kawasaki Heavy",
    "Sumitomo Infra", "IHI Corp", "Alstom Power", "Ansaldo Energia", "Sulzer Pumps", "Flowserve",
]

CLIENT_SUFFIXES = [
    "Engineering Corp", "Infrastructure Ltd", "Heavy Energy", "Power Systems", "Petrochemicals Ltd",
    "Steel Processing", "Industrial Solutions", "Boilers & Piping", "Turbine Works", "Offshore Energy",
    "Process Plant Equipment", "Refinery Systems", "Renewable Infra", "Pipelines & Tanks", "Fab Systems",
]

MFR_PREFIXES = [
    "Premier", "Supreme", "Precision", "Zenith", "Supertech", "National", "Metro", "Universal",
    "Royal", "Microtech", "Sterling", "Continental", "Galaxy", "Dynamic", "Pioneer", "Ultra Clean",
    "Alpha", "Radiant", "Allied", "Omega", "Vanguard", "Titanium", "Hyperion", "Apex Flow",
    "Integrated", "Advanced Alloys", "Beacon", "Crest", "Deluxe", "Everest", "Frontier", "Global",
]

MFR_SUFFIXES = [
    "Valves & Fittings", "Boiler Works", "Forging Industries", "Pressure Vessels", "Castings & Alloys",
    "Heat Exchangers", "Piping Systems", "Electrodes & Welding", "Fasteners & Flanges", "Pumps & Compressors",
    "Steel Tubes", "Gaskets & Seals", "Foundry Ltd", "Gear Works", "Heat Treatment", "Refractories",
]

INDUSTRIES = [
    "Oil & Gas", "Power Generation", "Petrochemicals", "Heavy Fabrication",
    "Offshore & Marine", "Aerospace & Defence", "Renewable Energy", "Pharmaceuticals",
]

FIRST_NAMES = ["Rajesh", "Amit", "Suresh", "Vikram", "Priya", "Anil", "Rahul", "Deepak", "Sanjay", "Meena", "Rohan", "Sunil"]
LAST_NAMES = ["Sharma", "Patel", "Verma", "Rao", "Nair", "Deshmukh", "Gupta", "Joshi", "Kumar", "Singh", "Reddy", "Mehta"]


async def seed():
    print("Connecting to MongoDB for seeding...")
    client = AsyncMongoClient(settings.mongodb_url)
    await init_beanie(database=client[settings.mongodb_db_name], document_models=[
            AuditEntry,
            Sequence,Client, ClientUnit, Manufacturer, ManufacturerUnit])

    print("Clearing existing clients & manufacturers for fresh 200 seed dataset...")
    await Client.find_all().delete()
    await ClientUnit.find_all().delete()
    await Manufacturer.find_all().delete()
    await ManufacturerUnit.find_all().delete()

    site_id = "SITE-01"
    random.seed(42)

    # 1. Seed 200 Clients (C-001 to C-200)
    print("Seeding 200 Clients (C-001 to C-200)...")
    clients_to_insert = []
    for i in range(1, 201):
        client_id = f"C-{i:03d}"
        prefix = CLIENT_PREFIXES[(i - 1) % len(CLIENT_PREFIXES)]
        suffix = CLIENT_SUFFIXES[(i - 1) % len(CLIENT_SUFFIXES)]
        name = f"{prefix} {suffix} #{i}"
        city, state = CITIES_STATES[i % len(CITIES_STATES)]
        c_person = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
        gst = f"{27 + (i % 9):02d}AAAC{1000 + i:04d}A1Z{i % 9}"
        
        c = Client(
            client_id=client_id,
            site_id=site_id,
            name=name,
            code=f"CL-{1000 + i}",
            industry_type=INDUSTRIES[i % len(INDUSTRIES)],
            annual_revenue=round(random.uniform(50.0, 5000.0), 2),
            address=f"Plot {10 + i}, Industrial Area Phase {1 + (i % 4)}",
            city=city,
            state=state,
            country="India",
            contact_person=c_person,
            email=f"contact@{prefix.lower().replace(' ', '')}eng{i}.com",
            phone=f"+91 98{i % 100:02d}0 {10000 + i:05d}",
            total_units=random.randint(1, 4),
            is_active=True,
        )
        clients_to_insert.append(c)
    
    await Client.insert_many(clients_to_insert)

    # 2. Seed 200 Manufacturers (M-001 to M-200)
    print("Seeding 200 Manufacturers (M-001 to M-200)...")
    mfrs_to_insert = []
    for i in range(1, 201):
        mfr_id = f"M-{i:03d}"
        prefix = MFR_PREFIXES[(i - 1) % len(MFR_PREFIXES)]
        suffix = MFR_SUFFIXES[(i - 1) % len(MFR_SUFFIXES)]
        name = f"{prefix} {suffix} #{i}"
        city, state = CITIES_STATES[(i + 5) % len(CITIES_STATES)]
        c_person = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
        gst = f"{24 + (i % 9):02d}BBBM{2000 + i:04d}B1Z{i % 9}"

        m = Manufacturer(
            manufacturer_id=mfr_id,
            site_id=site_id,
            name=name,
            code=f"MFR-{2000 + i}",
            contact_number=f"+91 97{i % 100:02d}5 {20000 + i:05d}",
            gst=gst,
            sgst=9.0,
            cgst=9.0,
            igst=18.0,
            is_sez=False,
            is_overseas=False,
            total_units=random.randint(1, 3),
            is_active=True,
        )
        mfrs_to_insert.append(m)

    await Manufacturer.insert_many(mfrs_to_insert)

    total_c = await Client.find_all().count()
    total_m = await Manufacturer.find_all().count()
    print(f"SUCCESSFULLY SEEDED: {total_c} Clients & {total_m} Manufacturers into MongoDB!")


if __name__ == "__main__":
    asyncio.run(seed())
