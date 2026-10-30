"""Public scan-to-verify, and the certificate lifecycle behind it.

The page this replaces read seven fields from the URL query string and
queried nothing, so a hand-typed URL rendered as a genuine scan result under
IQE branding. The first test below is the one that matters: a reference that
was never issued must not verify, however it is presented.

The rest guard the two ways a verification endpoint goes wrong once it is
real - it leaks more than it should, or it says "valid" about something IQE
has stopped standing behind.
"""
import sys
from datetime import datetime
from pathlib import Path

import pytest
import pytest_asyncio
from beanie import init_beanie
from fastapi import HTTPException
from mongomock_motor import AsyncMongoMockClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.audit import AuditEntry  # noqa: E402
from core.sequences import Sequence  # noqa: E402
from modules.certifications.models import (  # noqa: E402
    Certification,
    CertificationStatus,
)
from modules.certifications.service import CertificationService  # noqa: E402
from modules.control_numbers.models import ControlNumber  # noqa: E402
from modules.tpi.models import TpiReport  # noqa: E402
from modules.verification.service import (  # noqa: E402
    ISSUING_BODY,
    VerificationService,
)

SITE = "SITE-01"
USER = "EMP-QA"

#: Everything the public answer is allowed to contain. Anything else appearing
#: here is a disclosure decision that should be made deliberately.
PUBLIC_KEYS = {
    "found", "reference", "in_force", "status", "meaning", "document_type",
    "title", "issued_on", "client", "issuing_body", "checked_at",
}


def _patch_mongomock():
    from mongomock_motor import AsyncMongoMockDatabase

    original = AsyncMongoMockDatabase.list_collection_names

    async def patched(self, *args, **kwargs):
        kwargs.pop("authorizedCollections", None)
        kwargs.pop("nameOnly", None)
        return await original(self, *args, **kwargs)

    AsyncMongoMockDatabase.list_collection_names = patched


@pytest_asyncio.fixture
async def db():
    _patch_mongomock()
    client = AsyncMongoMockClient()
    await init_beanie(
        database=client["verify_test"],
        document_models=[
            Certification, TpiReport, ControlNumber, AuditEntry, Sequence,
        ],
    )
    yield client


async def _issued_cert(cid: str = "CERT-2026-0001") -> Certification:
    cert = Certification(
        certification_id=cid, site_id=SITE,
        work_package_id="WP-1", job_id="JOB-1",
        status=CertificationStatus.ISSUED.value,
        certified_at=datetime.now(),
        certified_value=1459200, claimed_value=1514000,
        prepared_by="EMP-1", certified_by_person_id="EMP-2",
    )
    await cert.insert()
    return cert


# ------------------------------------------------- the hole being closed

@pytest.mark.asyncio
async def test_a_reference_that_was_never_issued_does_not_verify(db):
    """The whole point. Previously this rendered as a genuine certificate
    because the page believed whatever the URL said."""
    out = await VerificationService.verify("IRN-2026-9999")
    assert out["found"] is False
    assert out["in_force"] is False
    assert "contact IQE" in out["meaning"]


@pytest.mark.asyncio
async def test_a_real_issued_certificate_verifies(db):
    await _issued_cert()
    out = await VerificationService.verify("CERT-2026-0001")
    assert out["found"] is True
    assert out["in_force"] is True
    assert out["status"] == CertificationStatus.ISSUED
    assert out["issuing_body"] == ISSUING_BODY


@pytest.mark.asyncio
async def test_unknown_and_known_answers_have_the_same_shape(db):
    """A different shape for misses tells an enumerator which references
    exist."""
    await _issued_cert()
    hit = await VerificationService.verify("CERT-2026-0001")
    miss = await VerificationService.verify("CERT-2026-0002")
    assert set(hit) == set(miss) == PUBLIC_KEYS


@pytest.mark.asyncio
async def test_malformed_references_are_answered_not_errored(db):
    for bad in ["", "  ", "x", "../../etc/passwd", "a" * 200, "<script>"]:
        out = await VerificationService.verify(bad)
        assert out["found"] is False
        assert set(out) == PUBLIC_KEYS


# ------------------------------------------------------- what it reveals

@pytest.mark.asyncio
async def test_the_public_answer_carries_no_commercial_detail(db):
    """The reference on a certificate is not a secret; the certified value
    on it is. A verification page that handed the money to whoever scanned
    the QR would be a commercial problem, not a reassurance."""
    await _issued_cert()
    out = await VerificationService.verify("CERT-2026-0001")

    blob = str(out)
    for leaked in ("1459200", "1514000", "EMP-1", "EMP-2", "WP-1"):
        assert leaked not in blob, f"{leaked} must not appear in a public answer"
    assert set(out) == PUBLIC_KEYS


@pytest.mark.asyncio
async def test_a_suspension_reason_is_not_published(db):
    """Why IQE suspended something is internal reasoning and may name people
    or terms. The public answer says it is not in force, not why."""
    await _issued_cert()
    await CertificationService.suspend(
        "CERT-2026-0001",
        "Contractor's QA manager found to have signed his own inspections.",
        SITE, USER,
    )
    out = await VerificationService.verify("CERT-2026-0001")
    assert out["in_force"] is False
    assert "QA manager" not in str(out)


# --------------------------------------------------------- the lifecycle

@pytest.mark.asyncio
async def test_a_suspended_certificate_stops_verifying(db):
    await _issued_cert()
    assert (await VerificationService.verify("CERT-2026-0001"))["in_force"] is True

    await CertificationService.suspend(
        "CERT-2026-0001", "Calibration of the gauge used has lapsed.", SITE, USER
    )
    out = await VerificationService.verify("CERT-2026-0001")
    assert out["in_force"] is False
    assert "Do not rely" in out["meaning"]


