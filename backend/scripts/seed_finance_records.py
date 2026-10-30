import asyncio
import random
from datetime import datetime, timedelta
from pymongo import AsyncMongoClient
from beanie import init_beanie
from core.config import settings
from modules.finance.models import AccountReceivable, AccountPayable
from modules.invoices.models import Invoice, ChargeItem, AnnexureItem
from core.audit import AuditEntry
from core.sequences import Sequence

CLIENTS = [
    {"client_id": "C-001", "name": "Reliance Industries Ltd", "unit": "Hazira Heavy Yard"},
    {"client_id": "C-002", "name": "L&T Heavy Engineering", "unit": "Jamnagar Refinery Complex"},
    {"client_id": "C-003", "name": "ONGC Offshore Project", "unit": "Chennai Subsea Works"},
    {"client_id": "C-004", "name": "Tata Steel Industrial Div", "unit": "Jamshedpur Works"},
    {"client_id": "C-005", "name": "JSW Energy & Power", "unit": "Vijayanagar Plant"},
    {"client_id": "C-006", "name": "Adani Green Energy", "unit": "Khavda Solar & Wind Park"},
    {"client_id": "C-007", "name": "Indian Oil Corporation (IOCL)", "unit": "Mathura Refinery"},
    {"client_id": "C-008", "name": "GAIL India Petrochemicals", "unit": "Pata Polyethylene Complex"},
    {"client_id": "C-009", "name": "HPCL Refinery Expansion", "unit": "Visakh Refinery Unit 3"},
    {"client_id": "C-010", "name": "Bharat Petroleum (BPCL)", "unit": "Kochi Crude Distillation Unit"},
    {"client_id": "C-011", "name": "BHEL Heavy Power Works", "unit": "Haridwar Boiler Shop"},
    {"client_id": "C-012", "name": "Hindalco Industries", "unit": "Renukut Smelter Division"},
    {"client_id": "C-013", "name": "NTPC Power Generation", "unit": "Vindhyachal Super Thermal"},
    {"client_id": "C-014", "name": "Vedanta Aluminium & Power", "unit": "Jharsuguda Smelter"},
    {"client_id": "C-015", "name": "Engineers India Limited (EIL)", "unit": "New Delhi HQ Projects"},
]

VENDORS = [
    {"vendor_id": "M-001", "name": "BHEL Trichy Boilers", "type": "manufacturer"},
    {"vendor_id": "M-002", "name": "Godrej Heavy Engineering", "type": "manufacturer"},
    {"vendor_id": "M-003", "name": "ISGEC Heavy Engineering", "type": "manufacturer"},
    {"vendor_id": "M-004", "name": "Thermax Global Power Equipment", "type": "manufacturer"},
    {"vendor_id": "M-005", "name": "Welspun Tubular Steel Pipes", "type": "manufacturer"},
    {"vendor_id": "INS-001", "name": "Alok Gupta (Senior TPI Inspector Fee)", "type": "inspector"},
    {"vendor_id": "INS-002", "name": "S. Sundaram (Subsea NDT Specialist)", "type": "inspector"},
    {"vendor_id": "INS-003", "name": "Rao (QC Audit Specialist)", "type": "inspector"},
    {"vendor_id": "INS-004", "name": "Vikram Sharma (Senior Metallurgist)", "type": "inspector"},
    {"vendor_id": "INS-005", "name": "Priya Nair (Pressure Vessel Inspector)", "type": "inspector"},
    {"vendor_id": "VND-001", "name": "SGS India Quality Inspection Agency", "type": "sub_contractor"},
    {"vendor_id": "VND-002", "name": "TUV Rheinland NDT Testing Labs", "type": "sub_contractor"},
    {"vendor_id": "VND-003", "name": "Bureau Veritas Calibration Services", "type": "sub_contractor"},
    {"vendor_id": "VND-004", "name": "Intertek Quality Assurance Pvt Ltd", "type": "sub_contractor"},
    {"vendor_id": "VND-005", "name": "Deccan Logistics & Site Travel Ltd", "type": "travel"},
]

