"""
Configuration settings for the Agentic AI Pipeline
"""

from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="allow"
    )

    # Application Settings
    app_name: str = Field(default="SymptomSync Agentic AI", description="Application name")
    app_version: str = Field(default="1.0.0", description="Application version")
    environment: str = Field(default="development", description="Environment: development, staging, production")
    debug: bool = Field(default=False, description="Debug mode")

    # LLM Provider Settings
    openai_api_key: Optional[str] = Field(default=None, description="OpenAI API Key")
    anthropic_api_key: Optional[str] = Field(default=None, description="Anthropic API Key")
    google_ai_api_key: Optional[str] = Field(default=None, description="Google AI API Key")

    # Model Configuration
    primary_model: str = Field(default="gpt-4-turbo-preview", description="Primary LLM model")
    fallback_model: str = Field(default="gpt-3.5-turbo", description="Fallback LLM model")
    temperature: float = Field(default=0.7, description="LLM temperature")
    max_tokens: int = Field(default=2000, description="Maximum tokens for LLM response")

    # Vector Store Settings
    vector_store_type: str = Field(default="chroma", description="Vector store type: chroma, pinecone, faiss")
    chroma_persist_directory: str = Field(default="./data/chroma", description="ChromaDB persistence directory")
    pinecone_api_key: Optional[str] = Field(default=None, description="Pinecone API Key")
    pinecone_environment: Optional[str] = Field(default=None, description="Pinecone environment")
    pinecone_index_name: str = Field(default="symptomsync", description="Pinecone index name")

    # Database Settings
    database_url: str = Field(
        default="postgresql://user:password@localhost:5432/symptomsync",
        description="Database connection URL"
    )

    # Redis Settings
    redis_host: str = Field(default="localhost", description="Redis host")
    redis_port: int = Field(default=6379, description="Redis port")
    redis_db: int = Field(default=0, description="Redis database number")
    redis_password: Optional[str] = Field(default=None, description="Redis password")

    # AWS Settings
    aws_region: str = Field(default="us-east-1", description="AWS region")
    aws_access_key_id: Optional[str] = Field(default=None, description="AWS access key ID")
    aws_secret_access_key: Optional[str] = Field(default=None, description="AWS secret access key")
    aws_s3_bucket: Optional[str] = Field(default=None, description="AWS S3 bucket name")

    # Azure Settings
    azure_subscription_id: Optional[str] = Field(default=None, description="Azure subscription ID")
    azure_resource_group: Optional[str] = Field(default=None, description="Azure resource group")
    azure_storage_account: Optional[str] = Field(default=None, description="Azure storage account name")
    azure_storage_key: Optional[str] = Field(default=None, description="Azure storage account key")

    # MCP Server Settings
    mcp_server_host: str = Field(default="0.0.0.0", description="MCP server host")
    mcp_server_port: int = Field(default=8000, description="MCP server port")
    mcp_workers: int = Field(default=4, description="Number of MCP server workers")

    # Agent Settings
    max_agent_iterations: int = Field(default=10, description="Maximum agent iterations")
    agent_timeout: int = Field(default=300, description="Agent timeout in seconds")

    # Monitoring Settings
    enable_metrics: bool = Field(default=True, description="Enable Prometheus metrics")
    enable_tracing: bool = Field(default=True, description="Enable OpenTelemetry tracing")
    log_level: str = Field(default="INFO", description="Logging level")

    # Rate Limiting
    rate_limit_per_minute: int = Field(default=60, description="API rate limit per minute")

    class Config:
        """Pydantic configuration"""
        env_prefix = "SYMPTOMSYNC_"


# Global settings instance
settings = Settings()
