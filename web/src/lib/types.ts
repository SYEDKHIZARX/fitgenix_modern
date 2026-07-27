export type OutcomeStatus = "completed" | "skipped" | "too_hard";

export interface UserProfile {
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  goal: string;
  split: string;
  frequency_days: number;
  experience_level: string;
  equipment_tier: string;
  injury_part?: string | null;
  injury_severity?: string | null;
  body_type: string;
  fatigue: string;
  rl_rec: string;
  steps: number;
  active_minutes: number;
  calorie_intensity: string;
  ramp_factor: number;
  single_mode?: string | null;
  focus_muscle?: string | null;
}

export interface PlanExercise {
  name: string;
  sets_reps: string;
  weight?: string;
  muscles?: string;
  note?: string;
  status?: OutcomeStatus | null;
  difficulty?: string | null;
}

export interface PlanDay {
  day: number;
  focus: string;
  is_rest: boolean;
  exercises: PlanExercise[];
}

export interface Readiness {
  score: number;
  band: string;
  color: string;
  message: string;
  drivers: string[];
}

export interface SessionToday {
  day_number: number;
  focus: string;
  is_rest: boolean;
  exercises: PlanExercise[];
  autoreg_note?: string | null;
}

export interface Decision {
  action: string;
  headline: string;
  detail: string;
  ramp_factor: number;
  severity: string;
}

export const DEFAULT_PROFILE: UserProfile = {
  age: 27,
  gender: "Male",
  height_cm: 175,
  weight_kg: 72,
  goal: "Hypertrophy Training",
  split: "ppl",
  frequency_days: 6,
  experience_level: "Intermediate",
  equipment_tier: "Full gym",
  injury_part: null,
  injury_severity: null,
  body_type: "Mesomorph",
  fatigue: "Fully Rested",
  rl_rec: "MODERATE WORKOUT",
  steps: 8000,
  active_minutes: 60,
  calorie_intensity: "Moderate",
  ramp_factor: 1.0,
};

export const GOAL_CLUSTERS: Record<string, string[]> = {
  "Build Muscle": [
    "Hypertrophy Training",
    "Bodybuilding Training",
    "Resistance Training",
    "Functional Bodybuilding",
  ],
  "Get Stronger": [
    "Strength Training",
    "Powerlifting Training",
    "Olympic Weightlifting",
    "Power / Explosive Training",
  ],
  "Lose Fat & Conditioning": [
    "HIIT (High-Intensity Interval Training)",
    "Cardiovascular (Cardio) Training",
    "Metabolic Conditioning (MetCon)",
    "Circuit Training",
  ],
  "Athletic Performance": [
    "Athletic Performance Training",
    "Functional Training",
    "Speed & Agility Training",
    "Cross-Training / Hybrid Training",
  ],
  "Bodyweight & Calisthenics": [
    "Calisthenics",
    "Bodyweight Training",
    "Suspension Training (TRX)",
  ],
  "Mobility & Wellness": [
    "Mobility Training",
    "Yoga Training",
    "Pilates Training",
    "Core Training",
  ],
  "Recovery & Rehab": [
    "Recovery / Active Recovery Training",
    "Rehabilitation / Corrective Exercise",
  ],
};

export const SPLIT_OPTIONS = [
  { value: "ppl", label: "Push / Pull / Legs", days: [3, 6] },
  { value: "upper_lower", label: "Upper / Lower", days: [2, 4] },
  { value: "full_body", label: "Full Body", days: [2, 3] },
  { value: "single", label: "Single Muscle Focus", days: [3, 4, 5] },
];
