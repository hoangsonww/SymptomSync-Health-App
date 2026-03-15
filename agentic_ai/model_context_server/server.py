"""Public MCP server API and compatibility exports.

This module intentionally stays thin. Implementation is split across:
- `mcp_instance.py` for FastMCP construction
- `primitives.py` for tools/resources/prompts registration
- `http_gateway.py` for HTTP app and middleware
- `runtime.py` for transport startup logic
"""

from __future__ import annotations

from . import primitives as _primitives  # noqa: F401
from .http_gateway import create_http_app
from .mcp_instance import mcp
from .runtime import MCPServer, mcp_server, run_server

__all__ = [
    "mcp",
    "create_http_app",
    "run_server",
    "MCPServer",
    "mcp_server",
]
