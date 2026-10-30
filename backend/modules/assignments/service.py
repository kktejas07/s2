from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import HTTPException

from core.audit import AuditAction, record as audit
from core.sequences import next_identifier
from modules.assignments.models import (
    ALLOWED_TRANSITIONS,
    Assignment,
    AssignmentMethod,
    AssignmentRole,
    AssignmentStatus,
    ConsideredCandidate,
    check_eligibility,
    score_candidate,
    should_auto_assign,
)
from modules.people.models import Authorization, AuthorizationStatus, Person
from modules.people.service import PeopleService
from modules.work_packages.models import WorkPackage
from modules.work_packages.service import WorkPackageService
from modules.work_types.models import WorkTypeDefinition

VALID_ROLES = {r.value for r in AssignmentRole}
VALID_STATUSES = {s.value for s in AssignmentStatus}


async def _next_assignment_id(site_id: str) -> str:
    """ASG-YYYY-NNNN, allocated atomically. See core/sequences.py."""
    return await next_identifier(
        Assignment, "assignment_id", site_id, "ASG", kind="assignment"
    )


async def _has_calendar_clash(
    person_id: str, start: Optional[datetime], end: Optional[datetime], site_id: str
) -> bool:
    """Any live assignment overlapping this window."""
    if not start or not end:
        return False
    live = await Assignment.find(
        Assignment.person_id == person_id,
        Assignment.site_id == site_id,
        {"status": {"$in": ["proposed", "pending_client_approval", "accepted", "active"]}},
    ).to_list()
    for a in live:
        if a.planned_from and a.planned_to and a.planned_from <= end and a.planned_to >= start:
            return True
    return False


def _proximity(person_location: Optional[str], work_location: Optional[str]) -> float:
    """Crude but honest: exact match scores high, same-token match middling.

    Real geocoding would be better. Until distances exist, this is stated as an
    approximation rather than dressed up as one.
    """
    if not person_location or not work_location:
        return 0.3
    a, b = person_location.strip().lower(), work_location.strip().lower()
    if a == b:
        return 1.0
    if a in b or b in a:
        return 0.75
    if set(a.replace(",", " ").split()) & set(b.replace(",", " ").split()):
        return 0.5
    return 0.15


def _skill_depth(person: Person, wt: Optional[WorkTypeDefinition], auth: Optional[Authorization]) -> float:
    """Depth beyond the minimum bar, not whether they clear it — that is the gate."""
    score = 0.5
    if wt and wt.min_experience_years:
        # experience_text is free text in the legacy data; take any leading number
        try:
            years = float("".join(c for c in (person.experience_text or "") if c.isdigit() or c == ".") or 0)
        except ValueError:
            years = 0.0
        if years:
            score = min(1.0, years / (wt.min_experience_years * 2)) if wt.min_experience_years else 0.5
    if auth and len(auth.inspection_types) > 1:
        score = min(1.0, score + 0.1)       # breadth is worth a little
    return score


async def _workload(person_id: str, site_id: str) -> float:
    """Fewer live assignments scores higher, so work spreads."""
    live = await Assignment.find(
        Assignment.person_id == person_id,
        Assignment.site_id == site_id,
        {"status": {"$in": ["accepted", "active"]}},
    ).count()
    return max(0.0, 1.0 - (live / 5.0))     # 5+ live assignments scores zero


