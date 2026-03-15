"""
Symptom Analysis Chain - Simplified chain for direct symptom analysis
"""

from typing import Any

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough
from langchain_openai import ChatOpenAI

from ..config.settings import settings


class SymptomAnalysisChain:
    """
    A simplified LangChain chain for quick symptom analysis.

    This provides a lighter-weight alternative to the full assembly line
    for simple queries.
    """

    def __init__(self, llm: ChatOpenAI | None = None):
        """Initialize the chain"""
        self.llm = llm or ChatOpenAI(
            model=settings.primary_model,
            temperature=settings.temperature,
            api_key=settings.openai_api_key,
        )

        self.chain = self._build_chain()

    def _build_chain(self):
        """Build the LangChain chain"""

        # Symptom extraction prompt
        symptom_prompt = ChatPromptTemplate.from_messages([
            ("system", "Extract symptoms from the user's description. List them clearly."),
            ("user", "{input}"),
        ])

        # Analysis prompt
        analysis_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a medical information assistant. Provide general
information about the symptoms mentioned. This is NOT medical advice."""),
            ("user", "Symptoms: {symptoms}\n\nProvide general information."),
        ])

        # Build parallel chain
        chain = (
            {"input": RunnablePassthrough()}
            | RunnableParallel(
                symptoms=symptom_prompt | self.llm | StrOutputParser(),
                input=RunnablePassthrough(),
            )
            | {
                "symptoms": lambda x: x["symptoms"],
                "analysis": analysis_prompt | self.llm | StrOutputParser(),
            }
        )

        return chain

    async def analyze(self, user_input: str) -> dict[str, Any]:
        """Analyze symptoms from user input"""
        result = await self.chain.ainvoke({"input": user_input})
        if isinstance(result, dict):
            return result
        return {"analysis": str(result)}

    def invoke_sync(self, user_input: str) -> dict[str, Any]:
        """Synchronous analysis"""
        result = self.chain.invoke({"input": user_input})
        if isinstance(result, dict):
            return result
        return {"analysis": str(result)}
