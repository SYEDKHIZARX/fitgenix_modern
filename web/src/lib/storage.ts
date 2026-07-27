import type { PlanDay, Readiness, UserProfile } from "./types";
import { DEFAULT_PROFILE } from "./types";

const KEYS = {
  profile: "fg_profile",
  plan: "fg_plan",
  planStart: "fg_plan_start",
  onboarding: "fg_onboarding_done",
  checkin: "fg_checkin",
  checkinDate: "fg_checkin_date",
  readiness: "fg_readiness",
  outcomes: "fg_outcomes",
  outcomesDate: "fg_outcomes_date",
  history: "fg_history",
  streak: "fg_streak_meta",
} as const;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getProfile(): UserProfile {
  return { ...DEFAULT_PROFILE, ...read(KEYS.profile, {}) };
}

export function saveProfile(p: UserProfile) {
  write(KEYS.profile, p);
}

export function getPlan(): PlanDay[] {
  return read(KEYS.plan, []);
}

export function savePlan(plan: PlanDay[]) {
  write(KEYS.plan, plan);
  write(KEYS.planStart, today());
}

export function getPlanStart(): string | null {
  return read(KEYS.planStart, null as string | null);
}

export function isOnboarded(): boolean {
  return read(KEYS.onboarding, false);
}

export function setOnboarded(v = true) {
  write(KEYS.onboarding, v);
}

export function getTodayCheckin(): {
  sleep_hours: number;
  sleep_quality: string;
  soreness: string;
  energy: string;
} | null {
  if (read(KEYS.checkinDate, "") !== today()) return null;
  return read(KEYS.checkin, null);
}

export function saveTodayCheckin(data: {
  sleep_hours: number;
  sleep_quality: string;
  soreness: string;
  energy: string;
}) {
  write(KEYS.checkin, data);
  write(KEYS.checkinDate, today());
}

export function getReadiness(): Readiness | null {
  if (read(KEYS.checkinDate, "") !== today()) return null;
  return read(KEYS.readiness, null);
}

export function saveReadiness(r: Readiness) {
  write(KEYS.readiness, r);
}

export type OutcomeMap = Record<
  string,
  { status: string; difficulty?: string | null }
>;

export function getTodayOutcomes(): OutcomeMap {
  if (read(KEYS.outcomesDate, "") !== today()) return {};
  return read(KEYS.outcomes, {});
}

export function saveTodayOutcome(
  name: string,
  status: string,
  difficulty?: string | null
) {
  const map = getTodayOutcomes();
  map[name] = { status, difficulty: difficulty ?? null };
  write(KEYS.outcomes, map);
  write(KEYS.outcomesDate, today());
}

export function clearTodayOutcomes() {
  write(KEYS.outcomes, {});
  write(KEYS.outcomesDate, today());
}

export function logHistoryDay(entry: Record<string, unknown>) {
  const hist = read<Array<Record<string, unknown>>>(KEYS.history, []);
  const d = today();
  const next = hist.filter((h) => h.date !== d);
  next.push({ ...entry, date: d });
  write(KEYS.history, next.slice(-90));
}

export function getHistory() {
  return read<Array<Record<string, unknown>>>(KEYS.history, []);
}

export function expectedDayFromStart(length = 7): number {
  const start = getPlanStart();
  if (!start) return 1;
  const s = new Date(start + "T00:00:00");
  const now = new Date();
  const diff = Math.floor(
    (now.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.min(Math.max(diff + 1, 1), length);
}