class AssignmentService:

    # ------------------------------------------------------------- engine

    @staticmethod
    async def recommend(work_package_id: str, site_id: str = "SITE-01", top_n: int = 5):
        """Two-stage: hard eligibility gate, then weighted ranking of survivors."""
        wp = await WorkPackage.find_one(
            WorkPackage.work_package_id == work_package_id, WorkPackage.site_id == site_id
        )
        if not wp:
            raise HTTPException(404, f"Work package '{work_package_id}' not found")

        wt = await WorkTypeDefinition.find_one(
            WorkTypeDefinition.work_type_code == wp.work_type_code,
            WorkTypeDefinition.site_id == site_id,
        )
        required_types = wt.required_authorization_types if wt else []

        pool = await Person.find(Person.site_id == site_id).to_list()

        eligible, excluded = [], []
        for p in pool:
            auth = await Authorization.find_one(
                Authorization.person_id == p.person_id,
                Authorization.site_id == site_id,
                Authorization.status == AuthorizationStatus.AUTHORIZED.value,
            )
            conflict = await PeopleService.has_conflict(
                p.person_id, wp.client_id, wp.manufacturer_id, site_id
            )
            clash = await _has_calendar_clash(p.person_id, wp.planned_start, wp.planned_finish, site_id)

            ok, reason = check_eligibility(
                p.model_dump(),
                auth.model_dump() if auth else None,
                required_types,
                wp.planned_start,
                conflict,
                clash,
            )
            if not ok:
                excluded.append({
                    "person_id": p.person_id, "full_name": p.full_name, "reason": reason
                })
                continue
            eligible.append((p, auth))

        ranked = []
        for p, auth in eligible:
            breakdown = score_candidate(
                skill_depth=_skill_depth(p, wt, auth),
                proximity=_proximity(p.base_location or p.city_name, wp.location),
                availability=1.0,                       # passed the clash check
                workload=await _workload(p.person_id, site_id),
                past_performance=0.5,                   # neutral until history exists
            )
            bits = []
            if auth:
                bits.append(f"authorized for {', '.join(auth.inspection_types) or 'general work'}")
            if p.base_location or p.city_name:
                bits.append(f"based in {p.base_location or p.city_name}")
            breakdown.narrative = "; ".join(bits) or "Eligible"

            ranked.append({
                "person_id": p.person_id,
                "full_name": p.full_name,
                "score": breakdown.total,
                "breakdown": breakdown.model_dump(),
                "authorization_id": auth.authorization_id if auth else None,
                "authorization_valid_until": auth.valid_until if auth else None,
                "inspection_types": auth.inspection_types if auth else [],
                "base_location": p.base_location or p.city_name,
                "engagement_type": p.engagement_type,
            })

        ranked.sort(key=lambda r: -r["score"])
        auto_ok, auto_reason = should_auto_assign(
            ranked, wt.auto_assign_threshold if wt else None
        )

        return {
            "work_package_id": work_package_id,
            "work_type_code": wp.work_type_code,
            "required_authorization_types": required_types,
            "pool_size": len(pool),
            "eligible_count": len(ranked),
            "excluded_count": len(excluded),
            "recommendations": ranked[:top_n],
            "excluded": excluded[:20],
            "auto_assign_allowed": auto_ok,
            "auto_assign_reason": auto_reason,
        }

    # -------------------------------------------------------- assignment

    @staticmethod
    async def assign(
        work_package_id: str,
        person_id: str,
        site_id: str = "SITE-01",
        user_id: str = "USR-001",
        role: str = AssignmentRole.INSPECTION_OFFICER.value,
        method: str = AssignmentMethod.MANUAL.value,
        client_approval_required: bool = False,
        supervised_by_person_id: Optional[str] = None,
    ):
        """Assign a person, re-checking eligibility at the moment of assignment."""
        if role not in VALID_ROLES:
            raise HTTPException(400, f"Invalid role '{role}'. Expected one of: {sorted(VALID_ROLES)}")
        if role == AssignmentRole.TRAINEE_UNDER_SUPERVISION.value and not supervised_by_person_id:
            raise HTTPException(400, "A trainee assignment needs supervised_by_person_id")

        wp = await WorkPackage.find_one(
            WorkPackage.work_package_id == work_package_id, WorkPackage.site_id == site_id
        )
        if not wp:
            raise HTTPException(404, f"Work package '{work_package_id}' not found")

        person = await PeopleService.get(person_id, site_id)
        wt = await WorkTypeDefinition.find_one(
            WorkTypeDefinition.work_type_code == wp.work_type_code,
            WorkTypeDefinition.site_id == site_id,
        )
        auth = await Authorization.find_one(
            Authorization.person_id == person_id,
            Authorization.site_id == site_id,
            Authorization.status == AuthorizationStatus.AUTHORIZED.value,
        )
        conflict = await PeopleService.has_conflict(
            person_id, wp.client_id, wp.manufacturer_id, site_id
        )
        clash = await _has_calendar_clash(person_id, wp.planned_start, wp.planned_finish, site_id)

        # The gate runs again here. A recommendation list can go stale between
        # being shown and being acted on.
        ok, reason = check_eligibility(
            person.model_dump(),
            auth.model_dump() if auth else None,
            wt.required_authorization_types if wt else [],
            wp.planned_start,
            conflict,
            clash,
        )
        if not ok:
            raise HTTPException(409, f"{person.full_name} cannot take this work: {reason}")

        assignment = Assignment(
            assignment_id=await _next_assignment_id(site_id),
            site_id=site_id,
            work_package_id=work_package_id,
            job_id=wp.job_id,
            person_id=person_id,
            person_name=person.full_name,
            role=role,
            supervised_by_person_id=supervised_by_person_id,
            assigned_by=user_id,
            assignment_method=method,
            # snapshotted, so the record stays true after the certificate lapses
            authorization_id=auth.authorization_id if auth else None,
            authorization_valid_until=auth.valid_until if auth else None,
            inspection_types_covered=auth.inspection_types if auth else [],
            impartiality_checked=True,
            impartiality_conflict_found=False,
            planned_from=wp.planned_start,
            planned_to=wp.planned_finish,
            client_approval_required=client_approval_required,
            status=(
                AssignmentStatus.PENDING_CLIENT_APPROVAL.value
                if client_approval_required
                else AssignmentStatus.PROPOSED.value
            ),
        )
        await assignment.insert()

        # Who was put on this work, by whom, and on what competence evidence -
        # the question an impartiality review starts from.
        await audit(
            "assignment", assignment.assignment_id, AuditAction.ASSIGN,
            actor={"user_id": user_id},
            note=f"{assignment.person_name or person_id} assigned to {work_package_id}",
            context={
                "person_id": person_id, "work_package_id": work_package_id,
                "role": role, "method": method,
            },
            site_id=site_id,
        )

        if wp.status == "planned":
            await WorkPackageService.transition(
                work_package_id, "assigned", site_id, user_id,
                f"{person.full_name} assigned as {role.lower().replace('_', ' ')}",
            )
        return assignment

    @staticmethod
    async def auto_assign(work_package_id: str, site_id: str = "SITE-01", user_id: str = "USR-001"):
        """Assign the top candidate, but only where the work type permits it."""
        rec = await AssignmentService.recommend(work_package_id, site_id, top_n=5)
        if not rec["auto_assign_allowed"]:
            raise HTTPException(409, rec["auto_assign_reason"])

        top = rec["recommendations"][0]
        assignment = await AssignmentService.assign(
            work_package_id, top["person_id"], site_id, user_id,
            method=AssignmentMethod.AI_AUTO.value,
        )
        assignment.ai_score = top["score"]
        assignment.ai_breakdown = top["breakdown"]
        assignment.ai_rationale = top["breakdown"].get("narrative")
        assignment.alternatives_considered = [
            ConsideredCandidate(
                person_id=r["person_id"], full_name=r["full_name"],
                score=r["score"], rank=i + 1,
            )
            for i, r in enumerate(rec["recommendations"][1:5], start=1)
        ]
        await assignment.save()
        return assignment

    # ------------------------------------------------------------ queries

    @staticmethod
    async def list(
        site_id: str = "SITE-01",
        work_package_id: str = "",
        person_id: str = "",
        status: str = "",
        page: int = 1,
        per_page: int = 100,
    ):
        query: dict = {"site_id": site_id}
        if work_package_id:
            query["work_package_id"] = work_package_id
        if person_id:
            query["person_id"] = person_id
        if status:
            query["status"] = status

        total = await Assignment.find(query).count()
        items = (
            await Assignment.find(query).sort(-Assignment.created_at)
            .skip((page - 1) * per_page).limit(per_page).to_list()
        )
        return {
            "total": total, "page": page, "per_page": per_page,
            "data": [i.model_dump(exclude={"id"}) for i in items],
        }

    @staticmethod
    async def get(assignment_id: str, site_id: str = "SITE-01") -> Assignment:
        a = await Assignment.find_one(
            Assignment.assignment_id == assignment_id, Assignment.site_id == site_id
        )
        if not a:
            raise HTTPException(404, f"Assignment '{assignment_id}' not found")
        return a

    @staticmethod
    async def transition(
        assignment_id: str,
        to_status: str,
        site_id: str = "SITE-01",
        reason: Optional[str] = None,
    ):
        a = await AssignmentService.get(assignment_id, site_id)
        if to_status not in VALID_STATUSES:
            raise HTTPException(400, f"Unknown status '{to_status}'. Expected one of: {sorted(VALID_STATUSES)}")
        allowed = ALLOWED_TRANSITIONS.get(a.status, set())
        if to_status not in allowed:
            raise HTTPException(
                409,
                f"Cannot move assignment from '{a.status}' to '{to_status}'. "
                f"Allowed: {sorted(allowed) or 'none (terminal)'}",
            )
        if to_status == AssignmentStatus.ACCEPTED.value and a.client_approval_required:
            a.client_approved_at = datetime.now()
        if to_status == AssignmentStatus.WITHDRAWN.value:
            a.withdrawn_reason = reason
        if to_status == AssignmentStatus.REJECTED.value:
            a.client_remarks = reason

        a.status = to_status
        a.updated_at = datetime.now()
        await a.save()
        return a

    @staticmethod
    async def roster(site_id: str = "SITE-01", person_id: str = ""):
        """Live assignments with their windows, for the calendar view."""
        query: dict = {
            "site_id": site_id,
            "status": {"$in": ["proposed", "pending_client_approval", "accepted", "active"]},
        }
        if person_id:
            query["person_id"] = person_id
        items = await Assignment.find(query).sort(Assignment.planned_from).to_list()

        by_person: dict[str, dict] = {}
        for a in items:
            e = by_person.setdefault(
                a.person_id,
                {"person_id": a.person_id, "person_name": a.person_name, "assignments": []},
            )
            e["assignments"].append({
                "assignment_id": a.assignment_id,
                "work_package_id": a.work_package_id,
                "job_id": a.job_id,
                "role": a.role,
                "status": a.status,
                "planned_from": a.planned_from,
                "planned_to": a.planned_to,
                "authorization_valid_until": a.authorization_valid_until,
            })
        return {"total_assignments": len(items), "people": list(by_person.values())}
