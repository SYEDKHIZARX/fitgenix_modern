import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, SectionLabel } from "@/components/ui/Card";
import type { PlanExercise } from "@/lib/types";

export function SessionCard({
  day,
  focus,
  isRest,
  exercises,
  autoregNote,
}: {
  day: number;
  focus: string;
  isRest: boolean;
  exercises: PlanExercise[];
  autoregNote?: string | null;
}) {
  return (
    <Card className="border-neon/20 bg-gradient-to-b from-neon/[0.06] to-transparent">
      <SectionLabel>Today&apos;s session</SectionLabel>
      <h2 className="font-display mt-1 text-2xl font-black text-white sm:text-3xl">
        Day {day}
        <span className="text-[var(--text-muted)]"> · </span>
        {focus || "Training"}
      </h2>
      {isRest ? (
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Rest & recovery day. Sleep, hydrate, light mobility — growth happens
          when you rest.
        </p>
      ) : (
        <>
          {autoregNote && (
            <p className="mt-2 text-sm text-neon/90">{autoregNote}</p>
          )}
          <ul className="mt-4 space-y-2">
            {exercises.slice(0, 4).map((ex) => (
              <li
                key={ex.name}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="truncate text-white">{ex.name}</span>
                <span className="shrink-0 font-bold text-neon">
                  {ex.sets_reps}
                </span>
              </li>
            ))}
            {exercises.length > 4 && (
              <li className="text-xs text-[var(--text-muted)]">
                +{exercises.length - 4} more exercises
              </li>
            )}
          </ul>
          <Link href="/train" className="mt-5 block">
            <Button className="w-full" size="lg">
              Start workout
            </Button>
          </Link>
        </>
      )}
    </Card>
  );
}
