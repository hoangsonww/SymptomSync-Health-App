"""HTTP gateway app and middleware for streamable MCP transport."""

from __future__ import annotations

import secrets
import time
import uuid
from collections import deque
from collections.abc import Awaitable, Callable
from threading import Lock

import structlog
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

try:
    from ..config.settings import settings
except ImportError:
    from config.settings import settings
from .mcp_instance import mcp
from .models import HealthStatus
from .service import service

logger = structlog.get_logger()

REQUEST_COUNT = Counter(
    "symptomsync_mcp_http_requests_total",
    "Total MCP HTTP request count",
    ["method", "endpoint", "status"],
)

REQUEST_DURATION = Histogram(
    "symptomsync_mcp_http_request_duration_seconds",
    "MCP HTTP request duration in seconds",
    ["method", "endpoint"],
)

RATE_LIMIT_HITS = Counter(
    "symptomsync_mcp_http_rate_limit_hits_total",
    "Total number of requests rejected by HTTP rate limiting",
    ["endpoint"],
)

_RATE_LIMIT_WINDOW_SECONDS = 60
_rate_limit_buckets: dict[str, deque[float]] = {}
_rate_limit_lock = Lock()


def _is_auth_exempt_path(path: str) -> bool:
    """Return True for paths that are intentionally left unauthenticated."""
    return path in {"/", "/health", "/livez", "/readyz"}


def _is_rate_limited(key: str, limit: int) -> bool:
    """Check and update in-memory rate limit bucket."""
    now = time.monotonic()
    with _rate_limit_lock:
        bucket = _rate_limit_buckets.setdefault(key, deque())
        cutoff = now - _RATE_LIMIT_WINDOW_SECONDS
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        if len(bucket) >= limit:
            return True
        bucket.append(now)
        return False


def _request_context_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
):
    """Attach a request id and standard security headers for HTTP transport."""

    async def _inner():
        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        return response

    return _inner()


def _auth_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
):
    """Enforce optional bearer token auth on non-health HTTP endpoints."""

    async def _inner():
        if not settings.mcp_require_auth or _is_auth_exempt_path(request.url.path):
            return await call_next(request)

        if not settings.mcp_auth_token:
            logger.error(
                "HTTP MCP auth is enabled but no token is configured",
                path=request.url.path,
            )
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "Server authentication configuration error"},
            )

        auth_header = request.headers.get("authorization", "")
        expected_header = f"Bearer {settings.mcp_auth_token}"
        if not secrets.compare_digest(auth_header, expected_header):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Unauthorized"},
                headers={"WWW-Authenticate": "Bearer"},
            )

        return await call_next(request)

    return _inner()


def _rate_limit_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
):
    """Enforce best-effort in-memory HTTP rate limiting."""

    async def _inner():
        if _is_auth_exempt_path(request.url.path):
            return await call_next(request)

        limit = max(1, settings.rate_limit_per_minute)
        identity = request.headers.get("authorization") or (request.client.host if request.client else "unknown")
        key = f"{identity}:{request.url.path}"
        if _is_rate_limited(key, limit):
            RATE_LIMIT_HITS.labels(endpoint=request.url.path).inc()
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit exceeded"},
            )

        return await call_next(request)

    return _inner()


def _metrics_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
):
    """Collect HTTP metrics for streamable MCP transport."""

    async def _inner():
        method = request.method
        path = request.url.path

        with REQUEST_DURATION.labels(method=method, endpoint=path).time():
            response = await call_next(request)

        REQUEST_COUNT.labels(
            method=method,
            endpoint=path,
            status=response.status_code,
        ).inc()

        return response

    return _inner()


def create_http_app() -> FastAPI:
    """Create an HTTP app with health/metrics plus mounted MCP routes."""
    with _rate_limit_lock:
        _rate_limit_buckets.clear()

    app = FastAPI(
        title=f"{settings.app_name} MCP Gateway",
        description="HTTP gateway for SymptomSync's standalone MCP server",
        version=settings.app_version,
    )

    app.middleware("http")(_request_context_middleware)
    app.middleware("http")(_auth_middleware)
    app.middleware("http")(_rate_limit_middleware)
    app.middleware("http")(_metrics_middleware)

    @app.get("/health", response_model=HealthStatus)
    async def health() -> HealthStatus:
        return service.get_health_status()

    @app.get("/livez", response_model=HealthStatus)
    async def livez() -> HealthStatus:
        return service.get_health_status()

    @app.get("/readyz", response_model=HealthStatus)
    async def readyz() -> HealthStatus:
        ready, reason = service.is_ready(deep_check=settings.mcp_readiness_check_graph)
        if not ready:
            raise HTTPException(status_code=503, detail=f"Not ready: {reason}")
        return service.get_health_status()

    @app.get("/metrics")
    async def metrics() -> Response:
        if not settings.enable_metrics:
            raise HTTPException(status_code=404, detail="Metrics disabled")
        return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

    @app.get("/")
    async def root() -> dict[str, str]:
        return {
            "name": settings.app_name,
            "version": settings.app_version,
            "transport": "streamable-http",
            "mcp_endpoint": settings.mcp_http_path,
            "health": "/health",
            "livez": "/livez",
            "readyz": "/readyz",
            "metrics": "/metrics",
        }

    app.mount("/", mcp.streamable_http_app())
    return app


__all__ = ["create_http_app"]
