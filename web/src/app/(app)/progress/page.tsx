"use client";

import React, { useMemo } from "react";
import { Card, SectionLabel } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MuscleHeatmap } from "@/components/anatomy/MuscleHeatmap";
import { useFit } from "@/context/FitgenixProvider";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { Activity, Flame, Award, Calendar, TrendingUp } from "lucide-react";

export default function ProgressPage() {
  const { history, plan, outcomes, readiness } = useFit();
  const sessions = history.length;
  const loggedToday = Object.keys(outcomes).length;

  // Mock trend data for recovery vs strain visualization
  const trendData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day, idx) => {
      const isToday = idx === 6;
      const baseReadiness = readiness?.score ? Math.round(readiness.score) : 78;
      const score = isToday ? baseReadiness : Math.floor(65 + Math.random() * 30);
      const strain = Math.floor(40 + Math.random() * 45);
      return { day, score, strain };
    });
  }, [readiness]);

  // Volume distribution by muscle group
  const muscleDistribution = [
    { group: "Chest", volume: 4200 },
    { group: "Back", volume: 5100 },
    { group: "Quads", volume: 6800 },
    { group: "Shoulders", volume: 3400 },
    { group: "Arms", volume: 2900 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionLabel>Athlete Intelligence Analytics</SectionLabel>
          <h1 className="font-display text-3xl font-black text-white sm:text-4xl">
            Progress & Performance
          </h1>
        </div>
        <Badge tone="neon">{sessions} Completed Sessions</Badge>
      </div>

      {/* Top Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Metric
          icon={<Flame className="text-neon" size={18} />}
          label="Logged Sessions"
          value={String(sessions)}
          hint="Total completed"
        />
        <Metric
          icon={<Calendar className="text-cool" size={18} />}
          label="Plan Horizon"
          value={String(plan.length ? `${plan.length} Days` : "—")}
          hint="Active adaptive macro-cycle"
        />
        <Metric
          icon={<Activity className="text-success" size={18} />}
          label="Today's Sets"
          value={String(loggedToday)}
          hint={readiness ? `Readiness ${readiness.band}` : "Pending check-in"}
        />
        <Metric
          icon={<Award className="text-heat" size={18} />}
          label="Adherence Rate"
          value={plan.length ? "94%" : "100%"}
          hint="Consistency score"
        />
      </div>

      {/* 7-Day Recovery vs. Training Strain Chart (Recharts) */}
      <Card className="glass-card">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <SectionLabel>Recovery & Load Dynamics</SectionLabel>
            <h3 className="font-display text-xl font-bold text-white">
              7-Day Readiness vs. Training Strain
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-neon">
              <span className="h-2.5 w-2.5 rounded-full bg-neon" />
              <span>Readiness Score</span>
            </div>
            <div className="flex items-center gap-1.5 text-cool">
              <span className="h-2.5 w-2.5 rounded-full bg-cool" />
              <span>Training Strain</span>
            </div>
          </div>
        </div>

        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReadiness" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e8ff00" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#e8ff00" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorStrain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00b4ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00b4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={12} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f1218",
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                name="Readiness Score"
                stroke="#e8ff00"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorReadiness)"
              />
              <Area
                type="monotone"
                dataKey="strain"
                name="Training Strain"
                stroke="#00b4ff"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorStrain)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Anatomical Recovery Heatmap */}
      <MuscleHeatmap />

      {/* Volume Distribution Bar Chart */}
      <Card className="glass-card">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <SectionLabel>Volume Breakdown</SectionLabel>
            <h3 className="font-display text-xl font-bold text-white">
              Tonnage Lifted by Muscle Group (kg)
            </h3>
          </div>
          <TrendingUp className="text-neon" size={20} />
        </div>

        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={muscleDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="group" stroke="#6b7280" fontSize={12} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f1218",
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="volume" name="Tonnage (kg)" fill="#e8ff00" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recent History Table */}
      <Card className="glass-card">
        <SectionLabel>Logged Workout Trail</SectionLabel>
        {!history.length ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Complete a session in Gym Mode to initiate your training trail.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-white/5">
            {[...history].reverse().slice(0, 14).map((h, i) => (
              <li
                key={i}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-neon" />
                  <span className="font-medium text-white">{String(h.date)}</span>
                </div>
                <span className="text-[var(--text-secondary)]">
                  {String(h.goal || "Session Logged")}
                  {h.outcomes != null ? ` · ${h.outcomes} exercises recorded` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="glass-card">
      <div className="flex items-center justify-between">
        <div className="text-[0.68rem] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </div>
        {icon}
      </div>
      <div className="font-display mt-2 text-3xl font-black text-white">
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-xs text-[var(--text-secondary)]">{hint}</div>
      )}
    </Card>
  );
}
