"""
Tests for MCP Server
"""

import pytest
from fastapi.testclient import TestClient
from mcp_server.server import app


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


class TestMCPServer:
    """Tests for MCP Server endpoints"""

    def test_root_endpoint(self, client):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data

    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    def test_config_endpoint(self, client):
        """Test config endpoint"""
        response = client.get("/api/v1/config")
        assert response.status_code == 200
        data = response.json()
        assert "app_name" in data
        assert "version" in data

    def test_visualize_graph(self, client):
        """Test graph visualization endpoint"""
        response = client.get("/api/v1/graph/visualize")
        assert response.status_code == 200
        data = response.json()
        assert "diagram" in data
        assert data["format"] == "mermaid"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
