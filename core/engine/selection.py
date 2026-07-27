"""Exercise selection — pure."""
from data import (
    EXERCISE_LIBRARY, select_cardio, exercise_allowed,
    goal_exercise_nature, get_exercise_meta, score_exercise_for_rotation,
)
from core.engine.injury import get_injury_safe_exercises

def pick_exercises(group, count=3, blocked=[], modified=[], injury_part=None, severity=None,
                   recent_subdivisions=None, rotation_offset=0, recent_exercises=None,
                   equipment_tier=None, goal=None, bmi_cat=None, emphasis=None):
    if group in blocked: return []
    if group in modified and injury_part and severity:
        safe = get_injury_safe_exercises(injury_part, severity)
        return safe[:count] if safe else []
    pool = list(EXERCISE_LIBRARY.get(group, EXERCISE_LIBRARY["rest"]))
    # Phase 6 (Layer 6): recomposition cardio -- for fat-loss/high-BMI users,
    # prefer muscle-preserving stamina modalities over pure steady-state.
    if group == "cardio" and (goal or bmi_cat):
        names = [ex[0] for ex in pool]
        chosen = select_cardio(names, goal, bmi_cat, count=count)
        by_name = {ex[0]: ex for ex in pool}
        picked = [by_name[n] for n in chosen if n in by_name]
        if picked:
            return picked[:count]
    # Phase 6: equipment filter FIRST -- it's a HARD constraint (a bodyweight-only
    # user must never see a barbell, regardless of goal).
    if equipment_tier:
        filtered = [ex for ex in pool if exercise_allowed(ex[0], equipment_tier)]
        if filtered:
            pool = filtered
    # Phase 6 (Point 3): then, for WEIGHTED goals, prefer loaded work as primary
    # (bodyweight -> warm-up). Only applies if loaded options remain after the
    # equipment filter -- so a bodyweight-only user keeps their bodyweight plan.
    if emphasis and goal_exercise_nature(emphasis) == "weighted":
        loaded = [ex for ex in pool if get_exercise_meta(ex[0]).get("equipment") != "bodyweight"]
        if len(loaded) >= count:
            pool = loaded
    if len(pool) <= count:
        return pool[:count]

    # Phase 6 (Layer 3): rotation-aware selection. Rank so exercises hitting
    # UNDER-trained subdivisions come first AND exercises already used on an
    # earlier same-muscle day this week are pushed down -- so a 2nd push day
    # emphasizes different chest regions AND different movements than the 1st.
    recent_subs = set(recent_subdivisions or [])
    used = set(recent_exercises or [])
    base_index = {ex[0]: idx for idx, ex in enumerate(EXERCISE_LIBRARY.get(group, []))}
    def sort_key(ex):
        name = ex[0]
        already_used = 1 if name in used else 0           # used exact exercise -> push down hard
        sub_score = -score_exercise_for_rotation(name, recent_subs)  # fresh subdivision first
        return (already_used, sub_score, base_index.get(name, 0))
    try:
        scored = sorted(pool, key=sort_key)
    except Exception:
        scored = pool
    if scored and rotation_offset:
        off = rotation_offset % len(scored)
        scored = scored[off:] + scored[:off]
    return scored[:count]

