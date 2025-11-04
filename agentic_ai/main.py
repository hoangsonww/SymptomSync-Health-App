"""
Main entry point for SymptomSync Agentic AI Pipeline
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from mcp_server.server import mcp_server
from utils.logger import setup_logging
from config.settings import settings


def main():
    """Main entry point"""
    # Setup logging
    setup_logging()

    # Run the MCP server
    print(f"""
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║          SymptomSync Agentic AI Pipeline                 ║
    ║                                                           ║
    ║  Multi-Agent System for Health Symptom Analysis          ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝

    Environment: {settings.environment}
    Version: {settings.app_version}
    Host: {settings.mcp_server_host}
    Port: {settings.mcp_server_port}

    API Documentation: http://{settings.mcp_server_host}:{settings.mcp_server_port}/docs
    Health Check: http://{settings.mcp_server_host}:{settings.mcp_server_port}/health
    Metrics: http://{settings.mcp_server_host}:{settings.mcp_server_port}/metrics

    """)

    # Run server
    mcp_server.run()


if __name__ == "__main__":
    main()
