"""
Knowledge Retriever Agent - Second stage in the assembly line
Retrieves relevant medical knowledge from vector stores
"""

from typing import Dict, Any, List, Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
from .base_agent import BaseAgent
from ..config.settings import settings


class KnowledgeRetrieverAgent(BaseAgent):
    """
    Retrieves relevant medical knowledge based on extracted symptoms.

    This agent queries vector stores and knowledge bases to find relevant
    medical information that will inform the diagnostic analysis.
    """

    def __init__(self, **kwargs):
        super().__init__(
            name="KnowledgeRetriever",
            description="Retrieves relevant medical knowledge from vector stores",
            **kwargs
        )
        self.embeddings = self._initialize_embeddings()
        self.vector_store = self._initialize_vector_store()

    def _initialize_embeddings(self):
        """Initialize embeddings based on configuration"""
        try:
            if settings.openai_api_key:
                return OpenAIEmbeddings(api_key=settings.openai_api_key)
            elif settings.google_ai_api_key:
                return GoogleGenerativeAIEmbeddings(
                    model="models/embedding-001",
                    google_api_key=settings.google_ai_api_key
                )
            else:
                # Fallback to local embeddings
                return HuggingFaceEmbeddings(
                    model_name="sentence-transformers/all-MiniLM-L6-v2"
                )
        except Exception as e:
            self.logger.warning(f"Failed to initialize cloud embeddings: {e}. Using local embeddings.")
            return HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2"
            )

    def _initialize_vector_store(self) -> Optional[Chroma]:
        """Initialize vector store"""
        try:
            return Chroma(
                persist_directory=settings.chroma_persist_directory,
                embedding_function=self.embeddings,
                collection_name="medical_knowledge"
            )
        except Exception as e:
            self.logger.warning(f"Vector store not available: {e}")
            return None

    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Retrieve relevant medical knowledge"""

        symptoms = state.get("symptoms", [])
        if not symptoms:
            return {
                "retrieved_documents": [],
                "knowledge_sources": [],
                "next_action": "continue",
            }

        # Create search query
        query = self._create_search_query(symptoms, state)

        # Retrieve documents
        documents = await self._retrieve_documents(query)

        # Enhance with LLM synthesis
        synthesized_knowledge = await self._synthesize_knowledge(documents, symptoms)

        return {
            "retrieved_documents": documents,
            "knowledge_sources": [doc.get("source", "Unknown") for doc in documents],
            "synthesized_knowledge": synthesized_knowledge,
            "next_action": "continue",
        }

    def _create_search_query(self, symptoms: List[str], state: Dict[str, Any]) -> str:
        """Create an effective search query from symptoms and context"""
        query_parts = [f"symptoms: {', '.join(symptoms)}"]

        if state.get("age"):
            query_parts.append(f"age {state['age']}")

        if state.get("medical_history"):
            query_parts.append(f"history: {', '.join(state['medical_history'][:3])}")

        return " | ".join(query_parts)

    async def _retrieve_documents(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Retrieve relevant documents from vector store"""
        if not self.vector_store:
            self.logger.warning("Vector store not available, returning empty results")
            return []

        try:
            results = await self.vector_store.asimilarity_search_with_score(
                query, k=k
            )

            documents = []
            for doc, score in results:
                documents.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "relevance_score": float(score),
                    "source": doc.metadata.get("source", "Unknown"),
                })

            return documents

        except Exception as e:
            self.logger.error(f"Document retrieval failed: {str(e)}")
            return []

    async def _synthesize_knowledge(
        self, documents: List[Dict[str, Any]], symptoms: List[str]
    ) -> str:
        """Synthesize retrieved knowledge using LLM"""
        if not documents:
            return "No relevant medical knowledge retrieved."

        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a medical knowledge synthesizer.
Combine the retrieved medical information into a concise, relevant summary."""),
            ("user", """Symptoms: {symptoms}

Retrieved Information:
{documents}

Provide a synthesized summary of the most relevant medical knowledge."""),
        ])

        try:
            chain = prompt | self.llm
            result = await chain.ainvoke({
                "symptoms": ", ".join(symptoms),
                "documents": "\n\n".join([
                    f"Source {i+1}: {doc['content'][:500]}..."
                    for i, doc in enumerate(documents[:3])
                ])
            })

            return result.content

        except Exception as e:
            self.logger.error(f"Knowledge synthesis failed: {str(e)}")
            return "Failed to synthesize knowledge."
