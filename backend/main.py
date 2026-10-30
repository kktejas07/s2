import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from beanie import init_beanie
from fastapi import Depends
from core import ratelimit
from core.policy import enforce_policy
from pymongo import AsyncMongoClient
from core.config import settings
from core.cache import close_redis

from modules.auth.models import UserLogin
from modules.clients.models import Client, ClientUnit
from modules.manufacturers.models import Manufacturer, ManufacturerUnit
from modules.users.models import Competency, InspectorRate, Associate
from modules.jobs.models import Job
from modules.service_orders.models import ServiceOrder
from modules.control_numbers.models import ControlNumber
from modules.visits.models import Visit, ManufacturerVisitLocation
from modules.invoices.models import Invoice
from modules.purchase_orders.models import PurchaseOrder
from modules.payments.models import Payment
from modules.enquiries.models import Enquiry, GoNoGoDecision, ProposalRevision
from modules.enquiries.reason_codes import ReasonCode
from modules.providers.models import (
    EvaluationRecord, ExternalProvider, PerformanceRecord, SubcontractConsent,
)
from modules.complaints.models import CustomerComplaint
from modules.documents.models import Document as DocModel
from modules.analytics.models import AnalyticsEvent

from modules.auth.routes import router as auth_router
from modules.clients.routes import router as clients_router
from modules.manufacturers.routes import router as manufacturers_router
from modules.users.routes import router as users_router
from modules.jobs.routes import router as jobs_router
from modules.service_orders.routes import router as service_orders_router
from modules.control_numbers.routes import router as control_numbers_router
from modules.visits.routes import router as visits_router
from modules.invoices.routes import router as invoices_router
from modules.purchase_orders.routes import router as purchase_orders_router
from modules.payments.routes import router as payments_router
from modules.providers.routes import router as providers_router
from modules.risk.models import InternalAudit, Risk, RiskReview
from modules.risk.routes import audits as internal_audits_router, router as risks_router
from modules.ncr.models import NCR
from modules.ncr.routes import router as ncr_router
from modules.rates.models import RateCard, RateFloor
from modules.rates.routes import router as rates_router
from modules.commercial.models import Amendment
from modules.commercial.routes import router as commercial_router
from modules.itp.models import InspectionCall, InspectionTestPlan
from modules.itp.routes import calls as inspection_calls_router, router as itps_router
from modules.verification.routes import router as verification_router
from modules.enquiries.routes import (
    router as enquiries_router,
    proposals as proposals_router,
    pipeline as pipeline_router,
)
from modules.complaints.routes import router as complaints_router
from modules.documents.routes import router as documents_router
from modules.reports.routes import router as reports_router
from modules.masters.routes import router as masters_router
from modules.file_upload.routes import router as file_upload_router
from modules.dashboard.routes import router as dashboard_router
from modules.ai.routes import router as ai_router
from modules.analytics.routes import router as analytics_router


from modules.finance.models import AccountReceivable, AccountPayable
from modules.finance.routes import router as finance_router
from modules.construction_bill_verification.models import ConstructionBillVerificationRecord
from modules.construction_bill_verification.routes import router as construction_bill_verification_router
from modules.schedule_m_pharma_epc.models import ScheduleMPharmaEPCProject
from modules.schedule_m_pharma_epc.routes import router as schedule_m_pharma_epc_router
from modules.tpi.models import TpiReport
from modules.tpi.routes import router as tpi_router
from modules.work_types.models import WorkTypeDefinition
from modules.work_types.routes import router as work_types_router
from modules.work_packages.models import WorkPackage
from modules.work_packages.routes import router as work_packages_router
from modules.certifications.models import Certification
from modules.certifications.routes import router as certifications_router
from modules.billing.models import BillingTerms
from modules.billing.routes import router as billing_router
from modules.people.models import Person, CompetenceProfile, Authorization, ImpartialityDeclaration
from modules.people.routes import router as people_router
from modules.assignments.models import Assignment
from modules.assignments.routes import router as assignments_router
from modules.dashboards.routes import router as dashboards_router
from modules.audit.routes import router as audit_router
from modules.ai_assist.routes import router as ai_assist_router
from modules.appeals.models import Appeal
from modules.appeals.routes import router as appeals_router
from modules.equipment.models import CalibrationRecord, Equipment, EquipmentUsage
from modules.equipment.routes import router as equipment_router
from modules.evidence.models import Evidence
from modules.evidence.routes import router as evidence_router
from modules.migration.routes import router as migration_router
from modules.reporting.models import ReportFormat
from modules.reporting.routes import router as reporting_router
from core.audit import AuditEntry
from core.sequences import Sequence

