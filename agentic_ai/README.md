# SymptomSync Agentic AI Pipeline

A sophisticated multi-agent AI system for health symptom analysis built with LangGraph, LangChain, and Model Context Protocol (MCP) server architecture.

[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/release/python-3110/)
[![MCP Python SDK](https://img.shields.io/badge/MCP_Python_SDK-1.26.0-green.svg)](https://github.com/modelcontextprotocol/python-sdk)
[![LangChain](https://img.shields.io/badge/LangChain-0.1.0-yellow.svg)](https://www.langchain.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.1.0-orange.svg)](https://www.langgraph.com/)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-red.svg)](https://www.modelcontextprotocol.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🎯 Overview

This production-ready agentic AI pipeline implements an **assembly line architecture** where specialized AI agents work in sequence to analyze health symptoms, retrieve medical knowledge, assess risks, and generate personalized recommendations.

### Key Features

- 🤖 **Multi-Agent System**: Five specialized agents working in coordination
- 🔄 **Assembly Line Architecture**: Sequential processing with state management
- 📊 **LangGraph State Machine**: Sophisticated workflow orchestration
- 🔗 **LangChain Integration**: Powerful LLM chains and components
- 🌐 **Standalone MCP Server**: Official Python SDK with modular primitive registration
- 🧰 **Expanded Primitive Surface**: 21 tools, 8 resources, and 6 prompts for core, triage, and ops workflows
- 🧱 **Production Hardening**: Optional auth, per-identity rate limiting, runtime policy validation/fail-fast
- ☁️ **Cloud-Ready**: Full AWS and Azure deployment configurations
- 📈 **Production Monitoring**: Prometheus metrics and Grafana dashboards
- 🔒 **Security First**: HIPAA-compliant design patterns
- 🧪 **Fully Tested**: Comprehensive test suite included

## 🏗️ Architecture

### System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        Client[Client Application]
        API[MCP Server / Optional HTTP Gateway]
    end

    subgraph "Agentic AI Pipeline"
        SE[Symptom Extractor Agent]
        KR[Knowledge Retriever Agent]
        DA[Diagnostic Analyzer Agent]
        RA[Risk Assessor Agent]
        RG[Recommendation Generator Agent]
        ORC[Orchestrator Agent]
    end

    subgraph "Data Layer"
        VS[Vector Store<br/>ChromaDB/Pinecone]
        DB[(PostgreSQL<br/>Database)]
        Cache[(Redis Cache)]
    end

    subgraph "External Services"
        LLM[LLM Providers<br/>OpenAI/Anthropic/Google]
        AWS[AWS Services]
        Azure[Azure Services]
    end

    Client -->|HTTP/JSON| API
    API --> SE
    SE --> KR
    KR --> DA
    DA --> RA
    RA --> RG
    RG --> ORC
    ORC -->|Continue/End| SE

    KR <-->|Query| VS
    API <--> DB
    API <--> Cache
    SE & KR & DA & RA & RG -->|API Calls| LLM

    API -.->|Deploy| AWS
    API -.->|Deploy| Azure
```

### Assembly Line Flow

```mermaid
stateDiagram-v2
    [*] --> SymptomExtractor

    SymptomExtractor --> KnowledgeRetriever: Symptoms Extracted
    KnowledgeRetriever --> DiagnosticAnalyzer: Knowledge Retrieved
    DiagnosticAnalyzer --> RiskAssessor: Preliminary Analysis
    RiskAssessor --> RecommendationGenerator: Risk Assessed
    RecommendationGenerator --> Orchestrator: Recommendations Ready

    Orchestrator --> [*]: End
    Orchestrator --> SymptomExtractor: Continue
    Orchestrator --> Emergency: Escalate

    Emergency --> [*]: Alert

    note right of SymptomExtractor
        Extracts symptoms,
        severity, and duration
        from user input
    end note

    note right of KnowledgeRetriever
        Retrieves relevant
        medical knowledge
        from vector stores
    end note

    note right of DiagnosticAnalyzer
        Performs preliminary
        analysis of possible
        conditions
    end note

    note right of RiskAssessor
        Assesses health risks
        and determines urgency
    end note

    note right of RecommendationGenerator
        Generates personalized
        health recommendations
    end note
```

### Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant API as MCP Server
    participant SE as Symptom Extractor
    participant KR as Knowledge Retriever
    participant DA as Diagnostic Analyzer
    participant RA as Risk Assessor
    participant RG as Recommendation Generator
    participant VS as Vector Store
    participant LLM as LLM Provider

    User->>API: MCP tools/call analyze_symptoms
    API->>SE: Initialize State

    SE->>LLM: Extract Symptoms
    LLM-->>SE: Structured Symptoms
    SE->>KR: Pass State

    KR->>VS: Query Medical Knowledge
    VS-->>KR: Relevant Documents
    KR->>LLM: Synthesize Knowledge
    LLM-->>KR: Synthesized Summary
    KR->>DA: Pass State

    DA->>LLM: Analyze Symptoms
    LLM-->>DA: Preliminary Diagnosis
    DA->>RA: Pass State

    RA->>LLM: Assess Risks
    LLM-->>RA: Risk Assessment
    RA->>RG: Pass State

    RG->>LLM: Generate Recommendations
    LLM-->>RG: Personalized Advice
    RG->>API: Final State

    API-->>User: MCP Tool Result
```

### Agent Interaction Model

```mermaid
graph LR
    subgraph "Agent State"
        State[Shared State Object<br/>- Symptoms<br/>- Analysis<br/>- Recommendations<br/>- Metadata]
    end

    subgraph "Agent Pool"
        A1[Symptom<br/>Extractor]
        A2[Knowledge<br/>Retriever]
        A3[Diagnostic<br/>Analyzer]
        A4[Risk<br/>Assessor]
        A5[Recommendation<br/>Generator]
    end

    State <-->|Read/Write| A1
    State <-->|Read/Write| A2
    State <-->|Read/Write| A3
    State <-->|Read/Write| A4
    State <-->|Read/Write| A5
```

### Cloud Deployment Architecture

```mermaid
graph TB
    subgraph "AWS Deployment"
        ALB[Application Load Balancer]
        ECS[ECS Fargate Cluster]
        RDS[RDS PostgreSQL]
        ElastiCache[ElastiCache Redis]
        S3[S3 Bucket]
        CloudWatch[CloudWatch Logs]
    end

    subgraph "Azure Deployment"
        ACI[Azure Container Instances]
        AzureDB[Azure PostgreSQL]
        AzureRedis[Azure Cache for Redis]
        AzureStorage[Azure Blob Storage]
        AppInsights[Application Insights]
    end

    Internet((Internet))

    Internet --> ALB
    ALB --> ECS
    ECS --> RDS
    ECS --> ElastiCache
    ECS --> S3
    ECS --> CloudWatch

    Internet --> ACI
    ACI --> AzureDB
    ACI --> AzureRedis
    ACI --> AzureStorage
    ACI --> AppInsights
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- OpenAI API Key (or Anthropic/Google AI)

### Installation

1. **Clone the repository**

```bash
cd SymptomSync-Health-App/agentic_ai
```

2. **Create virtual environment**

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Configure environment**

```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

5. **Run with Docker Compose**

```bash
docker-compose up -d
```

The API will be available at: `http://localhost:8000`

## 📖 MCP Usage

### Option 1: STDIO (default)

Run the server:

```bash
python main.py --transport stdio
```

Connect with an MCP host (for example Claude Desktop or MCP Inspector) and call the `analyze_symptoms` tool.

Core capability groups exposed by the standalone server:
- Core graph/runtime tools:
  - `analyze_symptoms`, `batch_analyze_symptoms`, `visualize_graph`, `get_runtime_config`, `health_check`
- Deterministic triage/safety tools:
  - `triage_text_heuristics`, `extract_triage_facts`, `generate_clarification_questions`
  - `build_clinician_handoff`, `compare_symptom_snapshots`, `explain_urgency_level`
  - `compute_risk_score`, `recommend_care_setting`, `generate_self_care_plan`
  - `generate_monitoring_schedule`, `emergency_action_checklist`, `redact_sensitive_text`
- Operations tools:
  - `get_metrics_snapshot`, `check_dependencies`, `validate_runtime_policy`, `get_capability_catalog`

Additional resources and prompts are available for triage guidance, urgency matrices, capability catalogs, and workflow templates.

Resources:
- `symptomsync://health`, `symptomsync://config`
- `symptomsync://guidelines/triage`, `symptomsync://guidelines/urgency-matrix`
- `symptomsync://ops/metrics-snapshot`, `symptomsync://ops/dependency-status`, `symptomsync://ops/runtime-policy`
- `symptomsync://catalog/capabilities`

Prompts:
- `symptom_triage_prompt`
- `emergency_escalation_prompt`
- `follow_up_checkin_prompt`
- `clinician_handoff_prompt`
- `self_care_planning_prompt`
- `safety_audit_prompt`

### Option 2: Streamable HTTP

Run the MCP HTTP gateway:

```bash
python main.py --transport streamable-http --host 0.0.0.0 --port 8000
```

The MCP endpoint is available at: `http://localhost:8000/mcp`

Operational endpoints:
- `GET /health` basic health check
- `GET /livez` liveness probe
- `GET /readyz` readiness probe (optionally performs deep graph init check)
- `GET /metrics` Prometheus metrics (when enabled)

Example JSON-RPC tool call (`tools/call`) against `/mcp`:

```bash
curl -X POST "http://localhost:8000/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "analyze_symptoms",
      "arguments": {
        "user_input": "I have a headache and feel dizzy",
        "age": 35,
        "gender": "female",
        "medical_history": ["hypertension"],
        "current_medications": ["lisinopril"],
        "allergies": []
      }
    }
  }'
```

Optional production auth for HTTP endpoints:

```bash
SYMPTOMSYNC_MCP_REQUIRE_AUTH=true
SYMPTOMSYNC_MCP_AUTH_TOKEN=<strong-random-token>
```

Then pass `Authorization: Bearer <token>` for non-health endpoints.

Optional gateway protections:

```bash
SYMPTOMSYNC_RATE_LIMIT_PER_MINUTE=60
SYMPTOMSYNC_MCP_READINESS_CHECK_GRAPH=true
```

Rate limiting is applied per identity+endpoint for non-health routes in streamable HTTP mode.
Runtime policy validation rejects unsafe production/staging HTTP startup configurations (for example, auth disabled).

### Response Example

```json
{
  "symptoms": ["headache", "dizziness"],
  "preliminary_diagnosis": ["tension headache", "migraine", "dehydration"],
  "risk_assessment": {
    "risk_level": "low",
    "risk_factors": ["hypertension"],
    "red_flags": [],
    "monitoring_advice": "Monitor blood pressure regularly"
  },
  "urgency_level": "medium",
  "recommendations": [
    "Rest in a quiet, dark room",
    "Stay hydrated with water",
    "Monitor your blood pressure",
    "Consider over-the-counter pain relief if appropriate"
  ],
  "when_to_see_doctor": "If symptoms persist for more than 3 days or worsen",
  "confidence_score": 0.85,
  "processing_time": 2.34,
  "disclaimer": "This is NOT medical advice. Always consult healthcare professionals."
}
```

### Batch Analysis Tool

```bash
curl -X POST "http://localhost:8000/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "batch_analyze_symptoms",
      "arguments": {
        "requests": [
          {"user_input": "I have a headache"},
          {"user_input": "My throat is sore"}
        ]
      }
    }
  }'
```

### Graph Visualization Tool

```bash
curl -X POST "http://localhost:8000/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "visualize_graph",
      "arguments": {}
    }
  }'
```

## 🏭 Production Deployment

### AWS Deployment

1. **Build and push Docker image**

```bash
docker build -t symptomsync-agentic-ai:latest .
docker tag symptomsync-agentic-ai:latest YOUR_ECR_REPO/symptomsync-agentic-ai:latest
docker push YOUR_ECR_REPO/symptomsync-agentic-ai:latest
```

2. **Deploy with CloudFormation**

```bash
cd config/aws
export ENVIRONMENT=production
export CONTAINER_IMAGE=YOUR_ECR_REPO/symptomsync-agentic-ai:latest
export OPENAI_API_KEY=your-api-key
export DATABASE_PASSWORD=your-db-password
bash deploy.sh
```

### Azure Deployment

```bash
cd config/azure
export ENVIRONMENT=production
export CONTAINER_IMAGE=your-acr.azurecr.io/symptomsync-agentic-ai:latest
export OPENAI_API_KEY=your-api-key
export DATABASE_PASSWORD=your-db-password
bash deploy.sh
```

## 🧪 Testing

Recommended validation commands:

```bash
# Match CI gate behavior first
make lint
make test

# Optional: direct pytest invocations
pytest tests/ -v
pytest tests/ --cov=. --cov-report=html

# Run specific test file
pytest tests/test_agents.py -v
```

## 📊 Monitoring

### Prometheus Metrics

Access Prometheus at: `http://localhost:9090`

Available metrics:
- `symptomsync_active_requests` - Number of active requests
- `symptomsync_agent_executions_total` - Agent execution counts
- `symptomsync_pipeline_executions_total` - Pipeline execution counts
- `symptomsync_pipeline_duration_seconds` - Pipeline execution duration
- `symptomsync_llm_calls_total` - LLM API calls
- `symptomsync_llm_tokens_total` - Prompt/completion token usage
- `symptomsync_vector_queries_total` - Vector store query counts
- `symptomsync_errors_total` - Error counts

### Grafana Dashboards

Access Grafana at: `http://localhost:3001`
- Username: `admin`
- Password: `admin`

## 🔧 Configuration

### Environment Variables

All configuration is done via environment variables with the `SYMPTOMSYNC_` prefix:

```bash
# LLM Configuration
SYMPTOMSYNC_OPENAI_API_KEY=sk-...
SYMPTOMSYNC_PRIMARY_MODEL=gpt-4-turbo-preview
SYMPTOMSYNC_TEMPERATURE=0.7

# Database
SYMPTOMSYNC_DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis
SYMPTOMSYNC_REDIS_HOST=localhost
SYMPTOMSYNC_REDIS_PORT=6379

# Vector Store
SYMPTOMSYNC_VECTOR_STORE_TYPE=chroma
SYMPTOMSYNC_CHROMA_PERSIST_DIRECTORY=./data/chroma
```

See `.env.example` for all available options.

## 🏗️ Project Structure

```
agentic_ai/
├── agents/                      # AI Agent implementations
│   ├── base_agent.py           # Base agent class
│   ├── symptom_extractor.py    # Symptom extraction agent
│   ├── knowledge_retriever.py  # Knowledge retrieval agent
│   ├── diagnostic_analyzer.py  # Diagnostic analysis agent
│   ├── risk_assessor.py        # Risk assessment agent
│   ├── recommendation_generator.py  # Recommendation agent
│   └── orchestrator.py         # Orchestration agent
├── graphs/                      # LangGraph state machines
│   ├── assembly_line.py        # Main assembly line graph
│   └── state.py                # State definitions
├── chains/                      # LangChain components
│   ├── symptom_chain.py        # Symptom analysis chain
│   └── retrieval_chain.py      # RAG chain
├── model_context_server/        # Standalone MCP server
│   ├── mcp_instance.py         # FastMCP construction + protocol metadata
│   ├── primitives.py           # Primitive registration aggregator
│   ├── primitives_core.py      # Core graph-backed tools/resources/prompts
│   ├── primitives_extended.py  # Extended primitive aggregation entrypoint
│   ├── primitives_triage.py    # Triage, safety, and handoff tools
│   ├── primitives_ops.py       # Operational diagnostics and policy tools
│   ├── primitives_resources.py # Operational and guideline resources
│   ├── primitives_prompts.py   # Reusable prompt templates
│   ├── http_gateway.py         # Streamable HTTP gateway + middleware
│   ├── runtime.py              # Transport startup orchestration
│   ├── decision_support.py     # Deterministic triage/risk helper logic
│   ├── service.py              # Graph-backed business logic
│   ├── models.py               # Pydantic request/response contracts
│   ├── server.py               # Thin compatibility facade
│   └── __init__.py
├── config/                      # Configuration
│   ├── settings.py             # Application settings
│   ├── aws/                    # AWS deployment configs
│   │   ├── cloudformation.yaml
│   │   └── deploy.sh
│   └── azure/                  # Azure deployment configs
│       ├── arm-template.json
│       └── deploy.sh
├── utils/                       # Utilities
│   ├── logger.py               # Logging configuration
│   └── monitoring.py           # Metrics collection
├── tests/                       # Test suite
│   ├── test_agents.py
│   ├── test_graph.py
│   └── test_mcp_server.py      # MCP primitive registration and tool tests
├── Dockerfile                   # Docker image definition
├── docker-compose.yml           # Docker Compose configuration
├── requirements.txt             # Python dependencies
├── main.py                      # Application entry point
└── README.md                    # This file
```

## 🔐 Security & Compliance

### HIPAA Compliance Considerations

- ✅ **Encryption at Rest**: All data encrypted in storage
- ✅ **Encryption in Transit**: TLS/SSL for all communications
- ✅ **Access Controls**: Role-based access control (RBAC)
- ✅ **Audit Logging**: Comprehensive logging of all operations
- ✅ **Data Anonymization**: PII handling and anonymization
- ⚠️ **BAA Required**: Obtain Business Associate Agreements from vendors

### Security Best Practices

1. **API Keys**: Store in environment variables or secrets manager
2. **Database**: Use strong passwords and connection encryption
3. **Network**: Deploy behind firewall/VPC
4. **Updates**: Keep dependencies updated
5. **Monitoring**: Enable security monitoring and alerting

## 🎯 Use Cases

1. **Symptom Triage**: Initial assessment of patient symptoms
2. **Health Education**: Providing health information to users
3. **Care Navigation**: Guiding users to appropriate care levels
4. **Remote Monitoring**: Supporting telemedicine platforms
5. **Research**: Analyzing symptom patterns and trends

## ⚠️ Medical Disclaimer

**IMPORTANT**: This system provides general health information for educational purposes only. It is **NOT** a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified healthcare providers with any questions regarding medical conditions.

## 📝 License

This project is part of the SymptomSync Health Application. See the main repository LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📞 Support

- **Runtime endpoints**: `/health`, `/livez`, `/readyz`, `/metrics`, and MCP endpoint at `/mcp` when running `streamable-http`
- **Issues**: Report bugs via GitHub Issues
- **Email**: support@symptomsync.com

## 🙏 Acknowledgments

Built with:
- [LangChain](https://www.langchain.com/) - LLM application framework
- [LangGraph](https://github.com/langchain-ai/langgraph) - State machine framework
- [FastAPI](https://fastapi.tiangolo.com/) - Modern web framework
- [OpenAI](https://openai.com/) - LLM provider
- [ChromaDB](https://www.trychroma.com/) - Vector database

---

**Version**: 1.0.0
**Last Updated**: 2026-03-15
**Maintained by**: SymptomSync Team
