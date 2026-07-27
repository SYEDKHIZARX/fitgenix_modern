"""
FITGENIX internal web API.

Run (from project root, with env SUPABASE_URL + SUPABASE_KEY set for cloud):
    uvicorn api.main:app --reload --port 8000
"""
from __future__ import annotations

import os
import sys
from typing import Any, Dict, List, Optional

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

import numpy as np
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from api.db import AuthUser, optional_user, require_user, supabase_configured
from api import persist
from core import calculate_bmi, decide_action, compute_plan_state_from_parts
from core.engine.substitutes import get_exercise_substitutes
from core.ml.rl import get_rl_recommendation, rl_recommend_index, rl_update_from_outcomes
from core.ml.artifacts import load_model_artifacts
from core.services import (
    generate_plan_for_profile,
    readiness_payload,
    session_today_from_plan,
)

app = FastAPI(
    title="FITGENIX API",
    version="0.3.0",
    description="Web backend for FITGENIX — engine + optional Supabase persistence.",
)

# Never use allow_origins=["*"] with allow_credentials=True.
# Override for production: CORS_ORIGINS=https://your-app.vercel.app,https://www.example.com
_cors_raw = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001",
)
_cors_origins = [o.strip() for o in _cors_raw.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class CheckInIn(BaseModel):
    sleep_hours: float = 7.0
    sleep_quality: str = "ok"
    soreness: str = "mild"
    energy: str = "good"
    steps: Optional[int] = None
    active_minutes: Optional[int] = None


class ProfileIn(BaseModel):
    age: int = 25
    gender: str = "Male"
    height_cm: float = 175.0
    weight_kg: float = 70.0
    goal: str = "Hypertrophy Training"
    split: str = "ppl"
    frequency_days: int = 4
    experience_level: str = "Intermediate"
    equipment_tier: str = "Full gym"
    injury_part: Optional[str] = None
    injury_severity: Optional[str] = None
    body_type: str = "Mesomorph"
    fatigue: str = "Fully Rested"
    rl_rec: str = "MODERATE WORKOUT"
    steps: int = 8000
    active_minutes: int = 60
    calorie_intensity: str = "Moderate"
    ramp_factor: float = 1.0
    single_mode: Optional[str] = None
    focus_muscle: Optional[str] = None
    bmi: Optional[float] = None


class SessionTodayIn(BaseModel):
    profile: ProfileIn
    checkin: Optional[CheckInIn] = None
    day: int = 1
    plan: Optional[List[Dict[str, Any]]] = None


class SubstituteIn(BaseModel):
    exercise_name: str
    equipment_tier: str = "Full gym"
    injury_part: Optional[str] = None


class RlFeedbackIn(BaseModel):
    fatigue_level: int = Field(ge=0, le=2)
    rec_action: int = Field(ge=0, le=3)
    outcomes: List[Dict[str, Any]]
    q_row: Optional[List[float]] = None
    cap: Optional[int] = None
    persist: bool = True


class OutcomeIn(BaseModel):
    exercise_name: str
    status: str  # completed | skipped | too_hard
    muscle_group: str = ""
    difficulty: Optional[str] = None
    fatigue_at_time: Optional[str] = None


class HistoryEntryIn(BaseModel):
    steps: int = 0
    active_minutes: int = 0
    fatigue: Optional[str] = None
    calorie_intensity: Optional[str] = None
    rl_rec: Optional[str] = None
    goal: Optional[str] = None
    bmi: Optional[float] = None
    calorie_score: Optional[float] = None


class SavePlanIn(BaseModel):
    profile: ProfileIn
    plan: List[Dict[str, Any]]
    length_days: Optional[int] = None


def _normalize_days(days: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    normalized = []
    for d in days:
        exercises = []
        for ex in d.get("exercises") or []:
            exercises.append(
                {
                    "name": ex.get("name", ""),
                    "sets_reps": ex.get("sets_reps") or ex.get("scheme") or "3 x 10",
                    "weight": ex.get("weight") or "",
                    "muscles": ex.get("muscles") or "",
                    "note": ex.get("progression_note") or ex.get("note") or "",
                }
            )
        normalized.append(
            {
                "day": d.get("day"),
                "focus": d.get("focus", ""),
                "is_rest": bool(d.get("is_rest")),
                "exercises": exercises,
            }
        )
    return normalized


def _profile_dict(p: ProfileIn) -> Dict[str, Any]:
    return p.model_dump()


def _row_to_web_profile(row: Dict[str, Any], snapshot: Optional[Dict] = None) -> Dict[str, Any]:
    base = snapshot or {}
    return {
        "age": base.get("age") or row.get("age") or 25,
        "gender": base.get("gender") or row.get("gender") or "Male",
        "height_cm": base.get("height_cm") or row.get("height_cm") or 175,
        "weight_kg": base.get("weight_kg") or row.get("weight_kg") or 70,
        "goal": base.get("goal") or row.get("goal") or "Hypertrophy Training",
        "split": base.get("split")
        or row.get("split_type")
        or base.get("split_type")
        or "ppl",
        "frequency_days": base.get("frequency_days")
        or row.get("frequency")
        or 4,
        "experience_level": base.get("experience_level")
        or row.get("experience_level")
        or "Intermediate",
        "equipment_tier": base.get("equipment_tier")
        or row.get("equipment_tier")
        or "Full gym",
        "injury_part": base.get("injury_part") or row.get("injury_part"),
        "injury_severity": base.get("injury_severity") or row.get("injury_severity"),
        "body_type": base.get("body_type") or row.get("body_type") or "Mesomorph",
        "fatigue": base.get("fatigue") or row.get("fatigue") or "Fully Rested",
        "rl_rec": base.get("rl_rec") or "MODERATE WORKOUT",
        "steps": base.get("steps") or 8000,
        "active_minutes": base.get("active_minutes") or 60,
        "calorie_intensity": base.get("calorie_intensity") or "Moderate",
        "ramp_factor": base.get("ramp_factor") or 1.0,
        "bmi": base.get("bmi") or row.get("bmi"),
    }


# ---------------------------------------------------------------------------
# Public engine endpoints
# ---------------------------------------------------------------------------
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "fitgenix-api",
        "version": "0.3.0",
        "supabase": supabase_configured(),
    }


@app.post("/api/readiness")
def readiness(body: CheckInIn, user: Optional[AuthUser] = Depends(optional_user)):
    payload = readiness_payload(
        body.sleep_hours,
        body.sleep_quality,
        body.soreness,
        body.energy,
        steps=body.steps,
        active_minutes=body.active_minutes,
    )
    if user:
        persist.save_checkin(
            user.id,
            {
                **body.model_dump(),
                "readiness_score": payload.get("score"),
                "readiness_band": payload.get("band"),
            },
        )
    return payload


@app.post("/api/generate-plan")
def generate_plan(
    profile: ProfileIn,
    user: Optional[AuthUser] = Depends(optional_user),
):
    days = _normalize_days(generate_plan_for_profile(profile))
    if user:
        persist.save_profile(user.id, _profile_dict(profile))
        persist.save_active_plan(
            user.id,
            days,
            _profile_dict(profile),
            length_days=len(days),
            frequency=profile.frequency_days,
            split_type=profile.split,
            focus=profile.focus_muscle,
        )
    return {"length_days": len(days), "plan": days, "persisted": bool(user)}


@app.post("/api/session/today")
def session_today(body: SessionTodayIn):
    plan = body.plan if body.plan else generate_plan_for_profile(body.profile)
    # unwrap envelope if client sent raw DB shape
    if plan and isinstance(plan, list) and plan and "day" not in plan[0] and "days" in (plan[0] or {}):
        plan = plan[0].get("days")  # unlikely
    ready = None
    if body.checkin is not None:
        ready = readiness_payload(
            body.checkin.sleep_hours,
            body.checkin.sleep_quality,
            body.checkin.soreness,
            body.checkin.energy,
            steps=body.checkin.steps,
            active_minutes=body.checkin.active_minutes,
        )
    session = session_today_from_plan(plan, expected_day=body.day, readiness=ready)
    for ex in session.get("exercises") or []:
        if "sets_reps" not in ex and "scheme" in ex:
            ex["sets_reps"] = ex["scheme"]
    return session


@app.post("/api/exercises/substitutes")
def substitutes(body: SubstituteIn):
    return {
        "exercise_name": body.exercise_name,
        "alternatives": get_exercise_substitutes(
            body.exercise_name, body.equipment_tier, body.injury_part
        ),
    }


@app.get("/api/bmi")
def bmi(weight_kg: float, height_cm: float):
    value, cat, color = calculate_bmi(weight_kg, height_cm)
    return {"bmi": value, "category": cat, "color": color}


@app.get("/api/rl/recommend")
def rl_recommend(
    fatigue_level: int = 0,
    user: Optional[AuthUser] = Depends(optional_user),
):
    try:
        _, _, base_q = load_model_artifacts()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Models unavailable: {e}")
    q = base_q
    personal = False
    if user:
        stored = persist.load_q_table(user.id)
        if stored is not None:
            try:
                q = np.asarray(stored, dtype=float)
                personal = True
            except Exception:
                q = base_q
    label, color, tip = get_rl_recommendation(fatigue_level, q)
    idx = rl_recommend_index(q, fatigue_level)
    return {
        "fatigue_level": fatigue_level,
        "action_index": idx,
        "label": label,
        "color": color,
        "tip": tip,
        "personal": personal,
    }


@app.post("/api/rl/feedback")
def rl_feedback(
    body: RlFeedbackIn,
    user: Optional[AuthUser] = Depends(optional_user),
):
    try:
        _, _, base_q = load_model_artifacts()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Models unavailable: {e}")

    if body.q_row is not None:
        row = np.array(body.q_row, dtype=float)
        full = None
    else:
        full = np.array(base_q, dtype=float)
        if user:
            stored = persist.load_q_table(user.id)
            if stored is not None:
                try:
                    full = np.asarray(stored, dtype=float)
                except Exception:
                    pass
        row = np.array(full[body.fatigue_level], dtype=float)

    new_row, new_cap, reward = rl_update_from_outcomes(
        row, body.rec_action, body.outcomes, existing_cap=body.cap
    )

    persisted = False
    rl_updates = None
    if user and body.persist:
        if full is None:
            full = np.array(base_q, dtype=float)
            if user:
                stored = persist.load_q_table(user.id)
                if stored is not None:
                    try:
                        full = np.asarray(stored, dtype=float)
                    except Exception:
                        pass
        full = full.copy()
        full[body.fatigue_level] = new_row
        rl_updates = persist.bump_rl_updates(user.id)
        persisted = persist.save_q_table(user.id, full.tolist(), rl_updates=rl_updates)

    return {
        "reward": reward,
        "new_cap": new_cap,
        "new_row": new_row.tolist(),
        "next_action_index": rl_recommend_index(new_row, cap=new_cap),
        "persisted": persisted,
        "rl_updates": rl_updates,
    }


@app.post("/api/plan/decide")
def plan_decide(state: Dict[str, Any]):
    return decide_action(state) or {"action": None}


# ---------------------------------------------------------------------------
# Authenticated me / sync endpoints
# ---------------------------------------------------------------------------
@app.get("/api/me")
def me(user: AuthUser = Depends(require_user)):
    profile_row = persist.load_profile(user.id) or {}
    plan_row = persist.load_active_plan(user.id)
    snapshot = (plan_row or {}).get("profile_snapshot")
    if profile_row.get("web_profile") and isinstance(profile_row["web_profile"], dict):
        snapshot = profile_row["web_profile"]
    profile = _row_to_web_profile(profile_row, snapshot)
    days = _normalize_days((plan_row or {}).get("days") or [])
    checkin = persist.load_today_checkin(user.id)
    outcomes = persist.load_today_outcomes(user.id)
    history = persist.load_history(user.id)
    readiness = None
    if checkin:
        readiness = readiness_payload(
            checkin.get("sleep_hours"),
            checkin.get("sleep_quality"),
            checkin.get("soreness"),
            checkin.get("energy"),
            steps=checkin.get("steps"),
            active_minutes=checkin.get("active_minutes"),
        )
    decision = None
    if plan_row:
        dates = persist.list_outcome_dates_since(
            user.id, str(plan_row.get("start_date") or "")
        )
        state = compute_plan_state_from_parts(
            {
                "start_date": plan_row.get("start_date"),
                "length_days": plan_row.get("length_days") or len(days) or 7,
                "split_type": plan_row.get("split_type"),
                "frequency": plan_row.get("frequency"),
                "focus": plan_row.get("focus"),
                "goal": plan_row.get("goal"),
            },
            logged_dates=dates,
        )
        decision = decide_action(state)
    return {
        "user": {"id": user.id, "email": user.email},
        "profile": profile,
        "plan": days,
        "plan_meta": {
            "start_date": (plan_row or {}).get("start_date"),
            "length_days": (plan_row or {}).get("length_days"),
            "split_type": (plan_row or {}).get("split_type"),
            "frequency": (plan_row or {}).get("frequency"),
            "goal": (plan_row or {}).get("goal"),
        }
        if plan_row
        else None,
        "checkin": checkin,
        "readiness": readiness,
        "outcomes": outcomes,
        "history": history,
        "decision": decision,
        "rl_updates": (profile_row or {}).get("rl_updates") or 0,
        "onboarded": bool(days) or bool(profile_row.get("goal")),
    }


@app.put("/api/me/profile")
def put_profile(profile: ProfileIn, user: AuthUser = Depends(require_user)):
    ok = persist.save_profile(user.id, _profile_dict(profile))
    if not ok:
        raise HTTPException(status_code=500, detail="Could not save profile")
    return {"ok": True}


@app.post("/api/me/plan")
def put_plan(body: SavePlanIn, user: AuthUser = Depends(require_user)):
    days = _normalize_days(body.plan)
    persist.save_profile(user.id, _profile_dict(body.profile))
    ok = persist.save_active_plan(
        user.id,
        days,
        _profile_dict(body.profile),
        length_days=body.length_days or len(days),
        frequency=body.profile.frequency_days,
        split_type=body.profile.split,
        focus=body.profile.focus_muscle,
    )
    if not ok:
        raise HTTPException(status_code=500, detail="Could not save plan")
    return {"ok": True, "length_days": len(days)}


@app.post("/api/me/outcomes")
def post_outcome(body: OutcomeIn, user: AuthUser = Depends(require_user)):
    ok = persist.save_outcome(
        user.id,
        body.exercise_name,
        body.status,
        muscle_group=body.muscle_group,
        difficulty=body.difficulty,
        fatigue_at_time=body.fatigue_at_time,
    )
    if not ok:
        raise HTTPException(status_code=500, detail="Could not save outcome")
    return {"ok": True, "outcomes": persist.load_today_outcomes(user.id)}


@app.post("/api/me/history")
def post_history(body: HistoryEntryIn, user: AuthUser = Depends(require_user)):
    ok = persist.save_history_entry(user.id, body.model_dump())
    if not ok:
        raise HTTPException(status_code=500, detail="Could not save history")
    return {"ok": True, "history": persist.load_history(user.id)}
