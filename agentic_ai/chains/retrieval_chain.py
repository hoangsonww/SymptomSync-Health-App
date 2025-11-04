"""
Medical Knowledge Retrieval Chain - RAG chain for medical knowledge
"""

from typing import List, Dict, Any, Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableParallel
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from ..config.settings import settings


class MedicalKnowledgeChain:
    """
    RAG (Retrieval-Augmented Generation) chain for medical knowledge.

    This chain retrieves relevant medical information from a vector store
    and uses it to provide informed responses.
    """

    def __init__(
        self,
        llm: Optional[ChatOpenAI] = None,
        vector_store: Optional[Chroma] = None,
    ):
        """Initialize the RAG chain"""
        self.llm = llm or ChatOpenAI(
            model=settings.primary_model,
            temperature=settings.temperature,
            api_key=settings.openai_api_key,
        )

        self.embeddings = OpenAIEmbeddings(api_key=settings.openai_api_key)

        self.vector_store = vector_store or self._initialize_vector_store()
        self.chain = self._build_chain()

    def _initialize_vector_store(self) -> Optional[Chroma]:
        """Initialize vector store"""
        try:
            return Chroma(
                persist_directory=settings.chroma_persist_directory,
                embedding_function=self.embeddings,
                collection_name="medical_knowledge"
            )
        except Exception:
            return None

    def _build_chain(self):
        """Build the RAG chain"""

        # Retrieval prompt
        retrieval_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a medical knowledge assistant. Use the retrieved
information to provide accurate, helpful responses. Always emphasize that this
is general information and not medical advice."""),
            ("user", """Context from medical knowledge base:
{context}

Question: {question}

Provide an informative response based on the context."""),
        ])

        # Build the chain
        def format_docs(docs: List[Document]) -> str:
            return "\n\n".join([doc.page_content for doc in docs])

        if self.vector_store:
            retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})

            chain = (
                {
                    "context": retriever | format_docs,
                    "question": RunnablePassthrough(),
                }
                | retrieval_prompt
                | self.llm
                | StrOutputParser()
            )
        else:
            # Fallback chain without retrieval
            chain = retrieval_prompt | self.llm | StrOutputParser()

        return chain

    async def retrieve_and_answer(self, question: str) -> str:
        """Retrieve relevant knowledge and answer the question"""
        try:
            if self.vector_store:
                result = await self.chain.ainvoke(question)
            else:
                result = await self.chain.ainvoke({
                    "context": "No knowledge base available",
                    "question": question,
                })
            return result
        except Exception as e:
            return f"Error retrieving information: {str(e)}"

    async def add_documents(self, documents: List[Dict[str, Any]]):
        """Add documents to the vector store"""
        if not self.vector_store:
            return

        docs = [
            Document(
                page_content=doc["content"],
                metadata=doc.get("metadata", {})
            )
            for doc in documents
        ]

        await self.vector_store.aadd_documents(docs)
