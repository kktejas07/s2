from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException

from core.audit import AuditAction, record as audit
from core.sequences import next_identifier
from modules.people.models import (
    Authorization,
    AuthorizationStatus,
    CompetenceProfile,
    EngagementType,
    ImpartialityDeclaration,
    Person,
    PersonCategory,
    Qualification,
    evaluate_deployability,
)

VALID_CATEGORIES = {c.value for c in PersonCategory}
VALID_ENGAGEMENTS = {e.value for e in EngagementType}
VALID_AUTH_STATUSES = {s.value for s in AuthorizationStatus}


async def _next_id(model, site_id: str, prefix: str, field: str, width: int = 4) -> str:
    """PREFIX-YYYY-NNNN, allocated atomically. See core/sequences.py."""
    return await next_identifier(
        model, field, site_id, prefix, width=width, kind=f"people:{prefix}"
    )


async def _next_person_id(site_id: str) -> str:
    """EMP-NNNNN, not year-scoped - a person outlives a calendar year.

    Allocated atomically. See core/sequences.py.
    """
    return await next_identifier(
        Person, "person_id", site_id, "EMP",
        year_scoped=False, width=5, kind="person",
    )


class PeopleService:

    # -------------------------------------------------------------- people

    @staticmethod
    async def list(
        site_id: str = "SITE-01",
        category: str = "",
        employment_status: str = "",
        deployable: Optional[bool] = None,
        discipline: str = "",
        search: str = "",
        page: int = 1,
        per_page: int = 100,
    ):
        query: dict = {"site_id": site_id}
        if category:
            query["category"] = category
        if employment_status:
            query["employment_status"] = employment_status
        if deployable is not None:
            query["deployable"] = deployable
        if discipline:
            query["prof_qualification"] = {"$regex": discipline, "$options": "i"}
        if search:
            query["$or"] = [
                {"person_id": {"$regex": search, "$options": "i"}},
                {"full_name": {"$regex": search, "$options": "i"}},
                {"employee_code": {"$regex": search, "$options": "i"}},
                {"inspector_code": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"city_name": {"$regex": search, "$options": "i"}},
            ]

        total = await Person.find(query).count()
        items = (
            await Person.find(query).sort(Person.full_name)
            .skip((page - 1) * per_page).limit(per_page).to_list()
        )
        return {
            "total": total, "page": page, "per_page": per_page,
            "data": [i.model_dump(exclude={"id"}) for i in items],
        }

    @staticmethod
    async def get(person_id: str, site_id: str = "SITE-01") -> Person:
        p = await Person.find_one(Person.person_id == person_id, Person.site_id == site_id)
        if not p:
            raise HTTPException(404, f"Person '{person_id}' not found")
        return p

    @staticmethod
    async def create(data: dict, site_id: str = "SITE-01", user_id: str = "USR-001"):
        if not (data.get("full_name") or "").strip():
            raise HTTPException(400, "full_name is required")
        cat = data.get("category")
        if cat and cat not in VALID_CATEGORIES:
            raise HTTPException(400, f"Invalid category '{cat}'. Expected one of: {sorted(VALID_CATEGORIES)}")
        eng = data.get("engagement_type")
        if eng and eng not in VALID_ENGAGEMENTS:
            raise HTTPException(400, f"Invalid engagement_type '{eng}'. Expected one of: {sorted(VALID_ENGAGEMENTS)}")

        data["site_id"] = site_id
        data["created_by"] = user_id
        data["person_id"] = data.get("person_id") or await _next_person_id(site_id)
        # deployable is derived, never accepted from the caller
        data.pop("deployable", None)
        data.pop("deployability_reason", None)

        person = Person(**data)
        await person.insert()
        return person

    @staticmethod
    async def update(person_id: str, data: dict, site_id: str = "SITE-01"):
        person = await PeopleService.get(person_id, site_id)
        for immutable in ("person_id", "site_id", "created_by", "created_at",
                          "deployable", "deployability_reason", "id"):
            data.pop(immutable, None)
        for k, v in data.items():
            if hasattr(person, k):
                setattr(person, k, v)
        person.updated_at = datetime.now()
        await person.save()
        await PeopleService.refresh_deployability(person_id, site_id)
        return await PeopleService.get(person_id, site_id)

    # ------------------------------------------------------- deployability

    @staticmethod
    async def refresh_deployability(person_id: str, site_id: str = "SITE-01"):
        """Recompute and store the derived deployable flag.

        Run on authorization change, qualification edit, employment-status
        change, and on a nightly sweep for expiries.
        """
        person = await PeopleService.get(person_id, site_id)

        auth = await Authorization.find_one(
            Authorization.person_id == person_id,
            Authorization.site_id == site_id,
            Authorization.status == AuthorizationStatus.AUTHORIZED.value,
        )
        profile = await CompetenceProfile.find_one(
            CompetenceProfile.person_id == person_id, CompetenceProfile.site_id == site_id
        )

        ok, reason = evaluate_deployability(
            person.employment_status,
            auth.model_dump() if auth else None,
            [q.model_dump() for q in profile.qualifications] if profile else [],
        )
        person.deployable = ok
        person.deployability_reason = reason
        person.updated_at = datetime.now()
        await person.save()
        return {"person_id": person_id, "deployable": ok, "reason": reason}

    @staticmethod
    async def deployable_pool(
        site_id: str = "SITE-01",
        inspection_type: str = "",
        discipline: str = "",
    ):
        """The assignment pool. Only people who pass the authorization gate."""
        people = await Person.find(
            Person.site_id == site_id, Person.deployable == True  # noqa: E712
        ).to_list()

        out = []
        for p in people:
            auth = await Authorization.find_one(
                Authorization.person_id == p.person_id,
                Authorization.status == AuthorizationStatus.AUTHORIZED.value,
            Authorization.site_id == site_id,
        )
            if inspection_type and (not auth or inspection_type not in auth.inspection_types):
                continue
            if discipline and discipline.lower() not in (p.prof_qualification or "").lower():
                continue
            out.append({
                "person_id": p.person_id,
                "full_name": p.full_name,
                "category": p.category,
                "engagement_type": p.engagement_type,
                "base_location": p.base_location or p.city_name,
                "inspector_code": p.inspector_code,
                "discipline": p.prof_qualification,
                "authorization_id": auth.authorization_id if auth else None,
                "inspection_types": auth.inspection_types if auth else [],
                "authorization_valid_until": auth.valid_until if auth else None,
            })
        return {"total": len(out), "data": out}

    @staticmethod
    async def expiring(site_id: str = "SITE-01", days: int = 60):
        """Certifications and authorizations lapsing soon.

        A lapsed certificate found during an accreditation audit is a finding;
        found 60 days early it is a calendar reminder.
        """
        horizon = datetime.now() + timedelta(days=days)
        now = datetime.now()
        items = []

        for prof in await CompetenceProfile.find(CompetenceProfile.site_id == site_id).to_list():
            for q in prof.qualifications:
                if q.expires_on and now <= q.expires_on <= horizon:
                    items.append({
                        "kind": "qualification",
                        "person_id": prof.person_id,
                        "name": q.name,
                        "expires_on": q.expires_on,
                        "days_remaining": (q.expires_on - now).days,
                    })

        for auth in await Authorization.find(
            Authorization.site_id == site_id,
            Authorization.status == AuthorizationStatus.AUTHORIZED.value,
        ).to_list():
            if auth.valid_until and now <= auth.valid_until <= horizon:
                items.append({
                    "kind": "authorization",
                    "person_id": auth.person_id,
                    "name": ", ".join(auth.inspection_types) or "Authorization",
                    "expires_on": auth.valid_until,
                    "days_remaining": (auth.valid_until - now).days,
                })

        items.sort(key=lambda i: i["days_remaining"])
        return {"horizon_days": days, "total": len(items), "data": items}

    # ------------------------------------------------------ authorizations

    @staticmethod
    async def list_authorizations(person_id: str, site_id: str = "SITE-01"):
        auths = await Authorization.find(
            Authorization.person_id == person_id, Authorization.site_id == site_id
        ).sort(-Authorization.created_at).to_list()
        return {"total": len(auths), "data": [a.model_dump(exclude={"id"}) for a in auths]}

    @staticmethod
    async def create_authorization(
        person_id: str, data: dict, site_id: str = "SITE-01", user_id: str = "USR-001"
    ):
        await PeopleService.get(person_id, site_id)
        data["person_id"] = person_id
        data["site_id"] = site_id
        data["authorization_id"] = data.get("authorization_id") or await _next_id(
            Authorization, site_id, "ATH", "authorization_id"
        )
        data["status"] = AuthorizationStatus.PENDING.value
        auth = Authorization(**data)
        await auth.insert()
        return auth

    @staticmethod
    async def decide_authorization(
        authorization_id: str,
        status: str,
        site_id: str = "SITE-01",
        authorized_by: str = "USR-001",
        reason: Optional[str] = None,
    ):
        if status not in VALID_AUTH_STATUSES:
            raise HTTPException(400, f"Invalid status '{status}'. Expected one of: {sorted(VALID_AUTH_STATUSES)}")

        auth = await Authorization.find_one(
            Authorization.authorization_id == authorization_id, Authorization.site_id == site_id
        )
        if not auth:
            raise HTTPException(404, f"Authorization '{authorization_id}' not found")

        if status == AuthorizationStatus.AUTHORIZED.value:
            missing = []
            if not auth.qualification_verified:
                missing.append("qualifications not verified")
            if not auth.training_completed:
                missing.append("training not completed")
            if auth.supervised_inspections_count < auth.supervised_required:
                missing.append(
                    f"{auth.supervised_inspections_count} of {auth.supervised_required} "
                    "supervised inspections logged"
                )
            if not auth.witnessed_assessment_passed:
                missing.append("witnessed assessment not passed")
            if missing:
                raise HTTPException(
                    409,
                    "Cannot authorize yet: " + "; ".join(missing) + ".",
                )
            auth.authorized_by = authorized_by
            auth.authorized_on = datetime.now()
            auth.unverified_legacy_grant = False

        if status == AuthorizationStatus.SUSPENDED.value:
            auth.suspension_reason = reason

        previous = auth.status
        auth.status = status
        auth.updated_at = datetime.now()
        await auth.save()
        await PeopleService.refresh_deployability(auth.person_id, site_id)

        # Granting, suspending or withdrawing an authorization is a competence
        # decision. ISO/IEC 17020 expects it to be traceable to a named person
        # and to the evidence that supported it.
        await audit(
            "authorization", auth.authorization_id, AuditAction.AUTHORIZE,
            actor={"user_id": authorized_by},
            before={"status": previous}, after={"status": status},
            note=reason,
            context={
                "person_id": auth.person_id,
                "inspection_types": list(auth.inspection_types or []),
                "qualification_verified": auth.qualification_verified,
                "training_completed": auth.training_completed,
                "supervised": f"{auth.supervised_inspections_count}/{auth.supervised_required}",
                "witnessed_assessment_passed": auth.witnessed_assessment_passed,
                "valid_until": str(auth.valid_until) if auth.valid_until else None,
            },
            site_id=site_id,
        )
        return auth

    # ------------------------------------------------------------ profiles

    @staticmethod
    async def get_profile(person_id: str, site_id: str = "SITE-01"):
        prof = await CompetenceProfile.find_one(
            CompetenceProfile.person_id == person_id, CompetenceProfile.site_id == site_id
        )
        return prof or {"person_id": person_id, "qualifications": []}

    @staticmethod
    async def add_qualification(person_id: str, data: dict, site_id: str = "SITE-01"):
        await PeopleService.get(person_id, site_id)
        prof = await CompetenceProfile.find_one(
            CompetenceProfile.person_id == person_id, CompetenceProfile.site_id == site_id
        )
        if not prof:
            prof = CompetenceProfile(
                profile_id=await _next_id(CompetenceProfile, site_id, "CP", "profile_id"),
                person_id=person_id, site_id=site_id,
            )
            await prof.insert()
        prof.qualifications.append(Qualification(**data))
        prof.updated_at = datetime.now()
        await prof.save()
        await PeopleService.refresh_deployability(person_id, site_id)
        return prof

    @staticmethod
    async def declare_impartiality(
        person_id: str, data: dict, site_id: str = "SITE-01"
    ):
        await PeopleService.get(person_id, site_id)
        data["person_id"] = person_id
        data["site_id"] = site_id
        data["declaration_id"] = data.get("declaration_id") or await _next_id(
            ImpartialityDeclaration, site_id, "IMP", "declaration_id"
        )
        decl = ImpartialityDeclaration(**data)
        await decl.insert()
        return decl

    @staticmethod
    async def has_conflict(
        person_id: str, client_id: Optional[str], manufacturer_id: Optional[str],
        site_id: str = "SITE-01",
    ) -> bool:
        decl = await ImpartialityDeclaration.find_one(
            ImpartialityDeclaration.person_id == person_id,
            ImpartialityDeclaration.site_id == site_id,
        )
        if not decl:
            return False
        if client_id and client_id in decl.conflicted_client_ids:
            return True
        if manufacturer_id and manufacturer_id in decl.conflicted_manufacturer_ids:
            return True
        return False

    @staticmethod
    async def options():
        return {
            "categories": sorted(VALID_CATEGORIES),
            "engagement_types": sorted(VALID_ENGAGEMENTS),
            "authorization_statuses": sorted(VALID_AUTH_STATUSES),
        }

    @staticmethod
    async def summary(site_id: str = "SITE-01"):
        people = await Person.find(Person.site_id == site_id).to_list()
        by_category: dict[str, int] = {}
        by_status: dict[str, int] = {}
        for p in people:
            by_category[p.category] = by_category.get(p.category, 0) + 1
            by_status[p.employment_status] = by_status.get(p.employment_status, 0) + 1

        deployable = len([p for p in people if p.deployable])
        pending = await Authorization.find(
            Authorization.site_id == site_id,
            Authorization.status == AuthorizationStatus.PENDING.value,
        ).count()
        legacy_unverified = await Authorization.find(
            Authorization.site_id == site_id,
            Authorization.unverified_legacy_grant == True,  # noqa: E712
        ).count()
        expiring = await PeopleService.expiring(site_id, 60)

        return {
            "total": len(people),
            "deployable": deployable,
            "not_deployable": len(people) - deployable,
            "by_category": by_category,
            "by_employment_status": by_status,
            "authorizations_pending": pending,
            "unverified_legacy_grants": legacy_unverified,
            "expiring_within_60_days": expiring["total"],
        }
