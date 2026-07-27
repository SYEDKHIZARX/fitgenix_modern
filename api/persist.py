"""Persistence against the same Supabase tables Streamlit uses."""
from __future__ import annotations

import datetime
from typing import Any, Dict, List, Optional

from api.db import get_admin_client


def _sb():
    return get_admin_client()


def _today() -> str:
    return datetime.date.today().isoformat()


def _now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------
def load_profile(user_id: str) -> Optional[Dict[str, Any]]:
    sb = _sb()
    if not sb:
        return None
    try:
        resp = sb.table("profiles").select("*").eq("id", user_id).limit(1).execute()
        if resp.data:
            return resp.data[0]
    except Exception:
        return None
    return None


def save_profile(user_id: str, profile: Dict[str, Any]) -> bool:
    """Upsert core profile columns (+ optional web fields if the schema allows)."""
    sb = _sb()
    if not sb:
        return False
    height = profile.get("height_cm") or profile.get("height")
    weight = profile.get("weight_kg") or profile.get("weight")
    row = {
        "id": user_id,
        "age": profile.get("age"),
        "gender": profile.get("gender"),
        "height_cm": height,
        "weight_kg": weight,
        "bmi": profile.get("bmi"),
        "body_type": profile.get("body_type"),
        "goal": profile.get("goal"),
        "updated_at": _now(),
    }
    # Extended web fields — ignored by DB if columns missing (retry core only)
    extended = {
        **row,
        "equipment_tier": profile.get("equipment_tier"),
        "experience_level": profile.get("experience_level") or profile.get("experience"),
        "split_type": profile.get("split") or profile.get("split_type"),
        "frequency": profile.get("frequency_days") or profile.get("frequency"),
        "injury_part": profile.get("injury_part"),
        "injury_severity": profile.get("injury_severity"),
        "fatigue": profile.get("fatigue"),
        "web_profile": profile,  # full snapshot if column exists
    }
    try:
        sb.table("profiles").upsert(extended).execute()
        return True
    except Exception:
        try:
            sb.table("profiles").upsert(row).execute()
            return True
        except Exception:
            return False


def save_q_table(user_id: str, q_table: List[List[float]], rl_updates: Optional[int] = None) -> bool:
    sb = _sb()
    if not sb:
        return False
    row: Dict[str, Any] = {
        "id": user_id,
        "q_table": q_table,
        "updated_at": _now(),
    }
    if rl_updates is not None:
        row["rl_updates"] = rl_updates
    try:
        sb.table("profiles").upsert(row).execute()
        return True
    except Exception:
        return False


def load_q_table(user_id: str) -> Optional[List]:
    p = load_profile(user_id)
    if p and p.get("q_table"):
        return p["q_table"]
    return None


def bump_rl_updates(user_id: str) -> int:
    p = load_profile(user_id) or {}
    n = int(p.get("rl_updates") or 0) + 1
    sb = _sb()
    if sb:
        try:
            sb.table("profiles").upsert(
                {"id": user_id, "rl_updates": n, "updated_at": _now()}
            ).execute()
        except Exception:
            pass
    return n


# ---------------------------------------------------------------------------
# Active plan
# ---------------------------------------------------------------------------
def _normalize_plan_payload(raw) -> Dict[str, Any]:
    """Support legacy list plan_json and v2 envelope {days, profile}."""
    if raw is None:
        return {"days": [], "profile": None}
    if isinstance(raw, list):
        return {"days": raw, "profile": None}
    if isinstance(raw, dict):
        days = raw.get("days") or raw.get("plan") or []
        return {"days": days, "profile": raw.get("profile")}
    return {"days": [], "profile": None}


