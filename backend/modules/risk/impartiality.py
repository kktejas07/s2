"""Impartiality exposure, computed from the work rather than declared.

ISO/IEC 17020:2026 wants impartiality risk identified, analysed and treated
on an ongoing basis. The register already holds whatever someone thought to
write down. What it cannot hold is the thing that actually creates the risk,
because nobody can see it from any one screen: how much of the body's revenue
comes from one client, and which inspectors spend most of their time working
for that client.

Both halves of that already exist in this system - orders and invoices on one
side, assignments on the other - and nothing joined them. This joins them.

Two different exposures, deliberately kept apart:

* **Financial dependence.** A client who is a large share of revenue is a
  client the body cannot afford to fail. That pressure is structural and does
  not require anyone to behave badly for it to be a risk.
* **Personal familiarity.** An inspector who works almost exclusively for one
  client, over years, is subject to a different pressure, and it is the one
  assessors ask about by name. A body can be well diversified overall and
  still have an inspector who has worked for nobody else in three years.

Neither is a finding. Both are conditions that call for a treatment -
rotation, a second reviewer, a declared and monitored risk - and the output
says so rather than implying wrongdoing.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Optional

logger = logging.getLogger(__name__)

#: Above this share of revenue, a single client is a structural dependence
#: worth treating rather than noting. Not a regulatory figure - no standard
#: states one - but a threshold commonly used in practice, and configurable
#: because the right number depends on the body's size.
CONCENTRATION_THRESHOLD_PCT = 25.0

#: Above this share of an inspector's assignments going to one client, the
#: familiarity is worth a rotation conversation.
FAMILIARITY_THRESHOLD_PCT = 70.0

#: Below this many assignments, a high percentage means nothing. Someone with
#: two assignments both for one client is not captured; they are new.
MIN_ASSIGNMENTS_FOR_FAMILIARITY = 6

DEFAULT_WINDOW_DAYS = 365


def _pct(part: float, whole: float) -> float:
    return round(part / whole * 100, 1) if whole else 0.0


class ImpartialityExposure:
    @staticmethod
    async def _revenue_by_client(
        site_id: str, since: datetime
    ) -> tuple[dict[str, float], dict[str, str], float]:
        """Invoiced value per client over the window.

        Invoiced rather than committed: what the body has actually been paid
        for is the dependence that exists, not the one that might.
        """
        from modules.invoices.models import Invoice
        from modules.jobs.models import Job

        jobs = await Job.find(Job.site_id == site_id).to_list()
        job_client = {j.job_id: (j.client_id, j.client_name) for j in jobs}

        invoices = await Invoice.find(Invoice.site_id == site_id).to_list()
        by_client: dict[str, float] = {}
        names: dict[str, str] = {}
        total = 0.0
        for inv in invoices:
            if inv.status in {"cancelled", "void"}:
                continue
            if inv.invoice_date and inv.invoice_date < since:
                continue
            client_id, client_name = job_client.get(inv.job_id, (None, None))
            client_id = client_id or inv.client_id
            client_name = client_name or inv.client_name
            if not client_id:
                continue
            value = float(inv.grand_total or 0.0)
            by_client[client_id] = by_client.get(client_id, 0.0) + value
            names[client_id] = client_name or client_id
            total += value
        return by_client, names, round(total, 2)

    @staticmethod
    async def _assignments_by_person(
        site_id: str, since: datetime
    ) -> dict[str, dict[str, int]]:
        """Per person, how many assignments went to each client."""
        from modules.assignments.models import Assignment
        from modules.jobs.models import Job

        jobs = await Job.find(Job.site_id == site_id).to_list()
        job_client = {j.job_id: j.client_id for j in jobs}

        assignments = await Assignment.find(
            Assignment.site_id == site_id
        ).to_list()
        out: dict[str, dict[str, int]] = {}
        for a in assignments:
            if a.status in {"WITHDRAWN", "REJECTED", "withdrawn", "rejected"}:
                continue
            planned = getattr(a, "planned_from", None) or getattr(a, "created_at", None)
            if planned and planned < since:
                continue
            client_id = job_client.get(a.job_id)
            if not client_id:
                continue
            out.setdefault(a.person_id, {})
            out[a.person_id][client_id] = out[a.person_id].get(client_id, 0) + 1
        return out

    @staticmethod
    async def _declared(site_id: str) -> dict[str, set[str]]:
        """Conflicts people have already declared, so the report can say which
        exposures are already known about and which are not."""
        from modules.people.models import ImpartialityDeclaration

        rows = await ImpartialityDeclaration.find(
            ImpartialityDeclaration.site_id == site_id
        ).to_list()
        out: dict[str, set[str]] = {}
        for r in rows:
            out.setdefault(r.person_id, set()).update(r.conflicted_client_ids or [])
        return out

    # ------------------------------------------------------------- the view

    @staticmethod
    async def compute(
        site_id: str = "SITE-01",
        *,
        window_days: int = DEFAULT_WINDOW_DAYS,
        concentration_threshold: float = CONCENTRATION_THRESHOLD_PCT,
        familiarity_threshold: float = FAMILIARITY_THRESHOLD_PCT,
        now: Optional[datetime] = None,
    ) -> dict:
        now = now or datetime.now()
        since = now - timedelta(days=window_days)

        revenue, names, total = await ImpartialityExposure._revenue_by_client(
            site_id, since
        )
        per_person = await ImpartialityExposure._assignments_by_person(
            site_id, since
        )
        declared = await ImpartialityExposure._declared(site_id)

        clients = sorted(
            (
                {
                    "client_id": cid,
                    "client_name": names.get(cid, cid),
                    "invoiced": round(value, 2),
                    "share_percent": _pct(value, total),
                    "above_threshold": _pct(value, total) >= concentration_threshold,
                }
                for cid, value in revenue.items()
            ),
            key=lambda r: -r["invoiced"],
        )
        concentrated = [c for c in clients if c["above_threshold"]]

        # The top client's share is the number that gets asked about, so it is
        # stated rather than left to be derived from the list.
        top_share = clients[0]["share_percent"] if clients else 0.0

        familiar: list[dict] = []
        for person_id, counts in per_person.items():
            n = sum(counts.values())
            if n < MIN_ASSIGNMENTS_FOR_FAMILIARITY:
                # A high percentage over two assignments means nothing except
                # that the person is new.
                continue
            client_id, count = max(counts.items(), key=lambda kv: kv[1])
            share = _pct(count, n)
            if share < familiarity_threshold:
                continue
            familiar.append({
                "person_id": person_id,
                "client_id": client_id,
                "client_name": names.get(client_id, client_id),
                "assignments": count,
                "assignments_total": n,
                "share_percent": share,
                "client_is_concentrated": any(
                    c["client_id"] == client_id for c in concentrated
                ),
                "already_declared": client_id in declared.get(person_id, set()),
            })
        familiar.sort(key=lambda r: -r["share_percent"])

        # The combination is what matters. An inspector working almost
        # entirely for a client that is also most of the body's revenue sits
        # at the intersection of both pressures, and that is the case an
        # assessor opens with.
        compounded = [
            f for f in familiar
            if f["client_is_concentrated"] and not f["already_declared"]
        ]

        notes: list[str] = []
        if total <= 0:
            notes.append(
                "No invoiced revenue in the window, so concentration cannot be "
                "measured. This is not the same as no concentration."
            )
        elif concentrated:
            notes.append(
                f"{len(concentrated)} client(s) are at or above "
                f"{concentration_threshold:.0f}% of invoiced revenue, the "
                f"largest at {top_share:.0f}%."
            )
        else:
            notes.append(
                f"No client exceeds {concentration_threshold:.0f}% of revenue; "
                f"the largest is {top_share:.0f}%."
            )
        if familiar:
            notes.append(
                f"{len(familiar)} inspector(s) send{'s' if len(familiar) == 1 else ''} "
                f"{familiarity_threshold:.0f}% or more of their assignments to "
                f"one client."
            )
        if compounded:
            notes.append(
                f"{len(compounded)} of those work mostly for a client that is "
                f"also a large share of revenue, with no declared conflict on "
                f"file. That intersection is the case an assessor opens with."
            )
        notes.append(
            "None of this is a finding. It is a condition that calls for a "
            "treatment - rotation, a second reviewer, or a declared and "
            "monitored risk."
        )

        return {
            "as_at": now,
            "window_days": window_days,
            "total_invoiced": total,
            "concentration_threshold_percent": concentration_threshold,
            "familiarity_threshold_percent": familiarity_threshold,
            "clients": clients,
            "concentrated_clients": concentrated,
            "top_client_share_percent": top_share,
            "familiar_inspectors": familiar,
            "compounded": compounded,
            "measurable": total > 0,
            "note": " ".join(notes),
        }

    @staticmethod
    async def propose_risks(
        site_id: str = "SITE-01", **kwargs: Any
    ) -> dict:
        """Turn the exposure into risk-register entries someone can accept.

        Proposed, never written. A register that fills itself is a register
        nobody reads, and an impartiality risk that appeared without anyone
        deciding it was one has not been identified in any sense an assessor
        would accept.
        """
        from modules.risk.models import IMPARTIALITY_TOLERANCE

        view = await ImpartialityExposure.compute(site_id, **kwargs)
        proposals: list[dict] = []

        for client in view["concentrated_clients"]:
            # Likelihood 3: the dependence exists now, and the question is
            # whether it is acted on. Impact scaled by how large the share is.
            share = client["share_percent"]
            impact = 5 if share >= 50 else 4 if share >= 35 else 3
            proposals.append({
                "title": (
                    f"{client['client_name']} is {share:.0f}% of invoiced revenue"
                ),
                "description": (
                    f"{client['client_name']} accounts for {share:.0f}% of "
                    f"invoiced revenue over the last {view['window_days']} "
                    f"days. A client the body cannot afford to fail exerts "
                    f"pressure on inspection decisions whether or not anyone "
                    f"acts on it."
                ),
                "category": "IMPARTIALITY",
                "source": "Computed from invoiced revenue",
                "inherent_likelihood": 3,
                "inherent_impact": impact,
                "suggested_treatment": "MITIGATE",
                "above_tolerance": 3 * impact >= IMPARTIALITY_TOLERANCE,
                "evidence": {
                    "client_id": client["client_id"],
                    "invoiced": client["invoiced"],
                    "share_percent": share,
                },
            })

        for person in view["compounded"]:
            proposals.append({
                "title": (
                    f"{person['person_id']} works mostly for "
                    f"{person['client_name']}"
                ),
                "description": (
                    f"{person['share_percent']:.0f}% of "
                    f"{person['person_id']}'s assignments "
                    f"({person['assignments']} of {person['assignments_total']}) "
                    f"are for {person['client_name']}, which is also a large "
                    f"share of revenue. No conflict is declared on file."
                ),
                "category": "IMPARTIALITY",
                "source": "Computed from assignments and revenue",
                "inherent_likelihood": 3,
                "inherent_impact": 4,
                "suggested_treatment": "MITIGATE",
                "above_tolerance": 12 >= IMPARTIALITY_TOLERANCE,
                "evidence": {
                    "person_id": person["person_id"],
                    "client_id": person["client_id"],
                    "share_percent": person["share_percent"],
                },
            })

        return {
            "proposals": proposals,
            "exposure": view,
            "note": (
                f"{len(proposals)} proposed register entr"
                f"{'y' if len(proposals) == 1 else 'ies'}. Nothing is written: "
                f"a risk that appeared on the register without anyone deciding "
                f"it was one has not been identified in any sense an assessor "
                f"would accept. Raise the ones that are real."
                if proposals else
                "Nothing to propose. That is not the same as no exposure - it "
                "means none crossed the thresholds set for this body."
            ),
        }
