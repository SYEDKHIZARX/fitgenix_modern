# Fitgenix Modern Deployment

This repository contains the modern Fitgenix application.

- `web/` — Next.js frontend application
- `api/` — FastAPI backend service
- `core/` — shared Python core engine
- `docs/` — architecture and setup docs

## What I have already done

- Verified `fitgenix_modern/web` build successfully
- Confirmed Vercel CLI is installed locally
- Confirmed Vercel CLI is not logged in, so the final deploy step requires your credentials

## Backend deployment (what needs to be done first)

### 1. Create the API env file

In `fitgenix_modern`, copy `.env.example` to `.env`:

```powershell
cd C:\Users\Lenovo\Desktop\fitgenix_modern
copy .env.example .env
```

Then edit `.env` and set:

```ini
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_KEY=your_anon_or_publishable_key
# SUPABASE_SERVICE_KEY=your_service_role_or_secret_key  # optional for server-side only
CORS_ORIGINS=https://your-vercel-app.vercel.app
```

### 2. Install backend dependencies

```powershell
cd C:\Users\Lenovo\Desktop\fitgenix_modern
python -m pip install -r requirements.txt
```

### 3. Run the backend locally to verify

```powershell
cd C:\Users\Lenovo\Desktop\fitgenix_modern
uvicorn api.main:app --reload --port 8000
```

Then open `http://127.0.0.1:8000/api/health` in your browser.

If that works, the backend is ready for production deployment.

## Recommended backend deployment: Railway

Railway is the best fit for a free, lightweight FastAPI backend with Vercel frontend.

### 1. Create a Railway project

- Sign in to https://railway.app
- Create a new project
- Choose "Deploy from GitHub" or "Start from scratch"
- Link the repository or upload the project files

### 2. Configure the service

For a Python FastAPI service, Railway should use `app` or `uvicorn` automatically.
If it asks for a start command, use:

```powershell
uvicorn api.main:app --host 0.0.0.0 --port $PORT
```

### 3. Add environment variables on Railway

Set the following vars in Railway's environment settings:

- `SUPABASE_URL=https://YOUR_PROJECT.supabase.co`
- `SUPABASE_KEY=your_anon_or_publishable_key`
- `SUPABASE_SERVICE_KEY=your_service_role_or_secret_key` (optional)
- `CORS_ORIGINS=https://web-smoky-psi-55.vercel.app`

### 4. Deploy the Railway service

Trigger a deploy in Railway.
After deployment, Railway will give you a backend URL like:

```
https://your-railway-service.up.railway.app
```

### 5. Point the frontend to the Railway backend

In `fitgenix_modern/web/.env.local`, set:

```ini
FITGENIX_API_URL=https://your-railway-service.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Then redeploy the frontend on Vercel.

## Frontend deployment to Vercel

The frontend root is `fitgenix_modern/web`.

### 1. Create frontend local env file

In `fitgenix_modern/web`, copy the example:

```powershell
cd C:\Users\Lenovo\Desktop\fitgenix_modern\web
copy .env.local.example .env.local
```

Then edit `.env.local` and set:

```ini
FITGENIX_API_URL=https://your-backend-url
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Install frontend dependencies

```powershell
cd C:\Users\Lenovo\Desktop\fitgenix_modern\web
npm install
```

### 3. Verify the build locally

```powershell
cd C:\Users\Lenovo\Desktop\fitgenix_modern\web
npm run build
```

If this succeeds, the frontend is ready for Vercel.

## Vercel deployment (requires your login)

### 1. Log in to Vercel

```powershell
cd C:\Users\Lenovo\Desktop\fitgenix_modern\web
vercel login
```

Follow the prompt and sign in with your preferred provider.

### 2. Deploy the frontend

```powershell
cd C:\Users\Lenovo\Desktop\fitgenix_modern\web
vercel --prod
```

Select or create a new project when prompted.

### 3. Set environment variables in Vercel

In the Vercel dashboard for your project, add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `FITGENIX_API_URL`

If you want, you can also set them from the CLI:

```powershell
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add FITGENIX_API_URL production
```

### 4. Re-deploy after env vars are set

If you set env vars after deployment, run:

```powershell
vercel --prod
```

## Backend deployment on Vercel

If you want the backend on Vercel as well, deploy the `fitgenix_modern` root and route `/api` to the FastAPI app.

1. In `fitgenix_modern`, ensure `vercel.json` exists with the Python build config.
2. Deploy from the backend root:

```powershell
cd C:\Users\Lenovo\Desktop\fitgenix_modern
vercel --prod
```

3. Add production backend env vars in Vercel:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_KEY` (optional)
- `CORS_ORIGINS=https://web-smoky-psi-55.vercel.app`

4. After backend deploys, set the frontend `FITGENIX_API_URL` to the backend URL and redeploy the frontend.

## Notes for baby-step execution

- Do backend first, then frontend.
- Use `.env` for the backend and `.env.local` for the frontend.
- Keep Supabase keys secret: only use `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the frontend.
- `SUPABASE_SERVICE_KEY` is optional and should only be used on the backend if needed.
