"""Plan lifecycle decisions — pure."""
from __future__ import annotations

import datetime


def decide_action(state):
    """Phase 5 (Step 5): map computed plan-state to a coaching decision.
    Returns {action, headline, detail, ramp_factor, severity}.
    Safety logic: long gaps ramp back / restart; overtraining triggers deload;
    being behind is never punished."""
    if not state:
        return None
    status = state["status"]
    gap = state.get("last_log_gap")
    adherence = state.get("adherence", 0)
    elapsed = state.get("days_elapsed", 0)
    length = state.get("length", 7)
    expected_day = state.get("expected_day", 1)

    if status == "Plan complete":
        return {"action":"progress","headline":"Plan complete - ready to progress",
                "detail":"You finished this plan. Generate your next cycle to keep advancing.",
                "ramp_factor":1.0,"severity":"good"}
    if gap is not None and gap >= 14:
        return {"action":"start_fresh","headline":"Welcome back after a long break",
                "detail":f"It's been {gap} days. Your body has detrained, so starting fresh "
                         "(rather than resuming mid-plan) is the safe, effective choice.",
                "ramp_factor":0.6,"severity":"warn"}
    if gap is not None and gap >= 4:
        return {"action":"resume_ramp","headline":"Welcome back - easing you in",
                "detail":f"You've had a {gap}-day break. Ease back in at reduced load today, "
                         "then build back to full intensity over your next sessions.",
                "ramp_factor":0.75,"severity":"warn"}
    if adherence >= 0.95 and elapsed >= 6 and (gap is not None and gap <= 1):
        return {"action":"deload","headline":"You've earned a lighter day",
                "detail":"You've trained consistently and hard. A lighter session now lets your "
                         "body adapt and come back stronger - recovery is training too.",
                "ramp_factor":0.6,"severity":"good"}
    if status == "On track":
        return {"action":"continue","headline":f"On track - Day {expected_day} of {length}",
                "detail":"You're following your plan well. Today's session is ready below.",
                "ramp_factor":1.0,"severity":"good"}
    if status == "Not started yet":
        return {"action":"begin","headline":"Your plan is ready",
                "detail":"You haven't logged a session yet - start with Day 1 whenever you're ready.",
                "ramp_factor":1.0,"severity":"neutral"}
    if status == "Behind schedule":
        return {"action":"continue","headline":"Let's pick up where you are",
                "detail":"A little behind is completely fine - consistency matters more than "
                         "perfection. Continue with today's session.",
                "ramp_factor":1.0,"severity":"neutral"}
    return {"action":"continue","headline":"Continue your plan","detail":"",
            "ramp_factor":1.0,"severity":"neutral"}



def compute_plan_state_from_parts(
    plan,
    *,
    today=None,
    logged_dates=None,
):
    """Pure plan-state derivation.

    plan: dict with start_date, length_days, split_type, frequency, focus, goal
    logged_dates: iterable of ISO date strings for sessions since plan start
    """
    if not plan:
        return None
    today = today or datetime.date.today()
    try:
        start = datetime.date.fromisoformat(str(plan["start_date"]))
    except Exception:
        start = today
    length = int(plan.get("length_days") or 7)
    days_elapsed = (today - start).days
    expected_day = min(max(days_elapsed + 1, 1), length)

    dates = sorted({d for d in (logged_dates or []) if d})
    logged_days = len(dates)
    last_log_gap = None
    if dates:
        last = datetime.date.fromisoformat(dates[-1])
        last_log_gap = (today - last).days

    expected_so_far = max(days_elapsed, 1)
    adherence = min((logged_days / expected_so_far) if expected_so_far else 0.0, 1.0)

    if days_elapsed >= length:
        status = "Plan complete"
    elif last_log_gap is not None and last_log_gap >= 4:
        status = "Picking back up"
    elif adherence >= 0.7:
        status = "On track"
    elif logged_days == 0:
        status = "Not started yet"
    else:
        status = "Behind schedule"

    return {
        "expected_day": expected_day,
        "length": length,
        "days_elapsed": days_elapsed,
        "logged_days": logged_days,
        "adherence": adherence,
        "last_log_gap": last_log_gap,
        "status": status,
        "split_type": plan.get("split_type"),
        "frequency": plan.get("frequency"),
        "focus": plan.get("focus"),
        "goal": plan.get("goal"),
        "start_date": str(plan.get("start_date")),
    }
