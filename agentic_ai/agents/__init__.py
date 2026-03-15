"""Agent implementations for the Agentic AI pipeline."""

__all__ = [
    "SymptomExtractorAgent",
    "KnowledgeRetrieverAgent",
    "DiagnosticAnalyzerAgent",
    "RiskAssessorAgent",
    "RecommendationGeneratorAgent",
    "OrchestratorAgent",
]


def __getattr__(name: str):
    """Lazily import agents to avoid heavy dependency import at package import time."""
    if name == "SymptomExtractorAgent":
        from .symptom_extractor import SymptomExtractorAgent

        return SymptomExtractorAgent
    if name == "KnowledgeRetrieverAgent":
        from .knowledge_retriever import KnowledgeRetrieverAgent

        return KnowledgeRetrieverAgent
    if name == "DiagnosticAnalyzerAgent":
        from .diagnostic_analyzer import DiagnosticAnalyzerAgent

        return DiagnosticAnalyzerAgent
    if name == "RiskAssessorAgent":
        from .risk_assessor import RiskAssessorAgent

        return RiskAssessorAgent
    if name == "RecommendationGeneratorAgent":
        from .recommendation_generator import RecommendationGeneratorAgent

        return RecommendationGeneratorAgent
    if name == "OrchestratorAgent":
        from .orchestrator import OrchestratorAgent

        return OrchestratorAgent
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")
