"""
Recommendation Generator Agent - Fifth stage in the assembly line
Generates personalized health recommendations and advice
"""

from typing import Dict, Any, List
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from .base_agent import BaseAgent


class Recommendations(BaseModel):
    """Structured output for recommendations"""
    immediate_actions: List[str] = Field(description="Actions to take right away")
    lifestyle_recommendations: List[str] = Field(description="Lifestyle and self-care advice")
    dietary_advice: List[str] = Field(description="Dietary recommendations")
    activity_guidance: List[str] = Field(description="Physical activity guidance")
    symptom_relief: List[str] = Field(description="Safe symptom relief measures")
    when_to_escalate: str = Field(description="When to seek emergency care")


class RecommendationGeneratorAgent(BaseAgent):
    """
    Generates personalized health recommendations.

    This agent provides actionable, evidence-based recommendations for
    symptom management and lifestyle modifications.
    """

    def __init__(self, **kwargs):
        super().__init__(
            name="RecommendationGenerator",
            description="Generates personalized health recommendations",
            **kwargs
        )
        self.parser = JsonOutputParser(pydantic_object=Recommendations)
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a health recommendation specialist.

Provide personalized, evidence-based recommendations for symptom management
and overall health improvement.

Guidelines:
1. Only suggest safe, general recommendations
2. Never recommend prescription medications
3. Always emphasize consulting healthcare professionals
4. Be specific and actionable
5. Consider patient's context (age, medical history, etc.)

{format_instructions}"""),
            ("user", """Generate personalized recommendations for:

Symptoms: {symptoms}
Preliminary Conditions: {diagnosis}
Risk Level: {risk_level}
Urgency: {urgency}

Patient Context:
- Age: {age}
- Gender: {gender}
- Medical History: {medical_history}
- Current Medications: {medications}
- Allergies: {allergies}

Risk Assessment:
{risk_assessment}

Provide comprehensive, personalized recommendations."""),
        ])

    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Generate recommendations"""

        chain = self.prompt | self.llm | self.parser

        try:
            result = await chain.ainvoke({
                "symptoms": ", ".join(state.get("symptoms", [])),
                "diagnosis": state.get("preliminary_diagnosis", []),
                "risk_level": state.get("risk_assessment", {}).get("risk_level", "unknown"),
                "urgency": state.get("urgency_level", "unknown"),
                "age": state.get("age", "Not provided"),
                "gender": state.get("gender", "Not provided"),
                "medical_history": state.get("medical_history", []),
                "medications": state.get("current_medications", []),
                "allergies": state.get("allergies", []),
                "risk_assessment": state.get("risk_assessment", {}),
                "format_instructions": self.parser.get_format_instructions(),
            })

            # Combine all recommendations
            all_recommendations = (
                result["immediate_actions"] +
                result["lifestyle_recommendations"] +
                result["symptom_relief"]
            )

            return {
                "recommendations": all_recommendations,
                "lifestyle_advice": result["lifestyle_recommendations"],
                "dietary_advice": result["dietary_advice"],
                "activity_guidance": result["activity_guidance"],
                "immediate_actions": result["immediate_actions"],
                "symptom_relief_measures": result["symptom_relief"],
                "escalation_criteria": result["when_to_escalate"],
                "next_action": "end",
            }

        except Exception as e:
            self.logger.error(f"Recommendation generation failed: {str(e)}")
            return {
                "recommendations": [
                    "Please consult with a healthcare professional for personalized advice."
                ],
                "errors": state.get("errors", []) + [f"Recommendation generation failed: {str(e)}"],
                "next_action": "end",
            }
