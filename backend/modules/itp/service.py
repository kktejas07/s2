"""Hold points, witness points, and the calls raised against them.

Two halves. The first enforces what a hold point means. The second is the
automation that makes the plan worth holding as data rather than as a PDF: a
forecast of what is coming against the people available to meet it, and an
assignment suggestion that reuses the existing eligibility gate rather than
inventing a second, laxer one.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import HTTPException

from core import audit
from core.audit import AuditAction
from core.sequences import next_identifier
from modules.itp.models import (
    BLOCKS_PROGRESS,
    DEFAULT_NOTICE_DAYS,
    OPEN_CALL_STATUSES,
    REQUIRES_ATTENDANCE,
    CallOutcome,
    CallStatus,
    InspectionCall,
    InspectionTestPlan,
    InterventionType,
    ITPPoint,
    ITPStatus,
)

VALID_INTERVENTIONS = {i.value for i in InterventionType}
logger = logging.getLogger(__name__)

VALID_OUTCOMES = {o.value for o in CallOutcome}


def notice_required(point: ITPPoint) -> int:
    if point.notice_days is not None:
        return int(point.notice_days)
    return DEFAULT_NOTICE_DAYS.get(
        InterventionType(point.intervention), 3
    )


class ITPService:
    # --------------------------------------------------------------- plans

    @staticmethod
    async def create(data: dict, site_id: str, user_id: str) -> dict:
        job_id = (data.get("job_id") or "").strip()
        title = (data.get("title") or "").strip()
        if not (job_id and title):
            raise HTTPException(400, "An ITP needs a job and a title")

        points = [ITPPoint(**p) for p in (data.get("points") or [])]
        ITPService._validate_points(points)

        plan = InspectionTestPlan(
            itp_id=await next_identifier(
                InspectionTestPlan, "itp_id", site_id, "ITP"
            ),
            site_id=site_id,
            job_id=job_id,
            client_id=data.get("client_id"),
            title=title,
            client_reference=data.get("client_reference"),
            revision=data.get("revision") or "Rev 0",
            points=points,
            extracted_from_document=data.get("extracted_from_document"),
            created_by=user_id,
        )
        await plan.insert()
        await audit.record(
            "itp", plan.itp_id, AuditAction.CREATE,
            actor={"user_id": user_id}, site_id=site_id, note=title,
            context={"job_id": job_id, "points": len(points),
                     "hold_points": sum(
                         1 for p in points
                         if p.intervention == InterventionType.HOLD)},
        )
        return plan.model_dump(exclude={"id"})

    @staticmethod
    def _validate_points(points: list[ITPPoint]) -> None:
        seen = set()
        for p in points:
            if p.intervention not in VALID_INTERVENTIONS:
                raise HTTPException(
                    400,
                    f"Point {p.point_id}: '{p.intervention}' is not an "
                    f"intervention type. Expected H, W, R or M.",
                )
            if p.point_id in seen:
                raise HTTPException(
                    400,
                    f"Point {p.point_id} appears twice. Calls are raised "
                    f"against a point reference, so duplicates make the call "
                    f"ambiguous.",
                )
            seen.add(p.point_id)
            # A hold point against no document is a hold point nobody can
            # close out: there is no stated thing to inspect against.
            if p.intervention == InterventionType.HOLD and not p.acceptance_criteria:
                raise HTTPException(
                    400,
                    f"Point {p.point_id} is a hold point with no acceptance "
                    f"criteria. Work stops there, so what releases it has to "
                    f"be written down.",
                )

    @staticmethod
    async def get(itp_id: str, site_id: str = "SITE-01") -> InspectionTestPlan:
        plan = await InspectionTestPlan.find_one(
            InspectionTestPlan.itp_id == itp_id,
            InspectionTestPlan.site_id == site_id,
        )
        if not plan:
            raise HTTPException(404, f"ITP {itp_id} not found")
        return plan

    @staticmethod
    async def list(site_id: str = "SITE-01", job_id: str = "") -> dict:
        query: dict[str, Any] = {"site_id": site_id}
        if job_id:
            query["job_id"] = job_id
        plans = await InspectionTestPlan.find(query).to_list()
        rows = []
        for p in plans:
            holds = [x for x in p.points if x.intervention == InterventionType.HOLD]
            rows.append({
                **p.model_dump(exclude={"id"}),
                "point_count": len(p.points),
                "hold_point_count": len(holds),
                "witness_point_count": sum(
                    1 for x in p.points if x.intervention == InterventionType.WITNESS
                ),
            })
        return {"total": len(rows), "data": rows}

    @staticmethod
    async def approve(itp_id: str, site_id: str, user_id: str) -> dict:
        """Agree the plan with the client. After this the points are fixed:
        an ITP is a contractual document and changing one silently changes
        what both parties agreed to inspect."""
        plan = await ITPService.get(itp_id, site_id)
        if plan.status == ITPStatus.APPROVED:
            raise HTTPException(409, f"{itp_id} is already approved")
        if not plan.points:
            raise HTTPException(400, "An ITP with no points approves nothing")
        if plan.extracted_from_document and not plan.extraction_confirmed_by:
            raise HTTPException(
                409,
                f"These points were read out of {plan.extracted_from_document} "
                f"and nobody has confirmed them against it. Approving an "
                f"extraction unread makes the machine's reading the "
                f"contractual one.",
            )
        plan.status = ITPStatus.APPROVED.value
        plan.approved_by = user_id
        plan.approved_on = datetime.now()
        plan.updated_at = datetime.now()
        await plan.save()
        await audit.record(
            "itp", itp_id, AuditAction.AUTHORIZE,
            actor={"user_id": user_id}, site_id=site_id,
            note=f"{plan.revision} approved",
            context={"points": len(plan.points)},
        )
        return plan.model_dump(exclude={"id"})

    @staticmethod
    async def confirm_extraction(itp_id: str, site_id: str, user_id: str) -> dict:
        """A person has read the extracted points and stands behind them."""
        plan = await ITPService.get(itp_id, site_id)
        if not plan.extracted_from_document:
            raise HTTPException(400, "These points were not extracted")
        plan.extraction_confirmed_by = user_id
        plan.updated_at = datetime.now()
        await plan.save()
        return plan.model_dump(exclude={"id"})

    # --------------------------------------------------------------- calls

    @staticmethod
    async def raise_call(data: dict, site_id: str, user_id: str) -> dict:
        """The contractor gives notice that work is reaching a point."""
        itp_id = (data.get("itp_id") or "").strip()
        point_id = (data.get("point_id") or "").strip()
        requested = data.get("requested_date")
        if not (itp_id and point_id and requested):
            raise HTTPException(
                400, "A call needs the ITP, the point and the requested date"
            )
        if isinstance(requested, str):
            requested = datetime.fromisoformat(requested)

        plan = await ITPService.get(itp_id, site_id)
        if plan.status != ITPStatus.APPROVED:
            raise HTTPException(
                409,
                f"{itp_id} is {plan.status.lower()}. Calls are raised against "
                f"an approved plan — against a draft, nobody has agreed what "
                f"the point requires.",
            )
        point = next((p for p in plan.points if p.point_id == point_id), None)
        if point is None:
            raise HTTPException(404, f"Point {point_id} is not in {itp_id}")

        required = notice_required(point)
        given = (requested - datetime.now()).total_seconds() / 86400
        short = given < required

        call = InspectionCall(
            call_id=await next_identifier(
                InspectionCall, "call_id", site_id, "ICN"
            ),
            site_id=site_id,
            itp_id=itp_id,
            point_id=point_id,
            job_id=plan.job_id,
            work_package_id=data.get("work_package_id"),
            intervention=point.intervention,
            activity=point.activity,
            discipline=point.discipline,
            raised_by=data.get("raised_by"),
            requested_date=requested,
            location=data.get("location"),
            notice_given_days=round(given, 2),
            notice_required_days=required,
            # Recorded, not refused. A contractor who cannot raise a short
            # -notice call raises none and carries on without inspection,
            # which is worse than an attended one with the shortfall on file.
            short_notice=short,
            created_by=user_id,
        )
        await call.insert()
        await audit.record(
            "inspection_call", call.call_id, AuditAction.CREATE,
            actor={"user_id": user_id}, site_id=site_id,
            note=f"{point.intervention} point {point_id}: {point.activity}",
            context={
                "itp_id": itp_id, "job_id": plan.job_id,
                "notice_given_days": call.notice_given_days,
                "notice_required_days": required,
                "short_notice": short,
            },
        )
        return {
            **call.model_dump(exclude={"id"}),
            "warning": (
                f"{given:.1f} days' notice against {required} required."
                if short else None
            ),
        }

    @staticmethod
    async def get_call(call_id: str, site_id: str = "SITE-01") -> InspectionCall:
        call = await InspectionCall.find_one(
            InspectionCall.call_id == call_id, InspectionCall.site_id == site_id
        )
        if not call:
            raise HTTPException(404, f"Call {call_id} not found")
        return call

    @staticmethod
    async def list_calls(
        site_id: str = "SITE-01", status: str = "", job_id: str = "",
        open_only: bool = False,
    ) -> dict:
        query: dict[str, Any] = {"site_id": site_id}
        if status:
            query["status"] = status
        if job_id:
            query["job_id"] = job_id
        calls = await InspectionCall.find(query).sort(
            InspectionCall.requested_date
        ).to_list()
        rows = [c for c in calls
                if not open_only or c.status in OPEN_CALL_STATUSES]
        now = datetime.now()
        return {
            "total": len(rows),
            "data": [
                {
                    **c.model_dump(exclude={"id"}),
                    "days_until": round(
                        (c.requested_date - now).total_seconds() / 86400, 1
                    ),
                    "blocks_progress": (
                        c.intervention in BLOCKS_PROGRESS
                        and c.status in OPEN_CALL_STATUSES
                    ),
                }
                for c in rows
            ],
        }

    @staticmethod
    async def assign(call_id: str, person_id: str, site_id: str, user_id: str) -> dict:
        call = await ITPService.get_call(call_id, site_id)
        if call.status not in OPEN_CALL_STATUSES:
            raise HTTPException(
                409, f"{call_id} is {call.status.lower()} and needs no inspector"
            )
        call.assigned_person_id = person_id
        call.assigned_on = datetime.now()
        call.status = CallStatus.CONFIRMED.value
        call.updated_at = datetime.now()

        # An inspector already has one place they look for work, and that is
        # the visit list. A confirmed call that only existed here would be a
        # second inbox, and the second inbox is the one nobody opens - so
        # confirming a call puts a real visit in front of the inspector and
        # keeps the reference on both sides.
        if not call.visit_id:
            visit_id, problem = await ITPService._raise_visit(call, site_id, user_id)
            call.visit_id = visit_id
        else:
            problem = None

        await call.save()
        await audit.record(
            "inspection_call", call_id, AuditAction.ASSIGN,
            actor={"user_id": user_id}, site_id=site_id,
            context={"person_id": person_id, "requested_date": str(call.requested_date),
                     "visit_id": call.visit_id},
        )
        out = call.model_dump(exclude={"id"})
        # Said out loud rather than swallowed: the call is assigned either way,
        # but if no visit was raised the inspector will not see it where they
        # look, and the coordinator needs to know that now.
        out["visit_warning"] = problem
        return out

    @staticmethod
    async def _raise_visit(call, site_id: str, user_id: str) -> tuple[Optional[str], Optional[str]]:
        """Put a confirmed call on the inspector's visit list.

        Returns the visit reference and, if one could not be raised, why. A
        failure here must not lose the assignment, which is the decision the
        coordinator actually made.
        """
        from modules.people.service import PeopleService
        from modules.visits.service import VisitService

        try:
            inspector_name = None
            try:
                person = await PeopleService.get(call.assigned_person_id, site_id)
                inspector_name = (
                    person.get("full_name") if isinstance(person, dict)
                    else getattr(person, "full_name", None)
                )
            except Exception:
                # A missing name is cosmetic; the id is what links the record.
                pass

            visit = await VisitService.create(
                {
                    "job_id": call.job_id,
                    "inspector_id": call.assigned_person_id,
                    "inspector_name": inspector_name,
                    "scheduled_start_date": call.requested_date,
                    "planned_date": call.requested_date,
                    "rfi_date": call.raised_on,
                    "visit_type": (
                        "Hold Point" if call.intervention in BLOCKS_PROGRESS
                        else "Witness Point"
                    ),
                    "inspection_scope": f"{call.itp_id} point {call.point_id}: {call.activity}",
                    "plant_location": call.location,
                    "comments": (
                        f"Raised against {call.itp_id} point {call.point_id} "
                        f"({call.call_id})."
                        + (" Short notice: " + str(call.notice_given_days)
                           + f" days given against {call.notice_required_days} required."
                           if call.short_notice else "")
                    ),
                },
                site_id, user_id,
            )
            visit_id = (
                visit.get("visit_id") if isinstance(visit, dict)
                else getattr(visit, "visit_id", None)
            )
            if not visit_id:
                return None, (
                    "The assignment is recorded, but no visit reference came "
                    "back, so check the visit list before relying on it."
                )
            return visit_id, None
        except Exception as e:  # noqa: BLE001 - reported, not swallowed
            logger.warning(
                "Could not raise a visit for %s: %s", call.call_id, e
            )
            return None, (
                f"{call.assigned_person_id} is assigned to {call.call_id}, but "
                f"a visit could not be raised ({e}), so this will not appear on "
                f"their visit list. Schedule the visit by hand."
            )

    @staticmethod
    async def record_attendance(
        call_id: str, payload: dict, site_id: str, user_id: str
    ) -> dict:
        """The inspection happened. Its outcome is what releases the point."""
        call = await ITPService.get_call(call_id, site_id)
        outcome = (payload.get("outcome") or "").upper()
        if outcome not in VALID_OUTCOMES:
            raise HTTPException(
                400, f"outcome must be one of: {', '.join(sorted(VALID_OUTCOMES))}"
            )
        note = (payload.get("outcome_note") or "").strip()
        if outcome != CallOutcome.ACCEPTED and not note:
            raise HTTPException(
                400,
                "Anything other than a clean acceptance needs a note saying "
                "what was found. It is what the contractor acts on.",
            )

        call.status = CallStatus.ATTENDED.value
        call.attended_on = payload.get("attended_on") or datetime.now()
        call.outcome = outcome
        call.outcome_note = note or None
        call.visit_id = payload.get("visit_id")
        call.ncr_refs = list(payload.get("ncr_refs") or [])
        call.updated_at = datetime.now()
        await call.save()

        await audit.record(
            "inspection_call", call_id, AuditAction.STATUS_CHANGE,
            actor={"user_id": user_id}, site_id=site_id, note=note or outcome,
            context={"outcome": outcome, "intervention": call.intervention,
                     "ncr_refs": call.ncr_refs},
        )
        return call.model_dump(exclude={"id"})

    @staticmethod
    async def waive(call_id: str, payload: dict, site_id: str, user_id: str) -> dict:
        """Release a point without attending.

        A hold point is the client's, not IQE's. Letting the inspection body
        wave its own hold point turns it into a reminder, so the client's
        authority is required and recorded.
        """
        call = await ITPService.get_call(call_id, site_id)
        reason = (payload.get("reason") or "").strip()
        authority = (payload.get("waiver_authority") or "").strip()
        waived_by = (payload.get("waived_by") or "").strip()

        if not reason:
            raise HTTPException(400, "A waiver needs a reason")

        if call.intervention in BLOCKS_PROGRESS:
            if not (authority and waived_by):
                raise HTTPException(
                    409,
                    f"{call_id} is a hold point. Only the client can release "
                    f"one, so this needs who authorised it and their written "
                    f"reference. IQE waiving its own hold point would make it "
                    f"a reminder rather than a hold point.",
                )

        call.status = CallStatus.WAIVED.value
        call.waived_by = waived_by or user_id
        call.waiver_authority = authority or None
        call.waiver_reason = reason
        call.waived_on = datetime.now()
        call.updated_at = datetime.now()
        await call.save()

        await audit.record(
            "inspection_call", call_id, AuditAction.AUTHORIZE,
            actor={"user_id": user_id}, site_id=site_id, note=reason,
            context={"intervention": call.intervention, "waived_by": call.waived_by,
                     "waiver_authority": call.waiver_authority},
        )
        return call.model_dump(exclude={"id"})

    @staticmethod
    async def decline(call_id: str, payload: dict, site_id: str, user_id: str) -> dict:
        """IQE will not attend. Available for a witness point, refused for a
        hold point — which is the whole difference between them."""
        call = await ITPService.get_call(call_id, site_id)
        reason = (payload.get("reason") or "").strip()
        if not reason:
            raise HTTPException(400, "Declining needs a reason")
        if call.intervention in BLOCKS_PROGRESS:
            raise HTTPException(
                409,
                f"{call_id} is a hold point: work cannot proceed without it, "
                f"so IQE cannot simply decline. Either attend it, or have the "
                f"client waive it.",
            )
        call.status = CallStatus.DECLINED.value
        call.declined_reason = reason
        call.updated_at = datetime.now()
        await call.save()
        await audit.record(
            "inspection_call", call_id, AuditAction.STATUS_CHANGE,
            actor={"user_id": user_id}, site_id=site_id, note=reason,
            context={"intervention": call.intervention},
        )
        return call.model_dump(exclude={"id"})

    # ---------------------------------------------------------- automation

    @staticmethod
    async def sweep_missed(site_id: str = "SITE-01") -> dict:
        """Mark calls whose date has passed with nobody there.

        Run on a schedule or on opening the screen. A hold point that quietly
        lapses is the failure this whole module exists to prevent: the work
        proceeded past a point that was supposed to stop it, and nobody
        noticed until the certificate was questioned.
        """
        now = datetime.now()
        calls = await InspectionCall.find(InspectionCall.site_id == site_id).to_list()
        missed, blocking = [], []
        for c in calls:
            if c.status not in OPEN_CALL_STATUSES:
                continue
            if c.requested_date >= now:
                continue
            c.status = CallStatus.MISSED.value
            c.updated_at = now
            await c.save()
            row = {
                "call_id": c.call_id, "job_id": c.job_id,
                "work_package_id": c.work_package_id,
                "intervention": c.intervention, "activity": c.activity,
                "requested_date": c.requested_date,
                "days_overdue": round((now - c.requested_date).total_seconds() / 86400, 1),
            }
            missed.append(row)
            if c.intervention in BLOCKS_PROGRESS:
                blocking.append(row)
            await audit.record(
                "inspection_call", c.call_id, AuditAction.STATUS_CHANGE,
                site_id=site_id,
                note="Requested date passed with no attendance and no waiver",
                context={"intervention": c.intervention,
                         "blocks_progress": c.intervention in BLOCKS_PROGRESS},
            )
        return {
            "missed": missed,
            "blocking_progress": blocking,
            "note": (
                f"{len(blocking)} missed hold point"
                f"{'' if len(blocking) == 1 else 's'}. Work past "
                f"{'it' if len(blocking) == 1 else 'these'} is not covered by "
                f"an IQE inspection and cannot be certified until that is "
                f"resolved."
            ) if blocking else "No hold points were missed.",
        }

    @staticmethod
    async def forecast(site_id: str = "SITE-01", days: int = 14) -> dict:
        """Demand against capacity, by discipline.

        This is what the plan is worth as data rather than as a PDF: the ITP
        already says what is coming, so the only question is whether there is
        anyone authorised to meet it. Answering it a fortnight out is the
        difference between hiring and apologising.
        """
        from modules.people.service import PeopleService

        now = datetime.now()
        horizon = now + timedelta(days=days)
        calls = await InspectionCall.find(InspectionCall.site_id == site_id).to_list()
        upcoming = [
            c for c in calls
            if c.status in OPEN_CALL_STATUSES
            and now <= c.requested_date <= horizon
            and c.intervention in REQUIRES_ATTENDANCE
        ]

        by_discipline: dict[str, dict] = {}
        for c in upcoming:
            key = c.discipline or "Unspecified"
            row = by_discipline.setdefault(
                key, {"calls": 0, "hold_points": 0, "unassigned": 0}
            )
            row["calls"] += 1
            if c.intervention in BLOCKS_PROGRESS:
                row["hold_points"] += 1
            if not c.assigned_person_id:
                row["unassigned"] += 1

        try:
            pool = await PeopleService.deployable_pool(site_id)
            people = pool.get("data", pool) if isinstance(pool, dict) else pool
            available = len(people or [])
        except Exception:
            available = None

        unassigned = sum(r["unassigned"] for r in by_discipline.values())
        pressure = (
            None if not available
            else round(unassigned / available, 2)
        )

        return {
            "horizon_days": days,
            "calls_due": len(upcoming),
            "hold_points_due": sum(
                1 for c in upcoming if c.intervention in BLOCKS_PROGRESS
            ),
            "unassigned": unassigned,
            "deployable_people": available,
            "calls_per_person": pressure,
            "by_discipline": by_discipline,
            "note": (
                "Counts open calls needing attendance. Hold points are shown "
                "separately because a missed one stops the contractor's work, "
                "while a missed witness point only costs IQE the attendance."
                + (
                    f" {unassigned} of them have nobody assigned against "
                    f"{available} deployable people."
                    if available is not None else
                    " The deployable pool could not be read, so there is no "
                    "capacity figure to compare against."
                )
            ),
        }

    @staticmethod
    async def suggest_inspector(call_id: str, site_id: str = "SITE-01") -> dict:
        """Who could take this call.

        Delegates to the assignment engine rather than ranking people here, so
        a suggestion cannot propose someone an actual assignment would refuse.
        A second, laxer gate is how a client's project manager ends up
        suggested as an IQE inspector.
        """
        call = await ITPService.get_call(call_id, site_id)
        if not call.work_package_id:
            return {
                "call_id": call_id,
                "candidates": [],
                "note": (
                    "This call is not linked to a work package, and competence "
                    "is checked against the work type the package carries. "
                    "Without one there is no requirement to check against, and "
                    "guessing would be worse than declining to."
                ),
            }

        from modules.assignments.service import AssignmentService

        try:
            result = await AssignmentService.recommend(
                call.work_package_id, site_id=site_id, top_n=5
            )
        except HTTPException as e:
            return {"call_id": call_id, "candidates": [], "note": e.detail}

        return {
            "call_id": call_id,
            "work_package_id": call.work_package_id,
            "candidates": result.get("recommendations", result.get("data", [])),
            "excluded": result.get("excluded", []),
            "note": (
                "Ranked by the same engine that gates a real assignment: "
                "competence, authorisation validity, impartiality and calendar "
                "clash are preconditions, not weighted factors."
            ),
        }
