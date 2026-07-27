"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";

export type MuscleStatus = "fresh" | "worked" | "sore" | "injured";

export interface MuscleStateMap {
  [muscleGroup: string]: {
    status: MuscleStatus;
    recoveryPercent?: number;
    notes?: string;
  };
}

interface MuscleHeatmapProps {
  muscleData?: MuscleStateMap;
  onSelectGroup?: (group: string) => void;
  className?: string;
}

const DEFAULT_MUSCLE_STATES: MuscleStateMap = {
  Chest: { status: "worked", recoveryPercent: 75, notes: "Trained today" },
  Shoulders: { status: "worked", recoveryPercent: 80, notes: "Deltoids engaged" },
  Biceps: { status: "worked", recoveryPercent: 85, notes: "Secondary volume" },
  Triceps: { status: "worked", recoveryPercent: 70, notes: "Push focus" },
  Core: { status: "fresh", recoveryPercent: 95, notes: "Fully recovered" },
  Back: { status: "sore", recoveryPercent: 45, notes: "Heavy fatigue from yesterday" },
  Quads: { status: "fresh", recoveryPercent: 90, notes: "Ready for leg day" },
  Hamstrings: { status: "fresh", recoveryPercent: 100, notes: "Prime status" },
  Calves: { status: "fresh", recoveryPercent: 100, notes: "Fully restored" },
};

const STATUS_COLORS: Record<MuscleStatus, { fill: string; stroke: string; label: string }> = {
  fresh: { fill: "#1c2230", stroke: "#2e384d", label: "Fresh (Ready)" },
  worked: { fill: "#e8ff00", stroke: "#ffff4d", label: "Trained Today" },
  sore: { fill: "#ffc107", stroke: "#ffd54f", label: "Fatigued / Sore" },
  injured: { fill: "#ff4d00", stroke: "#ff7b40", label: "Injured (Caution)" },
};

