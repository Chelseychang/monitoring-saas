# Deployment Guide

## Architecture

- **Frontend**: Deployed on Vercel (static site)
- **Backend** (`server.js`): Runs locally with Lark webhook secrets

## Security Setup

✅ `.env` is in `.gitignore` - your `LARK_WEBHOOK_URL` and `LARK_BOT_SECRET` will NEVER be committed to git

## Deploy to Vercel

### 1. Install Vercel CLI (optional)
```bash
npm i -g vercel
```

### 2. Deploy
```bash
# Setup local environment
cp .env.template .env
# Edit .env and fill in your actual values

# Deploy to Vercel
vercel
```

Or use the Vercel dashboard:
1. Go to https://vercel.com/new
2. Import your git repository
3. Vercel will auto-detect Vite configuration

### 3. Expose Local Backend

Since your backend needs to stay local (has secrets), you need to expose it to the internet so the Vercel frontend can reach it.

**Option A: Use ngrok (recommended for testing)**
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 8787
```

This gives you a public URL like: `https://abc123.ngrok.io`

**Option B: Deploy backend separately (if you want production)**
- Deploy `server.js` to a secure backend service (Railway, Fly.io, etc.)
- Set `LARK_WEBHOOK_URL` and `LARK_BOT_SECRET` as environment variables there

### 4. Configure Vercel Environment Variable

In Vercel dashboard → Your Project → Settings → Environment Variables:

Add:
- **Key**: `VITE_PUSH_API_URL`
- **Value**: Your ngrok URL or production backend URL (e.g., `https://abc123.ngrok.io`)

### 5. Redeploy
After setting the environment variable, trigger a redeploy in Vercel.

## Local Development

```bash
# Install dependencies
npm install

# Start both frontend and backend
npm run dev:all

# Or separately:
npm run dev        # Frontend only (port 5173)
npm run dev:push   # Backend only (port 8787)
```

## Important Files

- `.env` - **LOCAL ONLY, NOT IN GIT** - Contains your Lark webhook secrets
- `.env.example` - Template for other developers
- `server.js` - Backend push server
- `vercel.json` - Vercel configuration
