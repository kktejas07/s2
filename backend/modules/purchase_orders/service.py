from typing import Optional
from fastapi import HTTPException
from modules.purchase_orders.models import PurchaseOrder, POItemDetail
from datetime import datetime


class PurchaseOrderService:

    @staticmethod
    async def list(
        site_id: str = "SITE-01", 
        search: str = "", 
        alpha: str = "", 
        is_active: Optional[bool] = None, 
        page: int = 1, 
        per_page: int = 100
    ):
        query = {"site_id": site_id}
        if is_active is not None:
            query["is_active"] = is_active
        if alpha and alpha.upper() != "ALL":
            query["$or"] = [
                {"client_name": {"$regex": f"^{alpha}", "$options": "i"}},
                {"manufacturer_name": {"$regex": f"^{alpha}", "$options": "i"}},
            ]
        if search:
            search_query = {
                "$or": [
                    {"po_id": {"$regex": search, "$options": "i"}},
                    {"po_number": {"$regex": search, "$options": "i"}},
                    {"client_name": {"$regex": search, "$options": "i"}},
                    {"manufacturer_name": {"$regex": search, "$options": "i"}},
                    {"remarks": {"$regex": search, "$options": "i"}},
                ]
            }
            if "$or" in query:
                alpha_query = query.pop("$or")
                query["$and"] = [{"$or": alpha_query}, search_query]
            else:
                query.update(search_query)

        total = await PurchaseOrder.find(query).count()
        items = await PurchaseOrder.find(query).skip((page - 1) * per_page).limit(per_page).sort(-PurchaseOrder.created_at).to_list()
        
        results = []
        for p in items:
            p_dict = p.dict()
            p_dict["total_items"] = len(p.items or [])
            results.append(p_dict)

        return {"total": total, "page": page, "per_page": per_page, "data": results}

    @staticmethod
    async def get(po_id: str, site_id: str = "SITE-01"):
        po = await PurchaseOrder.find_one(PurchaseOrder.po_id == po_id, PurchaseOrder.site_id == site_id)
        if not po:
            raise HTTPException(status_code=404, detail="Purchase Order not found")
        p_dict = po.dict()
        p_dict["total_items"] = len(po.items or [])
        return p_dict

    @staticmethod
    async def create(data: dict, site_id: str, user_id: str):
        if not data.get("po_id"):
            total_pos = await PurchaseOrder.find_all().count()
            data["po_id"] = f"PO-{(total_pos + 1):03d}"
            
        existing = await PurchaseOrder.find_one(PurchaseOrder.po_id == data["po_id"], PurchaseOrder.site_id == site_id)
        if existing:
            raise HTTPException(status_code=400, detail="Purchase Order File No already exists")

        # Parse items if present
        raw_items = data.pop("items", [])
        items_list = []
        total_amt = 0.0
        for idx, item in enumerate(raw_items):
            item_id = item.get("po_item_id") or f"{data['po_id']}-ITEM-{(idx + 1):02d}"
            qty = float(item.get("quantity", 1.0))
            rate = float(item.get("rate", 0.0))
            amt = float(item.get("amount", qty * rate))
            total_amt += amt
            items_list.append(POItemDetail(**item, po_item_id=item_id, amount=amt))

        po = PurchaseOrder(
            **data, 
            site_id=site_id, 
            created_by=user_id, 
            items=items_list, 
            total_items=len(items_list),
            po_amount=total_amt or float(data.get("po_amount", 0.0))
        )
        await po.insert()
        return po

    @staticmethod
    async def update(po_id: str, data: dict):
        po = await PurchaseOrder.find_one(PurchaseOrder.po_id == po_id, PurchaseOrder.site_id == site_id)
        if not po:
            raise HTTPException(status_code=404, detail="Purchase Order not found")

        raw_items = data.pop("items", None)
        if raw_items is not None:
            items_list = []
            total_amt = 0.0
            for idx, item in enumerate(raw_items):
                item_id = item.get("po_item_id") or f"{po_id}-ITEM-{(idx + 1):02d}"
                qty = float(item.get("quantity", 1.0))
                rate = float(item.get("rate", 0.0))
                amt = float(item.get("amount", qty * rate))
                total_amt += amt
                items_list.append(POItemDetail(**item, po_item_id=item_id, amount=amt))
            po.items = items_list
            po.total_items = len(items_list)
            if total_amt > 0:
                po.po_amount = total_amt

        for k, v in data.items():
            if hasattr(po, k) and k not in ("po_id", "site_id", "created_at", "created_by"):
                setattr(po, k, v)

        po.updated_at = datetime.now()
        await po.save()
        return po

    @staticmethod
    async def toggle_status(po_id: str, is_active: bool, site_id: str = "SITE-01"):
        po = await PurchaseOrder.find_one(PurchaseOrder.po_id == po_id, PurchaseOrder.site_id == site_id)
        if not po:
            raise HTTPException(status_code=404, detail="Purchase Order not found")
        po.is_active = is_active
        po.updated_at = datetime.now()
        await po.save()
        return po

    @staticmethod
    async def add_item(po_id: str, item_data: dict, site_id: str = "SITE-01"):
        po = await PurchaseOrder.find_one(PurchaseOrder.po_id == po_id, PurchaseOrder.site_id == site_id)
        if not po:
            raise HTTPException(status_code=404, detail="Purchase Order not found")

        total_u = len(po.items or [])
        item_id = item_data.get("po_item_id") or f"{po_id}-ITEM-{(total_u + 1):02d}"
        qty = float(item_data.get("quantity", 1.0))
        rate = float(item_data.get("rate", 0.0))
        amt = float(item_data.get("amount", qty * rate))
        
        new_item = POItemDetail(**item_data, po_item_id=item_id, amount=amt)
        po.items.append(new_item)
        po.total_items = len(po.items)
        po.po_amount = sum(i.amount for i in po.items)
        po.updated_at = datetime.now()
        await po.save()
        return po
