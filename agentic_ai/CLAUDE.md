# Agentic AI Notes

- This workspace is Python 3.11 with `pyproject.toml`, `requirements.txt`, and a local `Makefile`.
- The executable entry points are `main.py` and `model_context_server/server.py`. The service now exposes real MCP tools/resources/prompts with optional streamable HTTP transport.
- Runtime settings come from `config/settings.py` and use the `SYMPTOMSYNC_` env prefix.
- Core flow lives in `graphs/assembly_line.py`, `graphs/state.py`, `agents/`, and `chains/`.
- If you change request or response models, inspect `model_context_server/models.py`, `model_context_server/service.py`, `model_context_server/server.py`, tests, and any deployment config that depends on ports or env vars.

## Validation

- Preferred checks: `make lint` and `make test`.
- If you only touch routing or settings, at minimum read `tests/` for impacted expectations even if full execution is not possible.

## Change discipline

- Do not rely on README claims alone; verify behavior in code.
- Keep health, metrics, and MCP transport settings consistent when changing server wiring.
