# 🚀 Deploying Inkwell to Vercel

## Before you deploy — checklist
- [ ] Supabase project created and schema applied
- [ ] ANTHROPIC_API_KEY obtained from console.anthropic.com
- [ ] App runs locally without errors

## Step 1 — Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/inkwell.git
git push -u origin main

## Step 2 — Deploy on vercel.com
1. Go to vercel.com → Add New Project → Import your repo
2. Vercel auto-detects Next.js

## Step 3 — Add env vars in Vercel Dashboard
Settings → Environment Variables:
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  ANTHROPIC_API_KEY
  NEXT_PUBLIC_APP_URL  ← set to https://your-app.vercel.app

## Step 4 — Update Supabase redirect URLs
Supabase → Authentication → URL Configuration:
  Site URL:      https://your-app.vercel.app
  Redirect URLs: https://your-app.vercel.app/auth/callback

## Every future update
git add . && git commit -m "update" && git push
Vercel auto-deploys on every push ✦