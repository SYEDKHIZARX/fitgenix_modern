"use client";

import { Card, SectionLabel } from "@/components/ui/Card";
import type { Readiness } from "@/lib/types";
import { motion } from "framer-motion";

export function ReadinessRing({
  readiness,
  compact = false,
}: {
  readiness: Readiness | null;
  compact?: boolean;
}) {
  const score = Math.round(readiness?.score ?? 0);
  const band = readiness?.band ?? "—";
  const color = readiness?.color ?? "#6B7280";
  const message =
    readiness?.message ?? "Complete a quick check-in to personalize today.";
  const drivers = readiness?.drivers ?? [];

  const radius = compact ? 46 : 58;
  const stroke = compact ? 8 : 10;
  const size = compact ? 120 : 148;
  const c = radius - stroke * 0.5;
  const circumference = 2 * Math.PI * c;
  const targetOffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <Card className="relative overflow-hidden glass-card">
      <div
        className="pointer-events-none absolute left-1/2 top-8 h-36 w-36 -translate-x-1/2 rounded-full opacity-25 blur-3xl transition-colors duration-700"
        style={{ background: color }}
      />
      <SectionLabel>Today&apos;s readiness score</SectionLabel>
      <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-6">
        <div
          className="relative flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={c}
              fill="transparent"
              stroke="var(--bg-elevated)"
              strokeWidth={stroke}
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={c}
              fill="transparent"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: targetOffset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="font-display text-4xl font-black leading-none text-white sm:text-5xl"
            >
              {readiness ? score : "—"}
            </motion.span>
            <span
              className="mt-1 font-display text-[0.7rem] font-extrabold uppercase tracking-[0.14em]"
              style={{ color }}
            >
              {band}
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            {message}
          </p>
          {drivers.length > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2.5 rounded-xl border border-white/10 bg-elevated px-3 py-2 text-xs text-[var(--text-secondary)]"
            >
              <span className="font-bold text-neon uppercase">Limited by: </span>
              {drivers.join(" · ")}
            </motion.p>
          )}
        </div>
      </div>
    </Card>
  );
}
