"""
Logging configuration using structlog
"""

import logging
import sys

import structlog

from ..config.settings import settings


def setup_logging():
    """Configure structured logging"""

    # Configure stdlib logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stderr,
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
    )

    # Configure structlog
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer() if settings.debug
            else structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, settings.log_level.upper(), logging.INFO)
        ),
        context_class=dict,
        # stderr keeps stdio MCP transport clean (stdout is reserved for protocol frames).
        logger_factory=structlog.PrintLoggerFactory(file=sys.stderr),
        cache_logger_on_first_use=True,
    )

    logger = structlog.get_logger()
    logger.info(
        "Logging configured",
        level=settings.log_level,
        environment=settings.environment
    )
