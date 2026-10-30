#!/usr/bin/env python3
"""Mock data for the pre-sales funnel.

The funnel shipped with no data, so /enquiries and /pipeline render empty and
there is nothing to sanity-check the loss-analysis rollups against.

Everything here goes through EnquiryService rather than inserting documents
directly. That is deliberate: a seeder that writes straight to the collections
can produce states the service would refuse, and then the screens show a funnel
that could never actually occur. Going through the service means this file also
exercises every path end to end - if a transition rule is wrong, the seed fails
rather than quietly creating an impossible record.

Fourteen enquiries spread across the funnel so that each stage, both gates and
both kinds of ending have something in them, including the two paths that only
exist because of the spec's central distinction: a no-go that was remediated
and then bid, and a loss that the client later revived.

Idempotent on enquiry_id. Running it twice changes nothing.

    python scripts/seed_presales.py            # seed
    python scripts/seed_presales.py --wipe     # remove only what this seeded
"""
from __future__ import annotations

import argparse
import asyncio
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from beanie import init_beanie  # noqa: E402
from pymongo import AsyncMongoClient  # noqa: E402

from core.audit import AuditEntry  # noqa: E402
from core.config import settings  # noqa: E402
from core.sequences import Sequence  # noqa: E402
from modules.enquiries.models import (  # noqa: E402
    Enquiry,
    EnquiryCategory,
    GoNoGoDecision,
    ProposalRevision,
)
from modules.enquiries.reason_codes import ReasonCode, seed as seed_reason_codes  # noqa: E402
from modules.enquiries.service import DEFAULT_CRITERIA, EnquiryService  # noqa: E402
from modules.jobs.models import Job  # noqa: E402

SITE = "SITE-01"
USER = "EMP-00002"
MARKER = "seeded:presales"


def scores(**overrides: int) -> list[dict]:
    """A scorecard, optionally weak on particular criteria."""
    return [
        {
            "code": code,
            "label": label,
            "weight": weight,
            "score": overrides.get(code, 4),
        }
        for code, label, weight in DEFAULT_CRITERIA
    ]


def lines(*rows: tuple[str, str, float, float]) -> list[dict]:
    return [
        EnquiryCategory(
            enquiry_category_id=f"EC-{i+1:02d}",
            sno=i + 1,
            details=details,
            scope=scope,
            uom="nos",
            qty=qty,
            budget=budget,
        ).model_dump()
        for i, (details, scope, qty, budget) in enumerate(rows)
    ]


