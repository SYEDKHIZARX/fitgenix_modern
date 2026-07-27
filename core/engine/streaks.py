"""Streak and badge helpers — pure."""
import datetime

def get_streak(history):
    if not history: return 0
    today = datetime.date.today(); streak = 0
    for i in range(len(history)-1,-1,-1):
        if datetime.date.fromisoformat(history[i]["date"]) == today - datetime.timedelta(days=streak):
            streak += 1
        else: break
    return streak

def get_best_streak(history):
    if not history: return 0
    best = current = 1
    for i in range(1,len(history)):
        d1 = datetime.date.fromisoformat(history[i-1]["date"])
        d2 = datetime.date.fromisoformat(history[i]["date"])
        if (d2-d1).days == 1: current += 1; best = max(best,current)
        else: current = 1
    return best

BADGES = [
    (1,  "⚡","First Spark",      "You started your journey!"),
    (3,  "🔥","On Fire",          "3-day streak achieved!"),
    (7,  "💪","Week Warrior",     "7 days straight — incredible!"),
    (14, "🏅","Fortnight Fighter","14 days of consistency!"),
    (30, "🏆","Monthly Champion", "30-day streak — elite level!"),
    (50, "💎","Diamond Grinder",  "50 sessions logged!"),
    (100,"👑","Legend",           "100 days — unstoppable!"),
]
def get_earned_badges(streak, total):
    return [(ic,n,d) for t,ic,n,d in BADGES if streak>=t or total>=t]

