"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, SectionLabel } from "@/components/ui/Card";
import { useFit } from "@/context/FitgenixProvider";
import { SPLIT_OPTIONS } from "@/lib/types";
import { apiBmi } from "@/lib/api";

export default function ProfilePage() {
  const { profile, updateProfile, generatePlan } = useFit();
  const [form, setForm] = useState(profile);
  const [bmi, setBmi] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      <div>
        <SectionLabel>Profile</SectionLabel>
        <h1 className="font-display text-3xl font-black text-white">
          Your setup
        </h1>
      </div>

      <Card className="space-y-4">
        <SectionLabel>Body</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Age">
            <input
              type="number"
              className={inputCls}
              value={form.age}
              onChange={(e) => set("age", Number(e.target.value))}
            />
          </Field>
          <Field label="Gender">
            <select
              className={inputCls}
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
            >
              {["Male", "Female", "Other"].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label="Height (cm)">
            <input
              type="number"
              className={inputCls}
              value={form.height_cm}
              onChange={(e) => set("height_cm", Number(e.target.value))}
            />
          </Field>
          <Field label="Weight (kg)">
            <input
              type="number"
              className={inputCls}
              value={form.weight_kg}
              onChange={(e) => set("weight_kg", Number(e.target.value))}
            />
          </Field>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            try {
              const r = await apiBmi(form.weight_kg, form.height_cm);
              setBmi(`${r.bmi} · ${r.category}`);
            } catch {
              setBmi("API offline");
            }
          }}
        >
          Calculate BMI
        </Button>
        {bmi && (
          <p className="text-sm text-neon">BMI: {bmi}</p>
        )}
      </Card>

      <Card className="space-y-4">
        <SectionLabel>Training</SectionLabel>
        <Field label="Goal (training type)">
          <input
            className={inputCls}
            value={form.goal}
            onChange={(e) => set("goal", e.target.value)}
          />
        </Field>
        <Field label="Split">
          <select
            className={inputCls}
            value={form.split}
            onChange={(e) => set("split", e.target.value)}
          >
            {SPLIT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Days / week">
          <input
            type="number"
            className={inputCls}
            value={form.frequency_days}
            onChange={(e) => set("frequency_days", Number(e.target.value))}
          />
        </Field>
        <Field label="Experience">
          <select
            className={inputCls}
            value={form.experience_level}
            onChange={(e) => set("experience_level", e.target.value)}
          >
            {["Beginner", "Intermediate", "Advanced"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="Equipment">
          <select
            className={inputCls}
            value={form.equipment_tier}
            onChange={(e) => set("equipment_tier", e.target.value)}
          >
            {["Full gym", "Home (dumbbells)", "Bodyweight only"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
      </Card>

      <Card className="space-y-4">
        <SectionLabel>Injury</SectionLabel>
        <Field label="Body part (blank = none)">
          <input
            className={inputCls}
            placeholder="e.g. Knee"
            value={form.injury_part || ""}
            onChange={(e) =>
              set("injury_part", e.target.value || null)
            }
          />
        </Field>
        <Field label="Severity">
          <select
            className={inputCls}
            value={form.injury_severity || ""}
            onChange={(e) =>
              set("injury_severity", e.target.value || null)
            }
          >
            <option value="">None</option>
            <option value="Low - can bear weight with caution">Low</option>
            <option value="Moderate - light movement only">Moderate</option>
            <option value="Severe - no movement in this area">Severe</option>
          </select>
        </Field>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="flex-1"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setMsg(null);
            try {
              updateProfile(form);
              await generatePlan();
              setMsg("Saved and plan regenerated.");
            } catch (e) {
              setMsg(e instanceof Error ? e.message : "Saved locally only");
              updateProfile(form);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Saving…" : "Save & regenerate plan"}
        </Button>
      </div>
      {msg && (
        <p className="text-sm text-[var(--text-secondary)]">{msg}</p>
      )}
    </div>
  );
}

const inputCls =
  "mt-1 w-full rounded-lg border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-neon/50";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
      {label}
      {children}
    </label>
  );
}
