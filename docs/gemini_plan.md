# FITGENIX — UI / UX Plan (Gemini track)

**Document type:** UI, UX, and frontend component plan  
**Status:** Companion to the master architecture plan  
**Date:** 2026-07-26  
**Owner track:** Frontend · Design system · Interaction design  

### How this document works with the master plan

| Document | Owns |
|----------|------|
| **[`MODERNIZATION_PLAN.md`](./MODERNIZATION_PLAN.md)** | Architecture, stack, phases, API, core Python, data, mobile roadmap, non-functionals |
| **This file (`gemini_plan.md`)** | Screens, components, visual polish, motion, interaction patterns, UI build order |
| **[`COMPETITOR_UI_RESEARCH.md`](./COMPETITOR_UI_RESEARCH.md)** | Competitor benchmarks that inform this UI |

**Rule:** If stack, API shape, or phasing conflicts with the master plan, **`MODERNIZATION_PLAN.md` wins.**  
This file deepens the **Neon Coach** UI so a frontend engineer (or Gemini-assisted UI work) can ship without re-deciding backend architecture.

**Locked from master (do not re-litigate here):**

- Web app first: **Next.js 15 + TypeScript + Tailwind + shadcn/ui + Framer Motion**  
- Intelligence stays in Python (`fitgenix_core` + FastAPI)  
- Auth/data: **Supabase**  
- Product IA: **Home · Train · Plan · Progress · Profile**  
- Mobile native comes **after** Product API v1  

---

## 1. UI mission

Turn FITGENIX from a **Streamlit report generator** into a **mobile-first coach**:

> Open app → see readiness → start today’s session → 1-tap outcomes → feel the system adapt.

### UX principles (enforce in every screen)

1. **Glance → act → explain** — score first, action second, “why” third  
2. **Train never blocked** by skipped check-in  
3. **≤ 2 taps** for exercise outcomes  
4. **Always show why** load/sets changed (readiness / ramp / RL)  
5. **Mobile-first**, one-thumb Train mode  
6. **Respect `prefers-reduced-motion`**  
7. Neon for CTAs and scores — **not** long body text (contrast)  
8. **Honest adaptation** — badges only when something real changed  

---

## 2. Visual language — Neon Coach (UI detail)

Master plan defines tokens; this section specifies **how they look and feel** in UI.

### 2.1 Surfaces & depth

| Layer | Token | Use |
|-------|-------|-----|
| Page | `--bg-void` | App background, subtle radial neon/heat glows (existing Streamlit vibe, refined) |
| Card | `--bg-surface` | Primary panels |
| Raised | `--bg-elevated` | Nested rows, inputs, exercise cards |
| Glass (sparing) | elevated + `backdrop-blur` + `--border-subtle` | Nav bars, sticky headers, modals only — not every card |

**Glassmorphism rule:** Use on chrome (shell, modal, sticky check-in), not on dense workout lists. Prefer solid elevated surfaces for readability in gym lighting.

### 2.2 Status color mapping

| Domain | Green | Amber / neon | Heat / red |
|--------|-------|--------------|------------|
| Readiness | Primed / Ready | Moderate | Low / Poor |
| Plan status | On track | Behind / picking up | Long gap / injury severe |
| Exercise outcome | Done | — | Too hard |
| RL intensity | — | High intensity rec | Rest / caution |

### 2.3 Typography in UI

- **Display (Barlow Condensed):** readiness score, day number, brand wordmark, metric values  
- **Body (Barlow / Inter):** labels, tips, form help  
- Oversized readiness number (40–56px) — WHOOP-style glanceability  
- Section labels: 0.7rem, uppercase, letter-spacing ~0.15–0.2em, accent color  

### 2.4 Motion (Framer Motion)

| Interaction | Motion | Notes |
|-------------|--------|-------|
| Readiness ring | Arc draw-in ~0.6s | Skip if reduced motion → static ring |
| Tab / route change | Soft fade + 8px y | Keep under 200ms |
| Outcome tap | Scale 0.96 → 1 + color flash | Immediate feedback |
| Streak milestone | Brief confetti / glow pulse | Rare; not every session |
| Plan generate | Skeleton shimmer → content | No full-page blank |

---

## 3. App shell & navigation

### 3.1 `AppShell`

**Mobile**

- Bottom nav (5 items): Home · Train · Plan · Progress · Profile  
- Active item: neon underline or filled icon  
- Safe-area padding for notched phones  
- Optional sticky top bar: logo mark + injury chip  

**Desktop (≥1024px)**

- Left rail (icon + label)  
- Max content width ~1120px centered  
- No reliance on Streamlit-style permanent data sidebar  

