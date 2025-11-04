"""
State definitions for the LangGraph assembly line
"""

from typing import TypedDict, Annotated, List, Dict, Optional, Any
from langgraph.graph import add_messages
from langchain_core.messages import BaseMessage


class AgentState(TypedDict):
    """
    State object that flows through the assembly line.

    This represents the shared state between all agents in the pipeline.
    Each agent can read from and write to this state.
    """

    # Conversation messages
    messages: Annotated[List[BaseMessage], add_messages]

    # User input and context
    user_input: str
    user_id: Optional[str]
    session_id: Optional[str]

    # Symptom analysis data
    symptoms: List[str]
    symptom_severity: Dict[str, int]  # symptom -> severity (1-10)
    symptom_duration: Dict[str, str]  # symptom -> duration
    extracted_entities: Dict[str, Any]

    # Medical context
    medical_history: Optional[List[str]]
    current_medications: Optional[List[str]]
    allergies: Optional[List[str]]
    age: Optional[int]
    gender: Optional[str]

    # Analysis results
    preliminary_diagnosis: Optional[List[str]]
    risk_assessment: Optional[Dict[str, Any]]
    urgency_level: Optional[str]  # low, medium, high, emergency

    # Recommendations
    recommendations: Optional[List[str]]
    lifestyle_advice: Optional[List[str]]
    when_to_see_doctor: Optional[str]

    # Knowledge retrieval
    retrieved_documents: Optional[List[Dict[str, Any]]]
    knowledge_sources: Optional[List[str]]

    # Agent tracking
    current_agent: Optional[str]
    agent_history: List[str]
    iteration_count: int

    # Error handling
    errors: List[str]
    warnings: List[str]

    # Metadata
    timestamp: Optional[str]
    processing_time: Optional[float]
    confidence_score: Optional[float]

    # Next action
    next_action: Optional[str]  # continue, end, escalate, ask_clarification


class SymptomAnalysisInput(TypedDict):
    """Input schema for symptom analysis"""
    user_input: str
    user_id: Optional[str]
    session_id: Optional[str]
    medical_history: Optional[List[str]]
    current_medications: Optional[List[str]]
    allergies: Optional[List[str]]
    age: Optional[int]
    gender: Optional[str]


class SymptomAnalysisOutput(TypedDict):
    """Output schema for symptom analysis"""
    symptoms: List[str]
    preliminary_diagnosis: List[str]
    risk_assessment: Dict[str, Any]
    urgency_level: str
    recommendations: List[str]
    when_to_see_doctor: str
    confidence_score: float
    processing_time: float
