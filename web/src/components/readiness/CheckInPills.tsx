"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, SectionLabel } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const SLEEP = [
  { label: "Poor", value: "poor", hours: 5 },
  { label: "OK", value: "ok", hours: 6.5 },
  { label: "Good", value: "good", hours: 7.5 },
  { label: "Great", value: "good", hours: 8.5 },
];

const SORENESS = [
  { label: "None", value: "none" },
  { label: "Mild", value: "mild" },
  { label: "Moderate", value: "moderate" },
  { label: "Severe", value: "severe" },
];

const ENERGY = [
  { label: "Very low", value: "very low" },
  { label: "Low", value: "low" },
  { label: "OK", value: "ok" },
  { label: "Good", value: "good" },
  { label: "High", value: "high" },
];

export type CheckInData = {
  sleep_hours: number;
  sleep_quality: string;
  soreness: string;
  energy: string;
};

export function CheckInPills({
  onSubmit,
  loading,
  initial,
}: {
  onSubmit: (data: CheckInData) => void | Promise<void>;
  loading?: boolean;
  initial?: CheckInData | null;
}) {
  const [sleepIdx, setSleepIdx] = useState(2);
  const [soreness, setSoreness] = useState(initial?.soreness ?? "mild");
  const [energy, setEnergy] = useState(initial?.energy ?? "good");

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>20-second check-in</SectionLabel>
          <h3 className="font-display mt-1 text-xl font-bold text-white">
            How recovered are you?
          </h3>
        </div>
        <span className="text-xs text-[var(--text-muted)]">Optional</span>
      </div>

      <PillGroup
        label="Sleep"
        options={SLEEP.map((s, i) => ({
          label: s.label,
          active: sleepIdx === i,
          onClick: () => setSleepIdx(i),
        }))}
      />
      <PillGroup
        label="Soreness"
        options={SORENESS.map((s) => ({
          label: s.label,
          active: soreness === s.value,
          heat: s.value === "severe" || s.value === "moderate",
          onClick: () => setSoreness(s.value),
        }))}
      />
      <PillGroup
        label="Energy"
        options={ENERGY.map((e) => ({
          label: e.label,
          active: energy === e.value,
          onClick: () => setEnergy(e.value),
        }))}
      />

      <Button
        className="mt-4 w-full"
        disabled={loading}
        onClick={() =>
          onSubmit({
            sleep_hours: SLEEP[sleepIdx].hours,
            sleep_quality: SLEEP[sleepIdx].value,
            soreness,
            energy,
          })
        }
      >
        {loading ? "Saving…" : "Save check-in"}
      </Button>
    </Card>
  );
}

function PillGroup({
  label,
  options,
}: {
  label: string;
  options: Array<{
    label: string;
    active: boolean;
    heat?: boolean;
    onClick: () => void;
  }>;
}) {
  return (
    <div className="mt-4">
      <div className="mb-2 text-[0.72rem] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.label}
            type="button"
            onClick={o.onClick}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-semibold transition",
              o.active
                ? o.heat
                  ? "border-heat bg-heat/15 text-heat"
                  : "border-neon bg-neon/15 text-neon"
                : "border-white/10 bg-elevated text-[var(--text-secondary)] hover:border-white/20"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
