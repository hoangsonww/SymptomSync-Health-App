"""
Orchestrator Agent - Manages the flow through the assembly line
Determines routing and next steps
"""

from typing import Dict, Any
from .base_agent import BaseAgent


class OrchestratorAgent(BaseAgent):
    """
    Orchestrates the flow through the agent assembly line.

    This agent makes routing decisions and determines which agent
    should process next based on the current state.
    """

    def __init__(self, **kwargs):
        super().__init__(
            name="Orchestrator",
            description="Manages flow through the assembly line",
            **kwargs
        )

    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Determine next action and routing"""

        # Check iteration count
        iteration_count = state.get("iteration_count", 0)
        if iteration_count >= 10:
            self.logger.warning("Max iterations reached")
            return {
                "next_action": "end",
                "warnings": state.get("warnings", []) + ["Maximum iterations reached"],
            }

        # Check for errors
        errors = state.get("errors", [])
        if len(errors) >= 3:
            self.logger.error("Too many errors, ending pipeline")
            return {
                "next_action": "end",
                "warnings": state.get("warnings", []) + ["Too many errors occurred"],
            }

        # Check urgency level
        urgency = state.get("urgency_level", "low")
        if urgency == "emergency":
            return {
                "next_action": "escalate",
                "warnings": state.get("warnings", []) + [
                    "EMERGENCY: Seek immediate medical attention"
                ],
            }

        # Determine next agent based on current state
        agent_history = state.get("agent_history", [])
        current_agent = state.get("current_agent", None)

        # Define the assembly line flow
        assembly_line = [
            "SymptomExtractor",
            "KnowledgeRetriever",
            "DiagnosticAnalyzer",
            "RiskAssessor",
            "RecommendationGenerator",
        ]

        # Find next agent in the pipeline
        if current_agent in assembly_line:
            current_index = assembly_line.index(current_agent)
            if current_index < len(assembly_line) - 1:
                next_agent = assembly_line[current_index + 1]
                return {
                    "next_action": "continue",
                    "next_agent": next_agent,
                    "iteration_count": iteration_count + 1,
                }

        # If we've completed the pipeline, end
        if "RecommendationGenerator" in agent_history:
            return {"next_action": "end"}

        # Default: continue to first agent if just starting
        if not agent_history:
            return {
                "next_action": "continue",
                "next_agent": "SymptomExtractor",
                "iteration_count": 0,
            }

        # Fallback
        return {"next_action": "end"}

    def should_ask_clarification(self, state: Dict[str, Any]) -> bool:
        """Determine if we need to ask user for clarification"""
        symptoms = state.get("symptoms", [])
        if not symptoms:
            return True

        # Check if symptoms are too vague
        extracted_entities = state.get("extracted_entities", {})
        if not extracted_entities:
            return True

        return False

    def should_escalate(self, state: Dict[str, Any]) -> bool:
        """Determine if we should escalate to human/emergency"""
        urgency = state.get("urgency_level", "low")
        if urgency == "emergency":
            return True

        requires_immediate_care = state.get("requires_immediate_care", False)
        if requires_immediate_care:
            return True

        # Check for critical risk factors
        risk_assessment = state.get("risk_assessment", {})
        red_flags = risk_assessment.get("red_flags", [])
        if len(red_flags) >= 3:
            return True

        return False