### 3.2 Auth screens

- Centered brand: `FIT` + neon `GENIX`  
- Tabs or toggle: Log in / Sign up  
- Minimal fields; errors as inline alerts (not only toasts)  
- After auth: onboarding if no profile/plan, else `/home`  

### 3.3 Onboarding wizard (UI)

Progress stepper (4 steps):

1. **Goal cluster** — large selectable cards (not a 40-item list)  
2. **Setup** — experience, equipment, days/week, split  
3. **Body** — age, height, weight, optional body type  
4. **Injury** — No / Yes + part + severity (skip-friendly)  

Primary CTA: **Build my plan** → loading state with honest copy (“Building your injury-aware plan…”) → `/home`.

---

## 4. Screen-by-screen UI spec

### 4.1 Home `/home`

**Purpose:** Daily command center.

| Block | Component | Notes |
|-------|-----------|-------|
| 1 | `ReadinessRing` / `ReadinessGauge` | Band + score; drivers line if limited |
| 2 | `CheckInPills` (if not done, not rest day) | Compact; expand to full form if needed |
| 3 | `DecisionBanner` | continue / resume / deload / start fresh |
| 4 | `SessionCard` | Day N · focus · 3–4 exercise preview · **Start workout** |
| 5 | `InjuryChip` | Only if active |
| 6 | `AdaptationBadge` row | Only if real adaptation |
| 7 | Streak strip | Compact; full badges on Progress |

Empty state (no plan): illustration + **Create plan** → onboarding/plan wizard.

### 4.2 Train `/train`

**Purpose:** Gym-mode logging. Highest interaction priority.

| Block | Component | Notes |
|-------|-----------|-------|
| Header | Day · focus · readiness band | Sticky |
| Autoreg note | Why sets/load adjusted | One line + expandable |
| List | `ExerciseRow` / `WorkoutCard` | One card per exercise |
| Actions | **Done · Skip · Too hard** | Match product labels (Phase 1) |
| Secondary | Swap icon → `SubstituteModal` | Phase UI-2 |
| Footer | **End session** | Triggers RL learn + celebration micro-state |

**Outcome labels (locked for Phase 1 UI):**

| Button | Maps to engine | Style |
|--------|----------------|-------|
| Done | `completed` | Success / neon border |
| Skip | `skipped` | Muted |
| Too hard | `completed` + difficulty `too_hard` | Heat accent |

**Future (UI-3, optional):** add **Too easy** as a fourth signal once API supports it — do not replace Done/Skip/Too hard.

Layout: large tap targets (≥44px), high contrast, minimal chrome.

### 4.3 Plan `/plan`

| Block | Component | Notes |
|-------|-----------|-------|
| Timeline | `PlanTimeline` | TODAY chip; past/future styling |
| Day cards | Native cards (not HTML iframe) | Rest days distinct |
| Actions | Generate / restart wizard | Confirm before abandon active plan |
| Rehab mode | Safety banner + protocol days | Heat-themed clinical warning |
| Swap | Per-exercise swap (when in edit context) | Same as Train modal |

### 4.4 Progress `/progress`

| Block | Component | Notes |
|-------|-----------|-------|
| Metrics row | `MetricTile` | Streak, sessions, adherence |
| Charts | Steps, active min, BMI, GA score | Recharts; dark theme |
| Advanced | Model performance | Collapsed by default |
| Export | PDF download CTA | Secondary button style |

### 4.5 Profile `/profile`

Sections as cards:

- Account (email, logout)  
- Body metrics  
- Training preferences (goal cluster, split, frequency, experience, equipment)  
- Injury profile (persistent, editable)  
- Danger zone later: delete data  

---

## 5. Component inventory (Gemini UI build list)

Implement under `web/` (Next.js). Prefer **TypeScript** (`.tsx`), not `.jsx`.

### 5.1 Phase UI-1 — ship with daily loop (P0)

| Component | File (suggested) | Spec |
|-----------|------------------|------|
| `AppShell` | `components/shell/AppShell.tsx` | Nav + safe areas + outlet |
| `Button` | `components/ui/Button.tsx` | Primary neon / ghost / danger |
| `ReadinessRing` | `components/readiness/ReadinessRing.tsx` | SVG arc 0–100; band colors; reduced-motion static |
| `CheckInPills` | `components/readiness/CheckInPills.tsx` | Sleep / soreness / energy pills + submit |
| `DecisionBanner` | `components/plan/DecisionBanner.tsx` | Severity border color + headline/detail |
| `SessionCard` | `components/session/SessionCard.tsx` | Preview + Start CTA |
| `ExerciseRow` | `components/session/ExerciseRow.tsx` | Name, sets, muscles, 3 outcome buttons |
| `InjuryChip` | `components/profile/InjuryChip.tsx` | Compact severity chip |
| `AdaptationBadge` | `components/plan/AdaptationBadge.tsx` | Honest chips only |
| `EmptyState` | `components/shell/EmptyState.tsx` | First-run CTA |
| `MetricTile` | `components/progress/MetricTile.tsx` | Label + big number |
| `PlanTimeline` | `components/plan/PlanTimeline.tsx` | Horizontal or vertical day list |

