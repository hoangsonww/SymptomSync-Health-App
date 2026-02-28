# Agentic AI Notes

- This workspace is Python 3.11 with `pyproject.toml`, `requirements.txt`, and a local `Makefile`.
- The executable entry points are `main.py` and `mcp_server/server.py`. The service is a FastAPI app with metrics and analysis routes, even though the docs sometimes describe it more broadly as an MCP server.
- Runtime settings come from `config/settings.py` and use the `SYMPTOMSYNC_` env prefix.
- Core flow lives in `graphs/assembly_line.py`, `graphs/state.py`, `agents/`, and `chains/`.
- If you change request or response models, inspect `mcp_server/models.py`, `mcp_server/routes.py`, tests, and any deployment config that depends on ports or env vars.

## Validation

- Preferred checks: `make lint` and `make test`.
- If you only touch routing or settings, at minimum read `tests/` for impacted expectations even if full execution is not possible.

## Change discipline

- Do not rely on README claims alone; verify behavior in code.
- Keep health, metrics, and `/api/v1` routes consistent when changing server wiring.
