"""
API-facing adapters — thin wrappers over pure core for FastAPI / UI track.

Maps Pydantic request models to production engine functions. Keeps
`core.engine` free of framework types.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from data import (
    apply_autoreg_to_scheme,
    autoreg_message,
    autoregulate,
    compute_readiness,
    readiness_drivers,
)
from core.engine.plan import get_plan_data
from core.engine.substitutes import get_exercise_substitutes
from core.ml.bmi import calculate_bmi

BAND_COLORS = {
    "Primed": "#00E676",
    "Ready": "#00E676",
    "Moderate": "#E8FF00",
    "Low": "#FF6B35",
    "Poor": "#FF6B35",
}


def readiness_payload(
    sleep_hours,
    sleep_quality,
    soreness,
    energy,
    steps=None,
    active_minutes=None,
) -> Dict[str, Any]:
    """Normalize readiness for JSON responses."""
    r = compute_readiness(
        sleep_hours, sleep_quality, soreness, energy,
        steps=steps, active_minutes=active_minutes,
    )
    drivers = readiness_drivers(r.get("components") or {})
    band = r.get("band", "Moderate")
    return {
        "score": r.get("score"),
        "band": band,
        "color": BAND_COLORS.get(band, "#E8FF00"),
        "message": r.get("message", ""),
        "drivers": drivers,
        "components": r.get("components"),
    }


def profile_dict_from_api(profile: Any) -> Dict[str, Any]:
    """Coerce ProfileModel (or dict) into get_plan_data user_profile shape."""
    if hasattr(profile, "model_dump"):
        p = profile.model_dump()
    else:
        p = dict(profile)
    height = p.get("height_cm") or p.get("height") or 170
    weight = p.get("weight_kg") or p.get("weight") or 70
    bmi, bmi_cat, _ = calculate_bmi(float(weight), float(height))
    return {
        "age": p.get("age", 25),
        "gender": p.get("gender", "Male"),
        "height": height,
        "weight": weight,
        "bmi": p.get("bmi") or bmi,
        "bmi_cat": p.get("bmi_category") or p.get("bmi_cat") or bmi_cat,
        "body_type": p.get("body_type", "Mesomorph"),
        "goal": p.get("goal", "Hypertrophy Training"),
        "experience": p.get("experience_level") or p.get("experience") or "Intermediate",
        "equipment_tier": p.get("equipment_tier", "Full gym"),
        "steps": p.get("steps", 8000),
        "active_minutes": p.get("active_minutes", 60),
        "fatigue": p.get("fatigue", "Fully Rested"),
        "calorie_intensity": p.get("calorie_intensity", "Moderate"),
        "rl_rec": p.get("rl_rec", "MODERATE WORKOUT"),
        "split_type": p.get("split") or p.get("split_type") or "ppl",
        "frequency": p.get("frequency_days") or p.get("frequency") or 4,
        "single_mode": p.get("single_mode"),
        "focus_muscle": p.get("focus_muscle"),
        "ramp_factor": p.get("ramp_factor", 1.0),
    }


def injury_dict_from_api(profile: Any) -> Optional[Dict[str, str]]:
    if hasattr(profile, "model_dump"):
        p = profile.model_dump()
    else:
        p = dict(profile)
    part = p.get("injury_part")
    if not part or part in ("None", "none", ""):
        return {"has_injury": "No"}
    return {
        "has_injury": "Yes",
        "body_part": part,
        "severity": p.get("injury_severity") or "Low - can bear weight with caution",
    }


def generate_plan_for_profile(profile: Any, progression_fn=None) -> List[Dict[str, Any]]:
    return get_plan_data(
        profile_dict_from_api(profile),
        injury_dict_from_api(profile),
        progression_fn=progression_fn,
    )


def session_today_from_plan(
    plan_days: List[Dict[str, Any]],
    expected_day: int,
    readiness: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Pick today's day from structured plan and apply autoreg if readiness given."""
    day = next((d for d in plan_days if d.get("day") == expected_day), None)
    if day is None and plan_days:
        day = plan_days[0]
    if day is None:
        return {
            "day_number": expected_day,
            "focus": "Rest",
            "is_rest": True,
            "exercises": [],
            "autoreg_note": None,
        }

    adj = None
    note = None
    if readiness and readiness.get("band"):
        adj = autoregulate(readiness["band"])
        drivers = readiness.get("drivers") or []
        note = autoreg_message(readiness["band"], drivers=drivers)

    exercises = []
    for ex in day.get("exercises") or []:
        sr = ex.get("sets_reps", "")
        if adj:
            sr = apply_autoreg_to_scheme(sr, adj)
        exercises.append(
            {
                "name": ex.get("name", ""),
                "sets_reps": sr,
                "weight": ex.get("weight", ""),
                "muscles": ex.get("muscles", ""),
                "note": ex.get("progression_note") or "",
            }
        )

    return {
        "day_number": day.get("day", expected_day),
        "focus": day.get("focus", ""),
        "is_rest": bool(day.get("is_rest")),
        "exercises": exercises,
        "autoreg_note": note,
    }


def substitutes(
    exercise_name: str,
    equipment_tier: str = "Full gym",
    injury_part: Optional[str] = None,
) -> List[Dict[str, str]]:
    return get_exercise_substitutes(exercise_name, equipment_tier, injury_part)
