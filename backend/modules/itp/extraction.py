"""Reading an ITP out of the document the client sent.

Clients send Inspection and Test Plans as PDFs and spreadsheets, usually as a
table: item number, activity, reference document, acceptance criteria, and a
column of H / W / R / M per party. Keying forty rows of that by hand is the
reason the plan ends up living in someone's inbox instead of in the system.

This is the one place in the module where a language model is used, and it is
deliberately boxed in:

* **It proposes; it never approves.** The extracted points land as a DRAFT
  marked with the document they came from, and `ITPService.approve` refuses
  until a person has confirmed them. An ITP is contractual: approving a
  machine's reading unread would make that reading the agreement.
* **Structure is parsed, not trusted.** Anything the model returns that is not
  a well-formed point is dropped with a reason rather than guessed at, and
  every point comes back with what the model was unsure about.
* **Unconfigured means nothing happens.** No endpoint, no key, no request —
  and an honest refusal rather than a plausible invented plan, which for a
  contractual document would be the worst possible output.
"""
from __future__ import annotations

import json
import re
from typing import Any, Optional

from core import llm
from modules.itp.models import DEFAULT_NOTICE_DAYS, InterventionType

#: Deliberately narrow. The model's job is transcription, not judgement: it
#: reads a table that already exists and must not invent acceptance criteria,
#: which is the field a contractor would be held to.
SYSTEM = """You transcribe Inspection and Test Plan tables for a third-party \
inspection body. You are reading a document the client has already issued.

Return ONLY a JSON array. Each element:
  point_id            the item reference exactly as printed (e.g. "4.3.2")
  activity            the activity description, verbatim
  discipline          Civil | Mechanical | Electrical | Welding | NDT | Other
  reference_document  the drawing or specification cited, if any
  reference_revision  its revision, if printed
  acceptance_criteria the stated criteria, verbatim; null if the row has none
  intervention        H, W, R or M as marked for the inspection body
  client_intervention H, W, R or M as marked for the client, if a column exists
  uncertain           array of field names you could not read confidently

Rules:
- Transcribe. Do not infer acceptance criteria that is not printed.
- If the intervention column is unreadable for a row, use "W" and list
  "intervention" in uncertain. Never guess "H": a hold point stops work, and
  inventing one stops a contractor for no reason.
- Omit rows that are headings, totals or notes rather than activities.
- No prose, no markdown fence. The array only."""


def _coerce_intervention(value: Any) -> tuple[str, bool]:
    """Map whatever came back onto a real intervention type.

    Returns the value and whether it had to be defaulted, so the caller can
    mark the point uncertain rather than presenting a guess as read.
    """
    text = str(value or "").strip().upper()
    if text in {i.value for i in InterventionType}:
        return text, False
    # Long forms appear on some clients' plans.
    for word, code in (
        ("HOLD", "H"), ("WITNESS", "W"), ("REVIEW", "R"), ("MONITOR", "M"),
    ):
        if text.startswith(word):
            return code, False
    return InterventionType.WITNESS.value, True


def _parse(text: str) -> tuple[list[dict], list[str]]:
    """Pull the array out of the reply. Returns points and rejection reasons."""
    rejected: list[str] = []
    cleaned = text.strip()
    # Models fence JSON even when told not to.
    fence = re.match(r"^```(?:json)?\s*(.*?)\s*```$", cleaned, re.S)
    if fence:
        cleaned = fence.group(1)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        return [], [f"The reply was not JSON: {e.msg}"]
    if not isinstance(data, list):
        return [], ["The reply was not an array of points."]

    points: list[dict] = []
    for index, raw in enumerate(data):
        if not isinstance(raw, dict):
            rejected.append(f"Row {index + 1} was not an object.")
            continue
        point_id = str(raw.get("point_id") or "").strip()
        activity = str(raw.get("activity") or "").strip()
        if not point_id or not activity:
            # Dropped rather than filled in: a point with no reference cannot
            # have a call raised against it, so it would be dead weight in a
            # contractual document.
            rejected.append(
                f"Row {index + 1} had no {'point reference' if not point_id else 'activity'}."
            )
            continue

        intervention, defaulted = _coerce_intervention(raw.get("intervention"))
        uncertain = [str(u) for u in (raw.get("uncertain") or []) if u]
        if defaulted and "intervention" not in uncertain:
            uncertain.append("intervention")

        criteria = raw.get("acceptance_criteria")
        criteria = str(criteria).strip() if criteria else None
        # A hold point with no criteria would be refused at validation, so
        # flag it here where the reviewer can see why.
        if intervention == InterventionType.HOLD and not criteria:
            uncertain.append("acceptance_criteria")

        points.append({
            "point_id": point_id,
            "sequence": index + 1,
            "activity": activity,
            "discipline": (str(raw.get("discipline")).strip()
                           if raw.get("discipline") else None),
            "reference_document": (str(raw.get("reference_document")).strip()
                                   if raw.get("reference_document") else None),
            "reference_revision": (str(raw.get("reference_revision")).strip()
                                   if raw.get("reference_revision") else None),
            "acceptance_criteria": criteria,
            "intervention": intervention,
            "client_intervention": (
                _coerce_intervention(raw.get("client_intervention"))[0]
                if raw.get("client_intervention") else None
            ),
            "notice_days": DEFAULT_NOTICE_DAYS.get(
                InterventionType(intervention), 3
            ),
            "uncertain": uncertain,
        })
    return points, rejected


async def extract(document_text: str, source: Optional[str] = None) -> dict:
    """Propose ITP points from a document's text.

    Returns a draft for a person to check. Never writes anything.
    """
    text = (document_text or "").strip()
    if not text:
        return {
            "ok": False,
            "status": "no_input",
            "points": [],
            "note": "No document text was supplied, so there is nothing to read.",
        }

    if not llm.is_configured():
        result = llm.not_configured("Reading an ITP out of a document")
        return {
            "ok": False,
            "status": result.status,
            "points": [],
            "note": result.detail,
        }

    # Bounded: a 200-page specification would be mostly irrelevant and the
    # cost is the client's. The ITP table is near the front in practice.
    reply = await llm.complete(SYSTEM, text[:40_000], temperature=0.0)
    if not reply.ok:
        return {
            "ok": False,
            "status": reply.status,
            "points": [],
            "note": reply.detail or "The model could not be reached.",
        }

    points, rejected = _parse(reply.text or "")
    flagged = [p for p in points if p["uncertain"]]
    holds = [p for p in points if p["intervention"] == InterventionType.HOLD]

    return {
        "ok": True,
        "status": "draft",
        "points": points,
        "rejected": rejected,
        "source": source,
        "summary": {
            "read": len(points),
            "dropped": len(rejected),
            "flagged": len(flagged),
            "hold_points": len(holds),
        },
        "note": (
            f"{len(points)} point{'' if len(points) == 1 else 's'} read from "
            f"the document, {len(holds)} of them hold points. This is a draft: "
            f"nothing is saved until someone confirms it, and the plan cannot "
            f"be approved until they do. "
            + (
                f"{len(flagged)} point{'' if len(flagged) == 1 else 's'} have "
                f"fields the model was unsure of — check those first."
                if flagged else
                "Nothing was flagged as uncertain, which is not the same as "
                "nothing being wrong."
            )
        ),
    }
