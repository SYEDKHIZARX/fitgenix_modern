"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, SectionLabel } from "@/components/ui/Card";
import { useFit } from "@/context/FitgenixProvider";
import {
  DEFAULT_PROFILE,
  GOAL_CLUSTERS,
  SPLIT_OPTIONS,
  type UserProfile,
} from "@/lib/types";
import { cn } from "@/lib/cn";

export default function OnboardingPage() {
  const { completeOnboarding, apiOnline } = useFit();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [cluster, setCluster] = useState("Build Muscle");
  const [form, setForm] = useState<UserProfile>({ ...DEFAULT_PROFILE });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const goals = GOAL_CLUSTERS[cluster] || [];
  const splitMeta = SPLIT_OPTIONS.find((s) => s.value === form.split);

  const finish = async () => {
    setBusy(true);
    setErr(null);
    try {
      await completeOnboarding(form);
      router.replace("/home");
    } catch (e) {
      setErr(
        e instanceof Error
          ? e.message
          : "Could not generate plan. Is the API running?"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-2 py-6">
      <div className="mb-6 text-center">
        <div className="font-display text-4xl font-black text-white">
          FIT<span className="text-neon">GENIX</span>
        </div>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Set up your coach in under a minute
        </p>
        <div className="mt-4 flex justify-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-8 rounded-full transition-all duration-300",
                i <= step ? "bg-neon shadow-[0_0_10px_rgba(232,255,0,0.5)]" : "bg-white/10"
              )}
            />
          ))}
        </div>
      </div>

      {apiOnline === false && (
        <Card className="mb-4 border-heat/30 text-sm text-heat">
          API appears offline. Start it with{" "}
          <code className="text-neon">uvicorn api.main:app --port 8000</code>
        </Card>
      )}

      {step === 0 && (
        <Card className="space-y-4 glass-card">
          <SectionLabel>Step 1 · Goal</SectionLabel>
          <h2 className="font-display text-2xl font-black text-white">
            What are you training for?
          </h2>
          <div className="grid gap-2">
            {Object.keys(GOAL_CLUSTERS).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCluster(c);
                  const first = GOAL_CLUSTERS[c][0];
                  setForm((f) => ({ ...f, goal: first }));
                }}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left font-display text-base font-bold transition",
                  cluster === c
                    ? "border-neon bg-neon/10 text-neon shadow-[0_0_15px_rgba(232,255,0,0.15)]"
                    : "border-white/10 bg-elevated text-white hover:border-white/20"
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">
            Style Focus
            <select
              className="mt-1 w-full rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white"
              value={form.goal}
              onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
            >
              {goals.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <Button className="w-full" onClick={() => setStep(1)}>
            Continue
          </Button>
        </Card>
      )}

      {step === 1 && (
        <Card className="space-y-4 glass-card">
          <SectionLabel>Step 2 · Setup</SectionLabel>
          <h2 className="font-display text-2xl font-black text-white">
            How do you train?
          </h2>
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">
            Experience Level
            <select
              className="mt-1 w-full rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white"
              value={form.experience_level}
              onChange={(e) =>
                setForm((f) => ({ ...f, experience_level: e.target.value }))
              }
            >
              {["Beginner", "Intermediate", "Advanced"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">
            Equipment Access
            <select
              className="mt-1 w-full rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white"
              value={form.equipment_tier}
              onChange={(e) =>
                setForm((f) => ({ ...f, equipment_tier: e.target.value }))
              }
            >
              {["Full gym", "Home (dumbbells)", "Bodyweight only"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">
            Training Split
            <select
              className="mt-1 w-full rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white"
              value={form.split}
              onChange={(e) => {
                const s = SPLIT_OPTIONS.find((x) => x.value === e.target.value);
                setForm((f) => ({
                  ...f,
                  split: e.target.value,
                  frequency_days: s?.days[s.days.length - 1] || 4,
                }));
              }}
            >
              {SPLIT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">
            Days Per Week
            <select
              className="mt-1 w-full rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white"
              value={form.frequency_days}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  frequency_days: Number(e.target.value),
                }))
              }
            >
              {(splitMeta?.days || [3, 4, 5, 6]).map((d) => (
                <option key={d} value={d}>
                  {d} Days
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button className="flex-1" onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-4 glass-card">
          <SectionLabel>Step 3 · Body Metrics</SectionLabel>
          <h2 className="font-display text-2xl font-black text-white">
            Basics for Programming
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["age", "Age"],
                ["height_cm", "Height (cm)"],
                ["weight_kg", "Weight (kg)"],
              ] as const
            ).map(([k, label]) => (
              <label
                key={k}
                className="block text-xs font-semibold uppercase text-[var(--text-secondary)]"
              >
                {label}
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white"
                  value={form[k]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [k]: Number(e.target.value) }))
                  }
                />
              </label>
            ))}
          </div>
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">
            Body Type
            <select
              className="mt-1 w-full rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white"
              value={form.body_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, body_type: e.target.value }))
              }
            >
              {["Ectomorph", "Mesomorph", "Endomorph"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button className="flex-1" onClick={() => setStep(3)}>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="space-y-4 glass-card">
          <SectionLabel>Step 4 · Safety Profile</SectionLabel>
          <h2 className="font-display text-2xl font-black text-white">
            Any Active Limitations?
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Skip if none — our algorithms program injury safety adaptively.
          </p>
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">
            Body Part
            <select
              className="mt-1 w-full rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white"
              value={form.injury_part || ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  injury_part: e.target.value || null,
                  injury_severity: e.target.value
                    ? f.injury_severity ||
                      "Low - can bear weight with caution"
                    : null,
                }))
              }
            >
              <option value="">None</option>
              {[
                "Knee",
                "Shoulder",
                "Lower back",
                "Ankle",
                "Hip",
                "Elbow",
                "Wrist",
                "Neck",
              ].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          {form.injury_part && (
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">
              Severity Level
              <select
                className="mt-1 w-full rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white"
                value={form.injury_severity || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, injury_severity: e.target.value }))
                }
              >
                <option value="Low - can bear weight with caution">Low</option>
                <option value="Moderate - light movement only">Moderate</option>
                <option value="Severe - no movement in this area">
                  Severe
                </option>
              </select>
            </label>
          )}
          {err && (
            <p className="rounded-xl border border-heat/30 bg-heat/10 p-3 text-sm text-heat">
              {err}
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button className="flex-1" disabled={busy} onClick={finish}>
              {busy ? "Building Plan…" : "Build My Plan"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