PAYMENT_MODES = ["NEFT", "RTGS", "Cheque", "Wire Transfer"]
STATUSES = ["settled", "overdue", "pending", "partially_paid"]


async def seed_finance_data():
    print("Connecting to MongoDB for Seeding 100+ Finance Invoices & Ledger Records...")
    client = AsyncMongoClient(settings.mongodb_url)
    await init_beanie(
        database=client[settings.mongodb_db_name],
        document_models=[
            AuditEntry,
            Sequence,AccountReceivable, AccountPayable, Invoice],
    )

    site_id = "SITE-01"
    now = datetime.now()

    # Clear existing sample records to insert clean expanded dataset
    await AccountReceivable.find(AccountReceivable.site_id == site_id).delete()
    await AccountPayable.find(AccountPayable.site_id == site_id).delete()

    ar_records = []
    ap_records = []
    inv_records = []

    # 1. Generate 65 Accounts Receivable Records (Invoices & Debtors Ledger)
    print("Generating 65 Accounts Receivable (Invoices)...")
    for i in range(1, 66):
        c = CLIENTS[(i - 1) % len(CLIENTS)]
        job_id = f"JOB-2026-MIG-{(i % 30) + 1:04d}" if i <= 30 else f"JOB-2026-{(i - 30):04d}"
        inv_no = f"INV/IQE/2026/{i:03d}"
        po_no = f"PO/{c['name'][:3].upper()}/2026/{100 + i}"
        
        # Payment terms & due dates mix
        terms_days = random.choice([30, 45, 60])
        days_ago = random.randint(5, 75)
        entry_date = now - timedelta(days=days_ago)
        due_date = entry_date + timedelta(days=terms_days)
        
        amount = round(random.uniform(35000.0, 850000.0), 2)
        
        # Determine status based on due date
        if due_date < now:
            status = random.choice(["overdue", "overdue", "settled", "partially_paid"])
        else:
            status = random.choice(["pending", "pending", "settled", "partially_paid"])

        if status == "settled":
            paid_amount = amount
            balance_amount = 0.0
            settlement_date = entry_date + timedelta(days=random.randint(5, terms_days - 2))
            txn_ref = f"TXN-AR-{random.randint(10000000, 99999999)}"
            pay_mode = random.choice(PAYMENT_MODES)
        elif status == "partially_paid":
            paid_amount = round(amount * random.choice([0.3, 0.5, 0.7]), 2)
            balance_amount = round(amount - paid_amount, 2)
            settlement_date = entry_date + timedelta(days=15)
            txn_ref = f"TXN-PART-{random.randint(10000000, 99999999)}"
            pay_mode = random.choice(PAYMENT_MODES)
        else:
            paid_amount = 0.0
            balance_amount = amount
            settlement_date = None
            txn_ref = None
            pay_mode = None

        overdue_alert = (status == "overdue")

        ar = AccountReceivable(
            ar_id=f"AR-2026-{i:03d}",
            site_id=site_id,
            client_id=c["client_id"],
            client_name=f"{c['name']} ({c['unit']})",
            invoice_id=f"INV-2026-{i:03d}",
            invoice_number=inv_no,
            job_id=job_id,
            po_number=po_no,
            entry_date=entry_date,
            due_date=due_date,
            payment_terms_days=terms_days,
            amount=amount,
            paid_amount=paid_amount,
            balance_amount=balance_amount,
            status=status,
            overdue_alert=overdue_alert,
            settlement_date=settlement_date,
            payment_mode=pay_mode,
            transaction_ref=txn_ref,
            remarks=f"Billing for TPI inspection mandays on {job_id}. Terms Net-{terms_days}.",
            created_at=entry_date,
            updated_at=now,
        )
        ar_records.append(ar)

        # Create matching Invoice object
        inv = Invoice(
            invoice_id=f"INV-2026-{i:03d}",
            job_id=job_id,
            site_id=site_id,
            client_id=c["client_id"],
            client_name=c["name"],
            invoice_number=inv_no,
            invoice_date=entry_date,
            due_date=due_date,
            amount=amount,
            tax=round(amount * 0.18, 2),
            total_amount=round(amount * 1.18, 2),
            subtotal=amount,
            grand_total=round(amount * 1.18, 2),
            payment_status="paid" if status == "settled" else ("partially_paid" if status == "partially_paid" else ("overdue" if status == "overdue" else "unpaid")),
            status="issued",
            po_number=po_no,
            billing_type="hourly",
            hourly_rate=1500.0,
            total_hours=round(amount / 1500.0, 1),
            created_at=entry_date,
            updated_at=now,
        )
        inv_records.append(inv)

    # 2. Generate 65 Accounts Payable Records (Vendor Bills & Creditors Ledger)
    print("Generating 65 Accounts Payable (Vendor Bills)...")
    for j in range(1, 66):
        v = VENDORS[(j - 1) % len(VENDORS)]
        job_id = f"JOB-2026-MIG-{(j % 30) + 1:04d}" if j <= 30 else f"JOB-2026-{(j - 30):04d}"
        po_no = f"PO/VND/2026/{200 + j}"
        
        terms_days = random.choice([15, 30, 45])
        days_ago = random.randint(5, 65)
        entry_date = now - timedelta(days=days_ago)
        due_date = entry_date + timedelta(days=terms_days)
        
        amount = round(random.uniform(15000.0, 380000.0), 2)

        if due_date < now:
            status = random.choice(["overdue", "settled", "settled", "partially_paid"])
        else:
            status = random.choice(["pending", "pending", "settled", "partially_paid"])

        if status == "settled":
            paid_amount = amount
            balance_amount = 0.0
            disbursement_date = entry_date + timedelta(days=random.randint(3, terms_days - 1))
            txn_ref = f"TXN-AP-{random.randint(10000000, 99999999)}"
            pay_mode = random.choice(PAYMENT_MODES)
        elif status == "partially_paid":
            paid_amount = round(amount * 0.5, 2)
            balance_amount = round(amount - paid_amount, 2)
            disbursement_date = entry_date + timedelta(days=10)
            txn_ref = f"TXN-AP-PART-{random.randint(10000000, 99999999)}"
            pay_mode = random.choice(PAYMENT_MODES)
        else:
            paid_amount = 0.0
            balance_amount = amount
            disbursement_date = None
            txn_ref = None
            pay_mode = None

        overdue_alert = (status == "overdue")

        ap = AccountPayable(
            ap_id=f"AP-2026-{j:03d}",
            site_id=site_id,
            vendor_id=v["vendor_id"],
            vendor_name=v["name"],
            vendor_type=v["type"],
            po_number=po_no,
            entry_date=entry_date,
            due_date=due_date,
            payment_terms_days=terms_days,
            amount=amount,
            paid_amount=paid_amount,
            balance_amount=balance_amount,
            status=status,
            overdue_alert=overdue_alert,
            disbursement_date=disbursement_date,
            payment_mode=pay_mode,
            transaction_ref=txn_ref,
            remarks=f"Vendor payable for site inspection services on {job_id}.",
            created_at=entry_date,
            updated_at=now,
        )
        ap_records.append(ap)

    # Insert into MongoDB
    await AccountReceivable.insert_many(ar_records)
    await AccountPayable.insert_many(ap_records)

    # Clean existing invoices and insert
    for inv in inv_records:
        try:
            await inv.insert()
        except Exception:
            pass

    print(f"=== SEEDING FINISHED ===")
    print(f"Successfully inserted {len(ar_records)} Accounts Receivable (Invoices)!")
    print(f"Successfully inserted {len(ap_records)} Accounts Payable (Vendor Bills)!")
    print(f"Successfully created matching Invoices ledger entries!")


if __name__ == "__main__":
    asyncio.run(seed_finance_data())
