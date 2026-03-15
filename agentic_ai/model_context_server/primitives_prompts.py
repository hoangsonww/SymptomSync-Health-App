"""MCP prompt template registrations."""

from __future__ import annotations

from .mcp_instance import mcp


@mcp.prompt(
    name="emergency_escalation_prompt",
    title="Emergency Escalation",
    description="Template for handling possible emergency symptoms",
)
def emergency_escalation_prompt(
    user_input: str,
    detected_red_flags: str = "",
) -> str:
    """Prompt template for emergency triage workflow."""
    return (
        "Use `triage_text_heuristics` on this input, then if red flags are found call "
        "`emergency_action_checklist` and summarize immediate steps clearly.\n"
        f"- user_input: {user_input}\n"
        f"- pre-detected red flags: {detected_red_flags or 'none'}\n"
        "Do not provide diagnosis. Prioritize emergency escalation guidance."
    )


@mcp.prompt(
    name="follow_up_checkin_prompt",
    title="Follow-up Check-in",
    description="Template for comparing baseline and follow-up symptom status",
)
def follow_up_checkin_prompt(
    baseline_summary: str,
    follow_up_summary: str,
) -> str:
    """Prompt template for symptom progression check-ins."""
    return (
        "Convert both summaries into structured snapshots and call "
        "`compare_symptom_snapshots`, then explain urgency trend and next steps.\n"
        f"- baseline_summary: {baseline_summary}\n"
        f"- follow_up_summary: {follow_up_summary}\n"
    )


@mcp.prompt(
    name="clinician_handoff_prompt",
    title="Clinician Handoff",
    description="Template for generating concise clinician handoff report",
)
def clinician_handoff_prompt(
    user_input: str,
    analysis_summary: str,
) -> str:
    """Prompt template for handoff report generation."""
    return (
        "Transform the summary into structured analysis fields, then call "
        "`build_clinician_handoff` and return report_markdown.\n"
        f"- user_input: {user_input}\n"
        f"- analysis_summary: {analysis_summary}\n"
    )


@mcp.prompt(
    name="self_care_planning_prompt",
    title="Self-Care Planning",
    description="Template for conservative home-care planning",
)
def self_care_planning_prompt(
    symptoms: str,
    urgency_level: str = "medium",
) -> str:
    """Prompt template for self-care planning workflow."""
    return (
        "Extract symptom list, call `generate_self_care_plan`, then explain what to monitor and "
        "when to escalate using `explain_urgency_level`.\n"
        f"- symptoms: {symptoms}\n"
        f"- urgency_level: {urgency_level}\n"
    )


@mcp.prompt(
    name="safety_audit_prompt",
    title="Safety Audit",
    description="Template for triage safety and operations policy checks",
)
def safety_audit_prompt(symptom_summary: str) -> str:
    """Prompt template for structured safety audits."""
    return (
        "Run `triage_text_heuristics`, `compute_risk_score`, and `validate_runtime_policy`. "
        "Return a short safety decision with explicit escalation criteria.\n"
        f"- symptom_summary: {symptom_summary}\n"
    )


__all__ = [
    "emergency_escalation_prompt",
    "follow_up_checkin_prompt",
    "clinician_handoff_prompt",
    "self_care_planning_prompt",
    "safety_audit_prompt",
]

