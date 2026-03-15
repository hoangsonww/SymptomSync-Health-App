"""Top-level primitive registration module.

Importing this module registers all MCP tools/resources/prompts.
"""

from __future__ import annotations

from . import primitives_core as _primitives_core
from . import primitives_extended as _primitives_extended

__all__ = ["_primitives_core", "_primitives_extended"]

