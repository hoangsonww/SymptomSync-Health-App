"""
Diagnostic Analyzer Agent - Third stage in the assembly line
Performs preliminary diagnostic analysis based on symptoms and knowledge
"""

from typing import Dict, Any, List
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from .base_agent import BaseAgent


class DiagnosticAnalysis(BaseModel):
    """Structured output for diagnostic analysis"""
    preliminary_diagnoses: List[str] = Field(description="Possible conditions")
    confidence_scores: Dict[str, float] = Field(description="Confidence for each diagnosis")
    reasoning: str = Field(description="Medical reasoning behind the analysis")
    requires_immediate_care: bool = Field(description="Whether immediate medical care is needed")


class DiagnosticAnalyzerAgent(BaseAgent):
    """
    Performs preliminary diagnostic analysis.

    DISCLAIMER: This is NOT a medical diagnosis tool. It provides preliminary
    analysis for informational purposes only. Users should always consult
    with qualified healthcare professionals.
    """

    def __init__(self, **kwargs):
        super().__init__(
            name="DiagnosticAnalyzer",
            description="Performs preliminary diagnostic analysis",
            **kwargs
        )
        self.parser = JsonOutputParser(pydantic_object=DiagnosticAnalysis)
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a medical analysis assistant.

CRITICAL DISCLAIMER: You are NOT providing medical diagnoses. You are
providing preliminary analysis for informational purposes only.

Your task is to analyze symptoms and relevant medical knowledge to identify
POSSIBLE conditions that might be associated with the symptoms.

Always emphasize that:
1. This is NOT a medical diagnosis
2. Users should consult healthcare professionals
3. This is for informational purposes only

Be thorough but conservative in your analysis.

{format_instructions}"""),
            ("user", """Analyze the following medical information:

Symptoms: {symptoms}
Severity Levels: {severity}
Duration: {duration}

Patient Context:
- Age: {age}
- Gender: {gender}
- Medical History: {medical_history}
- Current Medications: {medications}

Retrieved Medical Knowledge:
{knowledge}

Provide a preliminary analysis of possible conditions associated with these symptoms.
Remember: This is NOT a diagnosis, only informational analysis."""),
        ])

    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Perform diagnostic analysis"""

        symptoms = state.get("symptoms", [])
        if not symptoms:
            return {
                "preliminary_diagnosis": [],
                "confidence_score": 0.0,
                "next_action": "ask_clarification",
            }

        chain = self.prompt | self.llm | self.parser

        try:
            result = await chain.ainvoke({
                "symptoms": ", ".join(symptoms),
                "severity": state.get("symptom_severity", {}),
                "duration": state.get("symptom_duration", {}),
                "age": state.get("age", "Not provided"),
                "gender": state.get("gender", "Not provided"),
                "medical_history": state.get("medical_history", []),
                "medications": state.get("current_medications", []),
                "knowledge": state.get("synthesized_knowledge", "No knowledge retrieved"),
                "format_instructions": self.parser.get_format_instructions(),
            })

            # Calculate overall confidence
            avg_confidence = (
                sum(result["confidence_scores"].values()) / len(result["confidence_scores"])
                if result["confidence_scores"]
                else 0.0
            )

            return {
                "preliminary_diagnosis": result["preliminary_diagnoses"],
                "diagnostic_reasoning": result["reasoning"],
                "confidence_score": avg_confidence,
                "requires_immediate_care": result["requires_immediate_care"],
                "next_action": "continue",
            }

        except Exception as e:
            self.logger.error(f"Diagnostic analysis failed: {str(e)}")
            return {
                "errors": state.get("errors", []) + [f"Diagnostic analysis failed: {str(e)}"],
                "next_action": "continue",
            }
