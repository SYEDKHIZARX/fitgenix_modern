import type { PlanDay, Readiness, SessionToday, UserProfile } from "./types";

const BASE =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "/backend"
    : process.env.FITGENIX_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000";

let authToken: string | null = null;

export function setApiAuthToken(token: string | null) {
  authToken = token;
}

export function getApiAuthToken() {
  return authToken;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) || {}),
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export async function apiHealth(): Promise<{
  status: string;
  supabase?: boolean;
  version?: string;
}> {
  return request("/api/health");
}

export async function apiReadiness(body: {
  sleep_hours: number;
  sleep_quality: string;
  soreness: string;
  energy: string;
  steps?: number | null;
  active_minutes?: number | null;
}): Promise<Readiness> {
  return request("/api/readiness", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiGeneratePlan(
  profile: UserProfile
): Promise<{ length_days: number; plan: PlanDay[]; persisted?: boolean }> {
  return request("/api/generate-plan", {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

export async function apiSessionToday(
  profile: UserProfile,
  checkin: {
    sleep_hours: number;
    sleep_quality: string;
    soreness: string;
    energy: string;
    steps?: number | null;
    active_minutes?: number | null;
  } | null,
  day: number,
  plan?: PlanDay[]
): Promise<SessionToday> {
  return request(`/api/session/today`, {
    method: "POST",
    body: JSON.stringify({
      profile,
      checkin,
      day,
      plan: plan || null,
    }),
  });
}

export async function apiSubstitutes(
  exercise_name: string,
  equipment_tier: string,
  injury_part?: string | null
) {
  return request<{
    exercise_name: string;
    alternatives: Array<{
      name: string;
      scheme: string;
      equipment: string;
      muscles: string;
      note: string;
    }>;
  }>("/api/exercises/substitutes", {
    method: "POST",
    body: JSON.stringify({
      exercise_name,
      equipment_tier,
      injury_part: injury_part || null,
    }),
  });
}

export async function apiBmi(weight_kg: number, height_cm: number) {
  const q = new URLSearchParams({
    weight_kg: String(weight_kg),
    height_cm: String(height_cm),
  });
  return request<{ bmi: number; category: string; color: string }>(
    `/api/bmi?${q}`
  );
}

export async function apiRlRecommend(fatigue_level: number) {
  return request<{
    fatigue_level: number;
    action_index: number;
    label: string;
    color: string;
    tip: string;
    personal?: boolean;
  }>(`/api/rl/recommend?fatigue_level=${fatigue_level}`);
}

export async function apiRlFeedback(body: {
  fatigue_level: number;
  rec_action: number;
  outcomes: Array<{ status: string; difficulty?: string | null }>;
  q_row?: number[];
  cap?: number | null;
  persist?: boolean;
}) {
  return request<{
    reward: number;
    new_cap: number | null;
    new_row: number[];
    next_action_index: number;
    persisted?: boolean;
    rl_updates?: number;
  }>("/api/rl/feedback", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiPlanDecide(state: Record<string, unknown>) {
  return request("/api/plan/decide", {
    method: "POST",
    body: JSON.stringify(state),
  });
}

/** Cloud bootstrap for logged-in users */
export async function apiMe() {
  return request<{
    user: { id: string; email?: string | null };
    profile: UserProfile;
    plan: PlanDay[];
    plan_meta: {
      start_date?: string;
      length_days?: number;
      split_type?: string;
      frequency?: number;
      goal?: string;
    } | null;
    checkin: Record<string, unknown> | null;
    readiness: Readiness | null;
    outcomes: Record<string, { status: string; difficulty?: string | null }>;
    history: Array<Record<string, unknown>>;
    decision: {
      action: string;
      headline: string;
      detail: string;
      ramp_factor: number;
      severity: string;
    } | null;
    rl_updates: number;
    onboarded: boolean;
  }>("/api/me");
}

export async function apiSaveOutcome(body: {
  exercise_name: string;
  status: string;
  muscle_group?: string;
  difficulty?: string | null;
  fatigue_at_time?: string | null;
}) {
  return request<{
    ok: boolean;
    outcomes: Record<string, { status: string; difficulty?: string | null }>;
  }>("/api/me/outcomes", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiSaveHistory(body: Record<string, unknown>) {
  return request<{ ok: boolean; history: Array<Record<string, unknown>> }>(
    "/api/me/history",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export async function apiSaveProfile(profile: UserProfile) {
  return request<{ ok: boolean }>("/api/me/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}
