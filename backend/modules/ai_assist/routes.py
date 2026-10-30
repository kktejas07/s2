from fastapi import APIRouter, Depends

from core.auth import get_current_user
from modules.ai_assist.service import AIAssistService

router = APIRouter(prefix="/ai-assist", tags=["AI Assist"])


@router.get("/{work_package_id}/available")
async def available(work_package_id: str, user: dict = Depends(get_current_user)):
    """Which assists this work type permits, and which are working today."""
    return await AIAssistService.available_for(work_package_id, user.get("site_id", "SITE-01"))


@router.get("/{work_package_id}/validate")
async def validate(work_package_id: str, user: dict = Depends(get_current_user)):
    """Pre-submission completeness against what the work type requires."""
    return await AIAssistService.validate(work_package_id, user.get("site_id", "SITE-01"))


@router.get("/{work_package_id}/anomalies")
async def anomalies(
    work_package_id: str,
    sensitivity: float = 2.0,
    user: dict = Depends(get_current_user),
):
    """Rate and quantity outliers across the certified lines."""
    return await AIAssistService.detect_anomalies(
        work_package_id, user.get("site_id", "SITE-01"), sensitivity
    )


@router.get("/{work_package_id}/checklist")
async def checklist(work_package_id: str, user: dict = Depends(get_current_user)):
    """A checklist derived from the work type's codes and capture requirements."""
    return await AIAssistService.generate_checklist(
        work_package_id, user.get("site_id", "SITE-01")
    )


@router.post("/{work_package_id}/draft-report")
async def draft_report(work_package_id: str, user: dict = Depends(get_current_user)):
    """Draft report narrative. Needs a configured language model."""
    return await AIAssistService.draft_report(work_package_id, user.get("site_id", "SITE-01"))


@router.post("/{work_package_id}/extract/{evidence_id}")
async def extract(
    work_package_id: str, evidence_id: str, user: dict = Depends(get_current_user)
):
    """Extract structured data from a scanned document. Needs a vision model."""
    return await AIAssistService.extract_document(
        work_package_id, evidence_id, user.get("site_id", "SITE-01")
    )