export function MuscleHeatmap({
  muscleData = DEFAULT_MUSCLE_STATES,
  onSelectGroup,
  className = "",
}: MuscleHeatmapProps) {
  const [activeGroup, setActiveGroup] = useState<string | null>("Chest");
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  const currentDisplayGroup = hoveredGroup || activeGroup || "Chest";
  const currentInfo = muscleData[currentDisplayGroup] || {
    status: "fresh" as MuscleStatus,
    recoveryPercent: 100,
    notes: "No fatigue reported",
  };

  const getStyle = (groupName: string) => {
    const data = muscleData[groupName];
    const status = data ? data.status : "fresh";
    const colors = STATUS_COLORS[status];
    const isHovered = hoveredGroup === groupName || activeGroup === groupName;

    return {
      fill: isHovered && status === "fresh" ? "#2a344a" : colors.fill,
      stroke: isHovered ? "#ffffff" : colors.stroke,
      strokeWidth: isHovered ? 2 : 1,
      cursor: "pointer",
      transition: "all 0.25s ease",
      filter: isHovered ? "drop-shadow(0 0 6px " + colors.fill + ")" : "none",
    };
  };

  const handleGroupClick = (group: string) => {
    setActiveGroup(group);
    if (onSelectGroup) onSelectGroup(group);
  };

  return (
    <div className={`rounded-xl border border-white/10 bg-surface p-4 sm:p-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <span className="font-display text-xs uppercase tracking-widest text-neon">
            Anatomical Heatmap
          </span>
          <h3 className="font-display text-xl font-bold text-white">
            Muscle Recovery & Target Map
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {Object.entries(STATUS_COLORS).map(([key, value]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full border"
                style={{ backgroundColor: value.fill, borderColor: value.stroke }}
              />
              <span className="text-[var(--text-secondary)]">{value.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-6 md:grid-cols-12 md:items-center">
        {/* Anatomy SVG Graphic */}
        <div className="flex justify-center md:col-span-7">
          <svg
            viewBox="0 0 320 280"
            className="h-64 w-full max-w-sm drop-shadow-md sm:h-72"
          >
            {/* Outline Body Base Shapes */}
            <g opacity="0.3">
              {/* Head & Neck */}
              <circle cx="80" cy="22" r="14" fill="#1e2430" stroke="#374151" />
              <circle cx="240" cy="22" r="14" fill="#1e2430" stroke="#374151" />
              <path d="M72,36 L88,36 L92,50 L68,50 Z" fill="#1e2430" />
              <path d="M232,36 L248,36 L252,50 L228,50 Z" fill="#1e2430" />
            </g>

            {/* FRONT VIEW (Left Side of SVG Canvas) */}
            <g transform="translate(0, 0)">
              <text x="80" y="272" textAnchor="middle" fill="#6b7280" fontSize="10" fontWeight="bold">
                FRONT ANATOMY
              </text>

              {/* Shoulders (Deltoids) */}
              <path
                d="M50,54 Q38,58 36,75 L46,80 Q52,65 58,54 Z"
                style={getStyle("Shoulders")}
                onMouseEnter={() => setHoveredGroup("Shoulders")}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => handleGroupClick("Shoulders")}
              />
              <path
                d="M110,54 Q122,58 124,75 L114,80 Q108,65 102,54 Z"
                style={getStyle("Shoulders")}
                onMouseEnter={() => setHoveredGroup("Shoulders")}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => handleGroupClick("Shoulders")}
              />

              {/* Chest (Pectorals) */}
              <path
                d="M58,54 C66,54 78,56 80,68 C80,78 68,88 56,86 C52,80 50,68 58,54 Z"
                style={getStyle("Chest")}
                onMouseEnter={() => setHoveredGroup("Chest")}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => handleGroupClick("Chest")}
              />
              <path
                d="M102,54 C94,54 82,56 80,68 C80,78 92,88 104,86 C108,80 110,68 102,54 Z"
                style={getStyle("Chest")}
                onMouseEnter={() => setHoveredGroup("Chest")}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => handleGroupClick("Chest")}
              />

              {/* Biceps */}
              <path
                d="M34,80 L44,82 Q42,108 34,115 L26,108 Q30,90 34,80 Z"
                style={getStyle("Biceps")}
                onMouseEnter={() => setHoveredGroup("Biceps")}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => handleGroupClick("Biceps")}
              />
              <path
                d="M126,80 L116,82 Q118,108 126,115 L134,108 Q130,90 126,80 Z"
                style={getStyle("Biceps")}
                onMouseEnter={() => setHoveredGroup("Biceps")}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => handleGroupClick("Biceps")}
              />

              {/* Core / Abs */}
              <path
                d="M62,88 L98,88 L94,142 L66,142 Z"
                style={getStyle("Core")}
                onMouseEnter={() => setHoveredGroup("Core")}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => handleGroupClick("Core")}
              />

              {/* Quadriceps (Legs) */}
              <path
                d="M55,148 L76,148 L73,215 L50,210 Z"
                style={getStyle("Quads")}
                onMouseEnter={() => setHoveredGroup("Quads")}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => handleGroupClick("Quads")}
              />
              <path
                d="M105,148 L84,148 L87,215 L110,210 Z"
                style={getStyle("Quads")}
                onMouseEnter={() => setHoveredGroup("Quads")}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => handleGroupClick("Quads")}
              />

              {/* Calves Front */}
              <path
                d="M51,216 L71,218 L67,260 L54,258 Z"
                style={getStyle("Calves")}
                onMouseEnter={() => setHoveredGroup("Calves")}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => handleGroupClick("Calves")}
              />
              <path
                d="M109,216 L89,218 L93,260 L106,258 Z"
                style={getStyle("Calves")}
                onMouseEnter={() => setHoveredGroup("Calves")}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => handleGroupClick("Calves")}
              />
            </g>

            {/* BACK VIEW (Right Side of SVG Canvas) */}
            <g transform="translate(0, 0)">
              <text x="240" y="272" textAnchor="middle" fill="#6b7280" fontSize="10" fontWeight="bold">
                POSTERIOR / BACK
              </text>

              {/* Back / Lats */}
              <path
                d="M214,54 L266,54 L258,125 L222,125 Z"
                style={getStyle("Back")}
                onMouseEnter={() => setHoveredGroup("Back")}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => handleGroupClick("Back")}
              />

              {/* Triceps */}
              <path
                d="M194,76 L206,78 Q202,110 196,118 L186,110 Z"
                style={getStyle("Triceps")}
                onMouseEnter={() => setHoveredGroup("Triceps")}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => handleGroupClick("Triceps")}
              />
              <path
                d="M286,76 L274,78 Q278,110 284,118 L294,110 Z"
                style={getStyle("Triceps")}
                onMouseEnter={() => setHoveredGroup("Triceps")}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => handleGroupClick("Triceps")}
              />

              {/* Glutes & Hamstrings */}
              <path
                d="M214,130 L236,130 L234,212 L210,208 Z"
                style={getStyle("Hamstrings")}
                onMouseEnter={() => setHoveredGroup("Hamstrings")}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => handleGroupClick("Hamstrings")}
              />
              <path
                d="M266,130 L244,130 L246,212 L270,208 Z"
                style={getStyle("Hamstrings")}
                onMouseEnter={() => setHoveredGroup("Hamstrings")}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => handleGroupClick("Hamstrings")}
              />

              {/* Posterior Calves */}
              <path
                d="M210,215 L231,217 L227,260 L213,258 Z"
                style={getStyle("Calves")}
                onMouseEnter={() => setHoveredGroup("Calves")}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => handleGroupClick("Calves")}
              />
              <path
                d="M270,215 L249,217 L253,260 L267,258 Z"
                style={getStyle("Calves")}
                onMouseEnter={() => setHoveredGroup("Calves")}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => handleGroupClick("Calves")}
              />
            </g>
          </svg>
        </div>

        {/* Selected Muscle Card Inspector */}
        <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-elevated p-4 md:col-span-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl font-black uppercase text-white">
                {currentDisplayGroup}
              </span>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase"
                style={{
                  backgroundColor: STATUS_COLORS[currentInfo.status].fill + "33",
                  color: STATUS_COLORS[currentInfo.status].fill === "#1c2230" ? "#9ca3af" : STATUS_COLORS[currentInfo.status].fill,
                  border: `1px solid ${STATUS_COLORS[currentInfo.status].stroke}`,
                }}
              >
                {currentInfo.status}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>Recovery Readiness</span>
                <span className="font-bold text-white">
                  {currentInfo.recoveryPercent ?? 100}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${currentInfo.recoveryPercent ?? 100}%`,
                    backgroundColor: STATUS_COLORS[currentInfo.status].fill,
                  }}
                />
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-white/5 bg-surface p-3 text-xs text-[var(--text-secondary)]">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-neon" />
              <span>{currentInfo.notes || "Ready for training load."}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-1.5 text-center text-[10px] text-[var(--text-muted)]">
            <button
              onClick={() => handleGroupClick("Chest")}
              className={`rounded border p-1.5 transition ${activeGroup === "Chest" ? "border-neon text-white" : "border-white/5 hover:border-white/20"}`}
            >
              Chest
            </button>
            <button
              onClick={() => handleGroupClick("Back")}
              className={`rounded border p-1.5 transition ${activeGroup === "Back" ? "border-neon text-white" : "border-white/5 hover:border-white/20"}`}
            >
              Back
            </button>
            <button
              onClick={() => handleGroupClick("Quads")}
              className={`rounded border p-1.5 transition ${activeGroup === "Quads" ? "border-neon text-white" : "border-white/5 hover:border-white/20"}`}
            >
              Legs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
