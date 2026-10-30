from typing import Optional
from fastapi import HTTPException
from core.audit import AuditAction, record as audit
from modules.payments.models import Payment, DunningRecord
from modules.invoices.models import Invoice
from modules.finance.models import AccountReceivable
from datetime import datetime


class PaymentService:

    @staticmethod
    async def list(
        site_id: str = "SITE-01",
        client_id: str = "",
        invoice_id: str = "",
        page: int = 1,
        per_page: int = 100,
    ):
        query: dict = {"site_id": site_id}
        if client_id:
            query["client_id"] = client_id
        if invoice_id:
            query["invoice_id"] = invoice_id

        total = await Payment.find(query).count()
        items = (
            await Payment.find(query)
            .sort(-Payment.created_at)
            .skip((page - 1) * per_page)
            .limit(per_page)
            .to_list()
        )
        return {
            "total": total,
            "page": page,
            "per_page": per_page,
            "data": [p.dict() for p in items],
        }

    @staticmethod
    async def get(payment_id: str, site_id: str = "SITE-01"):
        p = await Payment.find_one(
            Payment.payment_id == payment_id, Payment.site_id == site_id,
        )
        if not p:
            raise HTTPException(404, "Payment not found")
        return p.dict()

    @staticmethod
    async def create(data: dict, site_id: str, user_id: str):
        if not data.get("payment_id"):
            total = await Payment.find_all().count()
            data["payment_id"] = f"PAY-2026-{(total + 1):04d}"

        data["site_id"] = site_id
        data["created_by"] = user_id
        if data.get("amount_received") and data.get("tds_deducted"):
            data["net_received"] = data["amount_received"] - data["tds_deducted"]

        payment = Payment(**data)
        await payment.insert()

        inv = await Invoice.find_one(
            Invoice.invoice_id == data.get("invoice_id"),
            Invoice.site_id == site_id,
        )
        if inv:
            payments = await Payment.find(
                Payment.invoice_id == inv.invoice_id,
                Payment.site_id == site_id,
            ).to_list()
            total_received = sum(p.net_received for p in payments)
            if total_received >= inv.grand_total:
                inv.payment_status = "paid"
            elif total_received > 0:
                inv.payment_status = "partially_paid"
            inv.updated_at = datetime.now()
            await inv.save()

            ar = await AccountReceivable.find_one(
                AccountReceivable.invoice_id == inv.invoice_id,
                AccountReceivable.site_id == site_id,
            )
            if ar:
                ar.paid_amount = total_received
                ar.balance_amount = ar.amount - total_received
                ar.status = "settled" if ar.balance_amount <= 0 else "partially_paid"
                if ar.balance_amount <= 0:
                    ar.settlement_date = datetime.now()
                ar.updated_at = datetime.now()
                await ar.save()

        await audit(
            "payment", payment.payment_id, AuditAction.CREATE,
            actor={"user_id": user_id}, site_id=site_id,
        )
        return payment.dict()

    @staticmethod
    async def update(payment_id: str, data: dict, site_id: str = "SITE-01"):
        p = await Payment.find_one(
            Payment.payment_id == payment_id, Payment.site_id == site_id,
        )
        if not p:
            raise HTTPException(404, "Payment not found")

        for k, v in data.items():
            if hasattr(p, k) and k not in ("payment_id", "site_id", "created_at", "created_by"):
                setattr(p, k, v)

        if p.amount_received and p.tds_deducted:
            p.net_received = p.amount_received - p.tds_deducted

        p.updated_at = datetime.now()
        await p.save()
        return p.dict()

    @staticmethod
    async def reconcile_tds(payment_id: str, data: dict, site_id: str = "SITE-01"):
        p = await Payment.find_one(
            Payment.payment_id == payment_id, Payment.site_id == site_id,
        )
        if not p:
            raise HTTPException(404, "Payment not found")

        p.tds_certificate_received = data.get("tds_certificate_received", p.tds_certificate_received)
        p.tds_certificate_quarter = data.get("tds_certificate_quarter", p.tds_certificate_quarter)
        p.tds_26as_verified = data.get("tds_26as_verified", p.tds_26as_verified)
        p.tds_16a_received = data.get("tds_16a_received", p.tds_16a_received)

        expected_tds = data.get("expected_tds")
        if expected_tds is not None:
            diff = abs(p.tds_deducted - expected_tds)
            p.tds_mismatch = diff > 1.0
            p.tds_mismatch_amount = diff if p.tds_mismatch else 0.0

        p.updated_at = datetime.now()
        await p.save()
        return p.dict()

    # --- Dunning / collections ---

    @staticmethod
    async def list_dunning(
        site_id: str = "SITE-01",
        invoice_id: str = "",
        status: str = "",
        page: int = 1,
        per_page: int = 50,
    ):
        query: dict = {"site_id": site_id}
        if invoice_id:
            query["invoice_id"] = invoice_id
        if status:
            query["status"] = status

        total = await DunningRecord.find(query).count()
        items = (
            await DunningRecord.find(query)
            .sort(-DunningRecord.created_at)
            .skip((page - 1) * per_page)
            .limit(per_page)
            .to_list()
        )
        return {
            "total": total,
            "page": page,
            "per_page": per_page,
            "data": [d.dict() for d in items],
        }

    @staticmethod
    async def create_dunning(data: dict, site_id: str, user_id: str):
        if not data.get("dunning_id"):
            total = await DunningRecord.find_all().count()
            data["dunning_id"] = f"DUN-2026-{(total + 1):04d}"

        data["site_id"] = site_id
        data["action_by"] = data.get("action_by", user_id)
        dunning = DunningRecord(**data)
        await dunning.insert()

        ar = await AccountReceivable.find_one(
            AccountReceivable.invoice_id == data.get("invoice_id"),
            AccountReceivable.site_id == site_id,
        )
        if ar:
            ar.dunning_count = getattr(ar, "dunning_count", 0) + 1
            ar.last_dunning_date = datetime.now()
            ar.updated_at = datetime.now()
            await ar.save()

        await audit(
            "dunning", dunning.dunning_id, AuditAction.CREATE,
            actor={"user_id": user_id}, site_id=site_id,
        )
        return dunning.dict()

    @staticmethod
    async def resolve_dunning(dunning_id: str, data: dict, site_id: str = "SITE-01"):
        d = await DunningRecord.find_one(
            DunningRecord.dunning_id == dunning_id, DunningRecord.site_id == site_id,
        )
        if not d:
            raise HTTPException(404, "Dunning record not found")

        d.status = data.get("status", "resolved")
        d.response = data.get("response", d.response)
        d.commitment_date = data.get("commitment_date", d.commitment_date)
        d.commitment_amount = data.get("commitment_amount", d.commitment_amount)
        d.updated_at = datetime.now()
        await d.save()
        return d.dict()
