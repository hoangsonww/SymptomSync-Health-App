"""
Tests for individual agents
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from agents.symptom_extractor import SymptomExtractorAgent
from agents.knowledge_retriever import KnowledgeRetrieverAgent


@pytest.mark.asyncio
class TestSymptomExtractorAgent:
    """Tests for SymptomExtractorAgent"""

    async def test_symptom_extraction(self):
        """Test basic symptom extraction"""
        agent = SymptomExtractorAgent()

        state = {
            "user_input": "I have a headache and feel dizzy",
            "age": 35,
            "gender": "female",
            "medical_history": [],
            "current_medications": [],
            "errors": [],
        }

        with patch.object(agent, 'llm', new_callable=AsyncMock) as mock_llm:
            mock_llm.ainvoke.return_value = Mock(
                content='{"symptoms": ["headache", "dizziness"], "severity": {"headache": 5, "dizziness": 4}, "duration": {"headache": "2 days", "dizziness": "2 days"}, "entities": {}}'
            )

            result = await agent.process(state)

            assert "symptoms" in result
            assert "urgency_level" in result

    async def test_urgency_calculation(self):
        """Test urgency level calculation"""
        agent = SymptomExtractorAgent()

        # Test emergency symptoms
        urgency = agent._calculate_urgency(10, ["chest pain", "difficulty breathing"])
        assert urgency == "emergency"

        # Test high urgency
        urgency = agent._calculate_urgency(8, ["severe headache"])
        assert urgency == "high"

        # Test medium urgency
        urgency = agent._calculate_urgency(5, ["headache"])
        assert urgency == "medium"

        # Test low urgency
        urgency = agent._calculate_urgency(2, ["minor ache"])
        assert urgency == "low"


@pytest.mark.asyncio
class TestKnowledgeRetrieverAgent:
    """Tests for KnowledgeRetrieverAgent"""

    async def test_search_query_creation(self):
        """Test search query creation"""
        agent = KnowledgeRetrieverAgent()

        state = {
            "symptoms": ["headache", "dizziness"],
            "age": 35,
            "medical_history": ["hypertension"],
        }

        query = agent._create_search_query(state["symptoms"], state)
        assert "headache" in query
        assert "dizziness" in query
        assert "35" in query

    async def test_document_retrieval(self):
        """Test document retrieval"""
        agent = KnowledgeRetrieverAgent()

        # Mock vector store to return None (unavailable)
        agent.vector_store = None

        docs = await agent._retrieve_documents("headache")
        assert docs == []


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
