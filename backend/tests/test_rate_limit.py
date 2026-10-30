"""The rate limiter covers the unauthenticated surface and nothing else.

The failure these guard against is not "the limiter lets an attacker
through" - it is "the limiter locks out an inspector", which is the far more
likely way a rate limit hurts an inspection body. Most of what follows tests
that it stays out of the way.
"""
from core import ratelimit
from core.ratelimit import LIMITS, Limit, limit_for


class _FakeClient:
    def __init__(self, host):
        self.host = host


class _FakeURL:
    def __init__(self, path):
        self.path = path


class _FakeRequest:
    """Enough of a Request for the limiter: a path, a peer and headers."""

    def __init__(self, path, host="10.0.0.5", headers=None):
        self.url = _FakeURL(path)
        self.client = _FakeClient(host)
        self.headers = headers or {}


def test_login_is_limited_and_says_when_to_retry():
    limit = LIMITS["/api/v1/auth/login"]
    for _ in range(limit.requests):
        assert ratelimit.check(_FakeRequest("/api/v1/auth/login")) is None

    rejected = ratelimit.check(_FakeRequest("/api/v1/auth/login"))
    assert rejected is not None
    assert rejected.status_code == 429
    # A 429 without Retry-After leaves a client guessing, and guessing clients
    # retry in a tight loop.
    assert int(rejected.headers["retry-after"]) >= 1


def test_authenticated_routes_are_not_limited():
    """A coordinator importing a schedule issues hundreds of writes. If the
    limiter touched these, that work would fail halfway through."""
    for _ in range(500):
        assert ratelimit.check(_FakeRequest("/api/v1/work-packages")) is None
        assert ratelimit.check(_FakeRequest("/api/v1/certifications")) is None


def test_one_caller_hitting_the_limit_does_not_block_another():
    limit = LIMITS["/api/v1/auth/login"]
    for _ in range(limit.requests + 5):
        ratelimit.check(_FakeRequest("/api/v1/auth/login", host="10.0.0.5"))

    # A second address starts with a full allowance.
    assert ratelimit.check(_FakeRequest("/api/v1/auth/login", host="10.0.0.9")) is None


def test_the_counters_are_per_path():
    """Exhausting login must not spend the verify allowance: a client scanning
    a certificate has nothing to do with whoever is guessing passwords."""
    limit = LIMITS["/api/v1/auth/login"]
    for _ in range(limit.requests + 5):
        ratelimit.check(_FakeRequest("/api/v1/auth/login"))

    assert ratelimit.check(_FakeRequest("/v/a1b2c3d4e5")) is None


def test_forwarded_header_buckets_callers_behind_a_proxy():
    """Behind a reverse proxy every caller shares a socket address. Without
    reading the header they would share one bucket, and the first script to
    hit the limit would lock out the whole site."""
    limit = LIMITS["/api/v1/auth/login"]
    noisy = {"x-forwarded-for": "203.0.113.7, 10.0.0.1"}
    quiet = {"x-forwarded-for": "203.0.113.9, 10.0.0.1"}

    for _ in range(limit.requests + 5):
        ratelimit.check(_FakeRequest("/api/v1/auth/login", host="10.0.0.1", headers=noisy))

    assert ratelimit.check(
        _FakeRequest("/api/v1/auth/login", host="10.0.0.1", headers=quiet)
    ) is None


def test_window_expiry_restores_the_allowance(monkeypatch):
    limit = LIMITS["/api/v1/auth/login"]
    clock = {"t": 1000.0}
    monkeypatch.setattr(ratelimit.time, "monotonic", lambda: clock["t"])

    for _ in range(limit.requests):
        assert ratelimit.check(_FakeRequest("/api/v1/auth/login")) is None
    assert ratelimit.check(_FakeRequest("/api/v1/auth/login")) is not None

    clock["t"] += limit.window_seconds + 1
    assert ratelimit.check(_FakeRequest("/api/v1/auth/login")) is None


