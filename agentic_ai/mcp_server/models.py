"""
Pydantic models for MCP server API
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class HealthCheck(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Health status")
    version: str = Field(..., description="Application version")
    environment: str = Field(..., description="Environment")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SymptomAnalysisRequest(BaseModel):
    """Request model for symptom analysis"""
    user_input: str = Field(..., description="User's symptom description", min_length=1)
    user_id: Optional[str] = Field(None, description="User identifier")
    session_id: Optional[str] = Field(None, description="Session identifier")
    age: Optional[int] = Field(None, ge=0, le=150, description="Patient age")
    gender: Optional[str] = Field(None, description="Patient gender")
    medical_history: Optional[List[str]] = Field(None, description="Medical history")
    current_medications: Optional[List[str]] = Field(None, description="Current medications")
    allergies: Optional[List[str]] = Field(None, description="Known allergies")

    class Config:
        json_schema_extra = {
            "example": {
                "user_input": "I have a headache and feel dizzy",
                "age": 35,
                "gender": "female",
                "medical_history": ["hypertension"],
                "current_medications": ["lisinopril"],
                "allergies": []
            }
        }


class SymptomAnalysisResponse(BaseModel):
    """Response model for symptom analysis"""
    symptoms: List[str] = Field(..., description="Extracted symptoms")
    preliminary_diagnosis: List[str] = Field(..., description="Possible conditions")
    risk_assessment: Dict[str, Any] = Field(..., description="Risk assessment")
    urgency_level: str = Field(..., description="Urgency level: low, medium, high, emergency")
    recommendations: List[str] = Field(..., description="Health recommendations")
    when_to_see_doctor: str = Field(..., description="When to seek medical care")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Analysis confidence")
    processing_time: float = Field(..., description="Processing time in seconds")
    disclaimer: str = Field(
        default="This is NOT medical advice. Always consult healthcare professionals.",
        description="Medical disclaimer"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "symptoms": ["headache", "dizziness"],
                "preliminary_diagnosis": ["tension headache", "migraine"],
                "risk_assessment": {
                    "risk_level": "low",
                    "risk_factors": ["stress"],
                    "red_flags": []
                },
                "urgency_level": "low",
                "recommendations": [
                    "Rest in a quiet, dark room",
                    "Stay hydrated",
                    "Consider over-the-counter pain relief"
                ],
                "when_to_see_doctor": "If symptoms persist for more than 3 days or worsen",
                "confidence_score": 0.85,
                "processing_time": 2.5,
                "disclaimer": "This is NOT medical advice. Always consult healthcare professionals."
            }
        }


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class BatchAnalysisRequest(BaseModel):
    """Request model for batch analysis"""
    requests: List[SymptomAnalysisRequest] = Field(..., max_length=10)


class BatchAnalysisResponse(BaseModel):
    """Response model for batch analysis"""
    results: List[SymptomAnalysisResponse]
    total_processing_time: float
