# FITGENIX user guide

How to run the **legacy** app and the **new** app, how the repo is organized, and how to improve the product safely.

---

## 1. What is in this project?

| Piece | Path | Role |
|-------|------|------|
| **Domain engine** | `core/` | Plans, injury, readiness, GA, RL (shared by both UIs) |
| **New API** | `api/` | FastAPI backend for the web app |
| **New web app** | `web/` | Next.js 15 + Tailwind (primary product UI) |
| **Legacy UI** | `streamlit_app.py` | Streamlit research / assignment UI |
| **Vite prototype** | `web_vite_legacy/` | Early UI experiment (optional) |
| **Tests** | `tests/` | Engine unit tests |
| **Docs** | `docs/` | Architecture, Supabase, security, this guide |

Both the **legacy Streamlit app** and the **new Next.js + API stack** live in the **same git repository**. Prefer the new stack for day-to-day use; keep Streamlit for demos, assignments, and offline research.

```
Khizer-App/
├── core/                 # shared fitness engine
├── api/                  # new backend
├── web/                  # new frontend (Next.js)
├── web_vite_legacy/      # optional old Vite UI
├── streamlit_app.py      # legacy app
├── tests/
├── docs/
├── requirements.txt
├── .env.example
└── README.md
```

---

## 2. Prerequisites

