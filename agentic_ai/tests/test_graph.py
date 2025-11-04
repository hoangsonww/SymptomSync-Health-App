"""
Tests for LangGraph assembly line
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from graphs.assembly_line import SymptomSyncGraph
from graphs.state import SymptomAnalysisInput


@pytest.mark.asyncio
class TestSymptomSyncGraph:
    """Tests for SymptomSyncGraph"""

    async def test_graph_initialization(self):
        """Test graph initialization"""
        graph = SymptomSyncGraph()

        assert graph.symptom_extractor is not None
        assert graph.knowledge_retriever is not None
        assert graph.diagnostic_analyzer is not None
        assert graph.risk_assessor is not None
        assert graph.recommendation_generator is not None
        assert graph.orchestrator is not None
        assert graph.graph is not None

    async def test_visualize(self):
        """Test graph visualization"""
        graph = SymptomSyncGraph()
        diagram = graph.visualize()

        assert "graph TD" in diagram
        assert "Symptom Extractor" in diagram
        assert "Knowledge Retriever" in diagram

    @patch('graphs.assembly_line.SymptomSyncGraph.graph')
    async def test_analyze_symptoms_success(self, mock_graph):
        """Test successful symptom analysis"""
        graph = SymptomSyncGraph()

        # Mock the graph execution
        mock_graph.ainvoke = AsyncMock(return_value={
            "symptoms": ["headache"],
            "preliminary_diagnosis": ["tension headache"],
            "risk_assessment": {"risk_level": "low"},
            "urgency_level": "low",
            "recommendations": ["Rest", "Hydrate"],
            "when_to_see_doctor": "If symptoms persist",
            "confidence_score": 0.85,
        })

        input_data: SymptomAnalysisInput = {
            "user_input": "I have a headache",
            "user_id": "test123",
            "session_id": "session123",
            "age": 30,
            "gender": "male",
            "medical_history": None,
            "current_medications": None,
            "allergies": None,
        }

        with patch.object(graph, 'graph', mock_graph):
            result = await graph.analyze_symptoms(input_data)

            assert "symptoms" in result
            assert "recommendations" in result
            assert "processing_time" in result

    async def test_analyze_symptoms_error_handling(self):
        """Test error handling in symptom analysis"""
        graph = SymptomSyncGraph()

        input_data: SymptomAnalysisInput = {
            "user_input": "I have a headache",
            "user_id": None,
            "session_id": None,
            "age": None,
            "gender": None,
            "medical_history": None,
            "current_medications": None,
            "allergies": None,
        }

        # Mock graph to raise an exception
        with patch.object(graph.graph, 'ainvoke', side_effect=Exception("Test error")):
            result = await graph.analyze_symptoms(input_data)

            # Should return safe fallback
            assert result["urgency_level"] == "unknown"
            assert len(result["recommendations"]) > 0
            assert "processing_time" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
