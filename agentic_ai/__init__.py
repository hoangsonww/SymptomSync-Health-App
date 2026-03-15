"""
SymptomSync Agentic AI Pipeline
A sophisticated multi-agent system for health symptom analysis and recommendations.
"""

__version__ = "1.0.0"
__author__ = "SymptomSync Team"

__all__ = ["SymptomSyncGraph", "MCPServer"]


def __getattr__(name: str):
    """Lazy imports to avoid importing heavy optional dependencies at package import time."""
    if name == "SymptomSyncGraph":
        from .graphs.assembly_line import SymptomSyncGraph

        return SymptomSyncGraph

    if name == "MCPServer":
        from .model_context_server.server import MCPServer

        return MCPServer

    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")
