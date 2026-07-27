"""Plan construction — pure structured plan data."""
from data import get_exercise_meta, get_rep_scheme, format_scheme, _EMPHASIS_WHY
from core.engine.injury import get_blocked_groups, get_modified_groups
from core.engine.schedule import get_schedule
from core.engine.selection import pick_exercises
from core.engine.progression import apply_ramp, apply_progression

def get_plan_data(user_profile, injury_profile=None, progression_fn=None):
    """Returns the 7-day plan as structured data (no HTML), using the exact
    same schedule + exercise-selection logic as build_workout_plan, so the PDF
    can never disagree with what is shown on screen.
    Shape: list of {day, focus, is_rest, exercises:[{name,sets_reps,weight,muscles}]}"""
    goal    = user_profile["goal"]
    bmi_cat = user_profile["bmi_cat"]
    fatigue = user_profile["fatigue"]
    rl_rec  = user_profile["rl_rec"]

    has_injury  = injury_profile and injury_profile.get("has_injury") == "Yes"
    injury_part = injury_profile.get("body_part","") if has_injury else ""
    severity    = injury_profile.get("severity","")  if has_injury else ""
    blocked     = get_blocked_groups(injury_part, severity)  if has_injury else []
    modified    = get_modified_groups(injury_part, severity) if has_injury else []

    schedule, meta = get_schedule(goal, bmi_cat, fatigue, rl_rec,
                                  split_type=user_profile.get("split_type"),
                                  frequency=user_profile.get("frequency"),
                                  single_mode=user_profile.get("single_mode"),
                                  focus_muscle=user_profile.get("focus_muscle"))

    if bmi_cat in ["Overweight","Obese"]:
        schedule = [
            (label+(" + Cardio" if "cardio" not in groups and label!="Rest & Recovery" else ""),
             (["cardio"]+groups if "cardio" not in groups and label!="Rest & Recovery" else groups))
            for label,groups in schedule
        ]
    if fatigue == "Very Fatigued":
        schedule[0] = ("Active Recovery",["recovery","cardio"])
    if "REST" in rl_rec.upper() and fatigue != "Fully Rested":
        schedule[0] = ("Active Recovery",["recovery","mobility"])

    days = []
    # Phase 6 (Layer 3): track which subdivisions each muscle group has hit on
    # earlier days, so later same-muscle days rotate to under-trained regions.
    _group_recent = {}   # group -> set of subdivisions used so far
    _group_seen = {}     # group -> how many times trained (for rotation offset)
    _group_used = {}     # group -> set of exact exercise names used so far
    for i,(focus,groups) in enumerate(schedule):
        is_rest = focus in ("Rest & Recovery","Active Recovery")
        day = {"day": i+1, "focus": focus, "is_rest": is_rest, "exercises": []}
        if not is_rest:
            for group in groups:
                _recent = _group_recent.get(group, set())
                _off = _group_seen.get(group, 0)
                _used = _group_used.get(group, set())
                exercises = pick_exercises(group,count=3,blocked=blocked,modified=modified,
                                           injury_part=injury_part,severity=severity,
                                           recent_subdivisions=_recent, rotation_offset=_off*3,
                                           recent_exercises=_used,
                                           equipment_tier=user_profile.get("equipment_tier"),
                                           goal=user_profile.get("goal"), bmi_cat=user_profile.get("bmi_cat"),
                                           emphasis=meta.get("emphasis"))
                # record what this day used, so the next same-group day rotates
                for ex in exercises:
                    _group_recent.setdefault(group, set()).update(get_exercise_meta(ex[0]).get("subdivision", []))
                    _group_used.setdefault(group, set()).add(ex[0])
                _group_seen[group] = _off + 1
                for name,sets_reps,weight,muscles,progression in exercises:
                    _ramp = user_profile.get("ramp_factor", 1.0)
                    # Phase 6 (Layer 4): dynamic sets/reps by goal emphasis + experience.
                    _emph = meta.get("emphasis", "volume")
                    _is_iso = get_exercise_meta(name).get("movement") == "isolation"
                    _scheme = get_rep_scheme(_emph, user_profile.get("experience","Intermediate"), _is_iso)
                    _sr = format_scheme(_scheme)
                    # Phase 6 (Layer 5): honest progression from logged outcomes.
                    _prog = progression_fn(name) if progression_fn else None
                    if _prog:
                        _sr = apply_progression(_sr, _prog["action"])
                    day["exercises"].append({
                        "name": name, "sets_reps": apply_ramp(_sr, _ramp),
                        "weight": weight, "muscles": muscles,
                        "rest": _scheme["rest"], "intensity": _scheme["intensity"],
                        "progression_note": (_prog or {}).get("note"),
                        "progression_action": (_prog or {}).get("action"),
                    })
        days.append(day)
    return days


def get_exercise_reason(group, focus, meta, fatigue, cal_int,
                        injured=False, injury_part="", modified=False):
    """Returns a short, truthful 'why this exercise' string built only from
    signals the recommendation engine already produced -- no invented claims."""
    emph = meta.get("emphasis", "balanced")
    why_emph = _EMPHASIS_WHY.get(emph, "your selected training focus")
    g = (group or "").replace("_", " ")

    bits = []
    # core reason: goal emphasis + the muscle group this slot targets
    if g and g not in ("cardio", "recovery", "mobility"):
        bits.append(f"targets your {g} as part of {why_emph}")
    elif g == "cardio":
        bits.append("conditioning work to support your goal and recovery")
    elif g in ("recovery", "mobility"):
        bits.append("light movement to aid recovery without adding fatigue")
    else:
        bits.append(f"supports {why_emph}")

    # fatigue context (only when it actually shaped the choice)
    if fatigue == "Very Fatigued":
        bits.append("kept lighter today because you logged high fatigue")
    elif fatigue == "Fully Rested":
        bits.append("you're rested, so it's programmed at full effort")

    # injury context
    if modified:
        bits.append(f"adjusted to protect your {injury_part}")

    reason = "; ".join(bits)
    return reason[0].upper() + reason[1:] if reason else ""

