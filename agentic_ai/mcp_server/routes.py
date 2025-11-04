"""
API routes for MCP server
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from typing import Dict, Any
import structlog
import time

from .models import (
    SymptomAnalysisRequest,
    SymptomAnalysisResponse,
    BatchAnalysisRequest,
    BatchAnalysisResponse,
    ErrorResponse,
)
from ..graphs.assembly_line import SymptomSyncGraph
from ..config.settings import settings

logger = structlog.get_logger()

router = APIRouter()

# Initialize the graph (singleton)
_graph_instance = None


def get_graph() -> SymptomSyncGraph:
    """Get or create the graph instance"""
    global _graph_instance
    if _graph_instance is None:
        _graph_instance = SymptomSyncGraph()
    return _graph_instance


@router.post(
    "/analyze",
    response_model=SymptomAnalysisResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Analyze symptoms",
    description="Analyze user symptoms and provide health recommendations"
)
async def analyze_symptoms(
    request: SymptomAnalysisRequest,
    graph: SymptomSyncGraph = Depends(get_graph),
) -> SymptomAnalysisResponse:
    """
    Analyze symptoms and provide recommendations.

    This endpoint runs the full agentic AI pipeline to:
    1. Extract symptoms from user input
    2. Retrieve relevant medical knowledge
    3. Perform preliminary analysis
    4. Assess health risks
    5. Generate personalized recommendations
    """
    try:
        logger.info(
            "Received symptom analysis request",
            user_id=request.user_id,
            session_id=request.session_id
        )

        # Convert request to input format
        input_data = {
            "user_input": request.user_input,
            "user_id": request.user_id,
            "session_id": request.session_id,
            "age": request.age,
            "gender": request.gender,
            "medical_history": request.medical_history,
            "current_medications": request.current_medications,
            "allergies": request.allergies,
        }

        # Run analysis
        result = await graph.analyze_symptoms(input_data)

        # Build response
        response = SymptomAnalysisResponse(
            symptoms=result["symptoms"],
            preliminary_diagnosis=result["preliminary_diagnosis"],
            risk_assessment=result["risk_assessment"],
            urgency_level=result["urgency_level"],
            recommendations=result["recommendations"],
            when_to_see_doctor=result["when_to_see_doctor"],
            confidence_score=result["confidence_score"],
            processing_time=result["processing_time"],
        )

        logger.info(
            "Analysis completed successfully",
            urgency=result["urgency_level"],
            processing_time=result["processing_time"]
        )

        return response

    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post(
    "/analyze/batch",
    response_model=BatchAnalysisResponse,
    summary="Batch analyze symptoms",
    description="Analyze multiple symptom requests in batch"
)
async def batch_analyze_symptoms(
    request: BatchAnalysisRequest,
    graph: SymptomSyncGraph = Depends(get_graph),
) -> BatchAnalysisResponse:
    """
    Batch analyze multiple symptom requests.

    This endpoint processes multiple analysis requests concurrently
    for improved performance.
    """
    start_time = time.time()

    try:
        results = []
        for req in request.requests:
            input_data = {
                "user_input": req.user_input,
                "user_id": req.user_id,
                "session_id": req.session_id,
                "age": req.age,
                "gender": req.gender,
                "medical_history": req.medical_history,
                "current_medications": req.current_medications,
                "allergies": req.allergies,
            }

            result = await graph.analyze_symptoms(input_data)

            response = SymptomAnalysisResponse(
                symptoms=result["symptoms"],
                preliminary_diagnosis=result["preliminary_diagnosis"],
                risk_assessment=result["risk_assessment"],
                urgency_level=result["urgency_level"],
                recommendations=result["recommendations"],
                when_to_see_doctor=result["when_to_see_doctor"],
                confidence_score=result["confidence_score"],
                processing_time=result["processing_time"],
            )
            results.append(response)

        total_time = time.time() - start_time

        return BatchAnalysisResponse(
            results=results,
            total_processing_time=total_time
        )

    except Exception as e:
        logger.error(f"Batch analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Batch analysis failed: {str(e)}"
        )


@router.get(
    "/graph/visualize",
    summary="Visualize the agent graph",
    description="Get a Mermaid diagram of the agent assembly line"
)
async def visualize_graph(
    graph: SymptomSyncGraph = Depends(get_graph),
) -> Dict[str, str]:
    """
    Get a visualization of the agent graph.

    Returns a Mermaid diagram showing the assembly line flow.
    """
    return {
        "diagram": graph.visualize(),
        "format": "mermaid"
    }


@router.get(
    "/config",
    summary="Get configuration",
    description="Get current configuration (sanitized)"
)
async def get_config() -> Dict[str, Any]:
    """
    Get sanitized configuration information.

    API keys and secrets are masked.
    """
    return {
        "app_name": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "primary_model": settings.primary_model,
        "temperature": settings.temperature,
        "max_tokens": settings.max_tokens,
        "vector_store_type": settings.vector_store_type,
        "metrics_enabled": settings.enable_metrics,
        "tracing_enabled": settings.enable_tracing,
    }
