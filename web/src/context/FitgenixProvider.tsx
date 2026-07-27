"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/context/AuthProvider";
import {
  apiGeneratePlan,
  apiHealth,
  apiMe,
  apiReadiness,
  apiRlFeedback,
  apiRlRecommend,
  apiSaveHistory,
  apiSaveOutcome,
  apiSaveProfile,
  apiSessionToday,
  apiSubstitutes,
} from "@/lib/api";
import {
  clearTodayOutcomes,
  expectedDayFromStart,
  getHistory,
  getPlan,
  getPlanStart,
  getProfile,
  getReadiness,
  getTodayCheckin,
  getTodayOutcomes,
  isOnboarded,
  logHistoryDay,
  savePlan,
  saveProfile,
  saveReadiness,
  saveTodayCheckin,
  saveTodayOutcome,
  setOnboarded,
  type OutcomeMap,
} from "@/lib/storage";
import type {
  Decision,
  OutcomeStatus,
  PlanDay,
  PlanExercise,
  Readiness,
  UserProfile,
} from "@/lib/types";
import { DEFAULT_PROFILE } from "@/lib/types";

type Ctx = {
  ready: boolean;
  apiOnline: boolean | null;
  cloud: boolean;
  onboarded: boolean;
  profile: UserProfile;
  plan: PlanDay[];
  planStart: string | null;
  readiness: Readiness | null;
  checkinDone: boolean;
  outcomes: OutcomeMap;
  expectedDay: number;
  todayDay: PlanDay | null;
  sessionExercises: PlanExercise[];
  autoregNote: string | null;
  decision: Decision | null;
  history: Array<Record<string, unknown>>;
  rlTip: string | null;
  rlPersonal: boolean;
  error: string | null;
  setError: (e: string | null) => void;
  refresh: () => void;
  updateProfile: (p: Partial<UserProfile>) => void;
  completeOnboarding: (p: UserProfile) => Promise<void>;
  generatePlan: () => Promise<void>;
  submitCheckin: (data: {
    sleep_hours: number;
    sleep_quality: string;
    soreness: string;
    energy: string;
  }) => Promise<void>;
  logOutcome: (name: string, status: OutcomeStatus) => Promise<void>;
  endSession: () => Promise<{ reward?: number; next?: number } | null>;
  swapExercise: (original: string, replacement: PlanExercise) => void;
  fetchSubs: (name: string) => Promise<
    Array<{
      name: string;
      scheme: string;
      equipment: string;
      muscles: string;
      note: string;
    }>
  >;
};

const FitContext = createContext<Ctx | null>(null);

