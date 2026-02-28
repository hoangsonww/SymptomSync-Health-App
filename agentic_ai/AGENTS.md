# Agentic AI Notes

- This workspace is Python 3.11 with `pyproject.toml`, `requirements.txt`, and its own `Makefile`.
- The actual executable surface is a FastAPI app in `mcp_server/server.py` with routes in `mcp_server/routes.py`.
- Runtime settings live in `config/settings.py` and use the `SYMPTOMSYNC_` env prefix.
- If request or response models change, inspect `mcp_server/models.py`, `mcp_server/routes.py`, and tests together.

## Validation

- Run `make lint`.
- Run `make test`.

## Skills

- Use `$symptomsync-agentic-ai-change` for implementation, debugging, or review in this service.
- Use `$symptomsync-doc-sync` if docs or runbooks became stale.
