import { Card } from "@/components/ui/Card";
import type { Decision } from "@/lib/types";
import { cn } from "@/lib/cn";

export function DecisionBanner({ decision }: { decision: Decision | null }) {
  if (!decision) return null;
  const tone =
    decision.severity === "good"
      ? "border-l-success"
      : decision.severity === "warn"
        ? "border-l-heat"
        : "border-l-[var(--text-muted)]";
  return (
    <Card className={cn("border-l-4 py-3", tone)}>
      <div className="font-display text-lg font-bold text-white">
        {decision.headline}
      </div>
      {decision.detail && (
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {decision.detail}
        </p>
      )}
    </Card>
  );
}
