from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import uuid4

from .models import (
    EmailLog, NotificationPreference, InAppNotification,
    DeliveryStatus, NotificationCategory,
)


class NotificationService:

    @staticmethod
    async def send_email(
        to: list[str],
        subject: str,
        category: str = NotificationCategory.GENERAL.value,
        body_template: Optional[str] = None,
        body_preview: Optional[str] = None,
        cc: list[str] | None = None,
        related_entity_type: Optional[str] = None,
        related_entity_id: Optional[str] = None,
        triggered_by: Optional[str] = None,
        site_id: str = "SITE-01",
    ) -> EmailLog:
        log = EmailLog(
            log_id=f"ELOG-{uuid4().hex[:8].upper()}",
            site_id=site_id,
            category=category,
            to_addresses=to,
            cc_addresses=cc or [],
            subject=subject,
            body_template=body_template,
            body_preview=body_preview,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            status=DeliveryStatus.QUEUED.value,
            triggered_by=triggered_by,
        )
        await log.insert()
        return log

    @staticmethod
    async def mark_sent(log_id: str) -> Optional[EmailLog]:
        log = await EmailLog.find_one(EmailLog.log_id == log_id)
        if not log:
            return None
        log.status = DeliveryStatus.SENT.value
        log.sent_at = datetime.now()
        log.updated_at = datetime.now()
        await log.save()
        return log

    @staticmethod
    async def mark_delivered(log_id: str) -> Optional[EmailLog]:
        log = await EmailLog.find_one(EmailLog.log_id == log_id)
        if not log:
            return None
        log.status = DeliveryStatus.DELIVERED.value
        log.delivered_at = datetime.now()
        log.updated_at = datetime.now()
        await log.save()
        return log

    @staticmethod
    async def mark_failed(log_id: str, reason: str) -> Optional[EmailLog]:
        log = await EmailLog.find_one(EmailLog.log_id == log_id)
        if not log:
            return None
        log.status = DeliveryStatus.FAILED.value
        log.failed_at = datetime.now()
        log.failure_reason = reason
        log.retry_count += 1
        if log.retry_count < log.max_retries:
            log.status = DeliveryStatus.QUEUED.value
        log.updated_at = datetime.now()
        await log.save()
        return log

    @staticmethod
    async def list_email_logs(
        site_id: str = "SITE-01",
        status: Optional[str] = None,
        category: Optional[str] = None,
        related_entity_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[EmailLog]:
        q: dict = {"site_id": site_id}
        if status:
            q["status"] = status
        if category:
            q["category"] = category
        if related_entity_id:
            q["related_entity_id"] = related_entity_id
        return await EmailLog.find(q).sort("-created_at").skip(skip).limit(limit).to_list()

    @staticmethod
    async def get_or_create_preference(person_id: str, site_id: str = "SITE-01") -> NotificationPreference:
        pref = await NotificationPreference.find_one(
            NotificationPreference.person_id == person_id,
            NotificationPreference.site_id == site_id,
        )
        if pref:
            return pref
        pref = NotificationPreference(
            preference_id=f"NPREF-{uuid4().hex[:8].upper()}",
            person_id=person_id,
            site_id=site_id,
        )
        await pref.insert()
        return pref

    @staticmethod
    async def update_preference(person_id: str, updates: dict, site_id: str = "SITE-01") -> NotificationPreference:
        pref = await NotificationService.get_or_create_preference(person_id, site_id)
        for k, v in updates.items():
            if hasattr(pref, k):
                setattr(pref, k, v)
        pref.updated_at = datetime.now()
        await pref.save()
        return pref

    @staticmethod
    async def list_admin_recipients(site_id: str = "SITE-01") -> list[NotificationPreference]:
        return await NotificationPreference.find(
            NotificationPreference.site_id == site_id,
            NotificationPreference.is_admin_recipient == True,
        ).to_list()

    @staticmethod
    async def create_in_app(
        person_id: str,
        title: str,
        message: str,
        category: str = NotificationCategory.GENERAL.value,
        link: Optional[str] = None,
        related_entity_type: Optional[str] = None,
        related_entity_id: Optional[str] = None,
        site_id: str = "SITE-01",
    ) -> InAppNotification:
        notif = InAppNotification(
            notification_id=f"NOTIF-{uuid4().hex[:8].upper()}",
            site_id=site_id,
            person_id=person_id,
            category=category,
            title=title,
            message=message,
            link=link,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
        )
        await notif.insert()
        return notif

    @staticmethod
    async def list_notifications(
        person_id: str,
        unread_only: bool = False,
        skip: int = 0,
        limit: int = 30,
        site_id: str = "SITE-01",
    ) -> list[InAppNotification]:
        q: dict = {"person_id": person_id, "site_id": site_id}
        if unread_only:
            q["is_read"] = False
        return await InAppNotification.find(q).sort("-created_at").skip(skip).limit(limit).to_list()

    @staticmethod
    async def unread_count(person_id: str, site_id: str = "SITE-01") -> int:
        return await InAppNotification.find(
            InAppNotification.person_id == person_id,
            InAppNotification.site_id == site_id,
            InAppNotification.is_read == False,
        ).count()

    @staticmethod
    async def mark_read(notification_id: str) -> Optional[InAppNotification]:
        notif = await InAppNotification.find_one(InAppNotification.notification_id == notification_id)
        if not notif:
            return None
        notif.is_read = True
        notif.read_at = datetime.now()
        await notif.save()
        return notif

    @staticmethod
    async def mark_all_read(person_id: str, site_id: str = "SITE-01") -> int:
        result = await InAppNotification.find(
            InAppNotification.person_id == person_id,
            InAppNotification.site_id == site_id,
            InAppNotification.is_read == False,
        ).update_many({"$set": {"is_read": True, "read_at": datetime.now()}})
        return result.modified_count if result else 0
