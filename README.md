<<<<<<< HEAD
# FITGENIX

Adaptive, injury-aware fitness coach — **GA + RL engine** in Python, **modern web app** in Next.js, plus a **legacy Streamlit** UI in the same repo.

## Start here

| Guide | Purpose |
|-------|---------|
| **[docs/USER_GUIDE.md](docs/USER_GUIDE.md)** | Launch new app, legacy app, git layout, how to improve |
| **[docs/SECURITY.md](docs/SECURITY.md)** | Keys, CORS, what never to commit |
| **[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)** | Cloud auth & tables |

## Quick start

### New app (recommended)

```powershell
# 1) API — project root
pip install -r requirements.txt
# copy .env.example → .env and fill Supabase URL + anon key (optional for guest mode)
uvicorn api.main:app --reload --port 8000

# 2) Web — other terminal
cd web
npm install
# copy .env.local.example → .env.local (anon key only in NEXT_PUBLIC_*)
npm run dev
```

- Web: http://localhost:3000  
- Login / guest: http://localhost:3000/login  
- API health: http://127.0.0.1:8000/api/health  

### Legacy app (Streamlit)

```powershell
# copy .streamlit/secrets.toml.example → secrets.toml (optional)
streamlit run streamlit_app.py
```

Still works; pure logic lives in `core/`. Prefer the web app for day-to-day use.

## Architecture

| Layer | Path | Role |
|-------|------|------|
| Domain engine | `core/` | Plan, injury, readiness, GA, RL (no UI) |
| API | `api/` | FastAPI for the web client |
| Web | `web/` | Next.js 15 + Tailwind · primary UI |
| Legacy UI | `streamlit_app.py` | Research / transitional Streamlit |
| Vite prototype | `web_vite_legacy/` | Early UI experiment |
| Tests | `tests/test_engine.py` | Engine tests |

**Overview presentation:** open [`docs/FITGENIX_OVERVIEW.html`](docs/FITGENIX_OVERVIEW.html) in a browser.

Plans: `docs/MODERNIZATION_PLAN.md` · UI notes: `docs/gemini_plan.md` · Architecture status: `docs/ARCHITECTURE_TRACK_STATUS.md`

## Security (short)

- Never commit `.env`, `web/.env.local`, or `.streamlit/secrets.toml`.
- Browser keys must be **anon / publishable** only — not `service_role` / `sb_secret_*`.
- See [docs/SECURITY.md](docs/SECURITY.md).

## Scripts

```powershell
pytest -v tests/test_engine.py
cd web; npm run build
```
