from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from core.auth import get_current_user
from .service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ── Email Logs ──────────────────────────────────────────────

@router.get("/emails")
async def list_email_logs(
    status: Optional[str] = None,
    category: Optional[str] = None,
    related_entity_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    user=Depends(get_current_user),
):
    logs = await NotificationService.list_email_logs(
        status=status, category=category,
        related_entity_id=related_entity_id,
        skip=skip, limit=limit,
    )
    return {"items": logs, "count": len(logs)}


@router.post("/emails")
async def send_email(body: dict, user=Depends(get_current_user)):
    log = await NotificationService.send_email(
        to=body["to"],
        subject=body["subject"],
        category=body.get("category", "general"),
        body_template=body.get("body_template"),
        body_preview=body.get("body_preview"),
        cc=body.get("cc"),
        related_entity_type=body.get("related_entity_type"),
        related_entity_id=body.get("related_entity_id"),
        triggered_by=user.get("user_id"),
    )
    return log


@router.patch("/emails/{log_id}/status")
async def update_email_status(log_id: str, body: dict, user=Depends(get_current_user)):
    status = body.get("status")
    if status == "sent":
        log = await NotificationService.mark_sent(log_id)
    elif status == "delivered":
        log = await NotificationService.mark_delivered(log_id)
    elif status == "failed":
        log = await NotificationService.mark_failed(log_id, body.get("reason", "Unknown"))
    else:
        raise HTTPException(400, "Invalid status. Use: sent, delivered, failed")
    if not log:
        raise HTTPException(404, "Email log not found")
    return log


# ── Notification Preferences ────────────────────────────────

@router.get("/preferences/{person_id}")
async def get_preferences(person_id: str, user=Depends(get_current_user)):
    pref = await NotificationService.get_or_create_preference(person_id)
    return pref


@router.put("/preferences/{person_id}")
async def update_preferences(person_id: str, body: dict, user=Depends(get_current_user)):
    pref = await NotificationService.update_preference(person_id, body)
    return pref


@router.get("/preferences/admin/recipients")
async def admin_recipients(user=Depends(get_current_user)):
    return await NotificationService.list_admin_recipients()


# ── In-App Notifications ────────────────────────────────────

@router.get("/")
async def list_notifications(
    unread_only: bool = False,
    skip: int = Query(0, ge=0),
    limit: int = Query(30, ge=1, le=100),
    user=Depends(get_current_user),
):
    person_id = user.get("person_id") or user.get("user_id")
    items = await NotificationService.list_notifications(
        person_id=person_id, unread_only=unread_only,
        skip=skip, limit=limit,
    )
    count = await NotificationService.unread_count(person_id)
    return {"items": items, "unread_count": count}


@router.patch("/{notification_id}/read")
async def mark_read(notification_id: str, user=Depends(get_current_user)):
    notif = await NotificationService.mark_read(notification_id)
    if not notif:
        raise HTTPException(404, "Notification not found")
    return notif


@router.patch("/read-all")
async def mark_all_read(user=Depends(get_current_user)):
    person_id = user.get("person_id") or user.get("user_id")
    count = await NotificationService.mark_all_read(person_id)
    return {"marked_read": count}


@router.post("/in-app")
async def create_in_app_notification(body: dict, user=Depends(get_current_user)):
    notif = await NotificationService.create_in_app(
        person_id=body["person_id"],
        title=body["title"],
        message=body["message"],
        category=body.get("category", "general"),
        link=body.get("link"),
        related_entity_type=body.get("related_entity_type"),
        related_entity_id=body.get("related_entity_id"),
    )
    return notif
