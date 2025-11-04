"""
Base agent class for all agents in the pipeline
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from langchain_core.language_models import BaseChatModel
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
import structlog
from ..config.settings import settings

logger = structlog.get_logger()


class BaseAgent(ABC):
    """
    Abstract base class for all agents in the assembly line.

    Each agent is responsible for a specific task in the pipeline
    and can read/write to the shared state.
    """

    def __init__(
        self,
        name: str,
        llm: Optional[BaseChatModel] = None,
        description: Optional[str] = None,
    ):
        self.name = name
        self.description = description or f"{name} agent"
        self.logger = logger.bind(agent=name)

        # Initialize LLM
        if llm is None:
            self.llm = self._initialize_llm()
        else:
            self.llm = llm

    def _initialize_llm(self) -> BaseChatModel:
        """Initialize the language model based on configuration"""
        try:
            if settings.openai_api_key:
                return ChatOpenAI(
                    model=settings.primary_model,
                    temperature=settings.temperature,
                    max_tokens=settings.max_tokens,
                    api_key=settings.openai_api_key,
                )
            elif settings.anthropic_api_key:
                return ChatAnthropic(
                    model="claude-3-sonnet-20240229",
                    temperature=settings.temperature,
                    max_tokens=settings.max_tokens,
                    api_key=settings.anthropic_api_key,
                )
            elif settings.google_ai_api_key:
                return ChatGoogleGenerativeAI(
                    model="gemini-pro",
                    temperature=settings.temperature,
                    max_output_tokens=settings.max_tokens,
                    google_api_key=settings.google_ai_api_key,
                )
            else:
                # Fallback to OpenAI without key (will fail but gives clear error)
                return ChatOpenAI(model=settings.primary_model)
        except Exception as e:
            self.logger.error(f"Failed to initialize LLM: {str(e)}")
            raise

    @abstractmethod
    async def process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process the state and return updates.

        Args:
            state: Current state of the pipeline

        Returns:
            Dictionary of state updates
        """
        pass

    async def __call__(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point for the agent.

        Args:
            state: Current state of the pipeline

        Returns:
            Updated state
        """
        self.logger.info(f"Starting {self.name} processing")

        try:
            # Update agent tracking
            updates = {
                "current_agent": self.name,
                "agent_history": state.get("agent_history", []) + [self.name],
            }

            # Process the state
            result = await self.process(state)
            updates.update(result)

            self.logger.info(f"Completed {self.name} processing")
            return updates

        except Exception as e:
            self.logger.error(f"Error in {self.name}: {str(e)}")
            return {
                "errors": state.get("errors", []) + [f"{self.name}: {str(e)}"],
                "next_action": "escalate",
            }

    def log_metrics(self, metrics: Dict[str, Any]):
        """Log metrics for monitoring"""
        self.logger.info("Agent metrics", **metrics)
