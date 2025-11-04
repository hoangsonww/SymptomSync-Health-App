"""
LangGraph Assembly Line - Main orchestration graph
Implements the multi-agent assembly line architecture
"""

from typing import Dict, Any, Literal
from datetime import datetime
import time
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage

from .state import AgentState, SymptomAnalysisInput, SymptomAnalysisOutput
from ..agents import (
    SymptomExtractorAgent,
    KnowledgeRetrieverAgent,
    DiagnosticAnalyzerAgent,
    RiskAssessorAgent,
    RecommendationGeneratorAgent,
    OrchestratorAgent,
)
import structlog

logger = structlog.get_logger()


class SymptomSyncGraph:
    """
    Main LangGraph assembly line for symptom analysis.

    This implements a sophisticated multi-agent system where each agent
    performs a specific role in the assembly line:

    1. SymptomExtractor: Extracts symptoms from user input
    2. KnowledgeRetriever: Retrieves relevant medical knowledge
    3. DiagnosticAnalyzer: Performs preliminary analysis
    4. RiskAssessor: Assesses health risks
    5. RecommendationGenerator: Generates personalized recommendations

    The Orchestrator manages the flow between agents.
    """

    def __init__(self):
        """Initialize the assembly line graph"""
        self.logger = logger.bind(component="SymptomSyncGraph")

        # Initialize agents
        self.symptom_extractor = SymptomExtractorAgent()
        self.knowledge_retriever = KnowledgeRetrieverAgent()
        self.diagnostic_analyzer = DiagnosticAnalyzerAgent()
        self.risk_assessor = RiskAssessorAgent()
        self.recommendation_generator = RecommendationGeneratorAgent()
        self.orchestrator = OrchestratorAgent()

        # Build the graph
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        """Build the LangGraph state machine"""

        # Create the graph
        workflow = StateGraph(AgentState)

        # Add nodes for each agent
        workflow.add_node("symptom_extractor", self._symptom_extractor_node)
        workflow.add_node("knowledge_retriever", self._knowledge_retriever_node)
        workflow.add_node("diagnostic_analyzer", self._diagnostic_analyzer_node)
        workflow.add_node("risk_assessor", self._risk_assessor_node)
        workflow.add_node("recommendation_generator", self._recommendation_generator_node)
        workflow.add_node("orchestrator", self._orchestrator_node)

        # Set entry point
        workflow.set_entry_point("symptom_extractor")

        # Define the assembly line flow
        workflow.add_edge("symptom_extractor", "knowledge_retriever")
        workflow.add_edge("knowledge_retriever", "diagnostic_analyzer")
        workflow.add_edge("diagnostic_analyzer", "risk_assessor")
        workflow.add_edge("risk_assessor", "recommendation_generator")
        workflow.add_edge("recommendation_generator", "orchestrator")

        # Add conditional edges from orchestrator
        workflow.add_conditional_edges(
            "orchestrator",
            self._route_from_orchestrator,
            {
                "end": END,
                "continue": "symptom_extractor",
                "escalate": END,
            }
        )

        # Compile the graph
        return workflow.compile()

    async def _symptom_extractor_node(self, state: AgentState) -> AgentState:
        """Symptom extractor node"""
        self.logger.info("Running symptom extractor")
        result = await self.symptom_extractor(state)
        return {**state, **result}

    async def _knowledge_retriever_node(self, state: AgentState) -> AgentState:
        """Knowledge retriever node"""
        self.logger.info("Running knowledge retriever")
        result = await self.knowledge_retriever(state)
        return {**state, **result}

    async def _diagnostic_analyzer_node(self, state: AgentState) -> AgentState:
        """Diagnostic analyzer node"""
        self.logger.info("Running diagnostic analyzer")
        result = await self.diagnostic_analyzer(state)
        return {**state, **result}

    async def _risk_assessor_node(self, state: AgentState) -> AgentState:
        """Risk assessor node"""
        self.logger.info("Running risk assessor")
        result = await self.risk_assessor(state)
        return {**state, **result}

    async def _recommendation_generator_node(self, state: AgentState) -> AgentState:
        """Recommendation generator node"""
        self.logger.info("Running recommendation generator")
        result = await self.recommendation_generator(state)
        return {**state, **result}

    async def _orchestrator_node(self, state: AgentState) -> AgentState:
        """Orchestrator node"""
        self.logger.info("Running orchestrator")
        result = await self.orchestrator(state)
        return {**state, **result}

    def _route_from_orchestrator(
        self, state: AgentState
    ) -> Literal["end", "continue", "escalate"]:
        """Route from orchestrator based on next_action"""
        next_action = state.get("next_action", "end")

        if next_action == "escalate":
            self.logger.warning("Escalating due to high urgency")
            return "escalate"
        elif next_action == "continue":
            # Check if we should continue or end
            if state.get("iteration_count", 0) >= 10:
                return "end"
            return "continue"
        else:
            return "end"

    async def analyze_symptoms(
        self, input_data: SymptomAnalysisInput
    ) -> SymptomAnalysisOutput:
        """
        Main entry point for symptom analysis.

        Args:
            input_data: Input data containing user symptoms and context

        Returns:
            Analysis results with recommendations
        """
        start_time = time.time()

        # Initialize state
        initial_state: AgentState = {
            "messages": [HumanMessage(content=input_data["user_input"])],
            "user_input": input_data["user_input"],
            "user_id": input_data.get("user_id"),
            "session_id": input_data.get("session_id"),
            "medical_history": input_data.get("medical_history"),
            "current_medications": input_data.get("current_medications"),
            "allergies": input_data.get("allergies"),
            "age": input_data.get("age"),
            "gender": input_data.get("gender"),
            "symptoms": [],
            "symptom_severity": {},
            "symptom_duration": {},
            "extracted_entities": {},
            "preliminary_diagnosis": None,
            "risk_assessment": None,
            "urgency_level": None,
            "recommendations": None,
            "lifestyle_advice": None,
            "when_to_see_doctor": None,
            "retrieved_documents": None,
            "knowledge_sources": None,
            "current_agent": None,
            "agent_history": [],
            "iteration_count": 0,
            "errors": [],
            "warnings": [],
            "timestamp": datetime.utcnow().isoformat(),
            "processing_time": None,
            "confidence_score": None,
            "next_action": "continue",
        }

        try:
            # Run the graph
            self.logger.info("Starting symptom analysis pipeline")
            final_state = await self.graph.ainvoke(initial_state)

            processing_time = time.time() - start_time

            # Prepare output
            output: SymptomAnalysisOutput = {
                "symptoms": final_state.get("symptoms", []),
                "preliminary_diagnosis": final_state.get("preliminary_diagnosis", []),
                "risk_assessment": final_state.get("risk_assessment", {}),
                "urgency_level": final_state.get("urgency_level", "unknown"),
                "recommendations": final_state.get("recommendations", []),
                "when_to_see_doctor": final_state.get("when_to_see_doctor", "Consult a healthcare professional"),
                "confidence_score": final_state.get("confidence_score", 0.0),
                "processing_time": processing_time,
            }

            self.logger.info(
                "Symptom analysis completed",
                processing_time=processing_time,
                urgency=output["urgency_level"]
            )

            return output

        except Exception as e:
            self.logger.error(f"Pipeline execution failed: {str(e)}")
            processing_time = time.time() - start_time

            # Return safe fallback output
            return {
                "symptoms": [],
                "preliminary_diagnosis": [],
                "risk_assessment": {},
                "urgency_level": "unknown",
                "recommendations": [
                    "We encountered an error processing your request. "
                    "Please consult with a healthcare professional."
                ],
                "when_to_see_doctor": "As soon as possible",
                "confidence_score": 0.0,
                "processing_time": processing_time,
            }

    def visualize(self) -> str:
        """Generate a Mermaid diagram of the graph"""
        return """
graph TD
    Start([User Input]) --> A[Symptom Extractor]
    A --> B[Knowledge Retriever]
    B --> C[Diagnostic Analyzer]
    C --> D[Risk Assessor]
    D --> E[Recommendation Generator]
    E --> F{Orchestrator}
    F -->|End| G([Output Results])
    F -->|Escalate| H([Emergency Alert])
    F -->|Continue| A
"""