function buildDecision(
  plan: PlanDay[],
  planStart: string | null,
  outcomes: OutcomeMap,
  cloudDecision?: Decision | null
): Decision | null {
  if (cloudDecision) return cloudDecision;
  if (!plan.length || !planStart) {
    return {
      action: "begin",
      headline: "Build your first plan",
      detail: "A few preferences and we'll generate an injury-aware week.",
      ramp_factor: 1,
      severity: "neutral",
    };
  }
  const start = new Date(planStart + "T00:00:00");
  const elapsed = Math.floor(
    (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  const length = plan.length || 7;
  const expected = Math.min(Math.max(elapsed + 1, 1), length);
  const logged = Object.keys(outcomes).length > 0 ? 1 : 0;

  if (elapsed >= length) {
    return {
      action: "progress",
      headline: "Plan complete — ready to progress",
      detail: "Generate your next cycle to keep advancing.",
      ramp_factor: 1,
      severity: "good",
    };
  }
  if (logged === 0 && elapsed === 0) {
    return {
      action: "begin",
      headline: "Your plan is ready",
      detail: "Start Day 1 whenever you're ready. Check-in is optional.",
      ramp_factor: 1,
      severity: "neutral",
    };
  }
  return {
    action: "continue",
    headline: `On track — Day ${expected} of ${length}`,
    detail: "Today's session is ready. Log outcomes so FITGENIX can adapt.",
    ramp_factor: 1,
    severity: "good",
  };
}

export function FitgenixProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [ready, setReady] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [cloud, setCloud] = useState(false);
  const [onboarded, setOnb] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [plan, setPlan] = useState<PlanDay[]>([]);
  const [planStart, setPlanStart] = useState<string | null>(null);
  const [readiness, setReadinessState] = useState<Readiness | null>(null);
  const [checkinDone, setCheckinDone] = useState(false);
  const [outcomes, setOutcomes] = useState<OutcomeMap>({});
  const [sessionExercises, setSessionExercises] = useState<PlanExercise[]>([]);
  const [autoregNote, setAutoregNote] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [rlTip, setRlTip] = useState<string | null>(null);
  const [rlPersonal, setRlPersonal] = useState(false);
  const [cloudDecision, setCloudDecision] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);

  const expectedDay = useMemo(
    () => expectedDayFromStart(plan.length || 7),
    // planStart is read inside helper via localStorage; plan length is primary signal
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan, planStart]
  );

  const todayDay = useMemo(
    () => plan.find((d) => d.day === expectedDay) || plan[0] || null,
    [plan, expectedDay]
  );

  const decision = useMemo(
    () => buildDecision(plan, planStart, outcomes, cloudDecision),
    [plan, planStart, outcomes, cloudDecision]
  );

  const loadLocal = useCallback(() => {
    setOnb(isOnboarded());
    setProfile(getProfile());
    setPlan(getPlan());
    setPlanStart(getPlanStart());
    setReadinessState(getReadiness());
    setCheckinDone(!!getTodayCheckin());
    setOutcomes(getTodayOutcomes());
    setHistory(getHistory());
    setCloud(false);
  }, []);

  const loadCloud = useCallback(async () => {
    const me = await apiMe();
    const prof = { ...DEFAULT_PROFILE, ...me.profile };
    saveProfile(prof);
    setProfile(prof);
    const days = me.plan || [];
    if (days.length) {
      savePlan(days);
      // preserve server start date in local meta
      if (me.plan_meta?.start_date && typeof window !== "undefined") {
        localStorage.setItem(
          "fg_plan_start",
          JSON.stringify(me.plan_meta.start_date)
        );
      }
    }
    setPlan(days);
    setPlanStart(me.plan_meta?.start_date || getPlanStart());
    if (me.readiness) {
      saveReadiness(me.readiness);
      setReadinessState(me.readiness);
    } else {
      setReadinessState(null);
    }
    setCheckinDone(!!me.checkin);
    if (me.outcomes) {
      setOutcomes(me.outcomes as OutcomeMap);
      if (typeof window !== "undefined") {
        localStorage.setItem("fg_outcomes", JSON.stringify(me.outcomes));
        localStorage.setItem(
          "fg_outcomes_date",
          JSON.stringify(new Date().toISOString().slice(0, 10))
        );
      }
    } else {
      setOutcomes({});
    }
    setHistory(me.history || []);
    setCloudDecision(me.decision);
    setOnboarded(me.onboarded || days.length > 0);
    setOnb(me.onboarded || days.length > 0);
    if (me.onboarded || days.length > 0) setOnboarded(true);
    setCloud(true);
  }, []);

  const refresh = useCallback(() => {
    if (!auth.ready) return;
    setReady(false);
    apiHealth()
      .then((h) => setApiOnline(true && h.status === "ok"))
      .catch(() => setApiOnline(false));

    const run = async () => {
      try {
        if (auth.session?.access_token) {
          await loadCloud();
        } else {
          loadLocal();
        }
      } catch (e) {
        // fall back to local if cloud fails
        loadLocal();
        setError(
          e instanceof Error
            ? `Cloud sync failed — using local data. ${e.message}`
            : "Cloud sync failed"
        );
      } finally {
        setReady(true);
      }
    };
    run();
  }, [auth.ready, auth.session?.access_token, loadCloud, loadLocal]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Session with autoreg
  useEffect(() => {
    if (!ready || !plan.length) {
      setSessionExercises([]);
      return;
    }
    const day = todayDay;
    if (!day) return;

    if (day.is_rest) {
      setSessionExercises([]);
      setAutoregNote(null);
      return;
    }

    const local = (day.exercises || []).map((ex) => ({
      ...ex,
      sets_reps: ex.sets_reps || "3 x 10",
    }));

    const checkin = getTodayCheckin();
    if ((!checkin && !checkinDone) || apiOnline === false) {
      setSessionExercises(local);
      setAutoregNote(null);
      return;
    }

    const checkinPayload =
      checkin ||
      (readiness
        ? {
            sleep_hours: 7,
            sleep_quality: "ok",
            soreness: "mild",
            energy: "good",
          }
        : null);

    if (!checkinPayload) {
      setSessionExercises(local);
      return;
    }

    apiSessionToday(getProfile(), checkinPayload, day.day, plan)
      .then((s) => {
        setSessionExercises(
          (s.exercises || []).map((ex) => ({
            name: ex.name,
            sets_reps: ex.sets_reps,
            weight: ex.weight,
            muscles: ex.muscles,
            note: ex.note,
          }))
        );
        setAutoregNote(s.autoreg_note || null);
      })
      .catch(() => setSessionExercises(local));
  }, [ready, plan, todayDay, checkinDone, apiOnline, readiness]);

  // RL tip
  useEffect(() => {
    if (apiOnline !== true || !ready) return;
    const map: Record<string, number> = {
      "Fully Rested": 0,
      "Slightly Fatigued": 1,
      "Very Fatigued": 2,
    };
    const fl = map[profile.fatigue] ?? 0;
    apiRlRecommend(fl)
      .then((r) => {
        setRlTip(`${r.label}: ${r.tip}`);
        setRlPersonal(!!r.personal);
      })
      .catch(() => {
        setRlTip(null);
        setRlPersonal(false);
      });
  }, [apiOnline, profile.fatigue, ready, auth.session?.access_token]);

  const updateProfile = (p: Partial<UserProfile>) => {
    const next = { ...getProfile(), ...p };
    saveProfile(next);
    setProfile(next);
    if (auth.session?.access_token) {
      apiSaveProfile(next).catch(() => undefined);
    }
  };

  const generatePlan = async () => {
    setError(null);
    try {
      if (apiOnline === false) throw new Error("API offline");
      const res = await apiGeneratePlan(getProfile());
      const days = res.plan.map((d) => ({
        ...d,
        exercises: (d.exercises || []).map((ex) => ({
          name: ex.name,
          sets_reps: ex.sets_reps || "3 x 10",
          weight: ex.weight || "",
          muscles: ex.muscles || "",
          note: ex.note || "",
        })),
      }));
      savePlan(days);
      setPlan(days);
      setPlanStart(getPlanStart());
      clearTodayOutcomes();
      setOutcomes({});
      setCloudDecision(null);
      setOnboarded(true);
      setOnb(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate plan");
      throw e;
    }
  };

  const completeOnboarding = async (p: UserProfile) => {
    saveProfile(p);
    setProfile(p);
    setOnboarded(true);
    setOnb(true);
    if (auth.session?.access_token) {
      try {
        await apiSaveProfile(p);
      } catch {
        /* generate-plan also saves when authed */
      }
    }
    await generatePlan();
  };

  const submitCheckin = async (data: {
    sleep_hours: number;
    sleep_quality: string;
    soreness: string;
    energy: string;
  }) => {
    setError(null);
    try {
      const r = await apiReadiness({
        ...data,
        steps: profile.steps,
        active_minutes: profile.active_minutes,
      });
      saveTodayCheckin(data);
      saveReadiness(r);
      setReadinessState(r);
      setCheckinDone(true);
    } catch (e) {
      const r: Readiness = {
        score: 70,
        band: "Moderate",
        color: "#E8FF00",
        message: "Check-in saved locally (API offline).",
        drivers: [],
      };
      saveTodayCheckin(data);
      saveReadiness(r);
      setReadinessState(r);
      setCheckinDone(true);
      setError(e instanceof Error ? e.message : "Readiness API unavailable");
    }
  };

  const logOutcome = async (name: string, status: OutcomeStatus) => {
    const difficulty = status === "too_hard" ? "too_hard" : null;
    const storeStatus = status === "too_hard" ? "completed" : status;
    saveTodayOutcome(name, storeStatus, difficulty);
    setOutcomes(getTodayOutcomes());
    if (auth.session?.access_token) {
      try {
        const res = await apiSaveOutcome({
          exercise_name: name,
          status,
          difficulty,
          fatigue_at_time: profile.fatigue,
        });
        if (res.outcomes) setOutcomes(res.outcomes as OutcomeMap);
      } catch {
        /* local already saved */
      }
    }
  };

  const endSession = async () => {
    const map = getTodayOutcomes();
    const list = Object.values(map);
    if (!list.length) return null;

    logHistoryDay({
      steps: profile.steps,
      active_minutes: profile.active_minutes,
      goal: profile.goal,
      outcomes: list.length,
    });
    setHistory(getHistory());

    if (auth.session?.access_token) {
      try {
        const h = await apiSaveHistory({
          steps: profile.steps,
          active_minutes: profile.active_minutes,
          goal: profile.goal,
          fatigue: profile.fatigue,
        });
        if (h.history) setHistory(h.history);
      } catch {
        /* ignore */
      }
    }

    try {
      const mapFat: Record<string, number> = {
        "Fully Rested": 0,
        "Slightly Fatigued": 1,
        "Very Fatigued": 2,
      };
      const fl = mapFat[profile.fatigue] ?? 1;
      const rec = await apiRlRecommend(fl);
      const res = await apiRlFeedback({
        fatigue_level: fl,
        rec_action: rec.action_index,
        outcomes: list.map((o) => ({
          status: o.status,
          difficulty: o.difficulty,
        })),
        persist: true,
      });
      if (res.persisted) setRlPersonal(true);
      return { reward: res.reward, next: res.next_action_index };
    } catch {
      return null;
    }
  };

  const swapExercise = (original: string, replacement: PlanExercise) => {
    const nextPlan = plan.map((d) => {
      if (d.day !== expectedDay) return d;
      return {
        ...d,
        exercises: d.exercises.map((ex) =>
          ex.name === original ? { ...ex, ...replacement } : ex
        ),
      };
    });
    savePlan(nextPlan);
    setPlan(nextPlan);
    setSessionExercises((prev) =>
      prev.map((ex) =>
        ex.name === original ? { ...ex, ...replacement } : ex
      )
    );
  };

  const fetchSubs = async (name: string) => {
    const res = await apiSubstitutes(
      name,
      profile.equipment_tier,
      profile.injury_part
    );
    return res.alternatives || [];
  };

  const value: Ctx = {
    ready: ready && auth.ready,
    apiOnline,
    cloud,
    onboarded,
    profile,
    plan,
    planStart,
    readiness,
    checkinDone,
    outcomes,
    expectedDay,
    todayDay,
    sessionExercises,
    autoregNote,
    decision,
    history,
    rlTip,
    rlPersonal,
    error,
    setError,
    refresh,
    updateProfile,
    completeOnboarding,
    generatePlan,
    submitCheckin,
    logOutcome,
    endSession,
    swapExercise,
    fetchSubs,
  };

  return <FitContext.Provider value={value}>{children}</FitContext.Provider>;
}

export function useFit() {
  const ctx = useContext(FitContext);
  if (!ctx) throw new Error("useFit must be used within FitgenixProvider");
  return ctx;
}