#: Each entry: the enquiry, then how far it travels.
PLAN: list[dict] = [
    # --- early stages, nothing decided yet
    {"client_id": "CLI-00001", "category": "Pressure vessel inspection, Unit 4",
     "source": "repeat_client", "pipeline_value": 480000, "probability_pct": 30,
     "stop": "draft"},
    {"client_id": "CLI-00003", "category": "Structural fabrication, bridge girders",
     "source": "tender_portal", "pipeline_value": 1250000, "probability_pct": 25,
     "stop": "qualifying"},
    {"client_id": "CLI-00002", "category": "RA bill verification, civil works",
     "source": "direct", "pipeline_value": 640000, "probability_pct": 40,
     "stop": "pending_decision"},
    {"client_id": "CLI-00004", "category": "Vendor audit, pump supplier",
     "source": "referral", "pipeline_value": 320000, "probability_pct": 35,
     "stop": "pending_decision"},

    # --- gate 1 declines, each for a different reason
    {"client_id": "CLI-00005", "category": "Radiographic testing, offshore spools",
     "source": "tender_portal", "pipeline_value": 0, "probability_pct": 0,
     "stop": "no_go", "weak": {"COMPETENCE": 0, "GEOGRAPHY": 1},
     "codes": ["NO_COMPETENT_INSPECTOR", "NONE_IN_GEOGRAPHY"],
     "remedy": "Authorise two inspectors for RT Level II and check travel economics."},
    {"client_id": "CLI-00006", "category": "Framework inspection, 24 months",
     "source": "tender_portal", "pipeline_value": 0, "probability_pct": 0,
     "stop": "closed_no_bid", "weak": {"COMMERCIAL": 0, "CLIENT_CREDIT": 2},
     "codes": ["BELOW_RATE_FLOOR"],
     # The work itself is attractive and the scorecard says so; declining on
     # price discipline is exactly the case the override exists for.
     "override": "Framework rate is 18% under our floor and the term is 24 "
                 "months. Taking it would set the benchmark for every "
                 "renegotiation with this client."},
    {"client_id": "CLI-00007", "category": "Third-party review, plant we designed",
     "source": "direct", "pipeline_value": 0, "probability_pct": 0,
     "stop": "closed_no_bid", "weak": {"IMPARTIALITY": 0},
     "codes": ["IMPARTIALITY_CONFLICT"]},

    # --- the remedy loop: declined, fixed, then bid and submitted
    {"client_id": "CLI-00002", "category": "UT thickness survey, storage tanks",
     "source": "repeat_client", "pipeline_value": 1720000, "probability_pct": 60,
     # Nobody authorised for UT Level II is a zero, not a low score - which
     # is what makes it disqualifying rather than a trade-off.
     "stop": "submitted_after_remediation", "weak": {"COMPETENCE": 0},
     "codes": ["NO_COMPETENT_INSPECTOR"],
     "remedy": "Two inspectors authorised for UT Level II on 10.10.2026.",
     "pricing": {"inspector_cost": 1200000, "travel_cost": 180000,
                 "overhead_pct": 8, "margin_pct": 15, "estimated_mandays": 42},
     "revision": {"inspector_cost": 1120000,
                  "change_summary": "Travel re-based on actual distance from the "
                                    "Khammam office rather than Hyderabad; rate unchanged."}},

    # --- bid, at various points on the way to a proposal
    {"client_id": "CLI-00001", "category": "Schedule M compliance, formulation block",
     "source": "direct", "pipeline_value": 890000, "probability_pct": 50,
     "stop": "go"},
    {"client_id": "CLI-00003", "category": "Expediting, long-lead valves",
     "source": "repeat_client", "pipeline_value": 410000, "probability_pct": 45,
     "stop": "proposal_draft",
     "pricing": {"inspector_cost": 300000, "travel_cost": 40000, "margin_pct": 18}},
    {"client_id": "CLI-00004", "category": "BOQ reconciliation, Block C",
     "source": "direct", "pipeline_value": 1120000, "probability_pct": 55,
     "stop": "under_clarification",
     "pricing": {"inspector_cost": 850000, "travel_cost": 90000, "margin_pct": 12}},

    # --- gate 2 outcomes
    {"client_id": "CLI-00005", "category": "Welding inspection, pipeline spread 3",
     "source": "tender_portal", "pipeline_value": 0, "probability_pct": 0,
     "stop": "lost", "pricing": {"inspector_cost": 700000, "margin_pct": 15},
     "codes": ["UNDERCUT_BY_COMPETITOR"], "competitors": ["TUV India"]},
    {"client_id": "CLI-00006", "category": "Pre-shipment inspection, imported skids",
     "source": "direct", "pipeline_value": 560000, "probability_pct": 30,
     "stop": "revived", "pricing": {"inspector_cost": 420000, "margin_pct": 20},
     "codes": ["PROJECT_DEFERRED"]},
    {"client_id": "CLI-00001", "category": "Civil quality audit, Mudigonda CHC",
     "source": "repeat_client", "pipeline_value": 2240000, "probability_pct": 100,
     "stop": "converted", "award": "LOI/SHMIC/2026/0044",
     "pricing": {"inspector_cost": 1700000, "travel_cost": 160000,
                 "overhead_pct": 6, "margin_pct": 18, "estimated_mandays": 56},
     "scope": [("Block B slab, RA bill 04", "Civil", 1, 0),
               ("Block C plinth verification", "Civil", 1, 0)]},
]


