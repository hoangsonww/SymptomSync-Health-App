"""Service layer backing the MCP server primitives."""

from __future__ import annotations

import asyncio
import time
from typing import TYPE_CHECKING, Any

import structlog

try:
    from ..config.settings import settings
    from ..utils.monitoring import metrics
except ImportError:
    from config.settings import settings
    from utils.monitoring import metrics
from .decision_support import (
    build_clarification_questions,
    build_monitoring_schedule,
    build_self_care_plan,
    compare_snapshots,
    compute_risk_score,
    detect_red_flags,
    emergency_checklist,
    explain_urgency,
    extract_triage_facts,
    infer_symptoms,
    recommend_care_setting,
    redact_sensitive_text,
    suggest_urgency,
    summarize_handoff,
    urgency_matrix,
)
from .models import (
    BatchAnalysisResponse,
    CapabilityCatalogResponse,
    CareSettingRecommendationResponse,
    ClarificationQuestionsResponse,
    ClinicianHandoffResponse,
    DependencyStatusResponse,
    EmergencyChecklistResponse,
    GraphVisualization,
    HealthStatus,
    MetricsSnapshotResponse,
    MonitoringScheduleResponse,
    RiskScoreResponse,
    RuntimeConfig,
    RuntimePolicyValidationResponse,
    SelfCarePlanResponse,
    SymptomAnalysisRequest,
    SymptomAnalysisResponse,
    SymptomComparisonResponse,
    TextRedactionResponse,
    TriageFactsResponse,
    TriageHeuristicsResponse,
    UrgencyExplanationResponse,
)

logger = structlog.get_logger()

if TYPE_CHECKING:
    try:
        from ..graphs.assembly_line import SymptomSyncGraph
    except ImportError:
        from graphs.assembly_line import SymptomSyncGraph


