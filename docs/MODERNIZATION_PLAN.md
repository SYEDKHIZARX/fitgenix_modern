# FITGENIX — Modernization Plan

**Document type:** Architecture & product engineering plan (**master plan**)  
**Status:** Approved direction for planning (implementation not started)  
**Date:** 2026-07-26  
**Product:** FITGENIX — Adaptive Fitness Intelligence  
**Audience:** Engineering, design, product  

**Related docs:**

| Document | Role |
|----------|------|
| **This file** | Master: stack, architecture, phases, API, data, mobile, NFRs |
| [`gemini_plan.md`](./gemini_plan.md) | **UI track:** screens, components, motion, heatmap/swap, frontend build order |
| [`COMPETITOR_UI_RESEARCH.md`](./COMPETITOR_UI_RESEARCH.md) | Competitor benchmarks |

### Dual-track ownership

| Track | Primary doc | Owns |
|-------|-------------|------|
| **Architecture** (this plan) | `MODERNIZATION_PLAN.md` | `fitgenix_core`, FastAPI, Supabase, phasing, API contracts, tests, mobile later |
| **UI / UX** | `gemini_plan.md` | Neon Coach implementation detail, AppShell, readiness gauge, Train cards, substitute modal, muscle heatmap |

**Conflict rule:** Stack, API, and phase order in **this master plan win**. The UI plan deepens presentation only.

---

## 1. Executive summary

FITGENIX today is a **Streamlit monolith** with strong domain intelligence (GA calorie model, personalized Q-learning, injury-aware planning, readiness/autoreg, plan lifecycle) but a **demo-grade UI shell**.

### Direction (locked for this plan)

| Horizon | Deliverable | Goal |
|--------|-------------|------|
| **Now** | **Modern web application** | Consumer-grade UI/UX, mobile-first PWA, design system, modular architecture |
| **Next** | **Hardened product API** | Stable REST API for web + future clients, versioning, observability |
| **Later** | **Mobile app** | iOS/Android (Expo/React Native) consuming the same API |

**Principle:** Preserve the **Python intelligence** (plan engine, GA, RL, readiness). Rebuild the **product shell** for modern UX. Do not rewrite ML in TypeScript.

---

## 2. Current state (baseline)

### 2.1 What exists

| Area | Current implementation |
|------|------------------------|
| UI | Streamlit single file (`streamlit_app.py` ~2,300+ lines) |
| Domain data | `data.py` — exercise library, 39+ training types, injury maps, splits, readiness, equipment |
| Auth & persistence | Supabase (profiles, history, outcomes, active plans, check-ins) |
| ML artifacts | `ga_model.pkl`, `q_table.pkl`, `scaler.pkl` |
| Charts / export | Plotly, fpdf2 |
| Tests | `test_engine.py` (engine slice via source exec — fragile) |
| Theme | Dark athletic brand: `#080A0E`, neon `#E8FF00`, heat `#FF4D00`, Barlow fonts |

### 2.2 Product capabilities to preserve

- Personalized RL intensity (Done / Skip / Too hard) with safety caps  
- GA calorie intensity + periodic personal retrain  
- Injury-aware exercise filtering + rehab protocols  
- Split-first programming (PPL, upper/lower, single-muscle, etc.)  
- Equipment tiers, experience scaling, rep schemes  
- Daily readiness check-in → autoregulated session  
- Plan lifecycle (adherence, resume ramp, deload, start fresh)  
- Streaks, badges, progress charts, PDF report  

### 2.3 Pain points driving the rebuild

1. **Monolith** — UI, auth, DB, ML, HTML rendering tangled  
2. **Streamlit UX ceiling** — full reruns, weak navigation, desktop-sidebar bias  
3. **Plan as HTML iframe** — fixed heights, poor mobile, hard to interact  
4. **Generate-first IA** — report-centric vs “train today” coach loop  
5. **No formal design system** — duplicated inline CSS/HTML  
6. **No client-ready API** — mobile app cannot ship against Streamlit  
7. **Silent DB failures** — personalization can fail without user feedback  

