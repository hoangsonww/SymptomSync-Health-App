"""MCP resource registrations."""

from __future__ import annotations

from typing import Any

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


@mcp.resource(
    "symptomsync://guidelines/triage",
    name="triage-guidelines",
    description="Safety-focused triage guidelines",
)
async def triage_guidelines_resource() -> str:
    """Return markdown triage guidelines for clients."""
    return service.triage_guidelines_markdown()


@mcp.resource(
    "symptomsync://guidelines/urgency-matrix",
    name="urgency-matrix",
    description="Structured urgency-level matrix",
)
async def urgency_matrix_resource() -> dict[str, Any]:
    """Return urgency matrix for client display and policy checks."""
    return service.urgency_matrix_resource()


@mcp.resource(
    "symptomsync://ops/metrics-snapshot",
    name="metrics-snapshot",
    description="Current runtime metrics snapshot",
)
async def metrics_snapshot_resource() -> MetricsSnapshotResponse:
    """Return current runtime metrics snapshot."""
    return service.metrics_snapshot()


@mcp.resource(
    "symptomsync://ops/dependency-status",
    name="dependency-status",
    description="Current dependency and config status",
)
async def dependency_status_resource() -> DependencyStatusResponse:
    """Return current dependency and configuration status."""
    return service.dependency_status()


@mcp.resource(
    "symptomsync://ops/runtime-policy",
    name="runtime-policy",
    description="Runtime hardening policy validation status",
)
async def runtime_policy_resource() -> RuntimePolicyValidationResponse:
    """Return runtime hardening control validation details."""
    return service.runtime_policy_validation()


@mcp.resource(
    "symptomsync://catalog/capabilities",
    name="capability-catalog",
    description="Catalog of available tools/resources/prompts",
)
async def capability_catalog_resource() -> CapabilityCatalogResponse:
    """Return capability catalog as a resource."""
    return await _catalog()


__all__ = [
    "triage_guidelines_resource",
    "urgency_matrix_resource",
    "metrics_snapshot_resource",
    "dependency_status_resource",
    "runtime_policy_resource",
    "capability_catalog_resource",
]

