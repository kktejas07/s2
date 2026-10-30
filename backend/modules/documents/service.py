from fastapi import HTTPException
from modules.documents.models import Document
from datetime import datetime

class DocumentService:
    @staticmethod
    async def list(site_id: str, category: str = "", page: int = 1, per_page: int = 25):
        query = {"site_id": site_id}
        if category: query["category"] = category
        total = await Document.find(query).count()
        items = await Document.find(query).sort(-Document.created_at).skip((page - 1) * per_page).limit(per_page).to_list()
        return {"total": total, "page": page, "per_page": per_page, "data": [d.dict() for d in items]}

    @staticmethod
    async def create(data: dict, site_id: str, user_id: str):
        data["site_id"] = site_id; data["created_by"] = user_id
        doc = Document(**data); await doc.insert(); return doc
