"""MCP instance construction for SymptomSync."""

from __future__ import annotations

from typing import Literal, TypeAlias, cast

from mcp.server.fastmcp import FastMCP

try:
    from ..config.settings import settings
except ImportError:
    from config.settings import settings


LogLevel: TypeAlias = Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
VALID_LOG_LEVELS: set[LogLevel] = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}


def _resolve_log_level(raw_level: str) -> LogLevel:
    """Return a valid FastMCP log level."""
    upper_level = raw_level.upper()
    if upper_level in VALID_LOG_LEVELS:
        return cast(LogLevel, upper_level)
    return "INFO"


mcp = FastMCP(
    settings.app_name,
    instructions=(
        "SymptomSync performs symptom triage using a multi-agent graph. "
        "Always return the disclaimer and encourage professional medical follow-up."
    ),
    debug=settings.debug,
    log_level=_resolve_log_level(settings.log_level),
    json_response=True,
    host=settings.mcp_server_host,
    port=settings.mcp_server_port,
    streamable_http_path=settings.mcp_http_path,
)


__all__ = ["mcp"]
