"""Triage-oriented MCP tool registrations."""

from __future__ import annotations

from typing import Any

from .mcp_instance import mcp
from .models import (
    CareSettingRecommendationResponse,
    ClarificationQuestionsResponse,
    ClinicianHandoffResponse,
    EmergencyChecklistResponse,
    MonitoringScheduleResponse,
    RiskScoreResponse,
    SelfCarePlanResponse,
    SymptomComparisonResponse,
    TextRedactionResponse,
    TriageFactsResponse,
    TriageHeuristicsResponse,
    UrgencyExplanationResponse,
)
from .service import service


@mcp.tool(
    name="triage_text_heuristics",
    description="Run deterministic symptom triage heuristics (no LLM calls)",
)
async def triage_text_heuristics(
    user_input: str,
    severity_hint: int | None = None,
    known_conditions: list[str] | None = None,
) -> TriageHeuristicsResponse:
    """Run model-independent triage heuristics for fast safety checks."""
    return service.heuristic_triage(
        user_input=user_input,
        severity_hint=severity_hint,
        known_conditions=known_conditions,
    )


@mcp.tool(
    name="extract_triage_facts",
    description="Extract structured triage facts from free-text input",
)
async def extract_triage_facts(user_input: str) -> TriageFactsResponse:
    """Extract symptom, severity, and duration hints from free text."""
    return service.extract_triage_facts(user_input=user_input)


@mcp.tool(
    name="generate_clarification_questions",
    description="Generate follow-up questions for missing triage context",
)
async def generate_clarification_questions(
    user_input: str,
    age: int | None = None,
    gender: str | None = None,
    medical_history: list[str] | None = None,
    current_medications: list[str] | None = None,
    allergies: list[str] | None = None,
) -> ClarificationQuestionsResponse:
    """Generate context-aware follow-up questions for better triage quality."""
    return service.clarification_questions(
        user_input=user_input,
        age=age,
        gender=gender,
        medical_history=medical_history,
        current_medications=current_medications,
        allergies=allergies,
    )


@mcp.tool(
    name="build_clinician_handoff",
    description="Build clinician-ready handoff summary from analysis output",
)
async def build_clinician_handoff(
    user_input: str,
    analysis: dict[str, Any],
) -> ClinicianHandoffResponse:
    """Create structured handoff report from an existing analysis result."""
    return service.clinician_handoff(user_input=user_input, analysis=analysis)


@mcp.tool(
    name="compare_symptom_snapshots",
    description="Compare baseline vs follow-up symptom snapshots",
)
async def compare_symptom_snapshots(
    baseline: dict[str, Any],
    follow_up: dict[str, Any],
) -> SymptomComparisonResponse:
    """Compare two symptom snapshots and return trend metadata."""
    return service.compare_symptom_snapshots(
        baseline_symptoms=baseline.get("symptoms", []),
        followup_symptoms=follow_up.get("symptoms", []),
        baseline_urgency=baseline.get("urgency_level", "unknown"),
        followup_urgency=follow_up.get("urgency_level", "unknown"),
        baseline_red_flags=baseline.get("risk_assessment", {}).get("red_flags", []),
        followup_red_flags=follow_up.get("risk_assessment", {}).get("red_flags", []),
    )


@mcp.tool(
    name="explain_urgency_level",
    description="Explain urgency level and next actions in plain language",
)
async def explain_urgency_level(urgency_level: str) -> UrgencyExplanationResponse:
    """Explain what an urgency level means and what to do next."""
    return service.explain_urgency_level(urgency_level)


@mcp.tool(
    name="compute_risk_score",
    description="Compute deterministic risk score from urgency and context",
)
async def compute_risk_score(
    urgency_level: str,
    red_flags: list[str] | None = None,
    age: int | None = None,
    known_conditions: list[str] | None = None,
    severity_hint: int | None = None,
) -> RiskScoreResponse:
    """Compute risk score for prioritization workflows."""
    return service.risk_score(
        urgency_level=urgency_level,
        red_flags=red_flags or [],
        age=age,
        known_conditions=known_conditions,
        severity_hint=severity_hint,
    )


@mcp.tool(
    name="recommend_care_setting",
    description="Recommend appropriate care setting and timeframe",
)
async def recommend_care_setting(
    urgency_level: str,
    risk_score: int,
    has_primary_care: bool = True,
) -> CareSettingRecommendationResponse:
    """Recommend where and when the user should seek care."""
    return service.recommend_care_setting(
        urgency_level=urgency_level,
        risk_score_value=risk_score,
        has_primary_care=has_primary_care,
    )


@mcp.tool(
    name="generate_self_care_plan",
    description="Generate conservative self-care plan from symptoms and urgency",
)
async def generate_self_care_plan(
    symptoms: list[str],
    urgency_level: str,
    allergies: list[str] | None = None,
    current_medications: list[str] | None = None,
) -> SelfCarePlanResponse:
    """Generate safety-first home-care guidance for non-emergency cases."""
    return service.self_care_plan(
        symptoms=symptoms,
        urgency_level=urgency_level,
        allergies=allergies,
        current_medications=current_medications,
    )


@mcp.tool(
    name="generate_monitoring_schedule",
    description="Generate monitoring cadence and escalation triggers",
)
async def generate_monitoring_schedule(
    symptoms: list[str],
    urgency_level: str,
    red_flags: list[str] | None = None,
) -> MonitoringScheduleResponse:
    """Generate symptom monitoring schedule for follow-up workflows."""
    return service.monitoring_schedule(
        symptoms=symptoms,
        urgency_level=urgency_level,
        red_flags=red_flags,
    )


@mcp.tool(
    name="emergency_action_checklist",
    description="Generate immediate emergency checklist for red-flag symptoms",
)
async def emergency_action_checklist(red_flags: list[str]) -> EmergencyChecklistResponse:
    """Generate immediate emergency actions checklist."""
    return service.emergency_action_checklist(red_flags=red_flags)


@mcp.tool(
    name="redact_sensitive_text",
    description="Redact common PII from text before sharing externally",
)
async def redact_sensitive_text(text: str) -> TextRedactionResponse:
    """Redact common PII patterns (email, phone, SSN, DOB, MRN)."""
    return service.redact_text(text)


__all__ = [
    "triage_text_heuristics",
    "extract_triage_facts",
    "generate_clarification_questions",
    "build_clinician_handoff",
    "compare_symptom_snapshots",
    "explain_urgency_level",
    "compute_risk_score",
    "recommend_care_setting",
    "generate_self_care_plan",
    "generate_monitoring_schedule",
    "emergency_action_checklist",
    "redact_sensitive_text",
]