# --- New modules (gap-fill build, Oct 2026) ---
from modules.regions.models import Region, Office, InterOfficeSettlement, InspectorLoan, DeputyCoverage
from modules.regions.routes import router as regions_router
from modules.recruitment.models import ManpowerRequest, Candidate, TechnicalInterview, OfferLetter, InductionChecklist
from modules.recruitment.routes import router as recruitment_router
from modules.leave_attendance.models import LeaveRequest, AttendanceRecord, Timesheet
from modules.leave_attendance.routes import router as leave_attendance_router
from modules.payroll.models import PayrollRun, Payslip
from modules.payroll.routes import router as payroll_router
from modules.appraisal.models import Appraisal, WitnessedInspection
from modules.appraisal.routes import router as appraisal_router
from modules.exit_management.models import ExitProcess
from modules.exit_management.routes import router as exit_router
from modules.payments.models import DunningRecord
from modules.purchasing.models import PurchaseRequisition, VendorPayment
from modules.purchasing.routes import router as purchasing_router
from modules.rfi.models import RFI
from modules.rfi.routes import router as rfi_router
from modules.punch_list.models import PunchItem
from modules.punch_list.routes import router as punch_list_router
from modules.release_notes.models import InspectionReleaseNote
from modules.release_notes.routes import router as release_notes_router
from modules.feedback.models import ClientFeedback, MRMAgendaItem
from modules.feedback.routes import router as feedback_router
from modules.job_handoff.models import JobConversion
from modules.job_handoff.routes import router as job_handoff_router
from modules.signoff.models import ReportSignoff
from modules.signoff.routes import router as signoff_router
from modules.win_loss.models import WinLossRecord
from modules.win_loss.routes import router as win_loss_router
from modules.notifications.models import EmailLog, NotificationPreference, InAppNotification
from modules.notifications.routes import router as notifications_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    client = AsyncMongoClient(settings.mongodb_url)
    await init_beanie(
        database=client[settings.mongodb_db_name],
        document_models=[
            Appeal, Equipment, CalibrationRecord, EquipmentUsage,
            Evidence,
            AuditEntry,
            Sequence,
            UserLogin, Client, ClientUnit, Manufacturer, ManufacturerUnit,
            Competency, InspectorRate, Associate, Job, ServiceOrder,
            ControlNumber, Visit, ManufacturerVisitLocation, Invoice,
            PurchaseOrder, Payment, Enquiry, GoNoGoDecision, ProposalRevision,
            ReasonCode, ExternalProvider, EvaluationRecord,
            PerformanceRecord, SubcontractConsent,
            Risk, RiskReview, InternalAudit,
            InspectionTestPlan, InspectionCall,
            Amendment, RateCard, RateFloor, NCR,
            CustomerComplaint, DocModel,
            AnalyticsEvent, AccountReceivable, AccountPayable, ConstructionBillVerificationRecord,
            ScheduleMPharmaEPCProject, TpiReport, WorkTypeDefinition, WorkPackage,
            Certification, BillingTerms,
            Person, CompetenceProfile, Authorization, ImpartialityDeclaration,
            Assignment, ReportFormat,
            # Gap-fill modules
            Region, Office, InterOfficeSettlement, InspectorLoan, DeputyCoverage,
            ManpowerRequest, Candidate, TechnicalInterview, OfferLetter, InductionChecklist,
            LeaveRequest, AttendanceRecord, Timesheet,
            PayrollRun, Payslip,
            Appraisal, WitnessedInspection,
            ExitProcess,
            DunningRecord,
            PurchaseRequisition, VendorPayment,
            RFI, PunchItem, InspectionReleaseNote,
            ClientFeedback, MRMAgendaItem,
            JobConversion, ReportSignoff, WinLossRecord,
            EmailLog, NotificationPreference, InAppNotification,
        ],
    )

    # Load the report format registry into the PDF renderer. The renderer is
    # synchronous and cannot read MongoDB itself, so the mapping is pushed in
    # once at startup; /reporting/sync-renderer refreshes it without a restart.
    # A failure here must not stop the API booting - rendering falls back to
    # the built-in format definitions.
    try:
        from modules.reporting.service import ReportingService

        await ReportingService.sync_renderer()
    except Exception as exc:  # pragma: no cover - startup resilience
        import logging

        logging.getLogger(__name__).warning(
            "Report format registry not loaded, falling back to built-in "
            "definitions: %s", exc,
        )

    # Anonymous access means every endpoint is open to anyone who can reach the
    # port. It is a development convenience and must never be on in production,
    # so say so loudly at every boot rather than leaving it to be discovered.
    if settings.auth_allow_anonymous:
        import logging

        logging.getLogger(__name__).warning(
            "AUTH_ALLOW_ANONYMOUS is enabled: unauthenticated requests are "
            "accepted as Admin. Do not run this way outside local development."
        )

    yield
    await close_redis()


