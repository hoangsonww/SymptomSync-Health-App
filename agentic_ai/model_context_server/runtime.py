"""Runtime orchestration for MCP server transports."""

from __future__ import annotations

import importlib.util

import structlog
import uvicorn

try:
    from ..config.settings import settings
except ImportError:
    from config.settings import settings
from .http_gateway import create_http_app
from .mcp_instance import mcp

logger = structlog.get_logger()


def _http_app_factory_import_path() -> str:
    """Return import path for create_http_app compatible with current runtime layout."""
    if importlib.util.find_spec("agentic_ai.model_context_server.http_gateway"):
        return "agentic_ai.model_context_server.http_gateway:create_http_app"
    return "model_context_server.http_gateway:create_http_app"


def _validate_runtime_policy(selected_transport: str) -> None:
    """Fail fast on unsafe startup configurations."""
    if settings.mcp_workers <= 0:
        raise ValueError("SYMPTOMSYNC_MCP_WORKERS must be >= 1.")

    if selected_transport != "streamable-http":
        return

    if settings.mcp_require_auth and not settings.mcp_auth_token:
        raise ValueError(
            "SYMPTOMSYNC_MCP_REQUIRE_AUTH=true requires SYMPTOMSYNC_MCP_AUTH_TOKEN to be set.",
        )

    if (
        settings.environment.lower() in {"production", "prod", "staging"}
        and not settings.mcp_require_auth
    ):
        raise ValueError(
            "HTTP MCP transport in staging/production requires SYMPTOMSYNC_MCP_REQUIRE_AUTH=true.",
        )


def run_server(
    transport: str | None = None,
    host: str | None = None,
    port: int | None = None,
    mount_path: str | None = None,
) -> None:
    """Run the standalone MCP server with the selected transport."""
    selected_transport = (transport or settings.mcp_transport).lower()
    _validate_runtime_policy(selected_transport)

    if selected_transport == "stdio":
        logger.info("Starting SymptomSync MCP server", transport="stdio")
        mcp.run(transport="stdio")
        return

    if selected_transport == "streamable-http":
        resolved_host = host or settings.mcp_server_host
        resolved_port = port or settings.mcp_server_port

        logger.info(
            "Starting SymptomSync MCP server",
            transport="streamable-http",
            host=resolved_host,
            port=resolved_port,
            endpoint=f"http://{resolved_host}:{resolved_port}{settings.mcp_http_path}",
        )

        if settings.mcp_workers > 1:
            # Worker mode requires an import string and app factory.
            uvicorn.run(
                _http_app_factory_import_path(),
                host=resolved_host,
                port=resolved_port,
                workers=settings.mcp_workers,
                factory=True,
            )
        else:
            uvicorn.run(
                create_http_app(),
                host=resolved_host,
                port=resolved_port,
            )
        return

    if selected_transport == "sse":
        logger.info(
            "Starting SymptomSync MCP server",
            transport="sse",
            mount_path=mount_path or settings.mcp_http_path,
        )
        mcp.run(transport="sse", mount_path=mount_path or settings.mcp_http_path)
        return

    raise ValueError(
        f"Unsupported MCP transport '{selected_transport}'. Use stdio, streamable-http, or sse.",
    )


class MCPServer:
    """Compatibility wrapper used by existing entrypoints."""

    def run(
        self,
        transport: str | None = None,
        host: str | None = None,
        port: int | None = None,
        mount_path: str | None = None,
    ) -> None:
        run_server(transport=transport, host=host, port=port, mount_path=mount_path)


mcp_server = MCPServer()


__all__ = ["run_server", "MCPServer", "mcp_server"]
