from fastapi import APIRouter, Query
from typing import List, Optional
from modules.analytics.models import EventTrackPayload
from modules.analytics.service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/track")
async def track_event(payload: EventTrackPayload):
    event = await AnalyticsService.track_event(payload)
    return {"status": "success", "event_id": event.event_id}


@router.get("/summary")
async def get_summary(site_id: str = Query("SITE-01")):
    return await AnalyticsService.get_summary(site_id)


@router.get("/events")
async def get_events(
    site_id: str = Query("SITE-01"),
    event_type: str = Query(""),
    limit: int = Query(50)
):
    return await AnalyticsService.get_events(site_id, event_type, limit)