# The RBAC matrix is applied once here rather than on each of ~200 routes.
# See core/policy.py: areas the matrix covers are enforced, areas it does not
# still require authentication.
app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
    dependencies=[Depends(enforce_policy)],
)

@app.middleware("http")
async def rate_limit(request, call_next):
    """Covers the unauthenticated endpoints only - see core/ratelimit.py.

    Registered before CORS so that CORS ends up the outer layer: a 429 that
    reaches the browser without CORS headers is reported as a CORS failure,
    and the person at the login screen is told nothing useful.
    """
    rejected = ratelimit.check(request)
    if rejected is not None:
        return rejected
    return await call_next(request)


configured_origins = [o.strip() for o in settings.allowed_origins if o and o.strip()]
allow_all_origins = "*" in configured_origins
explicit_origins = [o for o in configured_origins if o != "*"]

# localhost plus private LAN ranges, so the app can be opened from a phone on the same Wi-Fi
lan_regex = (
    r"^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|10(\.\d{1,3}){3}"
    r"|192\.168(\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[01])(\.\d{1,3}){2})(:\d+)?$"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=explicit_origins,
    # Reflect any origin (with credentials) when '*' is configured, else allow the
    # explicit/env origins plus localhost/LAN hosts.
    allow_origin_regex=r".*" if allow_all_origins else lan_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cross-platform static files mount for uploads
UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/files/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

MEDIA_DIR = Path(__file__).resolve().parent / "media"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(MEDIA_DIR)), name="media")

