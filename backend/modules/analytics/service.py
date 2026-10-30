from datetime import datetime
import uuid
from typing import Dict, Any, List
from modules.analytics.models import AnalyticsEvent, EventTrackPayload
from modules.jobs.models import Job


class AnalyticsService:

    @staticmethod
    async def track_event(payload: EventTrackPayload) -> AnalyticsEvent:
        event_id = f"EVT-{uuid.uuid4().hex[:8].upper()}"
        event = AnalyticsEvent(
            event_id=event_id,
            event_type=payload.event_type,
            element_id=payload.element_id,
            element_key=payload.element_key,
            element_name=payload.element_name,
            category=payload.category,
            page_route=payload.page_route,
            user_id=payload.user_id,
            user_role=payload.user_role,
            site_id=payload.site_id,
            metadata=payload.metadata,
            timestamp=datetime.now(),
        )
        await event.insert()
        return event

    @staticmethod
    async def get_summary(site_id: str = "SITE-01") -> Dict[str, Any]:
        all_events = await AnalyticsEvent.find(AnalyticsEvent.site_id == site_id).to_list()
        total_events = len(all_events)
        page_views = len([e for e in all_events if e.event_type == "page_view"])
        button_clicks = len([e for e in all_events if e.event_type == "button_click"])
        legacy_migrations = len([e for e in all_events if e.event_type == "legacy_job_migrated"])

        # Count top clicked elements
        clicks_by_key: Dict[str, Dict[str, Any]] = {}
        for e in all_events:
            if e.event_type == "button_click" and e.element_key:
                key = e.element_key
                if key not in clicks_by_key:
                    clicks_by_key[key] = {
                        "key": key,
                        "name": e.element_name or key,
                        "count": 0,
                        "category": e.category or "general",
                        "page_route": e.page_route or "/",
                    }
                clicks_by_key[key]["count"] += 1

        sorted_clicks = sorted(clicks_by_key.values(), key=lambda x: x["count"], reverse=True)

        # Count migration stats
        total_jobs = await Job.find(Job.site_id == site_id).count()
        legacy_jobs = await Job.find(Job.site_id == site_id, Job.tags == "legacy_imported").count()

        return {
            "total_events": total_events,
            "page_views": page_views,
            "button_clicks": button_clicks,
            "legacy_migrations": legacy_migrations,
            "total_jobs_in_system": total_jobs,
            "legacy_migrated_jobs": legacy_jobs,
            "migration_completion_percentage": round((legacy_jobs / max(total_jobs, 1)) * 100, 1),
            "top_clicked_items": sorted_clicks[:10],
        }

    @staticmethod
    async def get_events(
        site_id: str = "SITE-01",
        event_type: str = "",
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        query = {"site_id": site_id}
        if event_type:
            query["event_type"] = event_type
        
        events = await AnalyticsEvent.find(query).sort(-AnalyticsEvent.timestamp).limit(limit).to_list()
        return [e.dict() for e in events]
