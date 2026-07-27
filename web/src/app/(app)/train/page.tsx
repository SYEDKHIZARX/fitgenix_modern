"use client";

import { useMemo, useState } from "react";
import { ExerciseRow } from "@/components/session/ExerciseRow";
import {
  SubstituteModal,
  type SubOption,
} from "@/components/session/SubstituteModal";
import { WorkoutSummaryModal } from "@/components/session/WorkoutSummaryModal";
import { Button } from "@/components/ui/Button";
import { Card, SectionLabel } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useFit } from "@/context/FitgenixProvider";
import type { OutcomeStatus } from "@/lib/types";

export default function TrainPage() {
  const {
    todayDay,
    sessionExercises,
    autoregNote,
    outcomes,
    logOutcome,
    endSession,
    fetchSubs,
    swapExercise,
    readiness,
    plan,
    history,
  } = useFit();

  const [swapOpen, setSwapOpen] = useState(false);
  const [swapName, setSwapName] = useState("");
  const [alts, setAlts] = useState<SubOption[]>([]);
  const [swapLoading, setSwapLoading] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endMsg, setEndMsg] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const exercises = useMemo(() => {
    if (sessionExercises.length) return sessionExercises;
    return todayDay?.exercises || [];
  }, [sessionExercises, todayDay]);

  const statusOf = (name: string): OutcomeStatus | null => {
    const o = outcomes[name];
    if (!o) return null;
    if (o.difficulty === "too_hard") return "too_hard";
    if (o.status === "skipped") return "skipped";
    if (o.status === "completed") return "completed";
    return null;
  };

  const loggedCount = Object.keys(outcomes).length;
  const completedCount = Object.values(outcomes).filter((o) => o.status === "completed").length;

  if (!plan.length) {
    return (
      <Card className="text-center">
        <SectionLabel>Train</SectionLabel>
        <p className="mt-2 text-[var(--text-secondary)]">
          Generate a plan first from Home or Plan.
        </p>
      </Card>
    );
  }

  if (todayDay?.is_rest) {
    return (
      <Card>
        <SectionLabel>Rest day</SectionLabel>
        <h1 className="font-display mt-1 text-3xl font-black text-white">
          Recover well
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          No lifting prescribed. Sleep 7–9 hours, hydrate, optional walk or
          mobility.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="sticky top-[57px] z-30 -mx-1 space-y-3 bg-void/90 px-1 py-2 backdrop-blur-md">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <SectionLabel>Gym mode</SectionLabel>
            <h1 className="font-display text-3xl font-black text-white sm:text-4xl">
              Day {todayDay?.day} · {todayDay?.focus}
            </h1>
          </div>
          {readiness && (
            <Badge
              tone={
                readiness.band === "Poor" || readiness.band === "Low"
                  ? "heat"
                  : "success"
              }
            >
              {readiness.band} Readiness
            </Badge>
          )}
        </div>
        {autoregNote && (
          <p className="rounded-xl border border-neon/20 bg-neon/5 px-3 py-2.5 text-xs text-neon/90 sm:text-sm">
            ⚡ {autoregNote}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {exercises.map((ex) => (
          <ExerciseRow
            key={ex.name}
            exercise={ex}
            status={statusOf(ex.name)}
            onOutcome={(s) => logOutcome(ex.name, s)}
            onSwap={async () => {
              setSwapName(ex.name);
              setSwapOpen(true);
              setSwapLoading(true);
              try {
                const list = await fetchSubs(ex.name);
                setAlts(list);
              } catch {
                setAlts([]);
              } finally {
                setSwapLoading(false);
              }
            }}
          />
        ))}
      </div>

      <Card className="glass-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SectionLabel>Session Progress</SectionLabel>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              <strong className="text-white">{loggedCount}</strong> of {exercises.length} logged. End session to train your personal intensity model.
            </p>
            {endMsg && (
              <p className="mt-2 text-sm text-success">{endMsg}</p>
            )}
          </div>
          <Button
            disabled={ending || loggedCount === 0}
            onClick={async () => {
              setEnding(true);
              setEndMsg(null);
              try {
                const res = await endSession();
                setEndMsg(
                  res
                    ? `Model updated (reward ${res.reward?.toFixed(2)}).`
                    : "Session saved locally."
                );
                setSummaryOpen(true);
              } finally {
                setEnding(false);
              }
            }}
          >
            {ending ? "Updating…" : "End Session & Calibrate"}
          </Button>
        </div>
      </Card>

      <SubstituteModal
        open={swapOpen}
        exerciseName={swapName}
        alternatives={alts}
        loading={swapLoading}
        onClose={() => setSwapOpen(false)}
        onSelect={(alt) => {
          swapExercise(swapName, {
            name: alt.name,
            sets_reps: alt.scheme,
            muscles: alt.muscles,
            weight: alt.equipment,
            note: alt.note,
          });
          setSwapOpen(false);
        }}
      />

      <WorkoutSummaryModal
        isOpen={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        completedExercisesCount={completedCount}
        totalExercisesCount={exercises.length}
        streak={history.length + 1}
      />
    </div>
  );
}
