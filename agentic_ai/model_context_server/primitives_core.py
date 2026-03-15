"""Core MCP tool/resource/prompt registrations."""

from __future__ import annotations

from typing import Any

try:
    from ..config.settings import settings
except ImportError:
    from config.settings import settings
from .mcp_instance import mcp
from .models import (
    BatchAnalysisResponse,
    GraphVisualization,
    HealthStatus,
    RuntimeConfig,
    SymptomAnalysisRequest,
    SymptomAnalysisResponse,
)
from .service import service


@mcp.tool(name="analyze_symptoms", description="Run single-request symptom analysis")
async def analyze_symptoms(
    user_input: str,
    user_id: str | None = None,
    session_id: str | None = None,
    age: int | None = None,
    gender: str | None = None,
    medical_history: list[str] | None = None,
    current_medications: list[str] | None = None,
    allergies: list[str] | None = None,
) -> SymptomAnalysisResponse:
    """Analyze symptoms and return triage recommendations."""
    request = SymptomAnalysisRequest(
        user_input=user_input,
        user_id=user_id,
        session_id=session_id,
        age=age,
        gender=gender,
        medical_history=medical_history,
        current_medications=current_medications,
        allergies=allergies,
    )
    return await service.analyze_symptoms(request)


@mcp.tool(
    name="batch_analyze_symptoms",
    description="Run symptom analysis for multiple requests",
)
async def batch_analyze_symptoms(requests: list[dict[str, Any]]) -> BatchAnalysisResponse:
    """Analyze up to configured max symptom requests in one MCP tool call."""
    if not requests:
        raise ValueError("At least one request is required")
    if len(requests) > settings.mcp_batch_max_requests:
        raise ValueError(
            f"A maximum of {settings.mcp_batch_max_requests} requests is allowed",
        )

    parsed_requests = [SymptomAnalysisRequest.model_validate(item) for item in requests]
    return await service.batch_analyze_symptoms(parsed_requests)


@mcp.tool(name="visualize_graph", description="Return the LangGraph flow as Mermaid")
async def visualize_graph() -> GraphVisualization:
    """Return a Mermaid diagram for the orchestration graph."""
    return service.get_graph_visualization()


@mcp.tool(name="get_runtime_config", description="Return sanitized runtime config")
async def get_runtime_config() -> RuntimeConfig:
    """Return non-secret configuration details for diagnostics."""
    return service.get_runtime_config()


@mcp.tool(name="health_check", description="Return current service health metadata")
async def health_check() -> HealthStatus:
    """Return current health status for MCP clients."""
    return service.get_health_status()


@mcp.resource(
    "symptomsync://health",
    name="health-status",
    description="Current SymptomSync runtime health",
)
async def health_resource() -> HealthStatus:
    """Resource providing current health metadata."""
    return service.get_health_status()


@mcp.resource(
    "symptomsync://config",
    name="runtime-config",
    description="Sanitized SymptomSync runtime configuration",
)
async def config_resource() -> RuntimeConfig:
    """Resource providing runtime config without credentials."""
    return service.get_runtime_config()


@mcp.prompt(
    name="symptom_triage_prompt",
    title="Symptom Triage",
    description="Template for running symptom triage through analyze_symptoms",
)
def symptom_triage_prompt(
    user_input: str,
    age: int | None = None,
    gender: str | None = None,
) -> str:
    """Prompt template that instructs clients to call analyze_symptoms."""
    age_text = age if age is not None else "unknown"
    gender_text = gender if gender is not None else "unknown"

    return (
        "Use the `analyze_symptoms` tool with the following context.\n"
        f"- user_input: {user_input}\n"
        f"- age: {age_text}\n"
        f"- gender: {gender_text}\n\n"
        "After getting results, summarize urgency, top recommendations, and include the disclaimer."
    )


__all__ = [
    "analyze_symptoms",
    "batch_analyze_symptoms",
    "visualize_graph",
    "get_runtime_config",
    "health_check",
    "health_resource",
    "config_resource",
    "symptom_triage_prompt",
]
