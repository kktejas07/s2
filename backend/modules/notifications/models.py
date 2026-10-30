from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import BaseModel, Field


class NotificationChannel(str, Enum):
    EMAIL = "email"
    IN_APP = "in_app"
    SMS = "sms"
    WHATSAPP = "whatsapp"


class DeliveryStatus(str, Enum):
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    BOUNCED = "bounced"


class NotificationCategory(str, Enum):
    VISIT_SCHEDULE = "visit_schedule"
    ENQUIRY_UPDATE = "enquiry_update"
    INVOICE_RAISED = "invoice_raised"
    PAYMENT_RECEIVED = "payment_received"
    DUNNING_REMINDER = "dunning_reminder"
    LEAVE_REQUEST = "leave_request"
    LEAVE_APPROVED = "leave_approved"
    APPRAISAL_DUE = "appraisal_due"
    AUTHORIZATION_EXPIRY = "authorization_expiry"
    QUALIFICATION_EXPIRY = "qualification_expiry"
    RFI_SCHEDULED = "rfi_scheduled"
    PUNCH_ITEM_RAISED = "punch_item_raised"
    RELEASE_NOTE_APPROVED = "release_note_approved"
    SIGNOFF_PENDING = "signoff_pending"
    COMPLAINT_RAISED = "complaint_raised"
    NCR_RAISED = "ncr_raised"
    EXIT_INITIATED = "exit_initiated"
    PAYROLL_DISBURSED = "payroll_disbursed"
    MRM_ESCALATION = "mrm_escalation"
    DOCUMENT_EXPIRY = "document_expiry"
    GENERAL = "general"


class EmailLog(Document):
    """Audit trail for every email sent by the system — maps legacy ProcessedEmail."""
    log_id: str
    site_id: str = "SITE-01"

    category: str = NotificationCategory.GENERAL.value
    channel: str = NotificationChannel.EMAIL.value

    to_addresses: list[str] = []
    cc_addresses: list[str] = []
    bcc_addresses: list[str] = []
    from_address: Optional[str] = None
    reply_to: Optional[str] = None

    subject: str
    body_template: Optional[str] = None
    body_preview: Optional[str] = None

    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None

    status: str = DeliveryStatus.QUEUED.value
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    failure_reason: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3

    smtp_message_id: Optional[str] = None
    provider: Optional[str] = None

    triggered_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "email_logs"
        indexes = ["site_id", "status", "category", "related_entity_id", "created_at"]


class NotificationPreference(Document):
    """Per-person notification routing config — maps legacy EmailRecipients."""
    preference_id: str
    person_id: str
    site_id: str = "SITE-01"

    email: Optional[str] = None
    phone: Optional[str] = None

    channel_preferences: dict[str, bool] = Field(default_factory=lambda: {
        "email": True,
        "in_app": True,
        "sms": False,
        "whatsapp": False,
    })

    category_subscriptions: dict[str, bool] = Field(default_factory=lambda: {
        "visit_schedule": True,
        "enquiry_update": True,
        "invoice_raised": True,
        "payment_received": True,
        "dunning_reminder": True,
        "leave_request": True,
        "leave_approved": True,
        "appraisal_due": True,
        "authorization_expiry": True,
        "qualification_expiry": True,
        "rfi_scheduled": True,
        "signoff_pending": True,
        "complaint_raised": True,
        "ncr_raised": True,
        "general": True,
    })

    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    timezone: str = "Asia/Kolkata"

    is_admin_recipient: bool = False
    receives_daily_digest: bool = False
    receives_weekly_summary: bool = False

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "notification_preferences"
        indexes = ["person_id", "site_id", "is_admin_recipient"]


class InAppNotification(Document):
    """In-app notification bell items for the frontend."""
    notification_id: str
    site_id: str = "SITE-01"
    person_id: str

    category: str = NotificationCategory.GENERAL.value
    title: str
    message: str
    link: Optional[str] = None

    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None

    is_read: bool = False
    read_at: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "in_app_notifications"
        indexes = ["person_id", "is_read", "created_at", "site_id"]
