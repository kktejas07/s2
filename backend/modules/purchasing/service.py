from typing import Optional
from fastapi import HTTPException
from core.audit import AuditAction, record as audit
from modules.purchasing.models import PurchaseRequisition, VendorPayment
from datetime import datetime, timedelta


class PurchasingService:

    # --- Requisitions ---

    @staticmethod
    async def list_requisitions(
        site_id: str = "SITE-01",
        status: str = "",
        vendor_type: str = "",
        page: int = 1,
        per_page: int = 50,
    ):
        query: dict = {"site_id": site_id}
        if status:
            query["status"] = status
        if vendor_type:
            query["vendor_type"] = vendor_type

        total = await PurchaseRequisition.find(query).count()
        items = (
            await PurchaseRequisition.find(query)
            .sort(-PurchaseRequisition.created_at)
            .skip((page - 1) * per_page)
            .limit(per_page)
            .to_list()
        )
        return {
            "total": total,
            "page": page,
            "per_page": per_page,
            "data": [r.dict() for r in items],
        }

    @staticmethod
    async def get_requisition(requisition_id: str, site_id: str = "SITE-01"):
        r = await PurchaseRequisition.find_one(
            PurchaseRequisition.requisition_id == requisition_id,
            PurchaseRequisition.site_id == site_id,
        )
        if not r:
            raise HTTPException(404, "Purchase requisition not found")
        return r.dict()

    @staticmethod
    async def create_requisition(data: dict, site_id: str, user_id: str):
        if not data.get("requisition_id"):
            total = await PurchaseRequisition.find_all().count()
            data["requisition_id"] = f"PRQ-2026-{(total + 1):04d}"

        data["site_id"] = site_id
        data["created_by"] = user_id
        data["requested_by"] = data.get("requested_by", user_id)

        if data.get("is_msme") and not data.get("msme_due_date"):
            data["msme_due_date"] = datetime.now() + timedelta(days=45)

        req = PurchaseRequisition(**data)
        await req.insert()

        await audit(
            "purchase_requisition", req.requisition_id, AuditAction.CREATE,
            actor={"user_id": user_id}, site_id=site_id,
        )
        return req.dict()

    @staticmethod
    async def approve_requisition(requisition_id: str, data: dict, site_id: str, user_id: str):
        r = await PurchaseRequisition.find_one(
            PurchaseRequisition.requisition_id == requisition_id,
            PurchaseRequisition.site_id == site_id,
        )
        if not r:
            raise HTTPException(404, "Purchase requisition not found")

        r.status = "approved"
        r.approved_by = data.get("approved_by", user_id)
        r.approved_on = datetime.now()
        r.updated_at = datetime.now()
        await r.save()

        await audit(
            "purchase_requisition", requisition_id, AuditAction.UPDATE,
            actor={"user_id": user_id}, site_id=site_id,
            note="Approved",
        )
        return r.dict()

    @staticmethod
    async def reject_requisition(requisition_id: str, data: dict, site_id: str, user_id: str):
        r = await PurchaseRequisition.find_one(
            PurchaseRequisition.requisition_id == requisition_id,
            PurchaseRequisition.site_id == site_id,
        )
        if not r:
            raise HTTPException(404, "Purchase requisition not found")

        r.status = "rejected"
        r.rejection_reason = data.get("reason", "")
        r.updated_at = datetime.now()
        await r.save()
        return r.dict()

    # --- Vendor payments ---

    @staticmethod
    async def list_vendor_payments(
        site_id: str = "SITE-01",
        vendor_type: str = "",
        status: str = "",
        page: int = 1,
        per_page: int = 50,
    ):
        query: dict = {"site_id": site_id}
        if vendor_type:
            query["vendor_type"] = vendor_type
        if status:
            query["status"] = status

        total = await VendorPayment.find(query).count()
        items = (
            await VendorPayment.find(query)
            .sort(-VendorPayment.created_at)
            .skip((page - 1) * per_page)
            .limit(per_page)
            .to_list()
        )
        return {
            "total": total,
            "page": page,
            "per_page": per_page,
            "data": [v.dict() for v in items],
        }

    @staticmethod
    async def create_vendor_payment(data: dict, site_id: str, user_id: str):
        if not data.get("vp_id"):
            total = await VendorPayment.find_all().count()
            data["vp_id"] = f"VP-2026-{(total + 1):04d}"

        data["site_id"] = site_id
        data["created_by"] = user_id
        if data.get("amount") and data.get("tds_deducted"):
            data["net_payable"] = data["amount"] - data["tds_deducted"]

        vp = VendorPayment(**data)
        await vp.insert()

        await audit(
            "vendor_payment", vp.vp_id, AuditAction.CREATE,
            actor={"user_id": user_id}, site_id=site_id,
        )
        return vp.dict()

    @staticmethod
    async def approve_vendor_payment(vp_id: str, data: dict, site_id: str, user_id: str):
        vp = await VendorPayment.find_one(
            VendorPayment.vp_id == vp_id, VendorPayment.site_id == site_id,
        )
        if not vp:
            raise HTTPException(404, "Vendor payment not found")

        vp.tm_approved = True
        vp.tm_approved_by = data.get("tm_approved_by", user_id)
        vp.tm_approved_on = datetime.now()
        vp.status = "approved"
        vp.updated_at = datetime.now()
        await vp.save()
        return vp.dict()

    @staticmethod
    async def pay_vendor(vp_id: str, data: dict, site_id: str, user_id: str):
        vp = await VendorPayment.find_one(
            VendorPayment.vp_id == vp_id, VendorPayment.site_id == site_id,
        )
        if not vp:
            raise HTTPException(404, "Vendor payment not found")

        vp.paid_date = datetime.now()
        vp.payment_mode = data.get("payment_mode", "NEFT")
        vp.payment_ref = data.get("payment_ref")
        vp.status = "paid"

        if vp.is_msme and vp.due_date:
            vp.msme_45day_compliant = (vp.paid_date - vp.due_date).days <= 45

        vp.updated_at = datetime.now()
        await vp.save()
        return vp.dict()

    @staticmethod
    async def msme_alerts(site_id: str = "SITE-01"):
        now = datetime.now()
        approaching = await VendorPayment.find(
            VendorPayment.site_id == site_id,
            VendorPayment.is_msme == True,
            VendorPayment.status.is_in(["pending", "approved"]),
        ).to_list()

        alerts = []
        for vp in approaching:
            if vp.due_date:
                days_remaining = (vp.due_date - now).days
                if days_remaining <= 45:
                    alerts.append({
                        "vp_id": vp.vp_id,
                        "vendor_name": vp.vendor_name,
                        "amount": vp.net_payable,
                        "due_date": vp.due_date.isoformat() if vp.due_date else None,
                        "days_remaining": days_remaining,
                        "severity": "critical" if days_remaining <= 7 else "warning" if days_remaining <= 20 else "info",
                    })
        return {"total": len(alerts), "data": sorted(alerts, key=lambda x: x["days_remaining"])}
