"""The authentication and authorisation gate.

This exists because the gate used to fail *open*: get_current_user returned an
Admin identity when there were no credentials, when the token carried no
subject, and - via a bare `except Exception` that swallowed decode_token's own
401 - when the token was forged or expired. The practical effect was that the
entire API was unauthenticated and every caller was an administrator, which
made the RBAC matrix in the architecture documentation describe something that
did not exist.

A failure in this file means someone has reopened that hole.
"""
import sys
from datetime import timedelta
from pathlib import Path

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.auth import (  # noqa: E402
    AUTHORIZES_PERSONNEL,
    ISSUES_CERTIFICATES,
    MANAGES_MONEY,
    Role,
    create_access_token,
    get_current_user,
    require_roles,
)
from core.config import settings  # noqa: E402


def bearer(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


@pytest.fixture(autouse=True)
def strict_auth():
    """Every test here assumes production settings."""
    original = settings.auth_allow_anonymous
    settings.auth_allow_anonymous = False
    yield
    settings.auth_allow_anonymous = original


# ------------------------------------------------------- authentication

@pytest.mark.asyncio
async def test_no_credentials_is_refused():
    with pytest.raises(HTTPException) as exc:
        await get_current_user(None)
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_a_forged_token_is_refused():
    with pytest.raises(HTTPException) as exc:
        await get_current_user(bearer("not.a.real.token"))
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_an_expired_token_is_refused():
    stale = create_access_token({"sub": "EMP-1", "role_id": 1},
                                expires_delta=timedelta(seconds=-60))
    with pytest.raises(HTTPException) as exc:
        await get_current_user(bearer(stale))
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_a_token_without_a_subject_is_refused():
    with pytest.raises(HTTPException) as exc:
        await get_current_user(bearer(create_access_token({"role_id": 1})))
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_nothing_ever_resolves_to_admin_by_accident():
    """The precise shape of the old bug: a failure producing role_id 1."""
    for creds in (None, bearer("rubbish"), bearer(create_access_token({"role_id": 1}))):
        with pytest.raises(HTTPException):
            await get_current_user(creds)


@pytest.mark.asyncio
async def test_a_valid_token_resolves_to_its_own_claims():
    token = create_access_token(
        {"sub": "EMP-00002", "role_id": Role.QC_AUDITOR.value, "site_id": "SITE-07"}
    )
    user = await get_current_user(bearer(token))
    assert user == {"user_id": "EMP-00002", "role_id": 5, "site_id": "SITE-07"}


@pytest.mark.asyncio
async def test_an_unknown_role_claim_does_not_become_admin():
    """A token that omits role_id must not be promoted."""
    token = create_access_token({"sub": "EMP-00003"})
    user = await get_current_user(bearer(token))
    assert user["role_id"] != Role.ADMIN, "a missing role must not default to Admin"


@pytest.mark.asyncio
async def test_anonymous_access_only_when_deliberately_enabled():
    settings.auth_allow_anonymous = True
    try:
        user = await get_current_user(None)
        assert user["role_id"] == Role.ADMIN
    finally:
        settings.auth_allow_anonymous = False

    with pytest.raises(HTTPException):
        await get_current_user(None)


# -------------------------------------------------------- authorisation

async def _check(roles, role_id):
    checker = require_roles(roles)
    token = create_access_token({"sub": "EMP-1", "role_id": role_id, "site_id": "SITE-01"})
    return await checker(await get_current_user(bearer(token)))


@pytest.mark.asyncio
async def test_qc_auditor_may_issue_a_certification_and_an_inspector_may_not():
    assert await _check(ISSUES_CERTIFICATES, Role.QC_AUDITOR.value)
    with pytest.raises(HTTPException) as exc:
        await _check(ISSUES_CERTIFICATES, Role.INSPECTOR.value)
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_finance_may_raise_an_invoice_and_an_inspector_may_not():
    assert await _check(MANAGES_MONEY, Role.FINANCE.value)
    with pytest.raises(HTTPException):
        await _check(MANAGES_MONEY, Role.INSPECTOR.value)


@pytest.mark.asyncio
async def test_only_the_technical_manager_authorizes_personnel():
    """ISO/IEC 17020 puts this with a named competent technical function."""
    assert await _check(AUTHORIZES_PERSONNEL, Role.TECHNICAL_MANAGER.value)
    for denied in (Role.QC_AUDITOR, Role.FINANCE, Role.COORDINATOR, Role.INSPECTOR):
        with pytest.raises(HTTPException):
            await _check(AUTHORIZES_PERSONNEL, denied.value)


@pytest.mark.asyncio
async def test_a_client_role_reaches_none_of_the_guarded_actions():
    for roles in (ISSUES_CERTIFICATES, MANAGES_MONEY, AUTHORIZES_PERSONNEL):
        with pytest.raises(HTTPException):
            await _check(roles, Role.CLIENT.value)


def test_the_guarded_routes_actually_carry_a_guard():
    """A guard that is defined but never applied is what the old code had."""
    from main import app

    # Paths are as declared on the router; the /api/v1 prefix is applied by
    # the include and is not stored on the inner route.
    guarded = {
        ("POST", "/certifications/{certification_id}/issue"),
        ("POST", "/billing/invoices/from-certifications"),
        ("PATCH", "/people/authorizations/{authorization_id}"),
        ("POST", "/migration/all"),
    }
    # FastAPI 0.149 keeps included routers lazy, so app.routes holds
    # _IncludedRouter wrappers rather than the APIRoute objects. Walk through
    # original_router to reach the real ones.
    def all_routes(router):
        for r in getattr(router, "routes", []):
            if type(r).__name__ == "_IncludedRouter":
                yield from all_routes(r.original_router)
            else:
                yield r

    found = set()
    for route in all_routes(app):
        for method in getattr(route, "methods", set()) or set():
            key = (method, getattr(route, "path", ""))
            if key in guarded:
                names = [d.call.__qualname__ for d in route.dependant.dependencies]
                assert any("role_checker" in n for n in names), f"{key} has no role guard"
                found.add(key)
    assert found == guarded, f"routes not found: {sorted(guarded - found)}"
