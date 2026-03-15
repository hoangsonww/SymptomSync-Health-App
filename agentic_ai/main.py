"""Main entry point for SymptomSync Agentic AI Pipeline."""

import argparse
import sys
from pathlib import Path

import structlog

# Support both repository package layout (`agentic_ai/*`) and flattened runtime
# layout (files copied directly into a container working directory).
CURRENT_DIR = Path(__file__).resolve().parent
REPO_ROOT = CURRENT_DIR.parent
for candidate in (str(REPO_ROOT), str(CURRENT_DIR)):
    if candidate not in sys.path:
        sys.path.insert(0, candidate)

try:
    from agentic_ai.config.settings import settings
    from agentic_ai.model_context_server.server import mcp_server
    from agentic_ai.utils.logger import setup_logging
except ModuleNotFoundError:
    from config.settings import settings
    from model_context_server.server import mcp_server
    from utils.logger import setup_logging

logger = structlog.get_logger()


def parse_args() -> argparse.Namespace:
    """Parse runtime arguments for transport-specific startup."""
    parser = argparse.ArgumentParser(description="Run the SymptomSync standalone MCP server")
    parser.add_argument(
        "--transport",
        choices=["stdio", "streamable-http", "sse"],
        default=settings.mcp_transport,
        help="MCP transport mode",
    )
    parser.add_argument(
        "--host",
        default=settings.mcp_server_host,
        help="Host for HTTP/SSE transports",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=settings.mcp_server_port,
        help="Port for HTTP/SSE transports",
    )
    parser.add_argument(
        "--mount-path",
        default=settings.mcp_http_path,
        help="HTTP mount path for SSE transport",
    )
    return parser.parse_args()


def main():
    """Main entry point"""
    args = parse_args()
    setup_logging()

    logger.info(
        "Launching SymptomSync standalone MCP server",
        environment=settings.environment,
        version=settings.app_version,
        transport=args.transport,
        host=args.host if args.transport != "stdio" else None,
        port=args.port if args.transport != "stdio" else None,
        mcp_path=settings.mcp_http_path if args.transport == "streamable-http" else None,
    )

    # Run server
    mcp_server.run(
        transport=args.transport,
        host=args.host,
        port=args.port,
        mount_path=args.mount_path,
    )


if __name__ == "__main__":
    main()
