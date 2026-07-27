"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { OutcomeStatus, PlanExercise } from "@/lib/types";
import { RefreshCw, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

export function ExerciseRow({
  exercise,
  status,
  onOutcome,
  onSwap,
}: {
  exercise: PlanExercise;
  status?: OutcomeStatus | null;
  onOutcome: (status: OutcomeStatus) => void;
  onSwap?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "rounded-2xl border bg-elevated p-4 sm:p-5 transition-all duration-300",
        status === "completed" && "border-success/60 bg-success/5 shadow-[0_0_25px_rgba(0,230,118,0.15)]",
        status === "too_hard" && "border-heat/60 bg-heat/5 shadow-[0_0_25px_rgba(255,77,0,0.15)]",
        status === "skipped" && "border-white/20 bg-white/5 opacity-75",
        !status && "border-white/[0.08]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {exercise.muscles && (
            <div className="font-display text-[0.68rem] font-extrabold uppercase tracking-widest text-neon">
              {exercise.muscles}
            </div>
          )}
          <h4 className="font-display mt-0.5 text-xl font-black text-white sm:text-2xl">
            {exercise.name}
          </h4>
        </div>
        {onSwap && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onSwap}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 font-display text-xs font-semibold text-[var(--text-secondary)] transition hover:border-neon/40 hover:text-neon"
          >
            <RefreshCw size={13} />
            Swap
          </motion.button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <span className="rounded-lg border border-neon/30 bg-neon/10 px-3 py-1 font-display text-sm font-extrabold text-neon">
          {exercise.sets_reps}
        </span>
        {exercise.weight && (
          <span className="rounded-lg border border-white/10 bg-surface px-2.5 py-1 text-sm font-medium text-[var(--text-secondary)]">
            Target: <strong className="text-white">{exercise.weight}</strong>
          </span>
        )}
      </div>

      {exercise.note && (
        <p className="mt-2.5 rounded-lg bg-surface/60 p-2 text-xs italic text-[var(--text-muted)]">
          💡 {exercise.note}
        </p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        <Button
          size="sm"
          variant={status === "completed" ? "success" : "secondary"}
          className={cn(
            "w-full",
            status === "completed" && "bg-success text-black border-transparent font-black shadow-lg"
          )}
          onClick={() => onOutcome("completed")}
        >
          <CheckCircle2 size={15} />
          Done
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "w-full border border-white/10",
            status === "skipped" && "border-white/40 bg-white/20 text-white font-bold"
          )}
          onClick={() => onOutcome("skipped")}
        >
          <XCircle size={15} />
          Skip
        </Button>

        <Button
          size="sm"
          variant={status === "too_hard" ? "danger" : "secondary"}
          className={cn(
            "w-full",
            status === "too_hard" && "bg-heat text-black border-transparent font-black shadow-lg"
          )}
          onClick={() => onOutcome("too_hard")}
        >
          <AlertCircle size={15} />
          Too Hard
        </Button>
      </div>
    </motion.div>
  );
}
