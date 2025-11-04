"""
Symptom Extractor Agent - First stage in the assembly line
Extracts and structures symptoms from user input
"""

from typing import Dict, Any, List
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from .base_agent import BaseAgent


class SymptomExtraction(BaseModel):
    """Structured output for symptom extraction"""
    symptoms: List[str] = Field(description="List of identified symptoms")
    severity: Dict[str, int] = Field(description="Severity rating for each symptom (1-10)")
    duration: Dict[str, str] = Field(description="Duration for each symptom")
    entities: Dict[str, Any] = Field(description="Other extracted medical entities")


class SymptomExtractorAgent(BaseAgent):
    """
    Extracts symptoms and medical information from user input.

    This is the first agent in the assembly line that processes raw user input
    and structures it into a format usable by downstream agents.
    """

    def __init__(self, **kwargs):
        super().__init__(
            name="SymptomExtractor",
            description="Extracts and structures symptoms from user input",
            **kwargs
        )
        self.parser = JsonOutputParser(pydantic_object=SymptomExtraction)
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a medical symptom extraction specialist.
Your task is to carefully analyze user input and extract all mentioned symptoms,
their severity, duration, and other relevant medical information.

Be thorough but only extract information that is explicitly mentioned or
strongly implied. Do not make medical diagnoses.

{format_instructions}"""),
            ("user", """Extract symptoms and medical information from this input:

User Input: {user_input}

Additional Context:
- Age: {age}
- Gender: {gender}
- Medical History: {medical_history}
- Current Medications: {medications}

Provide a structured extraction of all symptoms mentioned."""),
        ])

    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Extract symptoms from user input"""

        # Prepare input
        chain = self.prompt | self.llm | self.parser

        try:
            result = await chain.ainvoke({
                "user_input": state.get("user_input", ""),
                "age": state.get("age", "Not provided"),
                "gender": state.get("gender", "Not provided"),
                "medical_history": state.get("medical_history", []),
                "medications": state.get("current_medications", []),
                "format_instructions": self.parser.get_format_instructions(),
            })

            # Calculate urgency based on severity
            max_severity = max(result["severity"].values()) if result["severity"] else 0
            urgency = self._calculate_urgency(max_severity, result["symptoms"])

            return {
                "symptoms": result["symptoms"],
                "symptom_severity": result["severity"],
                "symptom_duration": result["duration"],
                "extracted_entities": result["entities"],
                "urgency_level": urgency,
                "next_action": "continue" if result["symptoms"] else "ask_clarification",
            }

        except Exception as e:
            self.logger.error(f"Symptom extraction failed: {str(e)}")
            return {
                "errors": state.get("errors", []) + [f"Symptom extraction failed: {str(e)}"],
                "next_action": "ask_clarification",
            }

    def _calculate_urgency(self, max_severity: int, symptoms: List[str]) -> str:
        """Calculate urgency level based on severity and symptoms"""
        # Emergency keywords
        emergency_keywords = [
            "chest pain", "difficulty breathing", "severe bleeding",
            "unconscious", "seizure", "stroke symptoms", "heart attack"
        ]

        symptom_text = " ".join(symptoms).lower()

        if any(keyword in symptom_text for keyword in emergency_keywords):
            return "emergency"
        elif max_severity >= 8:
            return "high"
        elif max_severity >= 5:
            return "medium"
        else:
            return "low"
