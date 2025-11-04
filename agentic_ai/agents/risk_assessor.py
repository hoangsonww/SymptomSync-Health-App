"""
Risk Assessor Agent - Fourth stage in the assembly line
Assesses health risks and urgency levels
"""

from typing import Dict, Any, List
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from .base_agent import BaseAgent


class RiskAssessment(BaseModel):
    """Structured output for risk assessment"""
    overall_risk_level: str = Field(description="Overall risk: low, moderate, high, critical")
    risk_factors: List[str] = Field(description="Identified risk factors")
    urgency_recommendation: str = Field(description="When to seek care")
    red_flags: List[str] = Field(description="Warning signs requiring immediate attention")
    monitoring_advice: str = Field(description="What to monitor")


class RiskAssessorAgent(BaseAgent):
    """
    Assesses health risks and determines urgency of medical attention needed.

    This agent evaluates the severity, progression patterns, and risk factors
    to determine appropriate urgency levels and when to seek care.
    """

    def __init__(self, **kwargs):
        super().__init__(
            name="RiskAssessor",
            description="Assesses health risks and urgency levels",
            **kwargs
        )
        self.parser = JsonOutputParser(pydantic_object=RiskAssessment)
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a medical risk assessment specialist.

Your role is to evaluate health risks based on symptoms, medical history,
and preliminary analysis. Provide clear guidance on when to seek medical care.

Be conservative - when in doubt, recommend seeking professional care.

Always include:
1. Clear urgency levels
2. Specific red flags to watch for
3. Monitoring recommendations

{format_instructions}"""),
            ("user", """Assess the health risks for this case:

Symptoms: {symptoms}
Severity: {severity}
Duration: {duration}

Preliminary Analysis: {preliminary_diagnosis}
Requires Immediate Care: {requires_immediate_care}

Patient Context:
- Age: {age}
- Medical History: {medical_history}
- Current Medications: {medications}
- Allergies: {allergies}

Provide a comprehensive risk assessment."""),
        ])

    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Assess health risks"""

        chain = self.prompt | self.llm | self.parser

        try:
            result = await chain.ainvoke({
                "symptoms": ", ".join(state.get("symptoms", [])),
                "severity": state.get("symptom_severity", {}),
                "duration": state.get("symptom_duration", {}),
                "preliminary_diagnosis": state.get("preliminary_diagnosis", []),
                "requires_immediate_care": state.get("requires_immediate_care", False),
                "age": state.get("age", "Not provided"),
                "medical_history": state.get("medical_history", []),
                "medications": state.get("current_medications", []),
                "allergies": state.get("allergies", []),
                "format_instructions": self.parser.get_format_instructions(),
            })

            # Determine final urgency level
            urgency_level = self._determine_urgency(
                result["overall_risk_level"],
                state.get("requires_immediate_care", False),
                result["red_flags"]
            )

            return {
                "risk_assessment": {
                    "risk_level": result["overall_risk_level"],
                    "risk_factors": result["risk_factors"],
                    "red_flags": result["red_flags"],
                    "monitoring_advice": result["monitoring_advice"],
                },
                "urgency_level": urgency_level,
                "when_to_see_doctor": result["urgency_recommendation"],
                "next_action": "continue",
            }

        except Exception as e:
            self.logger.error(f"Risk assessment failed: {str(e)}")
            return {
                "errors": state.get("errors", []) + [f"Risk assessment failed: {str(e)}"],
                "urgency_level": "high",  # Default to high when assessment fails
                "when_to_see_doctor": "Please consult a healthcare professional as soon as possible.",
                "next_action": "continue",
            }

    def _determine_urgency(
        self, risk_level: str, requires_immediate_care: bool, red_flags: List[str]
    ) -> str:
        """Determine final urgency level"""
        if requires_immediate_care or risk_level == "critical" or len(red_flags) > 2:
            return "emergency"
        elif risk_level == "high" or len(red_flags) > 0:
            return "high"
        elif risk_level == "moderate":
            return "medium"
        else:
            return "low"
