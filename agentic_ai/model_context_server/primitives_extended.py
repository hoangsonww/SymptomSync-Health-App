"""Extended primitive registration aggregator.

Importing this module registers advanced tools/resources/prompts by side effect.
"""

from __future__ import annotations

from . import primitives_ops as _primitives_ops
from . import primitives_prompts as _primitives_prompts
from . import primitives_resources as _primitives_resources
from . import primitives_triage as _primitives_triage

__all__ = [
    "_primitives_triage",
    "_primitives_ops",
    "_primitives_resources",
    "_primitives_prompts",
]

