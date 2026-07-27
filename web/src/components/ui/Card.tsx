"use client";

import { cn } from "@/lib/cn";
import { motion, HTMLMotionProps } from "framer-motion";

interface CardProps extends HTMLMotionProps<"div"> {
  hoverGlow?: boolean;
}

export function Card({
  className,
  hoverGlow = true,
  children,
  ...props
}: CardProps) {
  return (
    <motion.div
      whileHover={hoverGlow ? { borderColor: "rgba(232, 255, 0, 0.25)" } : undefined}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-surface p-4 sm:p-5 shadow-lg backdrop-blur-sm transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-neon",
        className
      )}
    >
      {children}
    </div>
  );
}
