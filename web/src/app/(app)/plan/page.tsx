"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, SectionLabel } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useFit } from "@/context/FitgenixProvider";
import { cn } from "@/lib/cn";

export default function PlanPage() {
  const { plan, expectedDay, generatePlan, profile } = useFit();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionLabel>Plan</SectionLabel>
          <h1 className="font-display text-3xl font-black text-white">
            Your cycle
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {profile.goal} · {profile.split} · {profile.frequency_days} days/week
          </p>
        </div>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setErr(null);
            try {
              await generatePlan();
            } catch (e) {
              setErr(e instanceof Error ? e.message : "Failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Generating…" : "Regenerate plan"}
        </Button>
      </div>

      {err && <Card className="border-heat/30 text-sm text-heat">{err}</Card>}

      {!plan.length && (
        <Card className="text-center">
          <p className="text-[var(--text-secondary)]">
            No plan yet. Generate one to see your week.
          </p>
        </Card>
      )}

      <div className="space-y-3">
        {plan.map((d) => {
          const isToday = d.day === expectedDay;
          return (
            <Card
              key={d.day}
              className={cn(
                isToday && "border-neon/40 bg-neon/[0.04]"
              )}
            >
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl font-bold text-white">
                  Day {d.day} · {d.focus}
                </h3>
                {isToday && <Badge tone="neon">Today</Badge>}
                {d.is_rest && <Badge tone="muted">Rest</Badge>}
              </div>
              {d.is_rest || !d.exercises?.length ? (
                <p className="mt-2 text-sm italic text-[var(--text-muted)]">
                  Recovery — rest, hydrate, light mobility.
                </p>
              ) : (
                <ul className="mt-3 space-y-1.5">
                  {d.exercises.map((ex) => (
                    <li
                      key={ex.name}
                      className="flex justify-between gap-3 text-sm"
                    >
                      <span className="text-white">{ex.name}</span>
                      <span className="shrink-0 font-bold text-neon">
                        {ex.sets_reps}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
