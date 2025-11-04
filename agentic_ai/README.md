# SymptomSync Agentic AI Pipeline

A sophisticated multi-agent AI system for health symptom analysis built with LangGraph, LangChain, and Model Context Protocol (MCP) server architecture.

## 🎯 Overview

This production-ready agentic AI pipeline implements an **assembly line architecture** where specialized AI agents work in sequence to analyze health symptoms, retrieve medical knowledge, assess risks, and generate personalized recommendations.

### Key Features

- 🤖 **Multi-Agent System**: Five specialized agents working in coordination
- 🔄 **Assembly Line Architecture**: Sequential processing with state management
- 📊 **LangGraph State Machine**: Sophisticated workflow orchestration
- 🔗 **LangChain Integration**: Powerful LLM chains and components
- 🌐 **MCP Server**: FastAPI-based Model Context Protocol server
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
        API[REST API / MCP Server]
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

    User->>API: POST /api/v1/analyze
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

    API-->>User: JSON Response
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

## 📖 API Usage

### Analyze Symptoms

```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "I have a headache and feel dizzy",
    "age": 35,
    "gender": "female",
    "medical_history": ["hypertension"],
    "current_medications": ["lisinopril"],
    "allergies": []
  }'
```

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

### Batch Analysis

```bash
curl -X POST "http://localhost:8000/api/v1/analyze/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      {"user_input": "I have a headache"},
      {"user_input": "My throat is sore"}
    ]
  }'
```

### Visualize Graph

```bash
curl "http://localhost:8000/api/v1/graph/visualize"
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

Run the test suite:

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=. --cov-report=html

# Run specific test file
pytest tests/test_agents.py -v
```

## 📊 Monitoring

### Prometheus Metrics

Access Prometheus at: `http://localhost:9090`

Available metrics:
- `symptomsync_requests_total` - Total API requests
- `symptomsync_agent_executions_total` - Agent execution counts
- `symptomsync_pipeline_duration_seconds` - Pipeline execution time
- `symptomsync_llm_calls_total` - LLM API calls
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
├── mcp_server/                  # MCP Server
│   ├── server.py               # FastAPI server
│   ├── routes.py               # API routes
│   └── models.py               # Pydantic models
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
│   └── test_mcp_server.py
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

- **Documentation**: See `/docs` endpoint when server is running
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
**Last Updated**: 2025
**Maintained by**: SymptomSync Team
