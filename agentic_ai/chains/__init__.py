"""LangChain chains and components."""

__all__ = ["SymptomAnalysisChain", "MedicalKnowledgeChain"]


def __getattr__(name: str):
    """Lazily import chains to avoid unnecessary heavy imports."""
    if name == "SymptomAnalysisChain":
        from .symptom_chain import SymptomAnalysisChain

        return SymptomAnalysisChain
    if name == "MedicalKnowledgeChain":
        from .retrieval_chain import MedicalKnowledgeChain

        return MedicalKnowledgeChain
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")
