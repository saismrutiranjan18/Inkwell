# ✦ Inkwell — Write Your Book

A full-stack book writing app. Write your story, design a cover, and export as a print-ready PDF.

---

## Tech Stack

| Layer      | Tech                          |
|------------|-------------------------------|
| Framework  | Next.js 14 (App Router)       |
| Editor     | TipTap                        |
| AI         | Claude API (Anthropic)        |
| Database   | Supabase (Postgres + Auth)    |
| Styling    | Tailwind CSS                  |
| Export     | Browser Print API (PDF)       |
| Deploy     | Vercel                        |

---

## Bug Fixes (Latest)

### Auth Fixes
- **Login / Signup** — Form submission aur error handling fix kiya. User-friendly Hindi/English error messages.
- **Google OAuth** — `queryParams` (`access_type: 'offline', prompt: 'consent'`) add kiya for proper token refresh.
- **Auth Callback** — `app/auth/callback/route.ts` ko direct `createServerClient` use karne ke liye fix kiya (pehle `createClient` helper import karne pe cookies properly set nahi ho rahi thi).
- **Signout** — `NEXT_PUBLIC_APP_URL` env var pe depend karne ki jagah `request.url` se `origin` extract karta hai.
- **Middleware** — `redirectTo` query param support add kiya taaki login ke baad correct page pe redirect ho.

### Editor Fixes
- **Preview Tab** — `BookPreview` component actually render ho raha hai (pehle empty `<div>` tha).
- **New Book Creation** — State set pehle hota hai, phir `router.replace()` — pehle race condition tha.
- **Import Paths** — `@/hooks/useAutoSave` → `@/app/hooks/useAutoSave` (sab `app/` ke andar hai).
- **Component Imports** — `@/components/` → `@/app/components/` throughout.

### Cover Designer Fix
- **Active Theme Detection** — `book.cover_theme?.name` ke bajaye `book.cover_theme?.bg` se compare karta hai (JSONB se wapas aata hai toh `name` field missing ho sakta tha).

### Auto-Save Fix
- **Duplicate Saves** — `savingRef` flag add kiya concurrent save requests rokne ke liye.
- **forceSave** — Ab `async/await` properly handle karta hai.

### Dashboard Fix
- **Error Handling** — Books fetch error gracefully handle hota hai.
- **Missing author_name** — Fallback `'Unknown Author'` add kiya.

---

## Project Structure

```
inkwell/
├── app/
│   ├── page.tsx                    ← Landing page
│   ├── layout.tsx                  ← Root layout
│   ├── (auth)/
│   │   ├── login/page.tsx          ← Login (fixed)
│   │   └── signup/page.tsx         ← Sign up (fixed)
│   ├── dashboard/page.tsx          ← Books list (fixed)
│   ├── editor/[id]/page.tsx        ← Write + AI (fixed)
│   ├── cover/[id]/page.tsx         ← Cover designer (fixed)
│   ├── components/                 ← ⚠️ app/components/ mein hain (NOT /components/)
│   │   ├── Editor.tsx
│   │   ├── ChapterList.tsx         (fixed)
│   │   ├── CoverDesigner.tsx       (fixed)
│   │   ├── BookPreview.tsx
│   │   ├── AIToolbar.tsx           (fixed)
│   │   ├── ErrorBoundary.tsx
│   │   └── Toast.tsx
│   ├── hooks/                      ← ⚠️ app/hooks/ mein hain
│   │   └── useAutoSave.ts          (fixed)
│   └── api/
│       ├── ai/format/route.ts
│       ├── ai/grammar/route.ts
│       ├── ai/title/route.ts
│       └── ai/continue/route.ts
├── lib/
│   ├── supabase-client.ts
│   ├── supabase-server.ts
│   ├── claude.ts
│   ├── pdf.ts
│   └── utils.ts
├── types/index.ts
├── middleware.ts                   ← (fixed)
└── supabase-schema.sql
```

> **Import Path Note**: Components `app/components/` mein hain. Import karo `@/app/components/ComponentName` se, NOT `@/components/ComponentName`.

---

## Setup — Step by Step

### 1. Supabase Project Create Karein

1. [supabase.com](https://supabase.com) pe jaayein → **New project**
2. Settings → API se **Project URL** aur **anon key** copy karein
3. **SQL Editor** mein `supabase-schema.sql` ka poora content paste karke **Run** karein
4. **Authentication → Providers** mein **Google** enable karein (optional)

#### Google OAuth Setup (Supabase mein)
1. Supabase Dashboard → **Authentication → Providers → Google**
2. Google Cloud Console se **Client ID** aur **Client Secret** enter karein
3. Google Cloud Console mein **Authorized redirect URIs** add karein:
   - Local: `https://<your-project>.supabase.co/auth/v1/callback`
   - Production: Same (Supabase handle karta hai)
4. Supabase → **Authentication → URL Configuration** mein:
   - **Site URL**: `http://localhost:3000` (local) ya `https://your-app.vercel.app`
   - **Redirect URLs**: `http://localhost:3000/auth/callback` add karein

### 2. Anthropic API Key Lein

1. [console.anthropic.com](https://console.anthropic.com) jaayein
2. API key create karein

### 3. Environment Variables Setup

```bash
cp .env.local.example .env.local
```

`.env.local` mein fill karein:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-your-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Install aur Run

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) kholo

---

## Common Issues & Solutions

### Login kaam nahi kar raha?
- Supabase mein **Authentication → URL Configuration** check karein
- `Site URL` aur `Redirect URLs` mein `http://localhost:3000` aur `http://localhost:3000/auth/callback` hona chahiye

### Google OAuth nahi chal raha?
- Google Cloud Console mein **OAuth 2.0 Client ID** create kiya hua hona chahiye
- **Authorized JavaScript origins**: `http://localhost:3000`
- **Authorized redirect URIs**: `https://<project-ref>.supabase.co/auth/v1/callback`

### Email confirmation nahi aa raha?
- Supabase Dashboard → **Authentication → Email Templates** check karein
- Spam folder zaroor dekhen
- Development mein: Supabase → **Authentication → Users** mein manually confirm kar sakte hain

### AI features kaam nahi kar rahe?
- `.env.local` mein `ANTHROPIC_API_KEY` sahi se set hai?
- `npm run dev` restart karein env vars change ke baad

### PDF export popup block ho raha hai?
- Browser popup blocker disable karein ya allow karein is site ke liye

---

## Deploy to Vercel

### Step 1 — GitHub pe push karein
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/inkwell.git
git push -u origin main
```

### Step 2 — Vercel pe deploy
1. [vercel.com](https://vercel.com) → **Add New Project** → Repo import karein
2. Next.js auto-detect ho jaata hai

### Step 3 — Environment Variables add karein
Vercel Dashboard → Settings → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
NEXT_PUBLIC_APP_URL  ← https://your-app.vercel.app
```

### Step 4 — Supabase Redirect URLs update karein
Authentication → URL Configuration:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

### Future Updates
```bash
git add . && git commit -m "update" && git push
```
Vercel har push pe auto-deploy karta hai ✦

---

## Features

- **✍ Rich Text Editor** — TipTap powered editor with formatting toolbar
- **📚 Chapter Management** — Add, delete, reorder chapters with auto-save
- **🤖 AI Writing Assistant** — Format, fix grammar, suggest titles, continue writing
- **🎨 Cover Designer** — 6 themes, custom ornaments, live preview
- **📖 Book Preview** — Print-ready layout with TOC and drop caps
- **⬇ PDF Export** — Browser print dialog se save as PDF
- **🔐 Auth** — Email/password + Google OAuth via Supabase