@pytest.mark.asyncio
async def test_a_restored_certificate_verifies_again(db):
    await _issued_cert()
    await CertificationService.suspend("CERT-2026-0001", "Under investigation.", SITE, USER)
    await CertificationService.restore(
        "CERT-2026-0001", "Instrument re-calibrated; readings re-checked and stand.",
        SITE, USER,
    )
    out = await VerificationService.verify("CERT-2026-0001")
    assert out["in_force"] is True


@pytest.mark.asyncio
async def test_a_withdrawn_certificate_cannot_be_restored(db):
    """Withdrawal is permanent on purpose. If it should not have been
    withdrawn the answer is a fresh certificate, not a reinstatement that
    leaves no trace of the period in between."""
    await _issued_cert()
    await CertificationService.withdraw(
        "CERT-2026-0001", "Issued against the wrong work package.", SITE, USER
    )
    with pytest.raises(HTTPException) as e:
        await CertificationService.restore("CERT-2026-0001", "Mistake.", SITE, USER)
    assert e.value.status_code == 409

    with pytest.raises(HTTPException) as e:
        await CertificationService.suspend("CERT-2026-0001", "Again.", SITE, USER)
    assert "nothing left to suspend" in e.value.detail


@pytest.mark.asyncio
async def test_suspension_and_withdrawal_need_reasons(db):
    await _issued_cert()
    with pytest.raises(HTTPException) as e:
        await CertificationService.suspend("CERT-2026-0001", "   ", SITE, USER)
    assert "person it hurts" in e.value.detail

    with pytest.raises(HTTPException):
        await CertificationService.withdraw("CERT-2026-0001", "", SITE, USER)


@pytest.mark.asyncio
async def test_a_draft_cannot_be_suspended_or_withdrawn(db):
    cert = Certification(
        certification_id="CERT-2026-0009", site_id=SITE,
        work_package_id="WP-1", job_id="JOB-1",
        status=CertificationStatus.DRAFT.value,
    )
    await cert.insert()
    for fn in (CertificationService.suspend, CertificationService.withdraw):
        with pytest.raises(HTTPException) as e:
            await fn("CERT-2026-0009", "reason", SITE, USER)
        assert "never" in e.value.detail


@pytest.mark.asyncio
async def test_every_lifecycle_change_stays_on_the_record(db):
    """The question asked later is never "is it valid now" but "was it valid
    on the day we relied on it"."""
    await _issued_cert()
    await CertificationService.suspend("CERT-2026-0001", "Gauge calibration lapsed.", SITE, USER)
    await CertificationService.restore("CERT-2026-0001", "Re-calibrated and re-checked.", SITE, USER)
    await CertificationService.withdraw("CERT-2026-0001", "Superseding revision issued.", SITE, USER)

    cert = await CertificationService.get("CERT-2026-0001", SITE)
    assert [e.event for e in cert.lifecycle_events] == ["SUSPENDED", "RESTORED", "WITHDRAWN"]
    assert all(e.reason for e in cert.lifecycle_events)


@pytest.mark.asyncio
async def test_a_draft_certificate_never_verifies_as_in_force(db):
    cert = Certification(
        certification_id="CERT-2026-0010", site_id=SITE,
        work_package_id="WP-1", job_id="JOB-1",
        status=CertificationStatus.DRAFT.value,
    )
    await cert.insert()
    out = await VerificationService.verify("CERT-2026-0010")
    assert out["found"] is True
    assert out["in_force"] is False
    assert "not a valid IQE certificate" in out["meaning"]


# ------------------------------------------------------ other documents

@pytest.mark.asyncio
async def test_a_draft_tpi_report_does_not_verify_as_in_force(db):
    await TpiReport(
        report_no="IQE-TP03-2026-0012", form_code="TP03", site_id=SITE,
        status="DRAFT", data={},
    ).insert()
    out = await VerificationService.verify("IQE-TP03-2026-0012")
    assert out["found"] is True
    assert out["in_force"] is False

    await TpiReport(
        report_no="IQE-TP03-2026-0013", form_code="TP03", site_id=SITE,
        status="ISSUED", data={},
    ).insert()
    out = await VerificationService.verify("IQE-TP03-2026-0013")
    assert out["in_force"] is True


@pytest.mark.asyncio
async def test_an_inactive_control_number_says_so(db):
    await ControlNumber(
        control_number_id="CN-2026-001", control_number="CN-2026-001",
        site_id=SITE, client_name="State Health Corp", is_active=False,
    ).insert()
    out = await VerificationService.verify("CN-2026-001")
    assert out["found"] is True
    assert out["in_force"] is False
    assert "reassigned or closed" in out["meaning"]


@pytest.mark.asyncio
async def test_every_status_has_public_wording(db):
    """"Superseded" tells a layperson nothing about whether to rely on the
    paper in their hand, so the wording comes from a table rather than the
    raw status - and the table has to be complete."""
    from modules.certifications.models import PUBLIC_MEANING

    for status in CertificationStatus:
        assert status.value in PUBLIC_MEANING, f"{status.value} has no public wording"
        wording = PUBLIC_MEANING[status.value]
        # A sentence telling the holder what to do, not the status word again.
        assert wording.endswith("."), f"{status.value}: not a sentence"
        assert status.value not in wording.lower().split(), (
            f"{status.value}: the wording just repeats the status"
        )
