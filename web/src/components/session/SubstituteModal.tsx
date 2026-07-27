"use client";

import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/Card";
import { X } from "lucide-react";

export interface SubOption {
  name: string;
  scheme: string;
  equipment: string;
  muscles: string;
  note: string;
}

export function SubstituteModal({
  open,
  exerciseName,
  alternatives,
  loading,
  onSelect,
  onClose,
}: {
  open: boolean;
  exerciseName: string;
  alternatives: SubOption[];
  loading?: boolean;
  onSelect: (alt: SubOption) => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 sm:items-center">
      <div className="glass max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <SectionLabel>Safe substitutes</SectionLabel>
            <h3 className="font-display mt-1 text-2xl font-bold text-white">
              Swap “{exerciseName}”
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Same muscle group, filtered by equipment and injury profile.
        </p>

        <div className="mt-4 space-y-3">
          {loading && (
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">
              Finding alternatives…
            </p>
          )}
          {!loading && alternatives.length === 0 && (
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">
              No substitutes found for this setup.
            </p>
          )}
          {alternatives.map((alt) => (
            <div
              key={alt.name}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-elevated p-3"
            >
              <div className="min-w-0">
                <div className="text-[0.68rem] font-bold uppercase tracking-wide text-neon">
                  {alt.equipment} · {alt.muscles}
                </div>
                <div className="truncate font-bold text-white">{alt.name}</div>
                <div className="text-xs text-[var(--text-muted)]">
                  {alt.scheme}
                </div>
              </div>
              <Button size="sm" onClick={() => onSelect(alt)}>
                Select
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
