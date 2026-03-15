# Agentic AI Notes

- This workspace is Python 3.11 with `pyproject.toml`, `requirements.txt`, and its own `Makefile`.
- The executable surface is now a standalone MCP server in `model_context_server/server.py`, with optional streamable-HTTP gateway paths.
- Runtime settings live in `config/settings.py` and use the `SYMPTOMSYNC_` env prefix.
- If request or response models change, inspect `model_context_server/models.py`, `model_context_server/service.py`, `model_context_server/server.py`, and tests together.

## Validation

- Run `make lint`.
- Run `make test`.

## Skills

- Use `$symptomsync-agentic-ai-change` for implementation, debugging, or review in this service.
- Use `$symptomsync-doc-sync` if docs or runbooks became stale.
