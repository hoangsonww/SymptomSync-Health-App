"""Tests for the standalone MCP server surface."""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient

from agentic_ai.config.settings import settings
from agentic_ai.model_context_server.models import SymptomAnalysisResponse
from agentic_ai.model_context_server.runtime import run_server
from agentic_ai.model_context_server.server import create_http_app, mcp
from agentic_ai.model_context_server.service import service


@pytest.mark.asyncio
class TestMCPServer:
    """Validate MCP primitives exposed by SymptomSync."""

    async def test_tools_registered(self):
        tools = await mcp.list_tools()
        tool_names = {tool.name for tool in tools}

        expected = {
            "analyze_symptoms",
            "batch_analyze_symptoms",
            "visualize_graph",
            "get_runtime_config",
            "health_check",
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
            "get_metrics_snapshot",
            "check_dependencies",
            "validate_runtime_policy",
            "get_capability_catalog",
        }
        assert expected.issubset(tool_names)

    async def test_resources_registered(self):
        resources = await mcp.list_resources()
        resource_uris = {str(resource.uri) for resource in resources}

        expected = {
            "symptomsync://health",
            "symptomsync://config",
            "symptomsync://guidelines/triage",
            "symptomsync://guidelines/urgency-matrix",
            "symptomsync://ops/metrics-snapshot",
            "symptomsync://ops/dependency-status",
            "symptomsync://ops/runtime-policy",
            "symptomsync://catalog/capabilities",
        }
        assert expected.issubset(resource_uris)

    async def test_prompts_registered(self):
        prompts = await mcp.list_prompts()
        prompt_names = {prompt.name for prompt in prompts}

        expected = {
            "symptom_triage_prompt",
            "emergency_escalation_prompt",
            "follow_up_checkin_prompt",
            "clinician_handoff_prompt",
            "self_care_planning_prompt",
            "safety_audit_prompt",
        }
        assert expected.issubset(prompt_names)

    async def test_runtime_config_tool(self):
        _, structured = await mcp.call_tool("get_runtime_config", {})

        assert structured["app_name"]
        assert structured["version"]
        assert "openai_api_key" not in structured
        assert "anthropic_api_key" not in structured

    async def test_health_resource(self):
        contents = await mcp.read_resource("symptomsync://health")

        assert contents
        assert "healthy" in contents[0].content

    async def test_prompt_generation(self):
        result = await mcp.get_prompt(
            "symptom_triage_prompt",
            arguments={"user_input": "I have a headache", "age": 30, "gender": "female"},
        )

        first_message = result.messages[0].content
        assert "analyze_symptoms" in first_message.text
        assert "I have a headache" in first_message.text

    async def test_analyze_tool_uses_service(self, monkeypatch):
        async def fake_analyze(_request):
            return SymptomAnalysisResponse(
                symptoms=["headache"],
                preliminary_diagnosis=["tension headache"],
                risk_assessment={"risk_level": "low"},
                urgency_level="low",
                recommendations=["rest"],
                when_to_see_doctor="If symptoms persist",
                confidence_score=0.9,
                processing_time=0.1,
            )

        monkeypatch.setattr(service, "analyze_symptoms", fake_analyze)

        _, structured = await mcp.call_tool(
            "analyze_symptoms",
            {
                "user_input": "I have a headache",
                "age": 30,
            },
        )

        assert structured["symptoms"] == ["headache"]
        assert structured["urgency_level"] == "low"

    async def test_compute_risk_score_tool(self):
        _, structured = await mcp.call_tool(
            "compute_risk_score",
            {
                "urgency_level": "high",
                "red_flags": ["difficulty breathing"],
                "age": 78,
                "known_conditions": ["heart disease"],
                "severity_hint": 9,
            },
        )

        assert structured["risk_score"] >= 75
        assert structured["risk_tier"] in {"high", "critical"}
        assert structured["suggested_urgency"] in {"high", "emergency"}

    async def test_redact_sensitive_text_tool(self):
        _, structured = await mcp.call_tool(
            "redact_sensitive_text",
            {
                "text": "Patient email jane@example.com phone 555-123-4567 ssn 123-45-6789",
            },
        )

        assert "[REDACTED_EMAIL]" in structured["redacted_text"]
        assert "[REDACTED_PHONE]" in structured["redacted_text"]
        assert "[REDACTED_SSN]" in structured["redacted_text"]
        assert structured["redaction_count"] >= 3

    async def test_runtime_policy_validation_tool(self, monkeypatch):
        monkeypatch.setattr(settings, "mcp_require_auth", True)
        monkeypatch.setattr(settings, "mcp_auth_token", None)
        _, structured = await mcp.call_tool("validate_runtime_policy", {})

        assert structured["status"] in {"warn", "fail"}
        assert structured["violations"]


def test_http_gateway_health_and_metrics_endpoints(monkeypatch):
    monkeypatch.setattr(settings, "mcp_require_auth", False)
    monkeypatch.setattr(settings, "enable_metrics", True)
    app = create_http_app()
    client = TestClient(app)

    assert client.get("/health").status_code == 200
    assert client.get("/livez").status_code == 200
    assert client.get("/readyz").status_code == 200

    metrics_response = client.get("/metrics")
    assert metrics_response.status_code == 200
    assert "text/plain" in metrics_response.headers["content-type"]


def test_http_gateway_authentication(monkeypatch):
    monkeypatch.setattr(settings, "mcp_require_auth", True)
    monkeypatch.setattr(settings, "mcp_auth_token", "test-token")
    monkeypatch.setattr(settings, "enable_metrics", True)
    app = create_http_app()
    client = TestClient(app)

    unauthorized = client.get("/metrics")
    assert unauthorized.status_code == 401

    authorized = client.get("/metrics", headers={"Authorization": "Bearer test-token"})
    assert authorized.status_code == 200


def test_http_gateway_rate_limiting(monkeypatch):
    monkeypatch.setattr(settings, "mcp_require_auth", False)
    monkeypatch.setattr(settings, "enable_metrics", True)
    monkeypatch.setattr(settings, "rate_limit_per_minute", 1)
    app = create_http_app()
    client = TestClient(app)

    request_id = uuid.uuid4().hex
    first = client.get("/metrics", headers={"Authorization": f"Bearer {request_id}"})
    second = client.get("/metrics", headers={"Authorization": f"Bearer {request_id}"})

    assert first.status_code == 200
    assert second.status_code == 429


def test_runtime_rejects_missing_token_when_auth_enabled(monkeypatch):
    monkeypatch.setattr(settings, "mcp_workers", 1)
    monkeypatch.setattr(settings, "mcp_require_auth", True)
    monkeypatch.setattr(settings, "mcp_auth_token", None)
    monkeypatch.setattr(settings, "environment", "development")

    with pytest.raises(ValueError, match="requires SYMPTOMSYNC_MCP_AUTH_TOKEN"):
        run_server(transport="streamable-http", host="127.0.0.1", port=8011)


def test_runtime_rejects_unauthenticated_http_in_production(monkeypatch):
    monkeypatch.setattr(settings, "mcp_workers", 1)
    monkeypatch.setattr(settings, "mcp_require_auth", False)
    monkeypatch.setattr(settings, "environment", "production")

    with pytest.raises(ValueError, match="requires SYMPTOMSYNC_MCP_REQUIRE_AUTH=true"):
        run_server(transport="streamable-http", host="127.0.0.1", port=8012)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
