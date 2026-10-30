"""Rate limiting for the endpoints that take no credentials.

The architecture document has listed "CORS & Rate Limiting" in the gateway
layer since the first draft. CORS was real; the rate limiting was not. This is
the smaller, actually-implemented version of that claim.

Scope is deliberately narrow. Only the paths that accept a request without a
token are limited:

* ``/api/v1/auth/login`` - the credential-guessing surface. Without a limit,
  an attacker gets as many password attempts per second as the server can
  answer, and the audit trail fills with noise that buries the real entry.
* ``/api/v1/auth/refresh`` - same shape, a token-guessing surface.
* ``/v/`` - scan-to-verify. Open by design, hits the link registry on every
  request, and is the one route on the public internet with nothing in front
  of it.

Authenticated routes are not limited here. A limit on them is a capacity
decision about real users doing real work - a coordinator bulk-importing a
schedule, a nightly report run - and picking a number for that without
measuring would break legitimate work to defend against a threat the token
already addresses.

**What this is not.** The counters live in this process's memory. Four uvicorn
workers mean four independent counters and four times the configured limit;
a restart clears them. That is a real weakening and it is written down rather
than papered over, because the alternative - requiring Redis on the request
path - would make the API refuse to start when the cache is down. For a single
-host deployment, which is what IQE runs, per-process counting is the honest
trade. If this ever runs behind more than one host, the limit belongs in the
reverse proxy, not here.

Failure is always open. A bug in this file must not be able to stop an
inspector logging in.
"""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from threading import Lock
from typing import Optional

from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Limit:
    """How many requests, over how many seconds, and why."""

    requests: int
    window_seconds: int
    note: str


#: Longest prefix wins, same rule as the policy table.
LIMITS: dict[str, Limit] = {
    "/api/v1/auth/login": Limit(
        requests=10,
        window_seconds=60,
        note=(
            "Ten attempts a minute from one address. A person who has "
            "mistyped their password three times types it slower, not "
            "faster; a script does not."
        ),
    ),
    "/api/v1/auth/refresh": Limit(
        requests=30,
        window_seconds=60,
        note=(
            "Higher than login because a legitimate client refreshes on a "
            "timer and several browser tabs refresh independently."
        ),
    ),
    "/api/v1/verify/": Limit(
        requests=30,
        window_seconds=60,
        note=(
            "Thirty a minute. A person checking the certificate in their hand "
            "does it once; this is here because an open endpoint keyed on a "
            "document reference is an enumeration surface."
        ),
    ),
    "/v/": Limit(
        requests=60,
        window_seconds=60,
        note=(
            "One a second. A client scanning the QR code on a certificate "
            "does it once; this only catches a script walking the registry."
        ),
    ),
}


def match(path: str) -> Optional[tuple[str, Limit]]:
    """The rule covering this path and the prefix it matched on, longest
    prefix first, or None."""
    best: Optional[tuple[int, str, Limit]] = None
    for prefix, limit in LIMITS.items():
        if path == prefix or path.startswith(prefix):
            if best is None or len(prefix) > best[0]:
                best = (len(prefix), prefix, limit)
    return (best[1], best[2]) if best else None


def limit_for(path: str) -> Optional[Limit]:
    """The limit covering this path, or None."""
    found = match(path)
    return found[1] if found else None


@dataclass
class _Window:
    started_at: float
    count: int = 0


_counters: dict[tuple[str, str], _Window] = {}
_lock = Lock()
#: Stop the dict growing without bound when a scan walks through many
#: addresses. Evicted entries only reset someone's allowance early, which is
#: the safe direction to be wrong in.
_MAX_KEYS = 20_000


def client_identity(request: Request) -> str:
    """Who to count against.

    X-Forwarded-For is honoured because IQE runs behind a reverse proxy and
    the socket address would otherwise be the proxy for every caller - one
    shared bucket, and the first script to hit the limit locks out everybody.
    The header is attacker-controlled, so this is not an identity to make a
    security decision on; it is only a bucket key. The worst a forged header
    buys is a fresh allowance, which is the same thing a new IP address buys.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        first = forwarded.split(",")[0].strip()
        if first:
            return first[:64]
    client = request.client
    return client.host if client else "unknown"


def check(request: Request) -> Optional[JSONResponse]:
    """None to let the request through, or the 429 to return instead."""
    try:
        found = match(request.url.path)
        if found is None:
            return None
        prefix, limit = found

        # Keyed on the prefix the rule matched, not the full path. Keying on
        # the path looked right and was useless for the case it mattered
        # most: /api/v1/verify/{reference} is a different path on every
        # request, so an enumerator walking references got a fresh allowance
        # each time - defeating the limit that was added precisely because
        # the endpoint is enumerable. Different rules still count separately,
        # so exhausting login does not spend the verify allowance.
        key = (client_identity(request), prefix)
        now = time.monotonic()

        with _lock:
            if len(_counters) > _MAX_KEYS:
                _counters.clear()
            window = _counters.get(key)
            if window is None or now - window.started_at >= limit.window_seconds:
                _counters[key] = _Window(started_at=now, count=1)
                return None
            window.count += 1
            if window.count <= limit.requests:
                return None
            retry_after = max(1, int(limit.window_seconds - (now - window.started_at)))

        logger.warning(
            "rate limit hit: %s on %s (%d in %ds)",
            key[0], key[1], window.count, limit.window_seconds,
        )
        return JSONResponse(
            status_code=429,
            content={
                "detail": (
                    "Too many requests. Wait "
                    f"{retry_after} second{'s' if retry_after != 1 else ''} "
                    "and try again."
                )
            },
            headers={"Retry-After": str(retry_after)},
        )
    except Exception:
        # Never let a counting bug stop an inspector logging in.
        logger.exception("rate limiter failed open")
        return None


def reset() -> None:
    """Clear all counters. For tests."""
    with _lock:
        _counters.clear()
