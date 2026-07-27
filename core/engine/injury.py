"""Injury filtering — pure."""
from data import INJURY_SAFE_EXERCISES, DEFAULT_SAFE, INJURY_MUSCLE_MAP

def get_injury_safe_exercises(body_part, severity):
    sev_key = "moderate" if "Moderate" in severity else "low"
    return INJURY_SAFE_EXERCISES.get(body_part, DEFAULT_SAFE).get(sev_key, DEFAULT_SAFE[sev_key])

def get_blocked_groups(body_part, severity):
    if "Severe" in severity: return INJURY_MUSCLE_MAP.get(body_part, [])
    return []

def get_modified_groups(body_part, severity):
    if "Moderate" in severity or "Low" in severity: return INJURY_MUSCLE_MAP.get(body_part, [])
    return []

