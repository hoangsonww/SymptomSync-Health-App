"""Models for the standalone MCP server surface."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field


class HealthStatus(BaseModel):
    """Health status payload used by tools and resources."""

    status: str = Field(default="healthy")
    version: str
    environment: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


class SymptomAnalysisRequest(BaseModel):
    """Request model for symptom analysis."""

    user_input: str = Field(..., min_length=1, description="User symptom description")
    user_id: str | None = Field(default=None)
    session_id: str | None = Field(default=None)
    age: int | None = Field(default=None, ge=0, le=150)
    gender: str | None = Field(default=None)
    medical_history: list[str] | None = Field(default=None)
    current_medications: list[str] | None = Field(default=None)
    allergies: list[str] | None = Field(default=None)


class SymptomAnalysisResponse(BaseModel):
    """Response model for symptom analysis."""

    symptoms: list[str]
    preliminary_diagnosis: list[str]
    risk_assessment: dict[str, Any]
    urgency_level: str
    recommendations: list[str]
    when_to_see_doctor: str
    confidence_score: float = Field(ge=0.0, le=1.0)
    processing_time: float
    disclaimer: str = Field(
        default="This is NOT medical advice. Always consult healthcare professionals.",
    )


class BatchAnalysisResponse(BaseModel):
    """Response model for batch analysis."""

    results: list[SymptomAnalysisResponse]
    total_processing_time: float


class GraphVisualization(BaseModel):
    """Graph visualization payload."""

    diagram: str
    format: str = Field(default="mermaid")


class RuntimeConfig(BaseModel):
    """Sanitized runtime configuration."""

    app_name: str
    version: str
    environment: str
    primary_model: str
    temperature: float
    max_tokens: int
    vector_store_type: str
    metrics_enabled: bool
    tracing_enabled: bool
    transport: str
    mcp_http_path: str
    mcp_tool_timeout_seconds: int
    mcp_batch_max_requests: int
    mcp_batch_max_concurrency: int
    mcp_require_auth: bool


class TriageHeuristicsResponse(BaseModel):
    """Heuristic-only triage output."""

    detected_symptoms: list[str]
    detected_red_flags: list[str]
    suggested_urgency: str
    rationale: list[str]
    recommended_next_step: str


class ClarificationQuestionsResponse(BaseModel):
    """Structured clarification question output."""

    questions: list[str]
    missing_fields: list[str]
    inferred_symptoms: list[str]


class ClinicianHandoffResponse(BaseModel):
    """Structured handoff report for clinicians or support staff."""

    report_markdown: str
    structured_summary: dict[str, Any]


class SymptomComparisonResponse(BaseModel):
    """Comparison output between two symptom snapshots."""

    new_symptoms: list[str]
    resolved_symptoms: list[str]
    persistent_symptoms: list[str]
    urgency_trend: str
    red_flag_changes: dict[str, list[str]]
    summary: str


class UrgencyExplanationResponse(BaseModel):
    """Human-readable explanation for urgency level."""

    urgency_level: str
    explanation: str
    immediate_actions: list[str]
    seek_care_threshold: str


class SelfCarePlanResponse(BaseModel):
    """Safety-focused self-care plan."""

    urgency_level: str
    actions: list[str]
    avoid: list[str]
    monitoring: list[str]
    disclaimer: str = Field(
        default="Self-care suggestions are informational and not a substitute for medical advice.",
    )


class EmergencyChecklistResponse(BaseModel):
    """Immediate emergency checklist output."""

    detected_red_flags: list[str]
    immediate_steps: list[str]
    emergency_contacts: list[str]


class MetricsSnapshotResponse(BaseModel):
    """Operational metrics snapshot."""

    active_requests: float
    pipeline_executions_total: float
    error_count_total: float
    llm_calls_total: float
    vector_queries_total: float


class DependencyStatusResponse(BaseModel):
    """Dependency and runtime readiness status."""

    status: str
    checks: dict[str, Any]
    warnings: list[str]


class CapabilityCatalogResponse(BaseModel):
    """Catalog of exposed MCP capabilities and limits."""

    tools: list[str]
    resources: list[str]
    prompts: list[str]
    limits: dict[str, Any]


class TriageFactsResponse(BaseModel):
    """Structured facts extracted from free-text symptom descriptions."""

    inferred_symptoms: list[str]
    inferred_duration: str | None
    inferred_severity: int | None
    inferred_context: dict[str, Any]
    red_flags: list[str]


class RiskScoreResponse(BaseModel):
    """Risk scoring output for triage prioritization."""

    risk_score: int = Field(ge=0, le=100)
    risk_tier: str
    contributing_factors: list[str]
    suggested_urgency: str


class CareSettingRecommendationResponse(BaseModel):
    """Recommended care setting and timeframe."""

    care_setting: str
    timeframe: str
    rationale: list[str]


class MonitoringScheduleResponse(BaseModel):
    """Symptom monitoring cadence and escalation triggers."""

    check_interval_minutes: int
    monitoring_window_hours: int
    required_checks: list[str]
    escalation_triggers: list[str]


class TextRedactionResponse(BaseModel):
    """PII redaction result for handoff-safe text."""

    redacted_text: str
    redaction_count: int
    redaction_types: list[str]


class RuntimePolicyValidationResponse(BaseModel):
    """Validation output for runtime hardening policies."""

    status: str
    controls: dict[str, Any]
    warnings: list[str]
    violations: list[str]
