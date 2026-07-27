"""Load pickled GA / scaler / Q-table artifacts from project root."""
from __future__ import annotations

import os
from functools import lru_cache
from typing import Any, Tuple

import joblib
import numpy as np

_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@lru_cache(maxsize=1)
def load_model_artifacts(
    root: str | None = None,
) -> Tuple[Any, Any, Any]:
    """Return (scaler, ga_model, q_table). Raises FileNotFoundError if missing."""
    base = root or _ROOT
    scaler = joblib.load(os.path.join(base, "scaler.pkl"))
    ga_model = joblib.load(os.path.join(base, "ga_model.pkl"))
    q_table = joblib.load(os.path.join(base, "q_table.pkl"))
    return scaler, ga_model, np.asarray(q_table, dtype=float)
