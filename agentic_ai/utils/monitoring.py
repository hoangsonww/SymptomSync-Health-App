"""
Monitoring and metrics collection
"""

from typing import Dict, Any
from prometheus_client import Counter, Histogram, Gauge, Info
import structlog
from ..config.settings import settings

logger = structlog.get_logger()


class MetricsCollector:
    """
    Collects and exposes metrics for monitoring.

    Provides Prometheus-compatible metrics for:
    - Request counts
    - Processing times
    - Agent performance
    - Error rates
    """

    def __init__(self):
        """Initialize metrics collectors"""

        # Agent execution metrics
        self.agent_executions = Counter(
            'symptomsync_agent_executions_total',
            'Total agent executions',
            ['agent_name', 'status']
        )

        self.agent_duration = Histogram(
            'symptomsync_agent_duration_seconds',
            'Agent execution duration',
            ['agent_name']
        )

        # Pipeline metrics
        self.pipeline_executions = Counter(
            'symptomsync_pipeline_executions_total',
            'Total pipeline executions',
            ['status']
        )

        self.pipeline_duration = Histogram(
            'symptomsync_pipeline_duration_seconds',
            'Pipeline execution duration'
        )

        # LLM metrics
        self.llm_calls = Counter(
            'symptomsync_llm_calls_total',
            'Total LLM API calls',
            ['model', 'status']
        )

        self.llm_tokens = Counter(
            'symptomsync_llm_tokens_total',
            'Total tokens used',
            ['model', 'type']  # type: prompt or completion
        )

        # Vector store metrics
        self.vector_queries = Counter(
            'symptomsync_vector_queries_total',
            'Total vector store queries'
        )

        self.vector_query_duration = Histogram(
            'symptomsync_vector_query_duration_seconds',
            'Vector query duration'
        )

        # Error metrics
        self.errors = Counter(
            'symptomsync_errors_total',
            'Total errors',
            ['component', 'error_type']
        )

        # System metrics
        self.active_requests = Gauge(
            'symptomsync_active_requests',
            'Number of active requests'
        )

        # Application info
        self.app_info = Info(
            'symptomsync_app',
            'Application information'
        )
        self.app_info.info({
            'version': settings.app_version,
            'environment': settings.environment,
        })

    def record_agent_execution(
        self,
        agent_name: str,
        duration: float,
        status: str = "success"
    ):
        """Record agent execution metrics"""
        self.agent_executions.labels(
            agent_name=agent_name,
            status=status
        ).inc()

        self.agent_duration.labels(agent_name=agent_name).observe(duration)

    def record_pipeline_execution(self, duration: float, status: str = "success"):
        """Record pipeline execution metrics"""
        self.pipeline_executions.labels(status=status).inc()
        self.pipeline_duration.observe(duration)

    def record_llm_call(
        self,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        status: str = "success"
    ):
        """Record LLM call metrics"""
        self.llm_calls.labels(model=model, status=status).inc()
        self.llm_tokens.labels(model=model, type="prompt").inc(prompt_tokens)
        self.llm_tokens.labels(model=model, type="completion").inc(completion_tokens)

    def record_vector_query(self, duration: float):
        """Record vector store query metrics"""
        self.vector_queries.inc()
        self.vector_query_duration.observe(duration)

    def record_error(self, component: str, error_type: str):
        """Record error metrics"""
        self.errors.labels(component=component, error_type=error_type).inc()

    def increment_active_requests(self):
        """Increment active request counter"""
        self.active_requests.inc()

    def decrement_active_requests(self):
        """Decrement active request counter"""
        self.active_requests.dec()


# Global metrics collector instance
metrics = MetricsCollector()