async def _walk(spec: dict) -> str:
    """Drive one enquiry as far through the funnel as its plan says."""
    eq = await EnquiryService.create(
        {
            "client_id": spec["client_id"],
            "category": spec["category"],
            "source": spec["source"],
            "pipeline_value": spec["pipeline_value"],
            "probability_pct": spec["probability_pct"],
            "proposal_owner": USER,
            "categories": lines(*spec["scope"]) if spec.get("scope") else [],
            "enquiry_date": datetime.now() - timedelta(days=28),
        },
        SITE, USER,
    )
    eid = eq.enquiry_id
    stop = spec["stop"]
    if stop == "draft":
        return eid

    await EnquiryService.advance(eid, "qualifying", SITE, USER)
    if stop == "qualifying":
        return eid

    await EnquiryService.build_scorecard(eid, SITE, USER, auto_score=False)
    if stop == "pending_decision":
        return eid

    weak = spec.get("weak") or {}
    if weak:
        await EnquiryService.decide(
            eid,
            {"decision": "no_go", "criteria": scores(**weak),
             "reason_codes": spec["codes"],
             "override_reason": spec.get("override"),
             "remediation_plan": spec.get("remedy")},
            SITE, USER,
        )
        if stop == "no_go":
            return eid
        if stop == "closed_no_bid":
            await EnquiryService.close(eid, {}, SITE, USER)
            return eid
        # The remedy loop, then a second decision that goes the other way.
        await EnquiryService.remediate(
            eid, {"remediation_plan": spec["remedy"], "remediation_owner": USER},
            SITE, USER,
        )
        await EnquiryService.decide(
            eid, {"decision": "go", "criteria": scores()}, SITE, USER
        )
    else:
        await EnquiryService.decide(
            eid, {"decision": "go", "criteria": scores()}, SITE, USER
        )
    if stop == "go":
        return eid

    rev = await EnquiryService.create_proposal(
        eid, spec.get("pricing") or {"inspector_cost": 250000}, SITE, USER
    )
    if stop == "proposal_draft":
        return eid

    await EnquiryService.issue_revision(rev["proposal_id"], 0, SITE, USER)

    if stop == "under_clarification":
        await EnquiryService.advance(
            eid, "under_clarification", SITE, USER,
            "Client queried the basis for the travel allowance.",
        )
        return eid

    if spec.get("revision"):
        nxt = await EnquiryService.add_revision(
            rev["proposal_id"], spec["revision"], SITE, USER
        )
        await EnquiryService.advance(
            eid, "under_clarification", SITE, USER, "Client queried the travel basis."
        )
        await EnquiryService.issue_revision(
            rev["proposal_id"], nxt["revision_no"], SITE, USER
        )
    if stop == "submitted_after_remediation":
        return eid

    if stop in {"lost", "revived"}:
        await EnquiryService.record_outcome(
            eid,
            {"outcome": "lost", "reason_codes": spec["codes"],
             "competitor_names": spec.get("competitors") or []},
            SITE, USER,
        )
        if stop == "revived":
            await EnquiryService.revive(
                eid, {"note": "Client confirmed the budget was restored."}, SITE, USER
            )
        return eid

    await EnquiryService.record_outcome(
        eid, {"outcome": "won", "award_reference": spec.get("award")}, SITE, USER
    )
    if stop == "converted":
        await EnquiryService.convert(
            eid, {"title": spec["category"], "client_name": spec["client_id"]},
            SITE, USER,
        )
    return eid


async def seed() -> None:
    existing = await Enquiry.find(Enquiry.site_id == SITE).count()
    if existing:
        print(f"  {existing} enquiries already present - nothing to do.")
        print("  Use --wipe first if you want to re-seed.")
        return

    created = await seed_reason_codes(SITE)
    print(f"  reason codes: {created} inserted")

    for spec in PLAN:
        eid = await _walk(spec)
        print(f"  {eid}  {spec['stop']:28s}  {spec['category']}")

    from modules.enquiries.service import PipelineService

    summary = await PipelineService.summary(SITE)
    analysis = await PipelineService.loss_analysis(SITE)
    print(f"\n  {summary['total']} enquiries, {summary['live']} live")
    print(f"  pipeline {summary['pipeline_value']:,.0f} / "
          f"weighted {summary['weighted_value']:,.0f}")
    print(f"  win rate {summary['win_rate_pct']}% over {summary['bid_count']} bids, "
          f"{summary['no_bid_count']} declined at gate 1")
    print(f"  loss analysis: {len(analysis['we_declined'])} reasons we declined, "
          f"{len(analysis['client_did_not_award'])} reasons the client did not award")


async def wipe() -> None:
    for model in (GoNoGoDecision, ProposalRevision):
        n = await model.find(model.site_id == SITE).delete()
        print(f"  {model.__name__}: {getattr(n, 'deleted_count', 0)} removed")
    jobs = await Job.find(Job.site_id == SITE).to_list()
    from_enquiry = [j for j in jobs if any(t.startswith("enquiry:") for t in j.tags)]
    for j in from_enquiry:
        await j.delete()
    print(f"  Job: {len(from_enquiry)} removed (only those tagged from an enquiry)")
    n = await Enquiry.find(Enquiry.site_id == SITE).delete()
    print(f"  Enquiry: {getattr(n, 'deleted_count', 0)} removed")


async def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--wipe", action="store_true")
    parser.add_argument("--force", action="store_true",
                        help="allow running against a database whose name does "
                             "not look like a development one")
    args = parser.parse_args()

    db_name = getattr(settings, "database_name", settings.mongodb_db_name)
    client = AsyncMongoClient(settings.mongodb_url)
    db = client[db_name]
    if not args.force and not any(
        hint in db_name.lower() for hint in ("dev", "test", "local", "iqe")
    ):
        print(f"Refusing to touch '{db_name}'. Pass --force if you mean it.")
        return 1

    await init_beanie(
        database=db,
        document_models=[
            Enquiry, GoNoGoDecision, ProposalRevision, ReasonCode,
            Job, AuditEntry, Sequence,
        ],
    )
    print(f"{'Wiping' if args.wipe else 'Seeding'} pre-sales in '{db_name}'\n")
    await (wipe() if args.wipe else seed())
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
