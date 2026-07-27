"use client";

import { cn } from "@/lib/cn";
import { motion } from "framer-motion";

export function Badge({
  children,
  tone = "neon",
  className,
}: {
  children: React.ReactNode;
  tone?: "neon" | "heat" | "success" | "muted" | "cool";
  className?: string;
}) {
  const tones = {
    neon: "text-neon border-neon/40 bg-neon/10 shadow-[0_0_12px_rgba(232,255,0,0.15)]",
    heat: "text-heat border-heat/40 bg-heat/10 shadow-[0_0_12px_rgba(255,77,0,0.15)]",
    success: "text-success border-success/40 bg-success/10 shadow-[0_0_12px_rgba(0,230,118,0.15)]",
    muted: "text-[var(--text-secondary)] border-white/10 bg-white/5",
    cool: "text-cool border-cool/40 bg-cool/10 shadow-[0_0_12px_rgba(0,180,255,0.15)]",
  };

  return (
    <motion.span
      initial={{ scale: 0.95, opacity: 0.8 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-display text-[0.68rem] font-bold uppercase tracking-wider",
        tones[tone],
        className
      )}
    >
      {children}
    </motion.span>
  );
}
