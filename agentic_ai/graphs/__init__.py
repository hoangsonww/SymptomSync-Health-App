"""LangGraph-based state machines and workflows."""

__all__ = ["SymptomSyncGraph", "AgentState"]


def __getattr__(name: str):
    """Lazily import graph modules to keep package imports lightweight."""
    if name == "SymptomSyncGraph":
        from .assembly_line import SymptomSyncGraph

        return SymptomSyncGraph
    if name == "AgentState":
        from .state import AgentState

        return AgentState
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")
