"use client";

import { cn } from "@/lib/cn";
import { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "neonOutline";

interface Props extends Omit<HTMLMotionProps<"button">, "variant"> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}

const variants: Record<Variant, string> = {
  primary:
    "bg-neon text-[var(--text-on-accent)] shadow-[0_0_20px_rgba(232,255,0,0.25)] hover:shadow-[0_0_30px_rgba(232,255,0,0.45)] hover:bg-white font-extrabold border border-neon",
  secondary:
    "bg-elevated text-[var(--text-primary)] border border-white/10 hover:border-neon/40 hover:bg-surface",
  ghost: "bg-transparent text-[var(--text-secondary)] hover:text-white hover:bg-white/5",
  danger: "bg-heat/15 text-heat border border-heat/40 hover:bg-heat hover:text-black",
  success:
    "bg-success/15 text-success border border-success/40 hover:bg-success hover:text-black",
  neonOutline:
    "bg-transparent text-neon border border-neon/50 hover:border-neon hover:bg-neon/10 font-bold",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-xl",
  lg: "px-6 py-3.5 text-base rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", disabled, children, ...props }, ref) => (
    <motion.button
      ref={ref}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-display uppercase tracking-wider transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
);
Button.displayName = "Button";