---

## 3. Product thesis

> Open FITGENIX → see readiness in seconds → start **today’s session** → log outcomes in 1–2 taps → the system gets smarter.  
> GA/RL is the differentiator; it is not the homepage headline.

### Primary daily loop (target UX)

```
Open web app
  → optional 20s readiness check-in (pills, not long forms)
  → Home: readiness ring + coaching decision + today’s session
  → Train: exercise list + Done / Skip / Too hard
  → End session → RL update + streak feedback
```

**Generate plan / full report / PDF** become secondary actions under **Plan** and **Progress**, not the only happy path.

---

## 4. Technology stack (web app — now)

### 4.1 Recommended stack

| Layer | Technology | Role |
|-------|------------|------|
| **Frontend** | **Next.js 15** (App Router) + **TypeScript** | Web app UI, routing, PWA shell |
| **Styling** | **Tailwind CSS** + CSS design tokens | Layout, responsive system, theme |
| **Components** | **shadcn/ui** + custom FITGENIX brand layer | Accessible primitives, branded composition |
| **Motion** | **Framer Motion** (sparing) | Readiness ring, page transitions, celebrations |
| **Data fetching** | **TanStack Query** | Cache, mutations, optimistic updates |
| **Auth & DB** | **Supabase** (Auth + Postgres + RLS) | Keep existing backend data plane |
| **Intelligence runtime** | **Python package** `fitgenix_core` | Plan engine, injury, readiness, GA, RL |
| **Web backend (Phase 1)** | **FastAPI** (minimal, internal) | Serve plan generation & ML ops to the web app |
| **Charts** | **Recharts** or **Visx** | Progress trends (lighter than Plotly in browser) |
| **PDF** | Keep **fpdf2** (or WeasyPrint) on server | Report export |
| **Tests** | **pytest** (core) + **Playwright** (E2E) | Engine correctness + critical UX paths |
| **Hosting (suggested)** | Vercel/Netlify (web) · Railway/Fly/Render (API) · Supabase (data) | Decoupled deploy |

### 4.2 Why this stack

| Decision | Rationale |
|----------|-----------|
| Next.js | Production routing, SSR/SSG options, PWA-friendly, large talent pool |
| TypeScript | Safer UI contracts as API stabilizes |
| Tailwind + tokens | Fast iteration + single design-system source of truth |
| shadcn/ui | Own the code; match dark/neon brand without Material defaults |
| Keep Supabase | Auth + RLS already in product; no auth rewrite |
| Keep Python for brain | All GA/RL/plan logic already proven; avoid dual implementations |
| FastAPI early but thin | Web needs server-side plan gen; full public API productization comes later |

### 4.3 Explicit non-goals for Phase 1

- Full native App Store / Play Store release  
- Rewriting the training engine in TypeScript/Node  
- Wearable hardware integrations (optional later)  
- Multi-tenant gym/coach B2B (unless prioritized later)  
- Keeping Streamlit as the long-term consumer UI  

Streamlit may remain temporarily as a **research/admin** entrypoint during migration, not the product shell.

---

## 5. Architecture

### 5.1 Target shape

