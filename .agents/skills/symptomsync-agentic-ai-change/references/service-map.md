# Agentic AI Service Map

## Primary runtime files

- `main.py`: launches the service
- `mcp_server/server.py`: FastAPI app, health endpoint, metrics endpoint, middleware
- `mcp_server/routes.py`: analysis, batch analysis, graph visualization, config routes
- `mcp_server/models.py`: request and response models
- `config/settings.py`: env-driven settings using the `SYMPTOMSYNC_` prefix

## Core logic

- `graphs/assembly_line.py`
- `graphs/state.py`
- `agents/`
- `chains/`

## Validation surface

- `tests/test_agents.py`
- `tests/test_graph.py`
- `tests/test_mcp_server.py`

## Repo-specific caveats

- The README is more ambitious than the currently checked-in code in several areas.
- If route, settings, or model contracts change, tests and docs often need the same update.
