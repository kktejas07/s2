from __future__ import annotations
from typing import Optional
from datetime import datetime
from fastapi import HTTPException
from core.audit import AuditAction, record as audit
from core.sequences import next_identifier
from modules.win_loss.models import WinLossRecord


class WinLossService:

    @staticmethod
    async def create(data: dict, site_id: str, user_id: str):
        record_id = await next_identifier(WinLossRecord, "record_id", site_id, "WL")
        record = WinLossRecord(
            record_id=record_id,
            site_id=site_id,
            enquiry_id=data["enquiry_id"],
            client_id=data.get("client_id"),
            client_name=data.get("client_name"),
            outcome=data["outcome"],
            outcome_date=data.get("outcome_date", datetime.now()),
            j_no=data.get("j_no"),
            award_value=data.get("award_value", 0),
            competitor_name=data.get("competitor_name"),
            lost_reason_codes=data.get("lost_reason_codes", []),
            price_gap_pct=data.get("price_gap_pct"),
            no_go_reason_codes=data.get("no_go_reason_codes", []),
            service_line=data.get("service_line"),
            region_code=data.get("region_code"),
            sector=data.get("sector"),
            proposal_value=data.get("proposal_value", 0),
            margin_pct=data.get("margin_pct", 0),
            cycle_days=data.get("cycle_days", 0),
            notes=data.get("notes"),
            created_by=user_id,
        )
        await record.insert()
        await audit(AuditAction.CREATE, "win_loss", record_id, user_id, site_id)
        return record.dict()

    @staticmethod
    async def list(
        site_id: str,
        outcome: Optional[str] = None,
        region_code: Optional[str] = None,
        client_id: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        page: int = 1,
        per_page: int = 50,
    ):
        query: dict = {"site_id": site_id}
        if outcome:
            query["outcome"] = outcome
        if region_code:
            query["region_code"] = region_code
        if client_id:
            query["client_id"] = client_id
        if date_from or date_to:
            date_q: dict = {}
            if date_from:
                date_q["$gte"] = datetime.fromisoformat(date_from)
            if date_to:
                date_q["$lte"] = datetime.fromisoformat(date_to)
            query["outcome_date"] = date_q

        total = await WinLossRecord.find(query).count()
        items = (
            await WinLossRecord.find(query)
            .sort(-WinLossRecord.created_at)
            .skip((page - 1) * per_page)
            .limit(per_page)
            .to_list()
        )
        return {"total": total, "items": [i.dict() for i in items]}

    @staticmethod
    async def get(record_id: str, site_id: str):
        r = await WinLossRecord.find_one({"record_id": record_id, "site_id": site_id})
        if not r:
            raise HTTPException(status_code=404, detail="Win-Loss record not found")
        return r.dict()

    @staticmethod
    async def summary(site_id: str, region_code: Optional[str] = None):
        query: dict = {"site_id": site_id}
        if region_code:
            query["region_code"] = region_code

        all_records = await WinLossRecord.find(query).to_list()
        if not all_records:
            return {"total": 0, "win_rate": 0, "avg_cycle_days": 0, "top_loss_reasons": [], "top_competitors": []}

        total = len(all_records)
        won = [r for r in all_records if r.outcome == "won"]
        lost = [r for r in all_records if r.outcome == "lost"]
        win_rate = round(len(won) / total * 100, 1) if total else 0
        avg_cycle = round(sum(r.cycle_days for r in all_records) / total, 1) if total else 0
        total_award = sum(r.award_value for r in won)
        total_proposal = sum(r.proposal_value for r in all_records)

        # Top loss reasons
        reason_counts: dict[str, int] = {}
        for r in lost:
            for code in r.lost_reason_codes:
                reason_counts[code] = reason_counts.get(code, 0) + 1
        top_loss = sorted(reason_counts.items(), key=lambda x: -x[1])[:10]

        # Top competitors
        comp_counts: dict[str, int] = {}
        for r in lost:
            if r.competitor_name:
                comp_counts[r.competitor_name] = comp_counts.get(r.competitor_name, 0) + 1
        top_comp = sorted(comp_counts.items(), key=lambda x: -x[1])[:10]

        return {
            "total": total,
            "won": len(won),
            "lost": len(lost),
            "no_go": len([r for r in all_records if r.outcome == "no_go"]),
            "win_rate": win_rate,
            "avg_cycle_days": avg_cycle,
            "total_award_value": total_award,
            "total_proposal_value": total_proposal,
            "top_loss_reasons": [{"code": c, "count": n} for c, n in top_loss],
            "top_competitors": [{"name": c, "count": n} for c, n in top_comp],
        }

    @staticmethod
    async def by_region(site_id: str):
        all_records = await WinLossRecord.find({"site_id": site_id}).to_list()
        regions: dict[str, dict] = {}
        for r in all_records:
            rc = r.region_code or "unknown"
            if rc not in regions:
                regions[rc] = {"region": rc, "total": 0, "won": 0, "lost": 0, "no_go": 0, "award_value": 0}
            regions[rc]["total"] += 1
            if r.outcome == "won":
                regions[rc]["won"] += 1
                regions[rc]["award_value"] += r.award_value
            elif r.outcome == "lost":
                regions[rc]["lost"] += 1
            elif r.outcome == "no_go":
                regions[rc]["no_go"] += 1
        for v in regions.values():
            v["win_rate"] = round(v["won"] / v["total"] * 100, 1) if v["total"] else 0
        return list(regions.values())

    @staticmethod
    async def by_sector(site_id: str):
        all_records = await WinLossRecord.find({"site_id": site_id}).to_list()
        sectors: dict[str, dict] = {}
        for r in all_records:
            s = r.sector or "unknown"
            if s not in sectors:
                sectors[s] = {"sector": s, "total": 0, "won": 0, "lost": 0, "award_value": 0}
            sectors[s]["total"] += 1
            if r.outcome == "won":
                sectors[s]["won"] += 1
                sectors[s]["award_value"] += r.award_value
            elif r.outcome == "lost":
                sectors[s]["lost"] += 1
        for v in sectors.values():
            v["win_rate"] = round(v["won"] / v["total"] * 100, 1) if v["total"] else 0
        return list(sectors.values())
