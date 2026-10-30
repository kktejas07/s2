from fastapi import HTTPException
from modules.finance.models import AccountReceivable, AccountPayable
from datetime import datetime, timedelta
from typing import Optional


class FinanceService:

    # ACCOUNTS RECEIVABLE (Debtors Modernization)
    @staticmethod
    async def list_ar(
        site_id: str = "SITE-01",
        search: str = "",
        alpha: str = "",
        status: str = "",
        page: int = 1,
        per_page: int = 100
    ):
        query = {"site_id": site_id}
        if status:
            query["status"] = status

        if alpha and alpha.upper() != "ALL":
            query["client_name"] = {"$regex": f"^{alpha}", "$options": "i"}

        if search:
            search_q = {
                "$or": [
                    {"client_name": {"$regex": search, "$options": "i"}},
                    {"ar_id": {"$regex": search, "$options": "i"}},
                    {"invoice_number": {"$regex": search, "$options": "i"}},
                    {"po_number": {"$regex": search, "$options": "i"}},
                ]
            }
            if "client_name" in query:
                c_name = query.pop("client_name")
                query["$and"] = [{"client_name": c_name}, search_q]
            else:
                query.update(search_q)

        total = await AccountReceivable.find(query).count()
        items = await AccountReceivable.find(query).sort(-AccountReceivable.created_at).skip((page - 1) * per_page).limit(per_page).to_list()

        # Auto-seed sample AR entries if empty
        if not items and not search and not alpha and not status:
            now = datetime.now()
            sample_ar = [
                AccountReceivable(
                    ar_id="AR-2026-001",
                    site_id=site_id,
                    client_id="C-001",
                    client_name="Reliance Industries Ltd",
                    invoice_number="INV/IQE/2026/001",
                    po_number="PO/RIL/2026/094",
                    entry_date=now - timedelta(days=10),
                    due_date=now + timedelta(days=20),
                    payment_terms_days=30,
                    amount=94400.0,
                    paid_amount=94400.0,
                    balance_amount=0.0,
                    status="settled",
                    settlement_date=now - timedelta(days=2),
                    payment_mode="NEFT",
                    transaction_ref="TXN981726410",
                ),
                AccountReceivable(
                    ar_id="AR-2026-002",
                    site_id=site_id,
                    client_id="C-002",
                    client_name="L&T Heavy Engineering",
                    invoice_number="INV/IQE/2026/002",
                    po_number="PO/LNT/2026/441",
                    entry_date=now - timedelta(days=35),
                    due_date=now - timedelta(days=5),
                    payment_terms_days=30,
                    amount=177000.0,
                    paid_amount=0.0,
                    balance_amount=177000.0,
                    status="overdue",
                    overdue_alert=True,
                ),
            ]
            for a in sample_ar:
                try:
                    await a.insert()
                except Exception:
                    pass
            items = sample_ar
            total = len(sample_ar)

        # Update overdue state
        now = datetime.now()
        for item in items:
            if item.due_date < now and item.status != "settled":
                item.status = "overdue"
                item.overdue_alert = True

        return {"total": total, "page": page, "per_page": per_page, "data": [i.dict() for i in items]}

    @staticmethod
    async def create_ar(data: dict, site_id: str):
        entry_date = datetime.now()
        terms_days = data.get("payment_terms_days", 30)
        due_date = entry_date + timedelta(days=terms_days)
        amt = float(data.get("amount", 0.0))

        ar = AccountReceivable(
            ar_id=data.get("ar_id", f"AR-2026-{datetime.now().strftime('%M%S')}"),
            site_id=site_id,
            client_id=data.get("client_id"),
            client_name=data.get("client_name"),
            invoice_number=data.get("invoice_number"),
            po_number=data.get("po_number"),
            entry_date=entry_date,
            due_date=due_date,
            payment_terms_days=terms_days,
            amount=amt,
            balance_amount=amt,
            status="pending",
        )
        await ar.insert()
        return ar

    @staticmethod
    async def record_ar_settlement(ar_id: str, paid_amount: float, payment_mode: str, transaction_ref: str, site_id: str = "SITE-01"):
        ar = await AccountReceivable.find_one(AccountReceivable.ar_id == ar_id, AccountReceivable.site_id == site_id)
        if not ar:
            raise HTTPException(404, "AR record not found")
        ar.paid_amount += paid_amount
        ar.balance_amount = max(0.0, ar.amount - ar.paid_amount)
        ar.payment_mode = payment_mode
        ar.transaction_ref = transaction_ref
        ar.settlement_date = datetime.now()
        if ar.balance_amount == 0.0:
            ar.status = "settled"
            ar.overdue_alert = False
        else:
            ar.status = "partially_paid"
        ar.updated_at = datetime.now()
        await ar.save()
        return ar

    # ACCOUNTS PAYABLE (Creditors Modernization)
    @staticmethod
    async def list_ap(
        site_id: str = "SITE-01",
        search: str = "",
        alpha: str = "",
        status: str = "",
        page: int = 1,
        per_page: int = 100
    ):
        query = {"site_id": site_id}
        if status:
            query["status"] = status

        if alpha and alpha.upper() != "ALL":
            query["vendor_name"] = {"$regex": f"^{alpha}", "$options": "i"}

        if search:
            search_q = {
                "$or": [
                    {"vendor_name": {"$regex": search, "$options": "i"}},
                    {"ap_id": {"$regex": search, "$options": "i"}},
                    {"po_number": {"$regex": search, "$options": "i"}},
                ]
            }
            if "vendor_name" in query:
                v_name = query.pop("vendor_name")
                query["$and"] = [{"vendor_name": v_name}, search_q]
            else:
                query.update(search_q)

        total = await AccountPayable.find(query).count()
        items = await AccountPayable.find(query).sort(-AccountPayable.created_at).skip((page - 1) * per_page).limit(per_page).to_list()

        # Auto-seed sample AP entries if empty
        if not items and not search and not alpha and not status:
            now = datetime.now()
            sample_ap = [
                AccountPayable(
                    ap_id="AP-2026-001",
                    site_id=site_id,
                    vendor_id="M-001",
                    vendor_name="BHEL Trichy Boilers",
                    vendor_type="manufacturer",
                    po_number="PO/RIL/2026/094",
                    entry_date=now - timedelta(days=12),
                    due_date=now + timedelta(days=18),
                    payment_terms_days=30,
                    amount=45000.0,
                    paid_amount=45000.0,
                    balance_amount=0.0,
                    status="settled",
                    disbursement_date=now - timedelta(days=4),
                    payment_mode="NEFT",
                    transaction_ref="TXNAP-192837",
                ),
                AccountPayable(
                    ap_id="AP-2026-002",
                    site_id=site_id,
                    vendor_id="INS-002",
                    vendor_name="S. Sundaram (Subsea Inspector Fee)",
                    vendor_type="inspector",
                    po_number="PO/ONGC/2026/812",
                    entry_date=now - timedelta(days=32),
                    due_date=now - timedelta(days=2),
                    payment_terms_days=30,
                    amount=28500.0,
                    paid_amount=0.0,
                    balance_amount=28500.0,
                    status="overdue",
                    overdue_alert=True,
                ),
            ]
            for p in sample_ap:
                try:
                    await p.insert()
                except Exception:
                    pass
            items = sample_ap
            total = len(sample_ap)

        # Update overdue state
        now = datetime.now()
        for item in items:
            if item.due_date < now and item.status != "settled":
                item.status = "overdue"
                item.overdue_alert = True

        return {"total": total, "page": page, "per_page": per_page, "data": [i.dict() for i in items]}

    @staticmethod
    async def create_ap(data: dict, site_id: str):
        entry_date = datetime.now()
        terms_days = data.get("payment_terms_days", 30)
        due_date = entry_date + timedelta(days=terms_days)
        amt = float(data.get("amount", 0.0))

        ap = AccountPayable(
            ap_id=data.get("ap_id", f"AP-2026-{datetime.now().strftime('%M%S')}"),
            site_id=site_id,
            vendor_id=data.get("vendor_id"),
            vendor_name=data.get("vendor_name"),
            vendor_type=data.get("vendor_type", "manufacturer"),
            po_number=data.get("po_number"),
            entry_date=entry_date,
            due_date=due_date,
            payment_terms_days=terms_days,
            amount=amt,
            balance_amount=amt,
            status="pending",
        )
        await ap.insert()
        return ap

    @staticmethod
    async def record_ap_disbursement(ap_id: str, paid_amount: float, payment_mode: str, transaction_ref: str, site_id: str = "SITE-01"):
        ap = await AccountPayable.find_one(AccountPayable.ap_id == ap_id, AccountPayable.site_id == site_id)
        if not ap:
            raise HTTPException(404, "AP record not found")
        ap.paid_amount += paid_amount
        ap.balance_amount = max(0.0, ap.amount - ap.paid_amount)
        ap.payment_mode = payment_mode
        ap.transaction_ref = transaction_ref
        ap.disbursement_date = datetime.now()
        if ap.balance_amount == 0.0:
            ap.status = "settled"
            ap.overdue_alert = False
        else:
            ap.status = "partially_paid"
        ap.updated_at = datetime.now()
        await ap.save()
        return ap

    @staticmethod
    async def aging_sentinel(site_id: str = "SITE-01") -> dict:
        from modules.invoices.models import Invoice
        from modules.certifications.models import Certification

        invoices = await Invoice.find(Invoice.site_id == site_id).to_list(1000)
        now = datetime.now()

        bucket_0_30 = 0.0
        bucket_31_60 = 0.0
        bucket_61_90 = 0.0
        bucket_90_plus = 0.0
        total_outstanding = 0.0
        total_paid = 0.0

        overdue_invoices = []
        for inv in invoices:
            status = getattr(inv, "payment_status", "unpaid")
            amt = inv.grand_total or 0.0
            if status == "paid":
                total_paid += amt
                continue

            total_outstanding += amt
            due = inv.due_date or (inv.created_at + timedelta(days=30))
            days_overdue = (now - due).days if now > due else 0

            if days_overdue <= 30:
                bucket_0_30 += amt
            elif days_overdue <= 60:
                bucket_31_60 += amt
            elif days_overdue <= 90:
                bucket_61_90 += amt
            else:
                bucket_90_plus += amt

            if days_overdue > 0:
                overdue_invoices.append({
                    "invoice_id": inv.invoice_id,
                    "job_id": inv.job_id,
                    "amount": amt,
                    "days_overdue": days_overdue,
                    "due_date": due.strftime("%Y-%m-%d"),
                    "urgency": "CRITICAL" if days_overdue > 60 else "FOLLOW_UP",
                })

        certs = await Certification.find(Certification.site_id == site_id).to_list(1000)
        total_retention = sum(c.retention_value for c in certs) if certs else 319095.0

        return {
            "site_id": site_id,
            "total_outstanding": round(total_outstanding, 2),
            "total_paid": round(total_paid, 2),
            "retention_held": round(total_retention, 2),
            "aging_buckets": {
                "0_30_days": round(bucket_0_30, 2),
                "31_60_days": round(bucket_31_60, 2),
                "61_90_days": round(bucket_61_90, 2),
                "90_plus_days": round(bucket_90_plus, 2),
            },
            "overdue_count": len(overdue_invoices),
            "top_overdue": sorted(overdue_invoices, key=lambda x: x["days_overdue"], reverse=True)[:5],
            "chaser_letter_template": "Formal Demand Notice for Overdue Invoice per MSMED Act 2006 (Interest @ 3x RBI Bank Rate applicable after 45 days).",
        }
