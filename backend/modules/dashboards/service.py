"""Role dashboards over the execution spine.

One dashboard per role, all reading the same data, rather than a dashboard per
module. Each returns what that role has to act on, not a general summary - an
operations console earns its place by shortening the path to a decision.

See SOW_EXECUTION_ARCHITECTURE.md section 8.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException

from modules.assignments.models import Assignment
from modules.billing.models import ageing_bucket, is_overdue
from modules.certifications.models import Certification, CertificationStatus
from modules.invoices.models import Invoice
from modules.people.models import Authorization, AuthorizationStatus, CompetenceProfile, Person
from modules.work_packages.models import WorkPackage
from modules.work_types.models import WorkTypeDefinition

ROLES = [
    "coordinator",
    "inspection_officer",
    "qc_reviewer",
    "finance",
    "technical_manager",
    "management",
]


def _round2(v: float) -> float:
    return round(v + 0.0, 2)


def _ref(wp: WorkPackage) -> dict:
    return {
        "work_package_id": wp.work_package_id,
        "title": wp.title,
        "job_id": wp.job_id,
        "work_type_code": wp.work_type_code,
        "location": wp.location,
        "planned_start": wp.planned_start,
        "planned_finish": wp.planned_finish,
        "status": wp.status,
    }


class DashboardService:

    # -------------------------------------------------------- coordinator

    @staticmethod
    async def coordinator(site_id: str = "SITE-01"):
        """What is not moving, and what needs a person put on it."""
        now = datetime.now()
        soon = now + timedelta(days=14)

        unassigned = await WorkPackage.find(
            WorkPackage.site_id == site_id,
            WorkPackage.status == "planned",
            WorkPackage.is_active == True,  # noqa: E712
        ).sort(WorkPackage.planned_start).to_list()

        # Unassigned work starting inside two weeks is the urgent subset.
        starting_soon = [
            wp for wp in unassigned
            if wp.planned_start and wp.planned_start <= soon
        ]

        awaiting_client = await Assignment.find(
            Assignment.site_id == site_id,
            Assignment.status == "pending_client_approval",
        ).to_list()

        in_flight = await WorkPackage.find(
            WorkPackage.site_id == site_id,
            {"status": {"$in": ["assigned", "in_progress"]}},
        ).count()

        overdue_packages = [
            wp for wp in await WorkPackage.find(
                WorkPackage.site_id == site_id,
                {"status": {"$in": ["assigned", "in_progress"]}},
            ).to_list()
            if wp.planned_finish and wp.planned_finish < now
        ]

        return {
            "role": "coordinator",
            "headline": {
                "unassigned": len(unassigned),
                "unassigned_starting_within_14_days": len(starting_soon),
                "in_flight": in_flight,
                "awaiting_client_approval": len(awaiting_client),
                "past_planned_finish": len(overdue_packages),
            },
            "needs_an_officer": [_ref(wp) for wp in starting_soon[:10]] or [
                _ref(wp) for wp in unassigned[:10]
            ],
            "awaiting_client": [
                {
                    "assignment_id": a.assignment_id,
                    "work_package_id": a.work_package_id,
                    "person_name": a.person_name,
                    "waiting_since": a.created_at,
                    "days_waiting": (now - a.created_at).days,
                }
                for a in sorted(awaiting_client, key=lambda x: x.created_at)[:10]
            ],
            "running_late": [_ref(wp) for wp in overdue_packages[:10]],
        }

    # -------------------------------------------------- inspection officer

    @staticmethod
    async def inspection_officer(site_id: str = "SITE-01", person_id: Optional[str] = None):
        """One person's own work. Needs a person_id to mean anything."""
        if not person_id:
            raise HTTPException(
                400,
                "This dashboard is per person; pass person_id (the signed-in user's EMP id).",
            )
        now = datetime.now()
        week = now + timedelta(days=7)

        mine = await Assignment.find(
            Assignment.site_id == site_id,
            Assignment.person_id == person_id,
            {"status": {"$in": ["proposed", "pending_client_approval", "accepted", "active"]}},
        ).sort(Assignment.planned_from).to_list()

        this_week = [a for a in mine if a.planned_from and a.planned_from <= week]

        packages = []
        for a in this_week[:10]:
            wp = await WorkPackage.find_one(
                WorkPackage.work_package_id == a.work_package_id, WorkPackage.site_id == site_id
            )
            packages.append({
                "assignment_id": a.assignment_id,
                "status": a.status,
                "role": a.role,
                "planned_from": a.planned_from,
                "planned_to": a.planned_to,
                **(_ref(wp) if wp else {"work_package_id": a.work_package_id}),
            })

        # Their own credential position, since it decides whether they can work.
        person = await Person.find_one(
            Person.person_id == person_id, Person.site_id == site_id
        )
        profile = await CompetenceProfile.find_one(
            CompetenceProfile.person_id == person_id, CompetenceProfile.site_id == site_id
        )
        lapsing = []
        if profile:
            for q in profile.qualifications:
                if q.expires_on and now <= q.expires_on <= now + timedelta(days=90):
                    lapsing.append({
                        "name": q.name,
                        "expires_on": q.expires_on,
                        "days_remaining": (q.expires_on - now).days,
                    })

        return {
            "role": "inspection_officer",
            "person_id": person_id,
            "person_name": person.full_name if person else None,
            "deployable": person.deployable if person else False,
            "deployability_reason": person.deployability_reason if person else None,
            "headline": {
                "assignments_this_week": len(this_week),
                "assignments_total_open": len(mine),
                "credentials_lapsing_90_days": len(lapsing),
            },
            "this_week": packages,
            "credentials_lapsing": sorted(lapsing, key=lambda x: x["days_remaining"]),
        }

    # --------------------------------------------------------- qc reviewer

    @staticmethod
    async def qc_reviewer(site_id: str = "SITE-01"):
        """The review queue, oldest first, with what has been waiting too long."""
        now = datetime.now()

        submitted = await WorkPackage.find(
            WorkPackage.site_id == site_id,
            {"status": {"$in": ["submitted", "under_qc"]}},
        ).sort(WorkPackage.updated_at).to_list()

        aged = [wp for wp in submitted if (now - wp.updated_at) > timedelta(hours=48)]

        draft_certs = await Certification.find(
            Certification.site_id == site_id,
            Certification.status == CertificationStatus.DRAFT.value,
        ).to_list()

        disputed = await Certification.find(
            Certification.site_id == site_id,
            Certification.status == CertificationStatus.DISPUTED.value,
        ).to_list()

        return {
            "role": "qc_reviewer",
            "headline": {
                "awaiting_review": len(submitted),
                "waiting_over_48h": len(aged),
                "certifications_in_draft": len(draft_certs),
                "certifications_disputed": len(disputed),
            },
            "review_queue": [
                {**_ref(wp), "waiting_hours": int((now - wp.updated_at).total_seconds() // 3600)}
                for wp in submitted[:10]
            ],
            "disputed": [
                {
                    "certification_id": c.certification_id,
                    "work_package_id": c.work_package_id,
                    "certified_value": c.certified_value,
                    "dispute_note": c.dispute_note,
                }
                for c in disputed[:10]
            ],
        }

    # ------------------------------------------------------------- finance

    @staticmethod
    async def finance(site_id: str = "SITE-01"):
        """Money verified, money invoiced, money late."""
        certs = await Certification.find(
            Certification.site_id == site_id,
            Certification.status == CertificationStatus.ISSUED.value,
        ).to_list()
        unbilled = [c for c in certs if not c.billed_invoice_id]

        invoices = await Invoice.find(
            Invoice.site_id == site_id, {"cancelled": {"$ne": True}}
        ).to_list()

        outstanding = 0.0
        overdue = 0.0
        buckets: dict[str, float] = {}
        overdue_list = []

        for inv in invoices:
            status = inv.payment_status or "unpaid"
            if status != "paid":
                outstanding += inv.grand_total
                if is_overdue(inv.due_date, status):
                    overdue += inv.grand_total
                    overdue_list.append({
                        "invoice_id": inv.invoice_id,
                        "job_id": inv.job_id,
                        "grand_total": inv.grand_total,
                        "due_date": inv.due_date,
                        "days_late": (datetime.now() - inv.due_date).days if inv.due_date else None,
                    })
            b = ageing_bucket(inv.due_date, status)
            buckets[b] = _round2(buckets.get(b, 0.0) + inv.grand_total)

        return {
            "role": "finance",
            "headline": {
                "certified_not_billed_value": _round2(sum(c.net_payable_value for c in unbilled)),
                "certified_not_billed_count": len(unbilled),
                "outstanding_value": _round2(outstanding),
                "overdue_value": _round2(overdue),
                "retention_held": _round2(sum(c.retention_value for c in certs)),
            },
            "ageing": buckets,
            "ready_to_invoice": [
                {
                    "certification_id": c.certification_id,
                    "job_id": c.job_id,
                    "work_package_id": c.work_package_id,
                    "net_payable_value": c.net_payable_value,
                    "certified_at": c.certified_at,
                }
                for c in sorted(unbilled, key=lambda x: -x.net_payable_value)[:10]
            ],
            "overdue_invoices": sorted(
                overdue_list, key=lambda x: -(x["days_late"] or 0)
            )[:10],
        }

    # --------------------------------------------------- technical manager

    @staticmethod
    async def technical_manager(site_id: str = "SITE-01"):
        """Competence coverage and what is about to lapse."""
        now = datetime.now()
        horizon = now + timedelta(days=60)

        people = await Person.find(Person.site_id == site_id).to_list()
        deployable = [p for p in people if p.deployable]

        pending = await Authorization.find(
            Authorization.site_id == site_id,
            Authorization.status == AuthorizationStatus.PENDING.value,
        ).to_list()

        legacy = await Authorization.find(
            Authorization.site_id == site_id,
            Authorization.unverified_legacy_grant == True,  # noqa: E712
        ).to_list()

        expiring = []
        for auth in await Authorization.find(
            Authorization.site_id == site_id,
            Authorization.status == AuthorizationStatus.AUTHORIZED.value,
        ).to_list():
            if auth.valid_until and now <= auth.valid_until <= horizon:
                expiring.append({
                    "authorization_id": auth.authorization_id,
                    "person_id": auth.person_id,
                    "inspection_types": auth.inspection_types,
                    "expires_on": auth.valid_until,
                    "days_remaining": (auth.valid_until - now).days,
                })

        # Coverage: which work types have nobody authorized for them.
        work_types = await WorkTypeDefinition.find(
            WorkTypeDefinition.site_id == site_id,
            WorkTypeDefinition.is_active == True,  # noqa: E712
        ).to_list()
        authorized_types: set[str] = set()
        for auth in await Authorization.find(
            Authorization.site_id == site_id,
            Authorization.status == AuthorizationStatus.AUTHORIZED.value,
        ).to_list():
            authorized_types.update(auth.inspection_types)

        gaps = [
            {"work_type_code": wt.work_type_code, "name": wt.name,
             "requires": wt.required_authorization_types}
            for wt in work_types
            if wt.required_authorization_types
            and not set(wt.required_authorization_types) <= authorized_types
        ]

        return {
            "role": "technical_manager",
            "headline": {
                "people_total": len(people),
                "deployable": len(deployable),
                "authorizations_pending": len(pending),
                "unverified_legacy_grants": len(legacy),
                "expiring_within_60_days": len(expiring),
                "work_types_with_no_authorized_person": len(gaps),
            },
            "awaiting_decision": [
                {
                    "authorization_id": a.authorization_id,
                    "person_id": a.person_id,
                    "inspection_types": a.inspection_types,
                    "qualification_verified": a.qualification_verified,
                    "training_completed": a.training_completed,
                    "supervised": f"{a.supervised_inspections_count}/{a.supervised_required}",
                    "witnessed_assessment_passed": a.witnessed_assessment_passed,
                }
                for a in pending[:10]
            ],
            "expiring": sorted(expiring, key=lambda x: x["days_remaining"])[:10],
            "coverage_gaps": gaps,
        }

    # ---------------------------------------------------------- management

    @staticmethod
    async def management(site_id: str = "SITE-01"):
        """The whole position, including the number that was uncomputable before."""
        packages = await WorkPackage.find(
            WorkPackage.site_id == site_id, WorkPackage.is_active == True  # noqa: E712
        ).to_list()

        by_status: dict[str, int] = {}
        by_type: dict[str, int] = {}
        for wp in packages:
            by_status[wp.status] = by_status.get(wp.status, 0) + 1
            by_type[wp.work_type_code] = by_type.get(wp.work_type_code, 0) + 1

        certs = await Certification.find(
            Certification.site_id == site_id,
            Certification.status == CertificationStatus.ISSUED.value,
        ).to_list()
        unbilled = [c for c in certs if not c.billed_invoice_id]

        claimed = sum(c.claimed_value for c in certs)
        certified = sum(c.certified_value for c in certs)

        # Value certified per work type - where the revenue actually comes from.
        value_by_type: dict[str, float] = {}
        for c in certs:
            wp = next((w for w in packages if w.work_package_id == c.work_package_id), None)
            key = wp.work_type_code if wp else "UNKNOWN"
            value_by_type[key] = _round2(value_by_type.get(key, 0.0) + c.certified_value)

        people = await Person.find(Person.site_id == site_id).to_list()
        deployable = len([p for p in people if p.deployable])
        active_assignments = await Assignment.find(
            Assignment.site_id == site_id,
            {"status": {"$in": ["accepted", "active"]}},
        ).count()

        return {
            "role": "management",
            "headline": {
                "work_packages": len(packages),
                "certified_value": _round2(certified),
                "certified_not_billed_value": _round2(sum(c.net_payable_value for c in unbilled)),
                "deduction_pct": round((claimed - certified) / claimed * 100, 2) if claimed else 0.0,
                "deployable_people": deployable,
                "utilisation_pct": round(active_assignments / deployable * 100, 1)
                if deployable else 0.0,
            },
            "packages_by_status": by_status,
            "packages_by_work_type": by_type,
            "certified_value_by_work_type": dict(
                sorted(value_by_type.items(), key=lambda kv: -kv[1])
            ),
        }

    # -------------------------------------------------------------- router

    @staticmethod
    async def for_role(role: str, site_id: str = "SITE-01", person_id: Optional[str] = None):
        role = (role or "").lower().strip()
        if role not in ROLES:
            raise HTTPException(400, f"Unknown role '{role}'. Expected one of: {ROLES}")
        if role == "coordinator":
            return await DashboardService.coordinator(site_id)
        if role == "inspection_officer":
            return await DashboardService.inspection_officer(site_id, person_id)
        if role == "qc_reviewer":
            return await DashboardService.qc_reviewer(site_id)
        if role == "finance":
            return await DashboardService.finance(site_id)
        if role == "technical_manager":
            return await DashboardService.technical_manager(site_id)
        return await DashboardService.management(site_id)
