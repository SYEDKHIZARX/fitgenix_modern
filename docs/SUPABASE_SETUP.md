# Supabase setup for web + API

The web app and FastAPI use the **same Supabase project** as Streamlit.

## Environment

### API (project root)

Create `.env` or export:

```bash
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=eyJ...   # prefer anon / publishable key
# optional stronger server key (never put this in the browser):
# SUPABASE_SERVICE_KEY=eyJ...   # service_role or sb_secret_*
```

**Security:** `NEXT_PUBLIC_*` and Streamlit client use must use the **anon / publishable** key only.  
Service / secret keys (`service_role`, `sb_secret_*`) are server-only. See [SECURITY.md](./SECURITY.md).

Load before starting API (PowerShell example):

```powershell
$env:SUPABASE_URL="https://xxxx.supabase.co"
$env:SUPABASE_KEY="eyJ..."
uvicorn api.main:app --reload --port 8000
```

Or use a `.env` file and `python-dotenv` if you prefer.

### Web (`web/.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Restart `npm run dev` after changing env.

## Tables (already used by Streamlit)

| Table | Purpose |
|-------|---------|
| `profiles` | User profile, `q_table`, `rl_updates`, GA fields |
| `active_plans` | Active plan JSON + meta |
| `daily_checkins` | Readiness check-ins |
| `exercise_outcomes` | Done / skip / too hard |
| `workout_history` | Session history rows |

## Auth flow

1. User signs up / logs in on `/login` (Supabase Auth).
2. Web stores session; sends `Authorization: Bearer <access_token>` to API.
3. API validates token via `supabase.auth.get_user(jwt)`.
4. Authenticated calls persist plan, check-in, outcomes, history, personal Q-table.

## Guest mode

If Supabase env is missing, or user chooses **Continue as guest**, data stays in **localStorage** only.

## Verify

```bash
# API should report supabase: true when env is set
curl http://127.0.0.1:8000/api/health
```
