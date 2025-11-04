"""
MCP (Model Context Protocol) Server
FastAPI-based server for the Agentic AI pipeline
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import structlog
from prometheus_client import Counter, Histogram, generate_latest
from typing import Dict, Any

from ..config.settings import settings
from .routes import router
from .models import HealthCheck

logger = structlog.get_logger()

# Prometheus metrics
REQUEST_COUNT = Counter(
    'symptomsync_requests_total',
    'Total request count',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'symptomsync_request_duration_seconds',
    'Request duration in seconds',
    ['method', 'endpoint']
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan"""
    logger.info("Starting SymptomSync MCP Server", version=settings.app_version)
    yield
    logger.info("Shutting down SymptomSync MCP Server")


class MCPServer:
    """
    Model Context Protocol Server for Agentic AI Pipeline.

    This server provides:
    - REST API for symptom analysis
    - Health checks and monitoring
    - Metrics endpoint for Prometheus
    - Background task processing
    """

    def __init__(self):
        """Initialize the MCP server"""
        self.app = self._create_app()

    def _create_app(self) -> FastAPI:
        """Create and configure FastAPI application"""

        app = FastAPI(
            title="SymptomSync Agentic AI API",
            description="Multi-agent AI system for health symptom analysis",
            version=settings.app_version,
            lifespan=lifespan,
        )

        # Configure CORS
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # Configure appropriately for production
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        # Add middleware
        app.middleware("http")(self._metrics_middleware)

        # Include routers
        app.include_router(router, prefix="/api/v1")

        # Health check endpoint
        @app.get("/health", response_model=HealthCheck)
        async def health_check():
            """Health check endpoint"""
            return HealthCheck(
                status="healthy",
                version=settings.app_version,
                environment=settings.environment,
            )

        # Metrics endpoint
        @app.get("/metrics")
        async def metrics():
            """Prometheus metrics endpoint"""
            if not settings.enable_metrics:
                raise HTTPException(status_code=404, detail="Metrics disabled")
            return JSONResponse(
                content=generate_latest().decode('utf-8'),
                media_type="text/plain"
            )

        # Root endpoint
        @app.get("/")
        async def root():
            """Root endpoint"""
            return {
                "name": settings.app_name,
                "version": settings.app_version,
                "status": "running",
                "docs": "/docs",
            }

        return app

    async def _metrics_middleware(self, request, call_next):
        """Middleware for collecting metrics"""
        method = request.method
        path = request.url.path

        with REQUEST_DURATION.labels(method=method, endpoint=path).time():
            response = await call_next(request)

        REQUEST_COUNT.labels(
            method=method,
            endpoint=path,
            status=response.status_code
        ).inc()

        return response

    def run(self, host: str = None, port: int = None, **kwargs):
        """Run the server"""
        import uvicorn

        host = host or settings.mcp_server_host
        port = port or settings.mcp_server_port

        uvicorn.run(
            self.app,
            host=host,
            port=port,
            workers=settings.mcp_workers,
            **kwargs
        )


# Create server instance
mcp_server = MCPServer()
app = mcp_server.app