**ReadinessRing visual detail (from original Gemini gauge idea):**

- Circular track on void/surface  
- Arc color = band (green / neon / heat)  
- Center: band label + optional score  
- Optional soft glow under ring (primary glow token)  
- Caption: “Mainly limited by sleep and soreness” when drivers exist  

### 5.2 Phase UI-2 — differentiators (P1)

| Component | File (suggested) | Spec |
|-----------|------------------|------|
| `WorkoutCard` | `components/session/WorkoutCard.tsx` | Elevated card variant of ExerciseRow; optional form gif/image slot |
| `SubstituteModal` | `components/session/SubstituteModal.tsx` | List safe alternatives; filter equipment + injury; confirm swap |
| `DayPlanCard` | `components/plan/DayPlanCard.tsx` | Full day with rest/workout states |
| `StreakStrip` | `components/progress/StreakStrip.tsx` | Fire/streak + mini badges |
| `OnboardingCards` | `components/onboarding/*` | Goal cluster large cards |

**SubstituteModal behavior:**

1. Open from swap icon on exercise  
2. Show alternatives same muscle group(s)  
3. Grey out / hide blocked by injury  
4. Respect equipment tier  
5. Confirm → update local plan view (API persistence per master plan)  

### 5.3 Phase UI-3 — visual intelligence (P2)

| Component | File (suggested) | Spec |
|-----------|------------------|------|
| `MuscleHeatmap` | `components/anatomy/MuscleHeatmap.tsx` | Interactive 2D SVG body; fresh / worked / sore / injured |
| `HeatmapLegend` | `components/anatomy/HeatmapLegend.tsx` | Color key |
| `ReadinessBreakdown` | `components/readiness/ReadinessBreakdown.tsx` | Expandable component bars |
| Optional | Fourth outcome **Too easy** | Only after API supports reward signal |

**MuscleHeatmap behavior (original Gemini highlight):**

- Front (and optional back) SVG silhouettes  
- Regions: chest, back, shoulders, arms, core, legs, etc.  
- States:  
  - **Fresh** — muted  
  - **Trained today** — neon fill  
  - **Sore / high fatigue** — amber  
  - **Injured** — heat outline  
- Hover/tap: tooltip with group name + status  
- Data source: today’s plan focus + outcomes + injury profile (API/home payload)  
- Accessibility: list fallback for screen readers  

### 5.4 Shared UI primitives (shadcn-based)

Dialog, Sheet (mobile drawers), Tabs, Input, Select, Slider, Toast, Skeleton, Badge — themed with Neon Coach CSS variables.

---

## 6. Frontend file structure (UI track)

Aligned with master plan `web/` app (not a separate Vite SPA):

```
web/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (auth)/signup/page.tsx
│   ├── (app)/layout.tsx          # AppShell
│   ├── (app)/home/page.tsx
│   ├── (app)/train/page.tsx
│   ├── (app)/plan/page.tsx
│   ├── (app)/progress/page.tsx
│   ├── (app)/profile/page.tsx
│   ├── (app)/onboarding/page.tsx
│   ├── globals.css               # tokens + base
│   └── layout.tsx
├── components/
│   ├── shell/
│   ├── ui/
│   ├── readiness/
│   ├── session/
│   ├── plan/
│   ├── progress/
│   ├── profile/
│   ├── onboarding/
│   └── anatomy/
├── lib/
│   ├── api.ts                    # typed client → FastAPI
│   ├── supabase.ts
│   └── cn.ts
└── public/
    └── icons/                    # PWA icons
```

**Do not** invent a parallel `frontend/` Vite app unless the master plan is explicitly revised.

---

## 7. UI data contracts (consume only — do not redesign API)

Frontend types should mirror master Phase-1 endpoints. UI track assumes payloads roughly like:

