"""Domain models — TypedDicts + Pydantic (API-ready)."""
from typing import List, Optional, TypedDict

try:
    from pydantic import BaseModel, Field
except ImportError:  # optional until API phase pins pydantic
    BaseModel = object  # type: ignore
    Field = None  # type: ignore


class ExerciseView(TypedDict, total=False):
    name: str
    sets_reps: str
    weight: str
    muscles: str
    rest: str
    intensity: str
    progression_note: Optional[str]
    progression_action: Optional[str]


class PlanDay(TypedDict, total=False):
    day: int
    focus: str
    is_rest: bool
    exercises: List[ExerciseView]


# ---------------------------------------------------------------------------
# Pydantic models (used by FastAPI / UI track adapters)
# ---------------------------------------------------------------------------
if BaseModel is not object:

    class ProfileModel(BaseModel):
        user_id: str = "local-user-id"
        age: int = 25
        height_cm: float = 175.0
        weight_kg: float = 70.0
        bmi: float = 22.9
        bmi_category: str = "Normal weight"
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
        single_mode: Optional[str] = None
        focus_muscle: Optional[str] = None
        ramp_factor: float = 1.0

    class CheckInModel(BaseModel):
        sleep_hours: float = 7.0
        sleep_quality: str = "ok"  # good | ok | poor
        soreness: str = "mild"  # none | mild | moderate | severe
        energy: str = "good"  # high | good | ok | low | very low
        steps: Optional[int] = None
        active_minutes: Optional[int] = None

    class OutcomeModel(BaseModel):
        exercise_name: str
        muscle_group: str = ""
        status: str  # completed | skipped
        difficulty: Optional[str] = None  # too_hard | None
        fatigue_at_time: Optional[str] = None

    class ReadinessResponse(BaseModel):
        score: float
        band: str
        color: str
        message: str
        drivers: List[str] = []
        components: Optional[dict] = None

    class ExerciseItem(BaseModel):
        name: str
        sets_reps: str
        weight: str = ""
        muscles: str = ""
        note: str = ""
        status: Optional[str] = None
        difficulty: Optional[str] = None

    class SessionDayResponse(BaseModel):
        day_number: int
        focus: str
        is_rest: bool
        exercises: List[ExerciseItem]
        autoreg_note: Optional[str] = None

else:
    ProfileModel = None  # type: ignore
    CheckInModel = None  # type: ignore
    OutcomeModel = None  # type: ignore
    ReadinessResponse = None  # type: ignore
    ExerciseItem = None  # type: ignore
    SessionDayResponse = None  # type: ignore