```
┌──────────────────────────────────────────────────────────────┐
│  WEB APP (Phase 1 — primary product)                         │
│  Next.js + TypeScript + Tailwind + Neon Coach design system  │
│  Routes: Home · Train · Plan · Progress · Profile            │
│  PWA: installable, mobile-first bottom navigation            │
└────────────────────────────┬─────────────────────────────────┘
                             │ HTTPS / JSON
┌────────────────────────────▼─────────────────────────────────┐
│  SERVICE LAYER                                               │
│  Phase 1: Internal FastAPI (“web backend”)                   │
│  Phase 2: Public versioned Product API (see §9)              │
│  Auth: validate Supabase JWT                                 │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│  fitgenix_core (pure Python)                                 │
│  schedule · exercise select · injury · readiness · autoreg   │
│  plan lifecycle · GA · RL · domain data                      │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│  Supabase Postgres + Auth + RLS                              │
│  profiles · workout_history · exercise_outcomes              │
│  active_plans · daily_checkins · model weights / q_table     │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Repository layout (target)

```
fitgenix/
├── docs/                          # plans, research, design
├── core/                          # fitgenix_core — pure Python
│   ├── models/                    # Pydantic domain models
│   ├── engine/                    # schedule, injury, readiness, lifecycle
│   ├── ml/                        # ga.py, rl.py
│   └── data/                      # libraries, maps, protocols
├── api/                           # FastAPI app (thin in Phase 1)
├── web/                           # Next.js application
├── streamlit_app.py               # legacy / transitional adapter
├── tests/                         # pytest against core (no Streamlit)
└── requirements / package configs
```

### 5.3 Extraction rule

Anything that is not presentation must live in **`core/`**:

- `predict_calories`, `calculate_bmi`, `get_schedule`, `pick_exercises`  
- `compute_readiness`, `autoregulate`, `decide_action`, `compute_plan_state`  
- `rl_learn_from_outcomes`, `adaptive_ga_retrain`  
- All static maps currently in `data.py`  

**UI must not embed business rules.** Streamlit (if kept) and Next.js both call the same core via API (preferred) or temporary Python imports only during migration.

### 5.4 Data model cleanups (do during web migration)

| Item | Action |
|------|--------|
| Injury profile | Persist on `profiles` (or dedicated table); not session-only |
| RL safety caps | Persist with personal Q-table |
| Upserts | Prefer real `ON CONFLICT` unique keys over delete+insert |
| Errors | Surface failures to UI; log server-side (no silent `except: pass`) |
| Legacy JSON | Deprecate `history.py` / local JSON for production paths |
| Active plans | Keep single-active invariant; archive prior plans |

---

## 6. Design system — “Neon Coach”

Codify brand for the web app. Aligns with competitor research (dark-first Freeletics energy, WHOOP glanceability, Fitbod action density).

### 6.1 Design tokens

```css
:root {
  /* Surfaces */
  --bg-void:        #080A0E;
  --bg-surface:     #0F1218;
  --bg-elevated:    #161B24;
  --bg-overlay:     rgba(15, 18, 24, 0.85);

  /* Brand */
  --accent-primary: #E8FF00;   /* primary CTA, high readiness, brand mark */
  --accent-heat:    #FF4D00;   /* intensity, injury, strong warning */
  --accent-cool:    #00B4FF;   /* secondary metrics */
  --accent-success: #00E676;   /* on track, completed, primed */

  /* Status */
  --status-green:   #00E676;
  --status-amber:   #FFC107;
  --status-red:     #FF3D00;

  /* Text */
  --text-primary:   #F0F2F5;
  --text-secondary: #9CA3AF;
  --text-muted:     #6B7280;
  --text-on-accent: #0A0A0A;

  /* Borders & glow */
  --border-subtle:  rgba(255, 255, 255, 0.08);
  --border-accent:  rgba(232, 255, 0, 0.15);
  --glow-primary:   0 0 40px rgba(232, 255, 0, 0.12);

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-pill: 999px;

  /* Spacing scale (4px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
}
```

### 6.2 Typography

| Role | Family | Weights | Use |
|------|--------|---------|-----|
| Display | Barlow Condensed | 700–900 | Brand, scores, day titles |
| UI / body | Barlow or Inter | 400–600 | Forms, body copy, labels |
| Optional mono | JetBrains Mono | 500 | Advanced model metrics only |

**Type scale (rem):** 12 · 14 · 16 · 20 · 28 · 40 · 56 — oversized numbers for readiness (glanceability).

### 6.3 Core components (build order)

> **Full UI specs, file paths, motion, and heatmap/swap detail:** see [`gemini_plan.md`](./gemini_plan.md).  
> Below is the architecture-level inventory only.

| Component | Behavior | UI track priority |
|-----------|----------|-------------------|
| `AppShell` | Mobile bottom nav; desktop side rail | UI-0 / UI-1 |
| `ReadinessRing` | Band + score; color by Primed → Poor | UI-1 |
| `DecisionBanner` | Coaching action (continue / resume / deload / fresh) | UI-1 |
| `SessionCard` | Day N, focus, preview exercises, **Start** CTA | UI-1 |
| `CheckInPills` | Sleep / soreness / energy (visual, short) | UI-1 |
| `ExerciseRow` | Sets, muscles, **Done / Skip / Too hard** | UI-1 |
| `PlanTimeline` | Week/cycle days with TODAY chip | UI-2 |
| `MetricTile` | BMI, intensity, steps | UI-2 |
| `InjuryChip` | Active limitation + severity | UI-1 |
| `AdaptationBadge` | Only when real adaptation occurred | UI-1 |
| `EmptyState` | First-run path to wizard | UI-1 |
| `Button` | Primary neon / secondary ghost / danger heat | UI-0 |
| `SubstituteModal` | Injury- & equipment-safe exercise swap | UI-3 |
| `MuscleHeatmap` | SVG fresh / trained / sore / injured | UI-4 |

### 6.4 UX principles

1. **Glance → act → explain** (progressive disclosure)  
2. **Never block training** if check-in is skipped (keep current philosophy)  
3. **Outcome logging ≤ 2 taps**  
4. Always show **why** intensity/sets changed  
5. **Mobile-first**, one-thumb Train mode  
6. Respect **`prefers-reduced-motion`**  
7. Neon accents for actions/scores — not long body text (contrast/a11y)  

### 6.5 Information architecture (web routes)

```
/                     → redirect to /home (if authed) or /login
/login · /signup
/home                 → readiness, decision, today’s session, streak
/train                → active workout logging
/plan                 → full plan, generate/restart wizard, exercise swap
/progress             → charts, adherence, optional model metrics, PDF
/profile              → body, equipment, experience, injury, account
/onboarding           → first-run wizard (goal → setup → body → injury)
```

### 6.6 Onboarding (replace sidebar wall of inputs)

1. Goal cluster (Build muscle / Stronger / Fat & conditioning / Athletic / …)  
2. Experience + equipment + days/week  
3. Age / height / weight (+ optional body type)  
4. Injury? (skip-friendly)  
→ Generate first plan → land on **Home**

Daily activity (steps, active minutes) lives in **check-in** or later health sync — not a permanent 15-field sidebar.

---

## 7. Feature map: current → web

| Feature | Streamlit today | Web Phase 1 target |
|---------|-----------------|--------------------|
| Auth | Supabase login screen | Polished auth pages + session |
| Profile / activity inputs | Long sidebar | Onboarding + Profile; activity on check-in |
| Generate report | Primary CTA | Plan wizard + secondary export |
| 7-day plan HTML | `components.html` iframe | Native day cards + list |
| Rehab protocols | HTML render | Dedicated plan view + safety banner |
| Daily check-in | Form + selectboxes | Pills + live readiness preview |
| Today’s session | Conditional cards | Home + Train primary surfaces |
| Outcome logging | Nested under “see plan” | First-class Train screen |
| RL personalization | After outcomes | Same loop; clearer “model adapted” feedback |
| GA retrain | Spinner on history milestones | Background-friendly; toast when evolved |
| Progress charts | Plotly | Recharts; same metrics |
| PDF | Download button | Progress → Export |
| Model performance | Sidebar toggle | Progress → Advanced |

### Stretch (web Phase 1.5 / 2) — UI track detail in `gemini_plan.md`

- Interactive muscle recovery heatmap (SVG) → **UI-4**  
- 1-tap exercise swap (same group + equipment + injury safe) → **UI-3**  
- Shareable session summary card  

---

## 8. Phased roadmap

### Phase 0 — Foundation (prerequisite)

**Goal:** Portable intelligence; safe refactor base.

- Extract `fitgenix_core` from `streamlit_app.py` + `data.py`  
- Pydantic models for Profile, PlanDay, CheckIn, Outcome  
- pytest imports core directly (remove source-slice loading)  
- Document Supabase schema + RLS requirements  
- Persist injury profile + RL caps  

**Exit criteria:** Core tests green without Streamlit; functions pure and importable.

---

### Phase 1 — Modern web app (NOW — primary build)

**Goal:** Ship the consumer web product.

#### 1A — Backend for web (internal)

- FastAPI app with endpoints required by the web UI only  
- Supabase JWT validation  
- Endpoints (minimum set):

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/me/home` | Readiness, plan state, decision, streak |
| POST | `/checkin` | Save daily readiness |
| GET | `/session/today` | Autoregulated today’s work |
| POST | `/session/outcomes` | Log Done/Skip/Too hard + optional RL learn |
| POST | `/plans/generate` | Generate & activate plan |
| GET | `/plans/active` | Full active plan |
| GET | `/progress` | History series + badges |
| GET | `/export/pdf` | PDF bytes |
| GET/PATCH | `/profile` | User profile + injury + equipment |

> This is a **web backend**, not yet a public multi-client product API. Contracts may still evolve.

#### 1B — Frontend

- Next.js app scaffold + auth against Supabase  
- Neon Coach tokens + AppShell navigation  
- Screens: Login, Onboarding, Home, Train, Plan, Progress, Profile  
- Wire to internal API  
- PWA manifest + mobile bottom nav  
- Playwright smoke paths: login → generate → log one exercise  

#### 1C — Cutover

- Production traffic to web app  
- Streamlit optional (research/internal) or retired  
- Monitor errors, completion rate, check-in rate  

**Exit criteria:** New user completes Day-1 exercise log on mobile web in under ~3 minutes; daily loop works without regenerating a full report.

---

### Phase 2 — Product API (LATER)

**Goal:** Stable, versioned API for web + future mobile (and partners).

| Work item | Detail |
|-----------|--------|
| Versioning | `/api/v1/...` frozen contracts + changelog |
| OpenAPI | Published schema; generated TS client for web |
| Auth scopes | Explicit user JWT rules; rate limits |
| Idempotency | Safe retries on outcome logging & plan generate |
| Observability | Structured logs, Sentry, request metrics |
| Hardening | Input validation, consistent error envelope |
| Background jobs | GA retrain / heavy work off request path |
| Model registry | Versioned GA/Q artifacts (not only repo pickles) |

**Exit criteria:** Web fully on `/api/v1`; breaking changes require a new version; mobile team can build against docs alone.

---

### Phase 3 — Mobile app (LATER)

**Goal:** Native-feel mobile clients on the stable API.

| Choice | Recommendation |
|--------|----------------|
| Framework | **Expo / React Native** (shared mental model with React web) |
| Auth/data | Supabase + Product API v1 |
| UX | Same IA: Home / Train / Plan / Progress / Profile |
| Offline | Queue outcome logs; sync when online (gym connectivity) |
| Store | iOS App Store + Google Play after API stability |

**Do not start native until:**

1. Web daily loop is stable in production  
2. Product API v1 is versioned and documented  
3. Core edge cases (injury, rest day, resume ramp) are covered by tests  

Optional intermediate: **installable PWA** from Phase 1 already covers many “app-like” needs on mobile browsers.

---

## 9. Intelligence productization (all phases)

| Capability | Product treatment |
|------------|-------------------|
| RL intensity | “Intensity model” insight: updates, too-hard rate, safety cap |
| GA evolution | Notify only when personal weights improve / retrain runs |
| Autoreg | Explicit copy: e.g. “Sets reduced — limited by sleep + soreness” |
| Injury | Always-visible chip on Home/Train/Plan |
| Plan decision | Persistent coaching strip until user acts |
| Model metrics | Advanced section under Progress (not Home noise) |

**Safety (non-negotiable):**

- Injury and rehab flows always show clinical disclaimer  
- Pain > 3/10 → stop guidance retained  
- RL never recommends above known too-hard cap for that fatigue state  

---

## 10. Quality & non-functional requirements

| Area | Target |
|------|--------|
| Performance | Home interactive &lt; 2s mid-tier mobile; plan generate &lt; 3s typical |
| Reliability | Personalization writes retry + user-visible error |
| Security | RLS on all user tables; no shared local JSON in production |
| Privacy | Account export/delete path planned |
| Accessibility | WCAG 2.1 AA intent; careful neon contrast |
| Analytics | Funnel: signup → onboarding → check-in → complete session → D7 return |
| CI | pytest on PR; Playwright critical path; lint typecheck web |

---

## 11. Success metrics

| Metric | Signals |
|--------|---------|
| Time-to-first-workout | Onboarding + IA quality |
| D1 session completion | Train UX quality |
| Check-in rate (active plan days) | Readiness UX friction |
| Too-hard rate trend ↓ | RL + autoreg effectiveness |
| 7-day adherence | Plan lifecycle quality |
| D7 / D30 return + streak | Habit / retention |

---

## 12. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Rewrite stalls product | Phase 0 core extract first; ship web vertical slices |
| Scope creep into native too early | Mobile gated on API v1 + web stability |
| Neon brand fails contrast | Tokens tested; never yellow long-form body text |
| Dual engines (Streamlit vs API) drift | Single `fitgenix_core`; UI only consumes core/API |
| Silent data loss | Remove bare excepts; add monitoring |
| Over-invest in ML polish before UX | Web daily loop before new model research |

---

## 13. Priority checklist (execution order)

### Architecture track (this plan)

1. **Extract `fitgenix_core`** + fix tests  
2. **Scaffold Next.js web app** repo layout (shared with UI track)  
3. **Minimal FastAPI** for home / session / plan / outcomes  
4. Wire auth + persistence; remove silent failures  
5. **Plan + Progress + Profile + PDF** endpoints  
6. **E2E + production cutover**  
7. **(Later) Product API v1 hardening**  
8. **(Later) Expo mobile app**  

### UI track ([`gemini_plan.md`](./gemini_plan.md))

1. **UI-0** — Tokens, Button, AppShell, auth layout (mocks OK)  
2. **UI-1** — Home + Train + ReadinessRing + outcomes (daily loop)  
3. **UI-2** — Plan, Progress, Profile screens  
4. **UI-3** — SubstituteModal + richer WorkoutCard  
5. **UI-4** — MuscleHeatmap  
6. **UI-5** — PWA polish, a11y, reduced motion  

Both tracks can run in parallel once `web/` exists and API contracts (or mocks) are agreed.

---

## 14. Decision log

| Decision | Choice | Notes |
|----------|--------|-------|
| Primary product surface now | **Web app (Next.js PWA)** | Replace Streamlit for users |
| Design system | **Neon Coach** (tokenized dark + neon) | Matches existing brand + research |
| Intelligence language | **Python (`fitgenix_core`)** | No TS rewrite of GA/RL |
| Data/auth | **Keep Supabase** | Extend schema, enforce RLS |
| API timing | **Internal API with web now; public Product API later** | Avoid blocking web on full API design |
| Mobile timing | **After Product API v1** | PWA bridges interim mobile need |
| Streamlit | **Transitional / optional** | Not long-term consumer UI |

---

## 15. Out of scope (this plan document)

- Pixel-perfect Figma file production (can follow)  
- Detailed SQL migration scripts (follow in implementation)  
- Exact hosting account setup  
- Marketing site / landing page (separate; can reuse Neon Coach tokens)  

---

## 16. Summary

FITGENIX will modernize as a **web-first product**:

1. **Now** — Next.js + TypeScript + Tailwind + design system + thin FastAPI + extracted Python core + Supabase  
2. **Later** — Versioned **Product API** ready for multiple clients  
3. **Then** — **Mobile app** (Expo/React Native) on that API  

The competitive edge stays in **adaptive, injury-aware intelligence**. The modernization edge is a **mobile-first coach UX** that makes that intelligence usable every day.

---

## Document history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-07-26 | Initial plan: web now, API later, mobile after API |
| 1.1 | 2026-07-26 | Dual-track: master architecture + `gemini_plan.md` UI companion |
