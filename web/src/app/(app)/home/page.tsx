"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckInPills } from "@/components/readiness/CheckInPills";
import { ReadinessRing } from "@/components/readiness/ReadinessRing";
import { SessionCard } from "@/components/session/SessionCard";
import { DecisionBanner } from "@/components/plan/DecisionBanner";
import { MuscleHeatmap } from "@/components/anatomy/MuscleHeatmap";
import { Button } from "@/components/ui/Button";
import { Card, SectionLabel } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useFit } from "@/context/FitgenixProvider";
import { Dumbbell, Calendar, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  const {
    readiness,
    checkinDone,
    submitCheckin,
    todayDay,
    sessionExercises,
    autoregNote,
    expectedDay,
    decision,
    plan,
    history,
    rlTip,
    apiOnline,
    cloud,
    rlPersonal,
    error,
    generatePlan,
  } = useFit();
  const [busy, setBusy] = useState(false);
  const [genBusy, setGenBusy] = useState(false);

  const streak = history.length;

  return (
    <div className="space-y-6">
      {/* Top Welcome & System Status Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionLabel>Dashboard Command Center</SectionLabel>
          <h1 className="font-display text-3xl font-black text-white sm:text-4xl">
            Ready when you are
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {apiOnline === true && <Badge tone="success">API Online</Badge>}
          {apiOnline === false && <Badge tone="heat">API Offline</Badge>}
          {cloud && <Badge tone="cool">Cloud Sync</Badge>}
          {rlPersonal && <Badge tone="neon">Personal RL</Badge>}
          {streak > 0 && <Badge tone="neon">{streak} Days Logged</Badge>}
        </div>
      </div>

      {error && (
        <Card className="border-heat/40 bg-heat/10 text-sm text-heat">
          ⚠️ {error}
        </Card>
      )}

      {/* Safety / Injury Decision Banner */}
      <DecisionBanner decision={decision} />

      {/* Primary Grid: Readiness Ring & Check-in / Recovery Info */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ReadinessRing readiness={readiness} />
        {!checkinDone ? (
          <CheckInPills
            loading={busy}
            onSubmit={async (d) => {
              setBusy(true);
              try {
                await submitCheckin(d);
              } finally {
                setBusy(false);
              }
            }}
          />
        ) : (
          <Card className="flex flex-col justify-center glass-card">
            <SectionLabel>Check-in status</SectionLabel>
            <h3 className="font-display mt-1 text-2xl font-extrabold text-white">
              Check-in Complete
            </h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Today&apos;s workout load has been dynamically calibrated based on your recovery signals.
            </p>
            {rlTip && (
              <div className="mt-4 rounded-xl border border-white/10 bg-elevated p-3 text-xs text-[var(--text-secondary)]">
                <span className="font-bold text-cool uppercase">Intensity Model Rationale: </span>
                {rlTip}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Interactive Muscle Heatmap */}
      <MuscleHeatmap />

      {/* Today's Training Session Card */}
      {plan.length === 0 ? (
        <Card className="text-center glass-card py-8">
          <SectionLabel>No Active Plan</SectionLabel>
          <h2 className="font-display mt-2 text-2xl font-extrabold text-white sm:text-3xl">
            Generate Your Adaptive Week
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">
            Injury-aware, equipment-aware training built dynamically from your athlete profile.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              disabled={genBusy}
              onClick={async () => {
                setGenBusy(true);
                try {
                  await generatePlan();
                } finally {
                  setGenBusy(false);
                }
              }}
            >
              {genBusy ? "Building Plan…" : "Generate Plan"}
            </Button>
            <Link href="/onboarding">
              <Button variant="secondary">Edit Preferences</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <SessionCard
          day={todayDay?.day ?? expectedDay}
          focus={todayDay?.focus ?? ""}
          isRest={!!todayDay?.is_rest}
          exercises={
            sessionExercises.length
              ? sessionExercises
              : todayDay?.exercises || []
          }
          autoregNote={autoregNote}
        />
      )}

      {/* Quick Navigation Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/train">
          <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
            <Card className="glass-card transition hover:border-neon/40 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon/10 text-neon border border-neon/30">
                  <Dumbbell size={20} />
                </div>
                <div>
                  <SectionLabel>Gym Mode</SectionLabel>
                  <p className="font-display text-lg font-extrabold text-white">
                    Train & Log
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </Link>

        <Link href="/plan">
          <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
            <Card className="glass-card transition hover:border-neon/40 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cool/10 text-cool border border-cool/30">
                  <Calendar size={20} />
                </div>
                <div>
                  <SectionLabel>Schedule</SectionLabel>
                  <p className="font-display text-lg font-extrabold text-white">
                    Full Week Plan
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </Link>

        <Link href="/progress">
          <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
            <Card className="glass-card transition hover:border-neon/40 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success border border-success/30">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <SectionLabel>Analytics</SectionLabel>
                  <p className="font-display text-lg font-extrabold text-white">
                    History & Trends
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