def load_active_plan(user_id: str) -> Optional[Dict[str, Any]]:
    sb = _sb()
    if not sb:
        return None
    try:
        resp = (
            sb.table("active_plans")
            .select("*")
            .eq("user_id", user_id)
            .eq("status", "active")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if resp.data:
            row = resp.data[0]
            env = _normalize_plan_payload(row.get("plan_json"))
            row["days"] = env["days"]
            row["profile_snapshot"] = env["profile"]
            return row
    except Exception:
        return None
    return None


def save_active_plan(
    user_id: str,
    days: List[Dict[str, Any]],
    profile: Dict[str, Any],
    *,
    length_days: Optional[int] = None,
    frequency: Optional[int] = None,
    split_type: Optional[str] = None,
    focus: Optional[str] = None,
) -> bool:
    sb = _sb()
    if not sb:
        return False
    try:
        sb.table("active_plans").update({"status": "abandoned"}).eq(
            "user_id", user_id
        ).eq("status", "active").execute()
    except Exception:
        pass
    envelope = {"version": 2, "days": days, "profile": profile}
    row = {
        "user_id": user_id,
        "start_date": _today(),
        "length_days": length_days or len(days) or 7,
        "frequency": frequency or profile.get("frequency_days") or profile.get("frequency"),
        "split_type": split_type or profile.get("split") or profile.get("split_type"),
        "focus": focus or profile.get("focus_muscle"),
        "goal": profile.get("goal"),
        "plan_json": envelope,
        "status": "active",
        "current_cycle": 1,
    }
    try:
        sb.table("active_plans").insert(row).execute()
        return True
    except Exception:
        # fallback: legacy list-only plan_json
        try:
            row["plan_json"] = days
            sb.table("active_plans").insert(row).execute()
            return True
        except Exception:
            return False


# ---------------------------------------------------------------------------
# Check-ins
# ---------------------------------------------------------------------------
def load_today_checkin(user_id: str) -> Optional[Dict[str, Any]]:
    sb = _sb()
    if not sb:
        return None
    try:
        resp = (
            sb.table("daily_checkins")
            .select("*")
            .eq("user_id", user_id)
            .eq("check_date", _today())
            .limit(1)
            .execute()
        )
        if resp.data:
            return resp.data[0]
    except Exception:
        return None
    return None


def save_checkin(user_id: str, row: Dict[str, Any]) -> bool:
    sb = _sb()
    if not sb:
        return False
    payload = {
        "user_id": user_id,
        "check_date": _today(),
        "sleep_hours": row.get("sleep_hours"),
        "sleep_quality": row.get("sleep_quality"),
        "soreness": row.get("soreness"),
        "energy": row.get("energy"),
        "steps": row.get("steps"),
        "active_minutes": row.get("active_minutes"),
        "readiness_score": row.get("readiness_score"),
        "readiness_band": row.get("readiness_band"),
    }
    try:
        sb.table("daily_checkins").upsert(
            payload, on_conflict="user_id,check_date"
        ).execute()
        return True
    except Exception:
        try:
            sb.table("daily_checkins").delete().eq("user_id", user_id).eq(
                "check_date", _today()
            ).execute()
            sb.table("daily_checkins").insert(payload).execute()
            return True
        except Exception:
            return False


# ---------------------------------------------------------------------------
# Outcomes
# ---------------------------------------------------------------------------
def load_today_outcomes(user_id: str) -> Dict[str, Dict[str, Any]]:
    sb = _sb()
    if not sb:
        return {}
    try:
        resp = (
            sb.table("exercise_outcomes")
            .select("*")
            .eq("user_id", user_id)
            .eq("log_date", _today())
            .execute()
        )
        out: Dict[str, Dict[str, Any]] = {}
        for r in resp.data or []:
            out[r["exercise_name"]] = {
                "status": r.get("status"),
                "difficulty": r.get("difficulty"),
                "muscle_group": r.get("muscle_group"),
            }
        return out
    except Exception:
        return {}


def save_outcome(
    user_id: str,
    exercise_name: str,
    status: str,
    *,
    muscle_group: str = "",
    difficulty: Optional[str] = None,
    fatigue_at_time: Optional[str] = None,
) -> bool:
    sb = _sb()
    if not sb:
        return False
    today = _today()
    if status == "too_hard":
        row_status, difficulty = "completed", "too_hard"
    else:
        row_status = status
    row = {
        "user_id": user_id,
        "log_date": today,
        "exercise_name": exercise_name,
        "muscle_group": muscle_group or "",
        "status": row_status,
        "difficulty": difficulty,
        "fatigue_at_time": fatigue_at_time,
    }
    try:
        (
            sb.table("exercise_outcomes")
            .delete()
            .eq("user_id", user_id)
            .eq("log_date", today)
            .eq("exercise_name", exercise_name)
            .execute()
        )
        sb.table("exercise_outcomes").insert(row).execute()
        return True
    except Exception:
        return False


def list_outcome_dates_since(user_id: str, start_date: str) -> List[str]:
    sb = _sb()
    if not sb:
        return []
    try:
        resp = (
            sb.table("exercise_outcomes")
            .select("log_date")
            .eq("user_id", user_id)
            .gte("log_date", start_date)
            .execute()
        )
        return sorted({r["log_date"] for r in (resp.data or []) if r.get("log_date")})
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Workout history
# ---------------------------------------------------------------------------
def load_history(user_id: str) -> List[Dict[str, Any]]:
    sb = _sb()
    if not sb:
        return []
    try:
        resp = (
            sb.table("workout_history")
            .select("*")
            .eq("user_id", user_id)
            .order("log_date", desc=False)
            .execute()
        )
        history = []
        for r in resp.data or []:
            history.append(
                {
                    "date": r.get("log_date"),
                    "steps": r.get("steps"),
                    "active_minutes": r.get("active_minutes"),
                    "fatigue": r.get("fatigue"),
                    "calorie_intensity": r.get("calorie_intensity"),
                    "rl_recommendation": r.get("rl_recommendation"),
                    "goal": r.get("goal"),
                    "bmi": r.get("bmi"),
                    "calorie_score": r.get("calorie_score"),
                }
            )
        return history
    except Exception:
        return []


def save_history_entry(user_id: str, entry: Dict[str, Any]) -> bool:
    sb = _sb()
    if not sb:
        return False
    today = _today()
    row = {
        "user_id": user_id,
        "log_date": today,
        "steps": int(entry.get("steps") or 0),
        "active_minutes": int(entry.get("active_minutes") or 0),
        "fatigue": entry.get("fatigue"),
        "calorie_intensity": entry.get("calorie_intensity"),
        "rl_recommendation": entry.get("rl_recommendation") or entry.get("rl_rec"),
        "goal": entry.get("goal"),
        "bmi": float(entry["bmi"]) if entry.get("bmi") is not None else None,
        "calorie_score": float(entry["calorie_score"])
        if entry.get("calorie_score") is not None
        else None,
    }
    try:
        sb.table("workout_history").delete().eq("user_id", user_id).eq(
            "log_date", today
        ).execute()
        sb.table("workout_history").insert(row).execute()
        return True
    except Exception:
        return False