```ts
// Illustrative — API track owns final schema
type HomePayload = {
  readiness?: { score: number; band: string; message: string; drivers?: string[] };
  checkinDone: boolean;
  isRestDay: boolean;
  decision?: { action: string; headline: string; detail: string; severity: string };
  todaySession?: {
    day: number;
    focus: string;
    isRest: boolean;
    exercises: ExerciseView[];
    autoregNote?: string;
  };
  streak: number;
  injury?: { bodyPart: string; severity: string } | null;
  adaptations?: { color: string; text: string }[];
};

type ExerciseView = {
  name: string;
  setsReps: string;
  weight?: string;
  muscles?: string;
  status?: "completed" | "skipped" | null;
  difficulty?: "too_hard" | null;
};
```

UI must render gracefully when optional fields are missing (first-run, offline error).

---

## 8. UI build order (coordinate with master phases)

| UI sprint | Deliver | Depends on (master) |
|-----------|---------|---------------------|
| **UI-0** | Tokens in `globals.css`, Button, AppShell shell, auth layout | Repo `web/` scaffold |
| **UI-1** | Home + Train + outcome buttons + SessionCard + ReadinessRing + CheckInPills | Internal API: home, checkin, session, outcomes |
| **UI-2** | Plan timeline, Profile forms, Progress charts, PDF button | plans, progress, profile, export |
| **UI-3** | SubstituteModal, richer WorkoutCard | substitutes endpoint or client filter via plan data |
| **UI-4** | MuscleHeatmap + legend | Home/progress aggregates for muscle state |
| **UI-5** | PWA polish, empty/error skeletons, a11y pass, reduced motion | Production hardening |

Master Phase 0 (core extract) can run in parallel with **UI-0** (static shell + mock data).

---

## 9. Accessibility & QA (UI track)

| Check | Target |
|-------|--------|
| Tap targets | ≥ 44×44px on Train outcomes |
| Contrast | Body text on void/surface meets AA; neon only on large/bold UI chrome |
| Keyboard | Modal trap, outcome buttons focusable |
| Screen reader | Heatmap has text list alternative |
| Reduced motion | No arc animation / confetti |
| Responsive | 360px width usable for Train |
| E2E (with master) | Playwright: login → home → complete one exercise |

---

## 10. Explicit non-ownership (UI track does not decide)

- FastAPI route design, versioning, JWT validation  
- Q-table / GA math, safety caps, plan lifecycle rules  
- Supabase schema migrations  
- Mobile native (Expo) project — reuse components later if possible  
- Streamlit retirement policy  

UI may **mock** API with fixtures until backend endpoints exist.

---

## 11. Collaboration model (both tracks on one app)

```
┌─────────────────────────────────────────────────────────────┐
│  MASTER — MODERNIZATION_PLAN.md                             │
│  core/ · api/ · phases · data · mobile later                │
└──────────────────────────┬──────────────────────────────────┘
                           │ contracts & phases
          ┌────────────────┴────────────────┐
          ▼                                 ▼
┌──────────────────────┐        ┌──────────────────────────┐
│  Architecture track  │        │  UI track (this doc)     │
│  fitgenix_core       │        │  Neon Coach components   │
│  FastAPI endpoints   │◄──────►│  screens & motion        │
│  Supabase / tests    │  JSON  │  heatmap, swap, gauges   │
└──────────────────────┘        └──────────────────────────┘
```

**Working agreement:**

1. Architecture track publishes/changes API shapes in master plan or OpenAPI.  
2. UI track implements screens against those shapes (or mocks).  
3. Shared design tokens live in `web` CSS and are mirrored from master §6.  
4. New visual features (heatmap, too-easy button) are proposed here, scheduled against master phases, not as silent scope creep.  

---

## 12. Summary

This document is the **UI half of the dual-track plan**:

- **Master plan** = what we build, in what order, on which stack, with which brain.  
- **This plan** = how it looks, feels, and taps — readiness gauge, coach home, train cards, substitutions, and muscle heatmap — without fighting architecture.

Original Gemini ideas retained and upgraded:

| Original Gemini idea | Status in this UI plan |
|----------------------|------------------------|
| Readiness circular gauge | **UI-1** as `ReadinessRing` |
| 1-tap RL feedback cards | **UI-1** Done / Skip / Too hard |
| Exercise substitute modal | **UI-3** |
| Interactive muscle heatmap | **UI-4** |
| Glassmorphism + Framer Motion | **Shell/modals + sparse motion** under Neon Coach rules |
| Vite/App.jsx structure | **Replaced** by Next.js `web/` App Router (per master) |

---

## Document history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | — | Original full-stack Gemini pitch |
| 2.0 | 2026-07-26 | Rewritten as UI companion under MODERNIZATION_PLAN ownership |
