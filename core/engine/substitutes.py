"""Exercise substitution — pure."""
from __future__ import annotations

from typing import Dict, List, Optional

from data import EXERCISE_LIBRARY, INJURY_MUSCLE_MAP, exercise_allowed, get_exercise_meta


def get_exercise_substitutes(
    exercise_name: str,
    equipment_tier: str = "Full gym",
    injury_part: Optional[str] = None,
    limit: int = 5,
) -> List[Dict[str, str]]:
    """Return safe alternatives targeting the same muscle group.

    Filters by equipment tier and skips exercises that primarily load an
    injured region (via INJURY_MUSCLE_MAP group membership).
    """
    target_group = None
    for group, ex_list in EXERCISE_LIBRARY.items():
        for ex in ex_list:
            if ex[0].lower() == exercise_name.lower():
                target_group = group
                break
        if target_group:
            break
    if not target_group:
        return []

    blocked_groups = set()
    if injury_part and injury_part not in ("None", "", None):
        # map uses title-case keys like "Knee"
        for key, groups in INJURY_MUSCLE_MAP.items():
            if key.lower() == str(injury_part).lower():
                blocked_groups = set(groups)
                break

    substitutes: List[Dict[str, str]] = []
    for ex in EXERCISE_LIBRARY.get(target_group, []):
        name, scheme, eq, muscles, note = ex
        if name.lower() == exercise_name.lower():
            continue
        if equipment_tier and not exercise_allowed(name, equipment_tier):
            continue
        # if this group is blocked by injury, skip (we're already in target_group)
        if target_group in blocked_groups:
            continue
        substitutes.append(
            {
                "name": name,
                "scheme": scheme,
                "equipment": eq,
                "muscles": muscles,
                "note": note,
                "group": target_group,
                "meta_equipment": get_exercise_meta(name).get("equipment", ""),
            }
        )
        if len(substitutes) >= limit:
            break
    return substitutes