def test_it_fails_open(monkeypatch):
    """A bug in the limiter must not be able to stop someone logging in."""
    def boom(_):
        raise RuntimeError("counter exploded")

    monkeypatch.setattr(ratelimit, "client_identity", boom)
    assert ratelimit.check(_FakeRequest("/api/v1/auth/login")) is None


def test_longest_prefix_wins():
    """Same resolution rule as the policy table, so the two cannot disagree
    about which rule covers a path."""
    assert limit_for("/api/v1/auth/login") is LIMITS["/api/v1/auth/login"]
    assert limit_for("/v/abc123") is LIMITS["/v/"]
    assert limit_for("/api/v1/work-packages") is None


def test_every_limit_explains_itself():
    """A bare number invites someone to change it without knowing what it was
    protecting."""
    for prefix, limit in LIMITS.items():
        assert isinstance(limit, Limit)
        assert limit.requests > 0 and limit.window_seconds > 0
        assert len(limit.note) > 40, f"{prefix} has no reasoning behind its number"


def test_limits_only_cover_paths_the_policy_table_leaves_open():
    """If a limited path required a token, the limit would be redundant and
    the two files would have drifted apart."""
    from core.policy import is_open

    for prefix in LIMITS:
        assert is_open(prefix), f"{prefix} is rate limited but is not an open path"


# --------------------------------------------------------- through the stack
# The unit tests above call check() directly, which would still pass if the
# middleware were never registered. These go through the app. TestClient is
# built without a `with` block so the lifespan - and its database connection -
# never runs; the middleware layer is all that is under test.

import sys  # noqa: E402
from pathlib import Path  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from starlette.testclient import TestClient  # noqa: E402

from main import app  # noqa: E402

http = TestClient(app, raise_server_exceptions=False)


def test_middleware_is_actually_registered():
    limit = LIMITS["/api/v1/auth/login"]
    codes = [
        http.post("/api/v1/auth/login", json={"login_name": "x", "password": "y"}).status_code
        for _ in range(limit.requests + 3)
    ]
    assert 429 in codes, "the limiter is not wired into the app"
    # The first few must get through: a limiter that rejects attempt one has
    # locked everyone out.
    assert codes[0] != 429
    assert codes.index(429) == limit.requests


def test_the_429_carries_cors_headers():
    """Registered inside CORS on purpose. A 429 that reaches the browser
    without these is reported as a CORS failure, and the person at the login
    screen is told nothing about what went wrong."""
    limit = LIMITS["/api/v1/auth/login"]
    origin = {"Origin": "http://localhost:3000"}
    for _ in range(limit.requests + 1):
        r = http.post(
            "/api/v1/auth/login", json={"login_name": "x", "password": "y"}, headers=origin
        )
    assert r.status_code == 429
    assert r.headers.get("access-control-allow-origin") is not None
    assert "Retry-After" in r.headers


def test_health_stays_unlimited():
    """Whatever polls this - a load balancer, a monitor - polls it often, and
    a health check that starts failing under its own monitoring is worse than
    no health check."""
    codes = [http.get("/health").status_code for _ in range(80)]
    assert 429 not in codes


def test_a_parameterised_path_counts_as_one_bucket():
    """Keying the counter on the full request path looked right and was
    useless for the case it mattered most. /api/v1/verify/{reference} is a
    different path on every request, so an enumerator walking references got
    a fresh allowance each time - defeating the limit that exists precisely
    because the endpoint is enumerable.

    Found by exercising the endpoint rather than by this file: the unit tests
    all used fixed paths, where the bug is invisible.
    """
    limit = LIMITS["/api/v1/verify/"]
    seen = [
        ratelimit.check(_FakeRequest(f"/api/v1/verify/CERT-2026-{i:04d}"))
        for i in range(limit.requests + 3)
    ]
    assert seen[0] is None
    assert any(r is not None for r in seen), (
        "walking distinct references got a fresh allowance each time"
    )
    assert seen.index(next(r for r in seen if r is not None)) == limit.requests
