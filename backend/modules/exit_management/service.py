from typing import Optional
from datetime import datetime
from fastapi import HTTPException
from core.audit import AuditAction, record as audit
from modules.exit_management.models import ExitProcess, DEFAULT_EXIT_CHECKLIST


class ExitService:

    @staticmethod
    async def list_exits(site_id: str, status: Optional[str] = None, page: int = 1, per_page: int = 100):
        query: dict = {"site_id": site_id}
        if status:
            query["status"] = status
        total = await ExitProcess.find(query).count()
        items = (
            await ExitProcess.find(query)
            .skip((page - 1) * per_page).limit(per_page)
            .sort(-ExitProcess.created_at).to_list()
        )
        return {"total": total, "items": items, "page": page, "per_page": per_page}

    @staticmethod
    async def initiate_exit(data: dict, site_id: str, user_id: str):
        if "checklist" not in data or not data["checklist"]:
            data["checklist"] = [item.model_dump() for item in DEFAULT_EXIT_CHECKLIST]
        exit_proc = ExitProcess(**data, site_id=site_id, created_by=user_id, processed_by=user_id)
        await exit_proc.insert()
        await audit(AuditAction.CREATE, "exit_processes", exit_proc.exit_id, user_id, site_id)
        return exit_proc

    @staticmethod
    async def get_exit(exit_id: str, site_id: str):
        ep = await ExitProcess.find_one({"exit_id": exit_id, "site_id": site_id})
        if not ep:
            raise HTTPException(404, "Exit process not found")
        return ep

    @staticmethod
    async def update_checklist_item(exit_id: str, item_code: str, completed: bool, site_id: str, user_id: str):
        ep = await ExitProcess.find_one({"exit_id": exit_id, "site_id": site_id})
        if not ep:
            raise HTTPException(404, "Exit process not found")
        found = False
        for item in ep.checklist:
            if item.item_code == item_code:
                item.completed = completed
                item.completed_on = datetime.now() if completed else None
                item.completed_by = user_id if completed else None
                found = True
                break
        if not found:
            raise HTTPException(404, f"Checklist item {item_code} not found")
        ep.status = "in_progress"
        ep.updated_at = datetime.now()
        await ep.save()
        await audit(AuditAction.UPDATE, "exit_processes", exit_id, user_id, site_id, {"checklist_item": item_code, "completed": completed})
        return ep

    @staticmethod
    async def withdraw_authorizations(exit_id: str, site_id: str, user_id: str):
        ep = await ExitProcess.find_one({"exit_id": exit_id, "site_id": site_id})
        if not ep:
            raise HTTPException(404, "Exit process not found")

        from modules.people.models import Authorization, AuthorizationStatus
        auths = await Authorization.find({"person_id": ep.person_id, "site_id": site_id, "status": AuthorizationStatus.AUTHORIZED.value}).to_list()
        for auth_doc in auths:
            auth_doc.status = AuthorizationStatus.WITHDRAWN.value
            auth_doc.updated_at = datetime.now()
            await auth_doc.save()

        ep.authorization_withdrawn = True
        ep.updated_at = datetime.now()
        await ep.save()
        await audit(AuditAction.UPDATE, "exit_processes", exit_id, user_id, site_id, {"authorization_withdrawn": True, "auths_withdrawn": len(auths)})
        return {"exit": ep, "authorizations_withdrawn": len(auths)}

    @staticmethod
    async def calculate_settlement(exit_id: str, data: dict, site_id: str, user_id: str):
        ep = await ExitProcess.find_one({"exit_id": exit_id, "site_id": site_id})
        if not ep:
            raise HTTPException(404, "Exit process not found")
        ep.final_settlement_amount = data.get("amount", 0.0)
        ep.final_settlement_status = "calculated"
        ep.updated_at = datetime.now()
        await ep.save()
        await audit(AuditAction.UPDATE, "exit_processes", exit_id, user_id, site_id, {"settlement_status": "calculated"})
        return ep

    @staticmethod
    async def complete_exit(exit_id: str, site_id: str, user_id: str):
        ep = await ExitProcess.find_one({"exit_id": exit_id, "site_id": site_id})
        if not ep:
            raise HTTPException(404, "Exit process not found")

        incomplete = [item for item in ep.checklist if not item.completed]
        if incomplete:
            raise HTTPException(400, f"{len(incomplete)} checklist items are incomplete: {[i.item_code for i in incomplete]}")

        from modules.people.models import Person, EmploymentStatus
        person = await Person.find_one({"person_id": ep.person_id, "site_id": site_id})
        if person:
            person.employment_status = EmploymentStatus.EXITED.value
            person.exit_date = ep.last_working_date or datetime.now()
            person.exit_reason = ep.reason
            person.deployable = False
            person.deployability_reason = "Exited"
            person.updated_at = datetime.now()
            await person.save()

        ep.status = "completed"
        ep.completed_on = datetime.now()
        ep.updated_at = datetime.now()
        await ep.save()
        await audit(AuditAction.UPDATE, "exit_processes", exit_id, user_id, site_id, {"status": "completed"})
        return ep
