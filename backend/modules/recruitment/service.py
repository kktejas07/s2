from typing import Optional
from datetime import datetime
from fastapi import HTTPException
from core.audit import AuditAction, record as audit

from modules.recruitment.models import (
    ManpowerRequest, ManpowerRequestStatus,
    Candidate, CandidateStatus,
    TechnicalInterview, InterviewRecommendation,
    OfferLetter, OfferStatus,
    InductionChecklist, DEFAULT_INDUCTION_ITEMS,
)


class RecruitmentService:

    # ------------------------------------------------------------------
    # H1 + H2: Manpower requests
    # ------------------------------------------------------------------

    @staticmethod
    async def list_manpower_requests(
        site_id: str, status: Optional[str] = None, page: int = 1, per_page: int = 50,
    ):
        query: dict = {"site_id": site_id}
        if status:
            query["status"] = status
        total = await ManpowerRequest.find(query).count()
        items = (
            await ManpowerRequest.find(query)
            .skip((page - 1) * per_page)
            .limit(per_page)
            .sort(-ManpowerRequest.created_at)
            .to_list()
        )
        return {"total": total, "page": page, "per_page": per_page, "items": items}

    @staticmethod
    async def get_manpower_request(request_id: str, site_id: str):
        doc = await ManpowerRequest.find_one({"request_id": request_id, "site_id": site_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Manpower request not found")
        return doc

    @staticmethod
    async def create_manpower_request(data: dict, site_id: str, user_id: str):
        data.setdefault("site_id", site_id)
        data.setdefault("requested_by", user_id)
        data.setdefault("created_by", user_id)
        data.setdefault("status", ManpowerRequestStatus.DRAFT.value)
        doc = ManpowerRequest(**data)
        await doc.insert()
        await audit(AuditAction.CREATE, "manpower_request", doc.request_id, user_id, site_id)
        return doc

    @staticmethod
    async def approve_budget(request_id: str, site_id: str, user_id: str, remarks: Optional[str] = None):
        doc = await RecruitmentService.get_manpower_request(request_id, site_id)
        if doc.status not in (ManpowerRequestStatus.DRAFT.value, ManpowerRequestStatus.PENDING_BUDGET.value):
            raise HTTPException(status_code=400, detail=f"Cannot approve budget in status {doc.status}")
        doc.budget_approved = True
        doc.within_budget = True
        doc.approved_by = user_id
        doc.budget_remarks = remarks
        doc.status = ManpowerRequestStatus.SOURCING.value
        doc.updated_at = datetime.now()
        await doc.save()
        await audit(AuditAction.UPDATE, "manpower_request", request_id, user_id, site_id, detail="budget_approved")
        return doc

    @staticmethod
    async def reject_budget(request_id: str, site_id: str, user_id: str, remarks: Optional[str] = None):
        doc = await RecruitmentService.get_manpower_request(request_id, site_id)
        if doc.status not in (ManpowerRequestStatus.DRAFT.value, ManpowerRequestStatus.PENDING_BUDGET.value):
            raise HTTPException(status_code=400, detail=f"Cannot reject budget in status {doc.status}")
        doc.budget_approved = False
        doc.approved_by = user_id
        doc.budget_remarks = remarks
        doc.status = ManpowerRequestStatus.BUDGET_REJECTED.value
        doc.updated_at = datetime.now()
        await doc.save()
        await audit(AuditAction.UPDATE, "manpower_request", request_id, user_id, site_id, detail="budget_rejected")
        return doc

    # ------------------------------------------------------------------
    # H3: Candidates
    # ------------------------------------------------------------------

    @staticmethod
    async def list_candidates(
        site_id: str, request_id: Optional[str] = None, status: Optional[str] = None,
        search: str = "", page: int = 1, per_page: int = 50,
    ):
        query: dict = {"site_id": site_id}
        if request_id:
            query["request_id"] = request_id
        if status:
            query["status"] = status
        if search:
            query["$or"] = [
                {"full_name": {"$regex": search, "$options": "i"}},
                {"candidate_id": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"phone": {"$regex": search, "$options": "i"}},
            ]
        total = await Candidate.find(query).count()
        items = (
            await Candidate.find(query)
            .skip((page - 1) * per_page)
            .limit(per_page)
            .sort(-Candidate.created_at)
            .to_list()
        )
        return {"total": total, "page": page, "per_page": per_page, "items": items}

    @staticmethod
    async def get_candidate(candidate_id: str, site_id: str):
        doc = await Candidate.find_one({"candidate_id": candidate_id, "site_id": site_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Candidate not found")
        return doc

    @staticmethod
    async def create_candidate(data: dict, site_id: str, user_id: str):
        data.setdefault("site_id", site_id)
        data.setdefault("created_by", user_id)
        doc = Candidate(**data)
        await doc.insert()
        await audit(AuditAction.CREATE, "candidate", doc.candidate_id, user_id, site_id)
        return doc

    @staticmethod
    async def update_candidate_status(candidate_id: str, new_status: str, site_id: str, user_id: str, notes: Optional[str] = None):
        doc = await RecruitmentService.get_candidate(candidate_id, site_id)
        doc.status = new_status
        if notes:
            doc.screening_notes = notes
        doc.updated_at = datetime.now()
        await doc.save()
        await audit(AuditAction.UPDATE, "candidate", candidate_id, user_id, site_id, detail=f"status→{new_status}")
        return doc

    # ------------------------------------------------------------------
    # H4: Technical interview
    # ------------------------------------------------------------------

    @staticmethod
    async def list_interviews(
        site_id: str, candidate_id: Optional[str] = None, page: int = 1, per_page: int = 50,
    ):
        query: dict = {"site_id": site_id}
        if candidate_id:
            query["candidate_id"] = candidate_id
        total = await TechnicalInterview.find(query).count()
        items = (
            await TechnicalInterview.find(query)
            .skip((page - 1) * per_page)
            .limit(per_page)
            .sort(-TechnicalInterview.created_at)
            .to_list()
        )
        return {"total": total, "page": page, "per_page": per_page, "items": items}

    @staticmethod
    async def create_interview(data: dict, site_id: str, user_id: str):
        data.setdefault("site_id", site_id)
        data.setdefault("created_by", user_id)
        doc = TechnicalInterview(**data)
        await doc.insert()
        await audit(AuditAction.CREATE, "technical_interview", doc.interview_id, user_id, site_id)
        return doc

    @staticmethod
    async def record_interview_result(
        interview_id: str, site_id: str, user_id: str,
        recommendation: str, scores: dict, remarks: Optional[str] = None,
    ):
        doc = await TechnicalInterview.find_one({"interview_id": interview_id, "site_id": site_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Interview not found")
        doc.overall_recommendation = recommendation
        doc.technical_score = scores.get("technical_score")
        doc.domain_knowledge = scores.get("domain_knowledge")
        doc.practical_assessment = scores.get("practical_assessment")
        doc.communication = scores.get("communication")
        doc.remarks = remarks
        await doc.save()

        if recommendation == InterviewRecommendation.FIT.value:
            candidate = await Candidate.find_one({"candidate_id": doc.candidate_id, "site_id": site_id})
            if candidate:
                candidate.status = CandidateStatus.TECHNICALLY_FIT.value
                candidate.updated_at = datetime.now()
                await candidate.save()
        elif recommendation == InterviewRecommendation.NOT_FIT.value:
            candidate = await Candidate.find_one({"candidate_id": doc.candidate_id, "site_id": site_id})
            if candidate:
                candidate.status = CandidateStatus.NOT_FIT.value
                candidate.updated_at = datetime.now()
                await candidate.save()

        await audit(AuditAction.UPDATE, "technical_interview", interview_id, user_id, site_id, detail=f"result→{recommendation}")
        return doc

    # ------------------------------------------------------------------
    # H5: Offer letter
    # ------------------------------------------------------------------

    @staticmethod
    async def list_offers(
        site_id: str, candidate_id: Optional[str] = None, status: Optional[str] = None,
        page: int = 1, per_page: int = 50,
    ):
        query: dict = {"site_id": site_id}
        if candidate_id:
            query["candidate_id"] = candidate_id
        if status:
            query["status"] = status
        total = await OfferLetter.find(query).count()
        items = (
            await OfferLetter.find(query)
            .skip((page - 1) * per_page)
            .limit(per_page)
            .sort(-OfferLetter.created_at)
            .to_list()
        )
        return {"total": total, "page": page, "per_page": per_page, "items": items}

    @staticmethod
    async def create_offer(data: dict, site_id: str, user_id: str):
        data.setdefault("site_id", site_id)
        data.setdefault("created_by", user_id)
        doc = OfferLetter(**data)
        await doc.insert()
        await audit(AuditAction.CREATE, "offer_letter", doc.offer_id, user_id, site_id)
        return doc

    @staticmethod
    async def send_offer(offer_id: str, site_id: str, user_id: str):
        doc = await OfferLetter.find_one({"offer_id": offer_id, "site_id": site_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Offer not found")
        if doc.status != OfferStatus.DRAFT.value:
            raise HTTPException(status_code=400, detail=f"Cannot send offer in status {doc.status}")
        doc.status = OfferStatus.SENT.value
        doc.sent_on = datetime.now()
        doc.updated_at = datetime.now()
        await doc.save()

        candidate = await Candidate.find_one({"candidate_id": doc.candidate_id, "site_id": site_id})
        if candidate:
            candidate.status = CandidateStatus.OFFER_SENT.value
            candidate.updated_at = datetime.now()
            await candidate.save()

        await audit(AuditAction.UPDATE, "offer_letter", offer_id, user_id, site_id, detail="sent")
        return doc

    @staticmethod
    async def record_offer_response(
        offer_id: str, site_id: str, user_id: str,
        accepted: bool, decline_reason: Optional[str] = None,
    ):
        doc = await OfferLetter.find_one({"offer_id": offer_id, "site_id": site_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Offer not found")
        if doc.status != OfferStatus.SENT.value:
            raise HTTPException(status_code=400, detail=f"Cannot record response in status {doc.status}")

        doc.responded_on = datetime.now()
        doc.updated_at = datetime.now()

        candidate = await Candidate.find_one({"candidate_id": doc.candidate_id, "site_id": site_id})

        if accepted:
            doc.status = OfferStatus.ACCEPTED.value
            if candidate:
                candidate.status = CandidateStatus.OFFER_ACCEPTED.value
                candidate.updated_at = datetime.now()
                await candidate.save()
        else:
            doc.status = OfferStatus.DECLINED.value
            doc.decline_reason = decline_reason
            if candidate:
                candidate.status = CandidateStatus.OFFER_DECLINED.value
                candidate.updated_at = datetime.now()
                await candidate.save()

        await doc.save()
        await audit(AuditAction.UPDATE, "offer_letter", offer_id, user_id, site_id,
                     detail=f"response→{'accepted' if accepted else 'declined'}")
        return doc

    # ------------------------------------------------------------------
    # H6: Induction
    # ------------------------------------------------------------------

    @staticmethod
    async def get_induction(induction_id: str, site_id: str):
        doc = await InductionChecklist.find_one({"induction_id": induction_id, "site_id": site_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Induction checklist not found")
        return doc

    @staticmethod
    async def get_induction_by_person(person_id: str, site_id: str):
        doc = await InductionChecklist.find_one({"person_id": person_id, "site_id": site_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Induction checklist not found for this person")
        return doc

    @staticmethod
    async def create_induction(data: dict, site_id: str, user_id: str):
        data.setdefault("site_id", site_id)
        data.setdefault("created_by", user_id)
        if not data.get("checklist_items"):
            data["checklist_items"] = [item.model_dump() for item in DEFAULT_INDUCTION_ITEMS]
        doc = InductionChecklist(**data)
        await doc.insert()
        await audit(AuditAction.CREATE, "induction_checklist", doc.induction_id, user_id, site_id)
        return doc

    @staticmethod
    async def update_induction_item(
        induction_id: str, item_code: str, completed: bool, site_id: str, user_id: str,
    ):
        doc = await RecruitmentService.get_induction(induction_id, site_id)
        found = False
        now = datetime.now()
        for item in doc.checklist_items:
            if item.item_code == item_code:
                item.completed = completed
                item.completed_on = now if completed else None
                item.completed_by = user_id if completed else None
                found = True

                if item_code == "CONFID" and completed:
                    doc.confidentiality_signed = True
                    doc.confidentiality_signed_on = now
                elif item_code == "IMPART" and completed:
                    doc.impartiality_declared = True
                elif item_code == "SAFETY" and completed:
                    doc.safety_briefing_done = True
                elif item_code == "IT_ACCESS" and completed:
                    doc.it_access_provisioned = True
                elif item_code == "ID_CARD" and completed:
                    doc.id_card_issued = True
                break

        if not found:
            raise HTTPException(status_code=404, detail=f"Checklist item {item_code} not found")

        doc.updated_at = now
        await doc.save()
        await audit(AuditAction.UPDATE, "induction_checklist", induction_id, user_id, site_id, detail=f"item:{item_code}→{completed}")
        return doc

    @staticmethod
    async def complete_induction(induction_id: str, site_id: str, user_id: str):
        doc = await RecruitmentService.get_induction(induction_id, site_id)

        incomplete = [i for i in doc.checklist_items if not i.completed]
        if incomplete:
            codes = ", ".join(i.item_code for i in incomplete)
            raise HTTPException(status_code=400, detail=f"Incomplete items: {codes}")

        if not doc.confidentiality_signed:
            raise HTTPException(status_code=400, detail="Confidentiality declaration not signed")
        if not doc.impartiality_declared:
            raise HTTPException(status_code=400, detail="Impartiality not declared")

        now = datetime.now()
        doc.completed = True
        doc.completed_on = now
        doc.inducted_by = user_id
        doc.updated_at = now
        await doc.save()

        from modules.people.models import Person, EmploymentStatus
        person = await Person.find_one({"person_id": doc.person_id, "site_id": site_id})
        if person and person.employment_status == EmploymentStatus.ONBOARDING.value:
            person.employment_status = EmploymentStatus.ACTIVE.value
            person.updated_at = now
            await person.save()

        await audit(AuditAction.UPDATE, "induction_checklist", induction_id, user_id, site_id, detail="completed")
        return doc
