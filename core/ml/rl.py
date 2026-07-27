"""Reinforcement learning helpers — pure (no Streamlit / Supabase)."""
from __future__ import annotations

import numpy as np

RL_ALPHA = 0.25

RL_ACTIONS = {
    0: ("REST / RECOVERY",  "#6B7280", "Your body needs recovery. Prioritise sleep, hydration, and light stretching."),
    1: ("LIGHT ACTIVITY",   "#00B4FF", "A gentle session - 20-30 min walk, yoga, or mobility work."),
    2: ("MODERATE WORKOUT", "#FF6B35", "You are ready. Aim for 45-60 min of steady cardio or strength training."),
    3: ("HIGH INTENSITY",   "#E8FF00", "Fully rested - push hard today. HIIT, heavy lifts, or interval runs."),
}


def get_rl_recommendation(fatigue_level, q_table):
    """Recommend intensity from Q-table row for fatigue_level (0..2)."""
    return RL_ACTIONS[int(np.argmax(q_table[fatigue_level]))]


def rl_recommend_index(q_table_or_row, fatigue_level=None, cap=None):
    """Argmax over Q row, restricted by optional safety cap.

    Accepts either full q_table + fatigue_level, or a 1-D row with fatigue_level=None.
    """
    if fatigue_level is None:
        row = np.asarray(q_table_or_row, dtype=float)
    else:
        row = np.asarray(q_table_or_row[fatigue_level], dtype=float)
    if cap is not None and cap < len(row) - 1:
        return int(np.argmax(row[: cap + 1]))
    return int(np.argmax(row))


def rl_update_from_outcomes(row, rec_action, outcomes_list, alpha=RL_ALPHA, existing_cap=None):
    """Apply validated Q-update for one fatigue state.

    outcomes_list: list of dicts with status/difficulty.
    Returns (new_row, new_cap, reward).
    """
    if not outcomes_list:
        return np.asarray(row, dtype=float).copy(), existing_cap, 0.0
    row = np.asarray(row, dtype=float).copy()
    too_hard = sum(1 for o in outcomes_list if o.get("difficulty") == "too_hard")
    done = sum(
        1
        for o in outcomes_list
        if o.get("status") == "completed" and o.get("difficulty") != "too_hard"
    )
    skipped = sum(1 for o in outcomes_list if o.get("status") == "skipped")
    n = len(outcomes_list)
    reward = max(-1.0, min(1.0, (done * 1.0 - too_hard * 1.0 - skipped * 0.4) / n))

    row[rec_action] += alpha * (reward - row[rec_action])
    if too_hard > 0 and rec_action > 0:
        row[rec_action - 1] += alpha * 0.5 * abs(reward)
    if too_hard == 0 and done == n and rec_action < len(row) - 1:
        row[rec_action + 1] += alpha * 0.5 * reward

    new_cap = existing_cap
    if too_hard > 0:
        new_cap = rec_action
    return row, new_cap, reward


def personalize_recommendation(q_table, fatigue_level, cap=None):
    """Drop-in personalised recommendation tuple (label, color, tip)."""
    idx = rl_recommend_index(q_table, fatigue_level, cap=cap)
    return RL_ACTIONS[idx]
