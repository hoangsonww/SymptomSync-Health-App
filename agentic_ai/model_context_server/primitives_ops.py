"""Operational MCP tool registrations."""

from __future__ import annotations

from .mcp_instance import mcp
from .models import (
    CapabilityCatalogResponse,
    DependencyStatusResponse,
    MetricsSnapshotResponse,
    RuntimePolicyValidationResponse,
)
from .service import service


async def _catalog() -> CapabilityCatalogResponse:
    tools = [tool.name for tool in await mcp.list_tools()]
    resources = [str(resource.uri) for resource in await mcp.list_resources()]
    prompts = [prompt.name for prompt in await mcp.list_prompts()]
    return service.capability_catalog(tools=tools, resources=resources, prompts=prompts)


@mcp.tool(
    name="get_metrics_snapshot",
    description="Get compact operational metrics snapshot",
)
async def get_metrics_snapshot() -> MetricsSnapshotResponse:
    """Get compact operations/telemetry snapshot."""
    return service.metrics_snapshot()


@mcp.tool(
    name="check_dependencies",
    description="Check runtime dependency and configuration status",
)
async def check_dependencies() -> DependencyStatusResponse:
    """Check runtime readiness, API key, and auth configuration status."""
    return service.dependency_status()


@mcp.tool(
    name="validate_runtime_policy",
    description="Validate runtime hardening controls and policy compliance",
)
async def validate_runtime_policy() -> RuntimePolicyValidationResponse:
    """Validate production hardening controls for MCP runtime."""
    return service.runtime_policy_validation()


@mcp.tool(
    name="get_capability_catalog",
    description="Return catalog of exposed MCP tools/resources/prompts and limits",
)
async def get_capability_catalog() -> CapabilityCatalogResponse:
    """Return full catalog of currently exposed MCP primitives."""
    return await _catalog()


__all__ = [
    "get_metrics_snapshot",
    "check_dependencies",
    "validate_runtime_policy",
    "get_capability_catalog",
]

