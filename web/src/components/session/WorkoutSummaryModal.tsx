"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Award, Flame, CheckCircle, TrendingUp, X } from "lucide-react";
import Link from "next/link";

interface WorkoutSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedExercisesCount: number;
  totalExercisesCount: number;
  streak: number;
}

export function WorkoutSummaryModal({
  isOpen,
  onClose,
  completedExercisesCount,
  totalExercisesCount,
  streak,
}: WorkoutSummaryModalProps) {
  if (!isOpen) return null;

  const percentage = Math.round((completedExercisesCount / (totalExercisesCount || 1)) * 100);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-neon/30 bg-surface p-6 shadow-[0_0_50px_rgba(232,255,0,0.2)]"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-1.5 text-gray-400 transition hover:text-white"
          >
            <X size={18} />
          </button>

          {/* Celebration Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neon/10 border border-neon/40 text-neon shadow-[0_0_30px_rgba(232,255,0,0.3)]"
            >
              <Award size={36} />
            </motion.div>

            <span className="font-display mt-4 block text-xs font-black uppercase tracking-widest text-neon">
              Session Complete
            </span>
            <h2 className="font-display text-3xl font-black text-white sm:text-4xl">
              Great Workout!
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Your feedback is calibrating tomorrow&apos;s adaptive plan.
            </p>
          </div>

          {/* Stat Grid */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-elevated p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <CheckCircle size={14} className="text-success" />
                <span>Completion</span>
              </div>
              <p className="font-display mt-1 text-3xl font-black text-white">
                {percentage}%
              </p>
              <span className="text-[10px] text-[var(--text-muted)]">
                {completedExercisesCount} of {totalExercisesCount} exercises
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-elevated p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <Flame size={14} className="text-heat" />
                <span>Active Streak</span>
              </div>
              <p className="font-display mt-1 text-3xl font-black text-neon">
                {streak} Days
              </p>
              <span className="text-[10px] text-[var(--text-muted)]">
                Streak updated
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-6 space-y-2.5">
            <Link href="/home" className="block w-full">
              <Button variant="primary" className="w-full">
                Return to Dashboard
              </Button>
            </Link>
            <Link href="/progress" className="block w-full">
              <Button variant="secondary" className="w-full">
                <TrendingUp size={16} />
                View Analytics & Trends
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
