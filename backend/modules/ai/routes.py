from fastapi import APIRouter, Depends
from core.auth import get_current_user
from modules.ai.service import AIService

router = APIRouter(prefix="/ai", tags=["AI"])
ai_service = AIService()


@router.post("/generate-report/{visit_id}")
async def generate_report(visit_id: str, user: dict = Depends(get_current_user)):
    """Draft report narrative. Returns a status rather than a draft when no
    language model is configured."""
    return await ai_service.generate_inspection_report(
        visit_id, user.get("site_id", "SITE-01")
    )


@router.get("/search")
async def search(query: str, limit: int = 10, user: dict = Depends(get_current_user)):
    """Keyword search across visits. Named for what it does - it was called
    vector search and performed substring matching."""
    return {
        "method": "keyword",
        "data": await ai_service.keyword_search(
            query, user.get("site_id", "SITE-01"), limit
        ),
    }


@router.get("/detect-anomalies/{visit_id}")
async def detect_anomalies(visit_id: str, user: dict = Depends(get_current_user)):
    return await ai_service.detect_anomalies(visit_id, user.get("site_id", "SITE-01"))


@router.get("/suggest-inspector")
async def suggest_inspector(job_type: str = "inspection", location: str = "",
                            work_package_id: str = "",
                            user: dict = Depends(get_current_user)):
    """Who should take this work.

    Pass `work_package_id` to get a ranking from the assignment engine, which
    applies the competence, authorization, impartiality and calendar gate.
    Without it the deployable pool is returned unranked, because there is no
    competence requirement to rank against.
    """
    return {
        "data": await ai_service.suggest_inspector(
            job_type, location, user.get("site_id", "SITE-01"),
            work_package_id or None,
        )
    }

from pydantic import BaseModel
from typing import Optional

class CopilotPayload(BaseModel):
    action: str = "boq_variance_audit"
    query: Optional[str] = ""
    context: Optional[dict] = None

@router.post("/copilot-action")
async def copilot_action(payload: CopilotPayload, user: dict = Depends(get_current_user)):
    return await ai_service.execute_copilot_action(
        payload.action, payload.query, payload.context, user.get("site_id", "SITE-01")
    )

@router.post("/copilot-action/", include_in_schema=False)
async def copilot_action_slash(payload: CopilotPayload, user: dict = Depends(get_current_user)):
    return await ai_service.execute_copilot_action(
        payload.action, payload.query, payload.context, user.get("site_id", "SITE-01")
    )