class SymptomSyncMCPService:
    """Coordinates graph execution and response shaping for MCP handlers."""

    def __init__(self) -> None:
        self._graph: SymptomSyncGraph | None = None
        self.logger = logger.bind(component="SymptomSyncMCPService")

    def _get_graph(self) -> SymptomSyncGraph:
        """Lazy-load the graph so startup works without model credentials."""
        if self._graph is None:
            try:
                from ..graphs.assembly_line import SymptomSyncGraph
            except ImportError:
                from graphs.assembly_line import SymptomSyncGraph

            self.logger.info("Initializing symptom analysis graph")
            self._graph = SymptomSyncGraph()
        return self._graph

    async def analyze_symptoms(self, request: SymptomAnalysisRequest) -> SymptomAnalysisResponse:
        """Run the full graph for a single symptom analysis request."""
        start_time = time.time()
        metrics.increment_active_requests()

        try:
            result = await asyncio.wait_for(
                self._get_graph().analyze_symptoms(request.model_dump()),
                timeout=settings.mcp_tool_timeout_seconds,
            )
            duration = time.time() - start_time
            metrics.record_pipeline_execution(duration, status="success")

            return SymptomAnalysisResponse(
                symptoms=result.get("symptoms", []),
                preliminary_diagnosis=result.get("preliminary_diagnosis", []),
                risk_assessment=result.get("risk_assessment", {}),
                urgency_level=result.get("urgency_level", "unknown"),
                recommendations=result.get("recommendations", []),
                when_to_see_doctor=result.get(
                    "when_to_see_doctor",
                    "Consult a healthcare professional.",
                ),
                confidence_score=float(result.get("confidence_score", 0.0)),
                processing_time=float(result.get("processing_time", duration)),
            )

        except TimeoutError as exc:  # pragma: no cover - protective fallback
            duration = time.time() - start_time
            self.logger.error(
                "Symptom analysis timed out",
                timeout_seconds=settings.mcp_tool_timeout_seconds,
                error=str(exc),
            )
            metrics.record_error("mcp_service", "TimeoutError")
            metrics.record_pipeline_execution(duration, status="error")

            return SymptomAnalysisResponse(
                symptoms=[],
                preliminary_diagnosis=[],
                risk_assessment={},
                urgency_level="unknown",
                recommendations=[
                    "The analysis timed out. Please retry or consult a healthcare professional."
                ],
                when_to_see_doctor="As soon as possible",
                confidence_score=0.0,
                processing_time=duration,
            )

        except Exception as exc:  # pragma: no cover - protective fallback
            duration = time.time() - start_time
            self.logger.error("Symptom analysis failed", error=str(exc))
            metrics.record_error("mcp_service", exc.__class__.__name__)
            metrics.record_pipeline_execution(duration, status="error")

            return SymptomAnalysisResponse(
                symptoms=[],
                preliminary_diagnosis=[],
                risk_assessment={},
                urgency_level="unknown",
                recommendations=[
                    "We encountered an error processing your request. Please consult a healthcare professional."
                ],
                when_to_see_doctor="As soon as possible",
                confidence_score=0.0,
                processing_time=duration,
            )

        finally:
            metrics.decrement_active_requests()

    async def batch_analyze_symptoms(
        self,
        requests: list[SymptomAnalysisRequest],
    ) -> BatchAnalysisResponse:
        """Run symptom analysis for a batch of requests."""
        start_time = time.time()
        semaphore = asyncio.Semaphore(max(1, settings.mcp_batch_max_concurrency))

        async def run_single(request: SymptomAnalysisRequest) -> SymptomAnalysisResponse:
            async with semaphore:
                return await self.analyze_symptoms(request)

        results = await asyncio.gather(*(run_single(request) for request in requests))
        total_time = time.time() - start_time
        return BatchAnalysisResponse(results=results, total_processing_time=total_time)

    def get_graph_visualization(self) -> GraphVisualization:
        """Return a Mermaid representation of the graph."""
        diagram = self._get_graph().visualize()
        return GraphVisualization(diagram=diagram)

    def get_runtime_config(self) -> RuntimeConfig:
        """Return a sanitized runtime configuration payload."""
        return RuntimeConfig(
            app_name=settings.app_name,
            version=settings.app_version,
            environment=settings.environment,
            primary_model=settings.primary_model,
            temperature=settings.temperature,
            max_tokens=settings.max_tokens,
            vector_store_type=settings.vector_store_type,
            metrics_enabled=settings.enable_metrics,
            tracing_enabled=settings.enable_tracing,
            transport=settings.mcp_transport,
            mcp_http_path=settings.mcp_http_path,
            mcp_tool_timeout_seconds=settings.mcp_tool_timeout_seconds,
            mcp_batch_max_requests=settings.mcp_batch_max_requests,
            mcp_batch_max_concurrency=settings.mcp_batch_max_concurrency,
            mcp_require_auth=settings.mcp_require_auth,
        )

    def get_health_status(self) -> HealthStatus:
        """Return current service health metadata."""
        return HealthStatus(
            status="healthy",
            version=settings.app_version,
            environment=settings.environment,
        )

    def heuristic_triage(
        self,
        user_input: str,
        severity_hint: int | None = None,
        known_conditions: list[str] | None = None,
    ) -> TriageHeuristicsResponse:
        """Run deterministic triage heuristics without using LLM providers."""
        red_flags = detect_red_flags(user_input)
        symptoms = infer_symptoms(user_input)
        urgency, reasons = suggest_urgency(
            red_flags=red_flags,
            severity_hint=severity_hint,
            known_conditions=known_conditions,
        )
        next_step = (
            "Seek emergency care immediately."
            if urgency == "emergency"
            else "Use symptom monitoring and seek care per urgency guidance."
        )
        return TriageHeuristicsResponse(
            detected_symptoms=symptoms,
            detected_red_flags=red_flags,
            suggested_urgency=urgency,
            rationale=reasons,
            recommended_next_step=next_step,
        )

    def clarification_questions(
        self,
        user_input: str,
        age: int | None = None,
        gender: str | None = None,
        medical_history: list[str] | None = None,
        current_medications: list[str] | None = None,
        allergies: list[str] | None = None,
    ) -> ClarificationQuestionsResponse:
        """Generate structured follow-up questions for better triage quality."""
        questions, missing_fields, inferred = build_clarification_questions(
            user_input=user_input,
            age=age,
            gender=gender,
            medical_history=medical_history,
            current_medications=current_medications,
            allergies=allergies,
        )
        return ClarificationQuestionsResponse(
            questions=questions,
            missing_fields=missing_fields,
            inferred_symptoms=inferred,
        )

    def extract_triage_facts(self, user_input: str) -> TriageFactsResponse:
        """Extract structured triage facts from free text."""
        return TriageFactsResponse(**extract_triage_facts(user_input))

    def clinician_handoff(
        self,
        user_input: str,
        analysis: dict,
    ) -> ClinicianHandoffResponse:
        """Build a concise markdown + structured handoff payload."""
        report_markdown, structured = summarize_handoff(user_input=user_input, analysis=analysis)
        return ClinicianHandoffResponse(
            report_markdown=report_markdown,
            structured_summary=structured,
        )

    def compare_symptom_snapshots(
        self,
        baseline_symptoms: list[str],
        followup_symptoms: list[str],
        baseline_urgency: str,
        followup_urgency: str,
        baseline_red_flags: list[str],
        followup_red_flags: list[str],
    ) -> SymptomComparisonResponse:
        """Compare two symptom snapshots and return trends."""
        result = compare_snapshots(
            baseline_symptoms=baseline_symptoms,
            followup_symptoms=followup_symptoms,
            baseline_urgency=baseline_urgency,
            followup_urgency=followup_urgency,
            baseline_red_flags=baseline_red_flags,
            followup_red_flags=followup_red_flags,
        )
        return SymptomComparisonResponse(**result)

    def explain_urgency_level(self, urgency_level: str) -> UrgencyExplanationResponse:
        """Explain urgency level in user-facing terms."""
        return UrgencyExplanationResponse(**explain_urgency(urgency_level))

    def risk_score(
        self,
        urgency_level: str,
        red_flags: list[str],
        age: int | None = None,
        known_conditions: list[str] | None = None,
        severity_hint: int | None = None,
    ) -> RiskScoreResponse:
        """Calculate deterministic risk score for triage prioritization."""
        return RiskScoreResponse(
            **compute_risk_score(
                urgency_level=urgency_level,
                red_flags=red_flags,
                age=age,
                known_conditions=known_conditions,
                severity_hint=severity_hint,
            )
        )

    def recommend_care_setting(
        self,
        urgency_level: str,
        risk_score_value: int,
        has_primary_care: bool = True,
    ) -> CareSettingRecommendationResponse:
        """Recommend care setting and timing from urgency/risk."""
        return CareSettingRecommendationResponse(
            **recommend_care_setting(
                urgency_level=urgency_level,
                risk_score=risk_score_value,
                has_primary_care=has_primary_care,
            )
        )

    def self_care_plan(
        self,
        symptoms: list[str],
        urgency_level: str,
        allergies: list[str] | None = None,
        current_medications: list[str] | None = None,
    ) -> SelfCarePlanResponse:
        """Generate a conservative self-care plan."""
        return SelfCarePlanResponse(
            **build_self_care_plan(
                symptoms=symptoms,
                urgency_level=urgency_level,
                allergies=allergies,
                current_medications=current_medications,
            )
        )

    def emergency_action_checklist(self, red_flags: list[str]) -> EmergencyChecklistResponse:
        """Generate immediate emergency actions checklist."""
        return EmergencyChecklistResponse(**emergency_checklist(red_flags))

    def monitoring_schedule(
        self,
        symptoms: list[str],
        urgency_level: str,
        red_flags: list[str] | None = None,
    ) -> MonitoringScheduleResponse:
        """Generate symptom monitoring schedule and escalation triggers."""
        return MonitoringScheduleResponse(
            **build_monitoring_schedule(
                symptoms=symptoms,
                urgency_level=urgency_level,
                red_flags=red_flags,
            )
        )

    def redact_text(self, text: str) -> TextRedactionResponse:
        """Redact common PII patterns from text payloads."""
        return TextRedactionResponse(**redact_sensitive_text(text))

    def _extract_metric_value(self, metric, sample_name_suffix: str | None = None) -> float:
        """Read current numeric value from a Prometheus metric collector."""
        value = 0.0
        for family in metric.collect():
            for sample in family.samples:
                if sample_name_suffix is None or sample.name.endswith(sample_name_suffix):
                    value += float(sample.value)
        return value

    def metrics_snapshot(self) -> MetricsSnapshotResponse:
        """Return a compact operations snapshot for clients."""
        return MetricsSnapshotResponse(
            active_requests=self._extract_metric_value(metrics.active_requests),
            pipeline_executions_total=self._extract_metric_value(metrics.pipeline_executions, "_total"),
            error_count_total=self._extract_metric_value(metrics.errors, "_total"),
            llm_calls_total=self._extract_metric_value(metrics.llm_calls, "_total"),
            vector_queries_total=self._extract_metric_value(metrics.vector_queries, "_total"),
        )

    def dependency_status(self) -> DependencyStatusResponse:
        """Check core dependency/config status for operations."""
        graph_ready, reason = self.is_ready(deep_check=settings.mcp_readiness_check_graph)

        checks = {
            "graph_ready": graph_ready,
            "graph_reason": reason,
            "openai_configured": bool(settings.openai_api_key),
            "anthropic_configured": bool(settings.anthropic_api_key),
            "google_ai_configured": bool(settings.google_ai_api_key),
            "metrics_enabled": settings.enable_metrics,
            "auth_enabled": settings.mcp_require_auth,
            "auth_token_configured": bool(settings.mcp_auth_token),
            "transport": settings.mcp_transport,
        }

        warnings: list[str] = []
        if settings.mcp_require_auth and not settings.mcp_auth_token:
            warnings.append("HTTP auth enabled but SYMPTOMSYNC_MCP_AUTH_TOKEN is not configured.")
        if not any((settings.openai_api_key, settings.anthropic_api_key, settings.google_ai_api_key)):
            warnings.append("No LLM provider API key configured; graph-based tools may fail.")
        if not graph_ready:
            warnings.append(f"Graph readiness check failed: {reason}")

        return DependencyStatusResponse(
            status="healthy" if graph_ready and not warnings else "degraded",
            checks=checks,
            warnings=warnings,
        )

    def runtime_policy_validation(self) -> RuntimePolicyValidationResponse:
        """Validate runtime controls aligned to production hardening expectations."""
        controls = {
            "auth_required": settings.mcp_require_auth,
            "auth_token_set": bool(settings.mcp_auth_token),
            "metrics_enabled": settings.enable_metrics,
            "tool_timeout_seconds": settings.mcp_tool_timeout_seconds,
            "batch_max_requests": settings.mcp_batch_max_requests,
            "batch_max_concurrency": settings.mcp_batch_max_concurrency,
            "workers": settings.mcp_workers,
            "transport": settings.mcp_transport,
        }

        warnings: list[str] = []
        violations: list[str] = []

        if settings.mcp_require_auth and not settings.mcp_auth_token:
            violations.append("Auth is required but SYMPTOMSYNC_MCP_AUTH_TOKEN is missing.")
        if settings.mcp_tool_timeout_seconds <= 0:
            violations.append("mcp_tool_timeout_seconds must be > 0.")
        if settings.mcp_batch_max_requests <= 0:
            violations.append("mcp_batch_max_requests must be > 0.")
        if settings.mcp_batch_max_concurrency <= 0:
            violations.append("mcp_batch_max_concurrency must be > 0.")
        if settings.mcp_batch_max_concurrency > settings.mcp_batch_max_requests:
            violations.append("mcp_batch_max_concurrency cannot exceed mcp_batch_max_requests.")

        if settings.mcp_transport == "streamable-http" and settings.mcp_workers > 1 and not settings.mcp_require_auth:
            warnings.append("HTTP worker mode enabled without auth requirement.")
        if settings.mcp_tool_timeout_seconds > 180:
            warnings.append("High tool timeout may reduce throughput under load.")
        if not settings.enable_metrics:
            warnings.append("Metrics disabled; production observability reduced.")

        status = "pass" if not violations and not warnings else ("warn" if not violations else "fail")
        return RuntimePolicyValidationResponse(
            status=status,
            controls=controls,
            warnings=warnings,
            violations=violations,
        )

    def capability_catalog(
        self,
        tools: list[str],
        resources: list[str],
        prompts: list[str],
    ) -> CapabilityCatalogResponse:
        """Return structured catalog of exposed MCP capabilities."""
        return CapabilityCatalogResponse(
            tools=tools,
            resources=resources,
            prompts=prompts,
            limits={
                "batch_max_requests": settings.mcp_batch_max_requests,
                "batch_max_concurrency": settings.mcp_batch_max_concurrency,
                "tool_timeout_seconds": settings.mcp_tool_timeout_seconds,
            },
        )

    def triage_guidelines_markdown(self) -> str:
        """Return markdown guidance for symptom triage interactions."""
        return "\n".join(
            [
                "# SymptomSync Triage Guidelines",
                "- Collect symptom onset, duration, severity, and progression.",
                "- Capture patient context: age, chronic conditions, medications, allergies.",
                "- Escalate immediately for red flags (chest pain, severe breathing issues, stroke signs, severe bleeding).",
                "- Provide conservative, safety-first recommendations.",
                "- Always include professional medical disclaimer.",
            ]
        )

    def urgency_matrix_resource(self) -> dict[str, Any]:
        """Return urgency matrix for resource readers."""
        return urgency_matrix()

    def is_ready(self, deep_check: bool = False) -> tuple[bool, str]:
        """Return readiness status; deep mode validates graph initialization."""
        if not deep_check:
            return True, "ready"

        try:
            self._get_graph()
        except Exception as exc:  # pragma: no cover - environment-dependent
            self.logger.error("Readiness check failed", error=str(exc))
            return False, str(exc)
        return True, "ready"


service = SymptomSyncMCPService()
