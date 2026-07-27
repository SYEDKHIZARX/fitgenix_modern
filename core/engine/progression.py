"""Load ramp and rep progression — pure."""
import re

def apply_ramp(sets_reps, factor):
    """Phase 5: scale a sets_reps string by a ramp factor (e.g. 0.75 after a
    break, 0.6 for deload) by reducing SETS while keeping reps/holds intact.
    Robust to '3 x 12', '3 x 30s', '3x15'. Never below 1 set."""
    import re as _re
    if not sets_reps or not factor or factor >= 1.0:
        return sets_reps
    m = _re.match(r"\s*(\d+)\s*[xX]\s*(.+)", str(sets_reps))
    if not m:
        return sets_reps
    sets = int(m.group(1)); rest = m.group(2)
    new_sets = max(1, round(sets * factor))
    if new_sets == sets and sets > 1:
        new_sets = sets - 1
    return f"{new_sets} x {rest}"


def apply_progression(sets_reps, action):
    """Adjust a 'sets x reps' scheme per a progression action.
    progress -> nudge reps up; ease -> nudge down. Sets unchanged."""
    import re as _re
    if not action or action == "hold":
        return sets_reps
    m = _re.match(r"\s*(\d+)\s*[xX]\s*(.+)", str(sets_reps))
    if not m:
        return sets_reps
    sets, rest = m.group(1), m.group(2).strip()
    rng = _re.match(r"(\d+)\s*-\s*(\d+)$", rest)
    if rng:
        lo, hi = int(rng.group(1)), int(rng.group(2))
        new = f"{hi}-{hi+2}" if action == "progress" else f"{max(1,lo-2)}-{lo}"
        return f"{sets} x {new}"
    num = _re.match(r"(\d+)$", rest)
    if num:
        n = int(num.group(1))
        n = n + 2 if action == "progress" else max(1, n - 2)
        return f"{sets} x {n}"
    return sets_reps




def progression_from_outcomes(rows):
    """Pure form of get_exercise_progression given already-fetched outcome rows.
    rows: newest-first list of {status, difficulty, log_date}.
    """
    if not rows:
        return None
    last = rows[0]
    too_hard = last.get("difficulty") == "too_hard"
    completed = last.get("status") == "completed"
    comfortable = sum(
        1
        for r in rows
        if r.get("status") == "completed" and r.get("difficulty") != "too_hard"
    )
    if too_hard:
        return {"action": "ease", "note": "eased - you found this tough last time"}
    if completed and comfortable >= 2:
        return {"action": "progress", "note": "progressed - you've handled this well"}
    if completed:
        return {"action": "hold", "note": "keep building consistency here"}
    return None