app.include_router(auth_router, prefix="/api/v1")
app.include_router(clients_router, prefix="/api/v1")
app.include_router(manufacturers_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(jobs_router, prefix="/api/v1")
app.include_router(service_orders_router, prefix="/api/v1")
app.include_router(control_numbers_router, prefix="/api/v1")
app.include_router(visits_router, prefix="/api/v1")
app.include_router(invoices_router, prefix="/api/v1")
app.include_router(purchase_orders_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(enquiries_router, prefix="/api/v1")
app.include_router(proposals_router, prefix="/api/v1")
app.include_router(pipeline_router, prefix="/api/v1")
app.include_router(providers_router, prefix="/api/v1")
app.include_router(risks_router, prefix="/api/v1")
app.include_router(internal_audits_router, prefix="/api/v1")
app.include_router(verification_router, prefix="/api/v1")
app.include_router(itps_router, prefix="/api/v1")
app.include_router(commercial_router, prefix="/api/v1")
app.include_router(rates_router, prefix="/api/v1")
app.include_router(ncr_router, prefix="/api/v1")
app.include_router(inspection_calls_router, prefix="/api/v1")
app.include_router(complaints_router, prefix="/api/v1")
app.include_router(documents_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(masters_router, prefix="/api/v1")
app.include_router(file_upload_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(finance_router, prefix="/api/v1")
app.include_router(construction_bill_verification_router, prefix="/api/v1")
app.include_router(schedule_m_pharma_epc_router, prefix="/api/v1")
app.include_router(work_types_router, prefix="/api/v1")
app.include_router(work_packages_router, prefix="/api/v1")
app.include_router(certifications_router, prefix="/api/v1")
app.include_router(billing_router, prefix="/api/v1")
app.include_router(people_router, prefix="/api/v1")
app.include_router(assignments_router, prefix="/api/v1")
app.include_router(dashboards_router, prefix="/api/v1")
app.include_router(reporting_router, prefix="/api/v1")
app.include_router(migration_router, prefix="/api/v1")
app.include_router(audit_router, prefix="/api/v1")
app.include_router(evidence_router, prefix="/api/v1")
app.include_router(appeals_router, prefix="/api/v1")
app.include_router(equipment_router, prefix="/api/v1")
app.include_router(ai_assist_router, prefix="/api/v1")
app.include_router(tpi_router)

# Gap-fill routers
app.include_router(regions_router, prefix="/api/v1")
app.include_router(recruitment_router, prefix="/api/v1")
app.include_router(leave_attendance_router, prefix="/api/v1")
app.include_router(payroll_router, prefix="/api/v1")
app.include_router(appraisal_router, prefix="/api/v1")
app.include_router(exit_router, prefix="/api/v1")
app.include_router(purchasing_router, prefix="/api/v1")
app.include_router(rfi_router, prefix="/api/v1")
app.include_router(punch_list_router, prefix="/api/v1")
app.include_router(release_notes_router, prefix="/api/v1")
app.include_router(feedback_router, prefix="/api/v1")
app.include_router(job_handoff_router, prefix="/api/v1")
app.include_router(signoff_router, prefix="/api/v1")
app.include_router(win_loss_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")


@app.get("/api/pdf/generate", include_in_schema=False)
async def generate_form_pdf(form_code: str, item_no: str = "", disposition: str = "inline"):
    """Legacy link used by the Expediting page (per-item PDF)."""
    from fastapi.responses import Response
    from app.pdf.service import render_pdf

    try:
        pdf = render_pdf(form_code, payload={"item_no": item_no} if item_no else {})
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    disp = "attachment" if disposition == "attachment" else "inline"
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'{disp}; filename="{form_code}_{item_no or "report"}.pdf"'})


@app.get("/v/{code}", include_in_schema=False)
async def open_verify_link(code: str):
    """Short link encoded in document QR codes -> the web app's /verify page."""
    from fastapi.responses import RedirectResponse
    from core.qr import resolve_short

    target = resolve_short(code)
    if not target:
        raise HTTPException(status_code=404, detail="Unknown or expired verification code")
    return RedirectResponse(target, status_code=302)



@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.app_name, "platform": sys.platform}


@app.get("/health/pdf")
async def health_pdf():
    status = {"available": False, "version": None, "error": None}
    try:
        import weasyprint

        status["available"] = True
        status["version"] = getattr(weasyprint, "__version__", "unknown")
    except Exception as e:
        status["error"] = str(e)
    return status


def main():
    """Cross-platform entry point to run server via python main.py"""
    import uvicorn

    # Windows-specific asyncio event loop policy fix to prevent WinError 995 / shutdown crash
    if sys.platform == "win32":
        import asyncio
        try:
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        except Exception:
            pass

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("RELOAD", "true").lower() in ("true", "1", "yes")

    print(f"Starting IQEApp Backend on http://{host}:{port} (OS: {sys.platform}, Reload: {reload})...")
    uvicorn.run("main:app", host=host, port=port, reload=reload)


if __name__ == "__main__":
    main()
