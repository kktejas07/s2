from typing import Optional
from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.purchase_orders.service import PurchaseOrderService

router = APIRouter(prefix="/purchase-orders", tags=["Purchase Orders"])


@router.get("/")
async def list_purchase_orders(
    search: str = "", 
    alpha: str = "", 
    is_active: Optional[bool] = None, 
    page: int = 1, 
    per_page: int = 100, 
    user: dict = Depends(get_current_user)
):
    return await PurchaseOrderService.list(user.get("site_id", "SITE-01"), search, alpha, is_active, page, per_page)


@router.get("/{po_id}")
async def get_purchase_order(po_id: str, user: dict = Depends(get_current_user)):
    return await PurchaseOrderService.get(po_id, user.get("site_id", "SITE-01"))


@router.post("/")
async def create_purchase_order(data: dict, user: dict = Depends(get_current_user)):
    return await PurchaseOrderService.create(data, user.get("site_id", "SITE-01"), user.get("user_id", "USR-001"))


@router.put("/{po_id}")
async def update_purchase_order(po_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await PurchaseOrderService.update(po_id, data)


@router.patch("/{po_id}/status")
async def toggle_purchase_order_status(po_id: str, is_active: bool, user: dict = Depends(get_current_user)):
    return await PurchaseOrderService.toggle_status(po_id, is_active, user.get("site_id", "SITE-01"))


@router.post("/{po_id}/items")
async def add_po_line_item(po_id: str, data: dict, user: dict = Depends(get_current_user)):
    return await PurchaseOrderService.add_item(po_id, data, user.get("site_id", "SITE-01"))