- **Python 3.11+** recommended  
- **Node.js 18+** and npm (for `web/`)  
- **Git**  
- Optional: a free [Supabase](https://supabase.com) project for cloud login and saved plans  

```powershell
# from project root
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

```powershell
cd web
npm install
cd ..
```

---

## 3. Secrets (read this once)

1. Copy examples — **never commit** real keys:

```powershell
copy .env.example .env
copy web\.env.local.example web\.env.local
copy .streamlit\secrets.toml.example .streamlit\secrets.toml
```

2. Fill values from Supabase → **Project Settings → API**:

| Variable | App | Which key |
|----------|-----|-----------|
| `SUPABASE_URL` | API / Streamlit | Project URL |
| `SUPABASE_KEY` | API / Streamlit | **Anon / publishable** (or service only on trusted server) |
| `NEXT_PUBLIC_SUPABASE_URL` | Web | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web | **Anon / publishable only** |

**Never** put `service_role` or `sb_secret_*` keys into `NEXT_PUBLIC_*` variables. Those are exposed to every visitor’s browser.

Details: [SECURITY.md](./SECURITY.md) · [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

---

## 4. Launch the **new** app (recommended)

You need **two terminals** from the project root.

### Terminal A — API

```powershell
# activate venv if you use one
uvicorn api.main:app --reload --port 8000
```

- Health: http://127.0.0.1:8000/api/health  
- Docs: http://127.0.0.1:8000/docs  

### Terminal B — Web

```powershell
cd web
npm run dev
```

- App: http://localhost:3000  
- Login: http://localhost:3000/login  
- Or **Continue as guest** (localStorage only; no cloud)

### Typical flow

1. **Onboarding** — goal, equipment, split, injury  
2. **Home** — readiness check-in + today’s session  
3. **Train** — Done / Skip / Too hard → end session (RL feedback)  
4. **Plan** — full week · regenerate  
5. **Progress / Profile** — history and settings  

### Production-style web build

```powershell
cd web
npm run build
npm start
```

Still point `FITGENIX_API_URL` (or the Next rewrite) at a running API.

---

## 5. Launch the **legacy** app (Streamlit)

```powershell
# from project root, venv active, secrets or .env set
streamlit run streamlit_app.py
```

- Usually opens http://localhost:8501  
- Without Supabase secrets, it falls back to a local offline user  

Streamlit still uses the same `core/` engine logic where adapted, and the same Supabase tables when configured.

---

## 6. Optional: Vite legacy UI

Early prototype only. Prefer `web/` (Next.js).

```powershell
cd web_vite_legacy
npm install
npm run dev
```

---

## 7. Tests

```powershell
# from project root
pytest -v tests/test_engine.py
```

Aim to keep tests green before large engine changes.

---

## 8. Git: legacy + new in one repo

Both stacks are meant to be versioned together.

### First-time safety check

```powershell
git status
# Must NOT list: .env, web/.env.local, .streamlit/secrets.toml, node_modules
```

### What belongs in git

| Include | Exclude |
|---------|---------|
| `core/`, `api/`, `web/src`, `streamlit_app.py` | `.env`, `web/.env.local` |
| `web/package.json`, lockfiles | `node_modules/`, `web/.next/` |
| `docs/`, `tests/`, `requirements.txt` | `__pycache__/`, `.venv/` |
| `.env.example`, `*.example` secrets templates | `user_history.json`, `injury_profile.json` |
| Model artifacts (`*.pkl`) if needed to run | `*.agent_bak` |

### Suggested commit workflow

```powershell
git add .gitignore README.md requirements.txt
git add core api web streamlit_app.py tests docs
git add web_vite_legacy -- ':!web_vite_legacy/node_modules'
git status   # review carefully
git commit -m "Add modern web/API stack alongside legacy Streamlit"
```

Remote (example): `origin` → your GitHub Fitgenix repo.

---

## 9. How to improve the project

Work in small vertical slices. Prefer changes that help **both** UIs by editing `core/` when the logic is shared.

### A. Safer product (high priority)

1. **Rotate any leaked secret keys** (see [SECURITY.md](./SECURITY.md)).  
2. Confirm Supabase **RLS** on `profiles`, `active_plans`, `daily_checkins`, `exercise_outcomes`, `workout_history`.  
3. Use **anon** key in the browser; optional **service** key only in API env.  
4. Set production `CORS_ORIGINS` to your real web domain only.  
5. Add rate limiting / auth on heavy public endpoints if you deploy publicly.

### B. Product features

| Area | Ideas |
|------|--------|
| Train | Rest timers, set logging, RPE, exercise media |
| Plan | Multi-week blocks, deload weeks, export PDF/ICS |
| Progress | Charts from history, streak recovery UX |
| Injury | More body parts, physio-friendly progressions |
| Social | Optional coach share link (auth required) |

### C. Engineering quality

1. Keep **engine pure** in `core/` — no Streamlit/Next imports there.  
2. Add a test in `tests/test_engine.py` for every new rule.  
3. Type API bodies with Pydantic; keep `web/src/lib/types.ts` in sync.  
4. Prefer persistence in Supabase over localStorage for signed-in users.  
5. Document new env vars in `.env.example` and this guide.

### D. Suggested improvement order

1. Security & RLS verification  
2. Cloud save of profile/plan for web login users (already partially wired via `/api/me`)  
3. Offline/guest merge when user later signs up  
4. Deploy API (e.g. Railway/Render) + web (Vercel) with env vars  
5. Richer progress analytics  
6. Mobile polish (PWA / responsive train screen)

### E. Where to edit what

| You want to change… | Edit |
|---------------------|------|
| Plan generation, injury filters, substitutes | `core/engine/` |
| GA / RL / BMI models | `core/ml/` |
| HTTP API shape | `api/main.py`, `api/persist.py` |
| Screens, navigation, styling | `web/src/` |
| Streamlit-only UI | `streamlit_app.py` |
| Dependencies | `requirements.txt`, `web/package.json` |

---

## 10. Troubleshooting

| Symptom | What to try |
|---------|-------------|
| `npm run dev` ENOENT package.json | Run from `web/` (`cd web`) |
| API `supabase: false` on `/api/health` | Fill root `.env`, restart uvicorn |
| Web login fails | Check `web/.env.local` anon key; enable Email auth in Supabase |
| CORS errors in browser | Add origin to `CORS_ORIGINS`; restart API |
| Plan empty / model error | Ensure `ga_model.pkl`, `q_table.pkl`, `scaler.pkl` exist at repo root |
| Streamlit no login | Create `.streamlit/secrets.toml` or set env vars |
| Port in use | Change ports: `--port 8001` or `next dev -p 3001` |

---

## 11. Quick reference

```powershell
# NEW APP
uvicorn api.main:app --reload --port 8000
cd web; npm run dev
# → http://localhost:3000

# LEGACY APP
streamlit run streamlit_app.py
# → http://localhost:8501

# TESTS
pytest -v tests/test_engine.py
```

More: [README.md](../README.md) · [SECURITY.md](./SECURITY.md) · [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) · [MODERNIZATION_PLAN.md](./MODERNIZATION_PLAN.md)
