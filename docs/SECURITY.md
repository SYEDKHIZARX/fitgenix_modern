# FITGENIX security checklist

Last reviewed: 2026-07-26

## Critical rules

| Do | Don't |
|----|--------|
| Keep `.env`, `web/.env.local`, `.streamlit/secrets.toml` **out of git** | Commit API keys, JWT secrets, or service-role keys |
| Put **anon / publishable** keys in `NEXT_PUBLIC_*` | Put `service_role`, `sb_secret_*`, or secret keys in the browser |
| Scope every Supabase write by authenticated `user_id` | Trust client-sent user IDs without validating the JWT |
| Restrict CORS to known origins in production | Use `allow_origins=["*"]` with credentials |

## Key types (Supabase)

| Key | Where it may live | Purpose |
|-----|-------------------|---------|
| **Anon / publishable** | Browser (`NEXT_PUBLIC_*`), Streamlit secrets, API `SUPABASE_KEY` | Public client; RLS must protect tables |
| **Service role / secret (`sb_secret_*`)** | **Server only** (API `.env` as `SUPABASE_SERVICE_KEY`) | Bypasses RLS — never ship to the frontend |

If a secret key was ever placed in `web/.env.local` or committed, **rotate it** in the Supabase dashboard immediately.

## What the apps do today

### New stack (API + Next.js)

- **Auth:** Supabase Auth JWT; API validates with `supabase.auth.get_user(token)`.
- **Protected routes:** `/api/me/*` require `Authorization: Bearer …`.
- **Public engine routes:** readiness, generate-plan, substitutes, BMI, RL (no PII required; optional auth for persistence).
- **CORS:** localhost origins only by default; set `CORS_ORIGINS` for production.
- **Guest mode:** data stays in browser `localStorage` only.

### Legacy (Streamlit)

- Login via Supabase Auth when secrets/env are set.
- Offline fallback uses a fixed local demo user when Supabase is not configured.
- Secrets from `.streamlit/secrets.toml` or environment variables.

## Repo hygiene

- Root file is **`.gitignore`** (not `gitignore`).
- Ignored: `.env*`, `node_modules/`, `__pycache__/`, `.next/`, runtime JSON history.
- Tracked safely: `.env.example`, `web/.env.local.example`, `secrets.toml.example`.

## Before you push or deploy

1. `git status` — confirm no `.env` or `secrets.toml`.
2. Confirm `web/.env.local` uses **anon** key only.
3. Confirm API production uses HTTPS and tight `CORS_ORIGINS`.
4. In Supabase: enable RLS on all user tables; policies should match `auth.uid() = user_id` / `id`.
5. Rotate any key that may have leaked (chat logs, screenshots, old commits).

## Reporting

If you suspect a leaked key, revoke/rotate it in Supabase → Project Settings → API, then update local env files only.
