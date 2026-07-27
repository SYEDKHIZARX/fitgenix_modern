# Architecture track — status

**Owner:** Architecture / backend (this track)  
**UI track:** [`gemini_plan.md`](./gemini_plan.md)  
**Master plan:** [`MODERNIZATION_PLAN.md`](./MODERNIZATION_PLAN.md)

---

## Done (Phase 0 + API + web rebuild)

### Web app (`web/`) — product UI

Replaced the Vite demo with **Next.js 15 + TypeScript + Tailwind** (Neon Coach):

| Route | Status |
|-------|--------|
| `/onboarding` | 4-step wizard → generate plan |
| `/home` | Readiness ring, check-in, session card, decision banner |
| `/train` | Gym mode · Done/Skip/Too hard · swap · end session → RL |
| `/plan` | Week timeline · regenerate |
| `/progress` | History metrics |
| `/profile` | Body / training / injury settings |

- API client via Next rewrite `/backend/*` → FastAPI  
- Local persistence (localStorage) until Supabase JWT  
- `npm run build` succeeds  

---

## Done (Phase 0 + API scaffold)

### `core/` — pure intelligence package

| Path | Role |
|------|------|
| `core/ml/` | BMI, GA calorie model, pure RL update/recommend |
| `core/engine/` | Injury, selection, schedule, plan, ramp, lifecycle, substitutes |
| `core/models/` | TypedDict + Pydantic models for API |
| `core/services.py` | Adapters for readiness / plan / session JSON |
| `core/data/` | Re-exports root `data.py` catalog |

**Rules:** No Streamlit. No Supabase. Importable by tests, FastAPI, and Streamlit.

### Streamlit

- Imports pure functions from `core`
- Keeps auth, Supabase I/O, HTML rendering, `get_exercise_progression` (DB)
- Thin adapters: `get_rl_recommendation`, `get_plan_data` (injects progression)

### Tests

```bash
pytest -v tests/test_engine.py
```

**120 passed** (no Streamlit source-slicing).

### Internal API scaffold

```bash
uvicorn api.main:app --reload --port 8000
```

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/health` | Liveness |
| POST | `/api/readiness` | Check-in → band/score |
| POST | `/api/generate-plan` | Full structured plan |
| POST | `/api/session/today` | Day + optional autoreg |
| POST | `/api/exercises/substitutes` | Swap candidates |
| GET | `/api/bmi` | BMI helper |
| GET | `/api/rl/recommend` | Base Q-table recommend |
| POST | `/api/rl/feedback` | Pure Q-update (no persist yet) |
| POST | `/api/plan/decide` | Lifecycle decision |

**Not yet:** Supabase JWT auth, persistence of plans/outcomes, PDF export endpoint.

---

## Done (Phase A — auth + cloud persistence)

- `api/db.py` — JWT validation via Supabase  
- `api/persist.py` — profiles, active_plans, checkins, outcomes, history, Q-table  
- `GET /api/me` bootstrap · outcome/history/profile save routes  
- Web `/login` · `@supabase/supabase-js` · guest mode  
- Bearer token on API calls · cloud sync badges  
- Docs: `docs/SUPABASE_SETUP.md`, `.env.example`, `web/.env.local.example`  

Without env keys, guest/local mode still works.

## Next (architecture)

1. Add Supabase keys to env and verify multi-device sync end-to-end  
2. PDF export endpoint  
3. Progress charts + streaks/badges UI  
4. Rehab protocol screens  
5. GA personal retrain in web flow  
6. Optionally move `data.py` fully under `core/data/`

---

## Coordination with UI track

- UI can call `http://localhost:8000/api/*` or keep mocks until auth lands  
- Contracts in `api/main.py` request models — prefer matching `gemini_plan.md` §7  
- Do not duplicate engine logic in TypeScript  

---

## Note on other-agent files

Flat stubs `core/data.py`, `core/engine.py`, `core/ml.py`, `core/models.py` conflicted with packages and were renamed to `*.agent_bak`. Useful Pydantic models were merged into `core/models/`. Incomplete reimplementations of GA/RL were **not** kept — production math lives in `core/ml` + `core/engine` extracted from Streamlit.
