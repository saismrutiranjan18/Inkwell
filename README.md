# ✦ Inkwell — Write Your Book

A full-stack book-writing application. Write chapters in a rich-text editor, polish them with Claude-powered AI tools, design a cover, preview the typeset result, and export a print-ready PDF — all from the browser.

**Live concept:** Google Docs + a cover designer + an AI co-author, purpose-built for long-form fiction/non-fiction instead of generic documents.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [Core Features](#core-features)
- [AI Integration](#ai-integration)
- [Authentication Flow](#authentication-flow)
- [Auto-Save System](#auto-save-system)
- [PDF Export](#pdf-export)
- [Setup Guide](#setup-guide)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Recent Bug Fixes](#recent-bug-fixes)
- [Known Limitations / Ideas for Improvement](#known-limitations--ideas-for-improvement)

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | **Next.js 14** (App Router) | React Server/Client Components, file-based routing |
| Language | **TypeScript** | Strict mode enabled |
| Rich-text Editor | **TipTap 2** | ProseMirror-based; StarterKit + Placeholder, CharacterCount, Typography, Underline, TextAlign extensions |
| AI | **Claude API** via `@anthropic-ai/sdk` | Server-side only, called from Next.js Route Handlers |
| Database & Auth | **Supabase** (Postgres + Auth + Storage) | Row Level Security enforced on every table |
| Styling | **Tailwind CSS** | Custom `ink` / `gold` color palette, custom fonts |
| PDF Export | **Browser Print API** | Opens a new window with print-styled HTML, triggers `window.print()` |
| Deployment | **Vercel** | Auto-detects Next.js, region pinned to `bom1` (Mumbai) |
| State | React local state + one custom hook (`useAutoSave`) | No global state library is actually wired up despite `zustand` being a dependency |

> **Note:** `jspdf` and `html2canvas` are listed in `package.json` but the actual export path (`lib/pdf.ts`) uses the browser's native print dialog instead — those two packages currently appear unused in the codebase.

---

## Architecture Overview

```
┌─────────────────┐      ┌──────────────────────┐      ┌─────────────────┐
│   Browser        │◄────►│   Next.js App Router   │◄────►│   Supabase      │
│  (React Client    │      │   - Pages (RSC/CSR)    │      │  - Postgres     │
│   Components)     │      │   - Middleware (auth)  │      │  - Auth         │
│                   │      │   - API Routes (/api)  │      │  - Storage      │
└─────────────────┘      └──────────┬───────────┘      └─────────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  Anthropic API    │
                            │  (Claude Sonnet)   │
                            └─────────────────┘
```

- **Client components** (`'use client'`) own almost all interactivity — login/signup forms, the editor, chapter list, cover designer, dashboard.
- **`middleware.ts`** runs on every request, refreshes the Supabase session, and redirects unauthenticated users away from protected routes (`/dashboard`, `/editor`, `/cover`).
- **API routes** under `app/api/ai/*` are thin wrappers: validate input → call `lib/claude.ts` → return JSON. The Anthropic API key never reaches the browser.
- **Supabase Row Level Security** is the actual authorization layer — every table policy checks `auth.uid()`, so even if a client-side bug leaked another user's ID, the database would reject the query.

---

## Project Structure

```
inkwell/
├── app/
│   ├── page.tsx                    ← Landing page
│   ├── layout.tsx                  ← Root layout (wraps app in ErrorBoundary + ToastProvider)
│   ├── globals.css                 ← Tailwind layers + TipTap prose styling
│   ├── not-found.tsx                ← Custom 404
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx          ← Email/password + Google OAuth login
│   │   └── signup/page.tsx         ← Account creation + email confirmation flow
│   │
│   ├── auth/
│   │   ├── callback/route.ts       ← Exchanges OAuth/magic-link code for a session
│   │   └── signout/route.ts        ← Server-side sign-out endpoint
│   │
│   ├── dashboard/page.tsx          ← Book library: stats, filters, create/delete books
│   ├── editor/[id]/page.tsx        ← Main writing surface: chapters + editor + AI toolbar
│   ├── cover/[id]/page.tsx         ← Cover designer + book preview + PDF export trigger
│   │
│   ├── components/                 ← ⚠️ Lives under app/, NOT a top-level /components/
│   │   ├── Editor.tsx              ← TipTap wrapper + custom toolbar
│   │   ├── ChapterList.tsx         ← Sidebar: add/delete/reorder chapters
│   │   ├── CoverDesigner.tsx       ← Theme, font, ornament, and image controls
│   │   ├── BookPreview.tsx         ← Paginated, typeset preview (cover/TOC/chapters)
│   │   ├── AIToolbar.tsx           ← Calls /api/ai/* endpoints, shows results in a modal
│   │   ├── ErrorBoundary.tsx       ← App-wide React error boundary + loading/not-found UI
│   │   └── Toast.tsx               ← Toast notification context/provider
│   │
│   ├── hooks/
│   │   └── useAutoSave.ts          ← Debounced chapter auto-save with duplicate-save guard
│   │
│   └── api/ai/
│       ├── format/route.ts         ← POST → formatChapter()
│       ├── grammar/route.ts        ← POST → fixGrammar()
│       ├── title/route.ts          ← POST → suggestTitles()
│       └── continue/route.ts       ← POST → continueWriting()
│
├── lib/
│   ├── supabase-client.ts          ← Browser Supabase client (singleton)
│   ├── supabase-server.ts          ← Server Supabase client (cookie-based)
│   ├── claude.ts                   ← All Anthropic API calls live here
│   ├── pdf.ts                      ← Builds print-ready HTML, opens print dialog
│   └── utils.ts                    ← cn(), wordCount(), stripHtml(), formatDate(), etc.
│
├── types/
│   └── index.ts                    ← Book, Chapter, CoverTheme types + theme/ornament constants
│
├── middleware.ts                    ← Route protection + session refresh
├── supabase-schema.sql              ← Full DB schema, triggers, RLS policies
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
├── .env.local.example
├── DEPLOY.md
└── README.md
```

> **Import path gotcha:** Components and hooks live inside `app/components/` and `app/hooks/`, not at the project root. Always import as `@/app/components/Editor`, not `@/components/Editor`.

---

## Data Model

Three tables, all under Supabase RLS (`supabase-schema.sql`):

### `users`
Mirrors `auth.users`. Auto-populated by a trigger (`handle_new_user`) on signup, pulling `full_name` / `avatar_url` from OAuth or signup metadata.

### `books`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → `users.id`, cascades on delete |
| `title`, `author_name`, `subtitle`, `description` | text | Core metadata |
| `cover_theme` | jsonb | `{ name, bg, text, accent }` — see `COVER_THEMES` in `types/index.ts` |
| `cover_ornament` | text | One of 16 emoji/symbol options |
| `cover_subtitle` | text | Subtitle shown on the cover (separate from `subtitle`) |
| `cover_font` | text | Google Font name (client-loaded, not in schema migration but used in `types/index.ts`) |
| `cover_image_url` | text | Supabase Storage public URL for a cover background image |
| `cover_image_opacity` | int | 10–90, controls background image overlay opacity |
| `status` | text | `'draft' \| 'published'` |
| `total_words` | int | **Auto-synced** by a trigger whenever any chapter's `word_count` changes |

### `chapters`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `book_id` | uuid | FK → `books.id`, cascades on delete |
| `title` | text | Defaults to `"Chapter 1"` |
| `content` | text | TipTap **HTML** (despite the SQL comment saying "TipTap JSON") |
| `content_text` | text | Plain text, stripped of HTML — used for AI calls and word counts |
| `order_index` | int | Determines chapter ordering |
| `word_count` | int | Recalculated on every save |

**Triggers worth knowing about:**
- `books_updated_at` / `chapters_updated_at` — auto-bump `updated_at` on any update.
- `sync_words_on_chapter_change` — after any insert/update of `chapters.word_count`, recomputes `books.total_words` as the sum across all chapters for that book. This is why the dashboard's word counts and progress bars stay accurate without any client-side aggregation logic.

**RLS policies** are blanket "owner can do everything" policies:
- `books_owner_all`: `auth.uid() = user_id`
- `chapters_owner_all`: ownership checked via a subquery against `books`
- `users_own_profile`: `auth.uid() = id`

This means even a compromised or buggy client can't read or write another user's data — the database itself enforces it.

> ⚠️ **Schema note:** `cover_font` is referenced throughout the app code (`types/index.ts`, `CoverDesigner.tsx`, `BookPreview.tsx` via `book.cover_font`) but is **not** present in the `create table books` statement in `supabase-schema.sql`. If you run the schema as-is, you'll need to add this column manually:
> ```sql
> alter table public.books add column if not exists cover_font text;
> ```

---

## Core Features

### ✍ Rich Text Editor (`Editor.tsx`)
- Built on **TipTap** with: Bold/Italic/Underline, H1/H2, blockquotes, horizontal-rule scene breaks (rendered as `* * *`), text alignment, undo/redo, and a live word counter (via `CharacterCount`).
- Content syncs from the database into the editor only when external state changes (chapter switch), avoiding cursor-jump bugs from re-rendering on every keystroke.

### 📚 Chapter Management (`ChapterList.tsx`)
- Add, delete (with confirmation, blocked if it's the last chapter), and reorder (up/down) chapters.
- Reordering swaps `order_index` via two parallel Supabase updates.

### 🤖 AI Writing Assistant (`AIToolbar.tsx` + `app/api/ai/*` + `lib/claude.ts`)
Four actions, each calling Claude with a dedicated system prompt (see [AI Integration](#ai-integration) below):
1. **Format Chapter** — cleans paragraph breaks, applies curly quotes, fixes typos, inserts scene breaks.
2. **Fix Grammar** — conservative copyedit; preserves voice and style.
3. **Suggest Title** — five evocative chapter title options, presented as clickable buttons.
4. **Continue Writing** — generates 2–3 paragraphs continuing the current chapter's tone and pace.

Results appear in a modal; the user can **Apply to Chapter** (for format/grammar/continue) or click a suggestion (for titles) before it touches the editor — nothing is auto-applied.

### 🎨 Cover Designer (`CoverDesigner.tsx`)
- 6 preset color themes (`dark-gold`, `midnight`, `crimson`, `forest`, `parchment`, `violet`).
- 16 Google Fonts across serif/sans-serif/display groups, lazy-loaded into `<head>` only when previewed or selected.
- 16 ornament glyphs.
- Background image upload to Supabase Storage bucket `cover-images` (5 MB limit, PNG/JPG/WEBP), with an opacity slider (10–90%).
- All changes auto-save to the `books` table on every field change (no explicit save button).

### 📖 Book Preview (`BookPreview.tsx`)
- Renders a cover page, an auto-generated table of contents (only for chapters with non-empty `content_text`), and one page per chapter.
- Approximates pagination with a flat `index * 14 + 1` page-number heuristic (not a real word-count-based pagination engine).
- First paragraph of each chapter gets a drop-cap via the `.book-drop-cap` CSS class.

### ⬇ PDF Export (`lib/pdf.ts`)
- Generates a self-contained HTML document (inline `<style>`, Google Fonts link) mirroring the in-app preview, opens it in a new window, and calls `window.print()` so the user can "Save as PDF" via their browser's print dialog.
- Requires popups to be allowed for the site.

### 🔐 Auth (Supabase)
- Email/password signup with 8-character minimum password, email confirmation flow.
- Google OAuth with `access_type: 'offline'` + `prompt: 'consent'` for refresh-token issuance.
- Server-side cookie-based session handling via `@supabase/ssr`.

---

## AI Integration

All Claude calls are centralized in **`lib/claude.ts`** and run **server-side only** — the API key is never exposed to the client. Each API route (`app/api/ai/*/route.ts`) follows the same shape:

```ts
POST /api/ai/format   { text: string } → { result: string }
POST /api/ai/grammar  { text: string } → { result: string }
POST /api/ai/title    { text: string } → { titles: string[] }
POST /api/ai/continue { text: string } → { result: string }
```

Current model string in code: `claude-sonnet-4-20250514`.

> 📌 **Model name check:** this is a dated snapshot string. If you hit a "model not found" error, check [console.anthropic.com](https://console.anthropic.com) or the [Anthropic API docs](https://docs.claude.com) for the current list of available model strings and update `MODEL` in `lib/claude.ts` accordingly. Model availability and naming change over time and aren't something to assume from memory.

**Design choices worth noting:**
- `suggestTitles()` asks Claude to return a raw JSON array and has a regex-based fallback parser in case the model wraps the response in markdown or adds stray formatting — a defensive pattern worth keeping if you swap models.
- Every system prompt explicitly says "no commentary, no preamble, no markdown fences" — necessary because these results get inserted directly into the editor or shown as plain suggestions.
- `chapterText` sent to the AI is always the **stripped plain text** (`stripHtml()`), not raw TipTap HTML — keeps token usage down and avoids confusing the model with markup.

---

## Authentication Flow

1. **Signup/Login** (`app/(auth)/signup`, `app/(auth)/login`) — client components using `supabase.auth.signUp` / `signInWithPassword` / `signInWithOAuth('google')`.
2. **OAuth callback** (`app/auth/callback/route.ts`) — exchanges the `code` query param for a session via `exchangeCodeForSession`, then redirects to `next` (defaults to `/dashboard`) or back to `/login?error=auth_callback_error` on failure.
3. **Middleware** (`middleware.ts`) — runs on nearly every request:
   - Refreshes the Supabase session (critical: nothing should run between `createServerClient` and `getUser()`).
   - Redirects unauthenticated users hitting `/dashboard`, `/editor`, or `/cover` to `/login?redirectTo=<original-path>`.
   - Redirects already-authenticated users away from `/login` and `/signup`, honoring `redirectTo` if present.
4. **Sign out** (`app/auth/signout/route.ts`) — server route that calls `supabase.auth.signOut()` and redirects to `/login`. Note the dashboard's sign-out button currently calls `supabase.auth.signOut()` directly client-side rather than hitting this route — both work, but it's worth knowing two sign-out paths exist.

---

## Auto-Save System

`app/hooks/useAutoSave.ts` debounces writes to the `chapters` table:

- **1.5 second debounce** after the last keystroke in the title or editor content.
- **`savingRef`** flag prevents overlapping concurrent save requests.
- **`lastSavedRef`** caches a `title::content` key so identical content isn't re-saved.
- **`forceSave()`** is exposed and called before switching chapters, switching tabs (Write ↔ Preview), or navigating to the cover page — ensuring no edits are lost.
- On save, it also recomputes `word_count` via `stripHtml()` + `wordCount()`, which in turn fires the `sync_words_on_chapter_change` Postgres trigger to keep `books.total_words` current.

Status flows through `idle → saving → saved → idle` (or `error`), surfaced in the `AIToolbar`'s save-status pill.

---

## Setup Guide

### 1. Clone and install

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. **Settings → API**: copy the **Project URL** and **anon public key**.
3. **SQL Editor**: paste the entire contents of `supabase-schema.sql` and run it.
4. Add the missing `cover_font` column (see [Data Model](#data-model) note above):
   ```sql
   alter table public.books add column if not exists cover_font text;
   ```
5. **Storage**: create a public bucket named `cover-images` (used by the cover image upload feature — not created by the SQL schema).
6. *(Optional)* **Authentication → Providers → Google**: enable Google OAuth, supplying the Client ID/Secret from Google Cloud Console.
   - Authorized redirect URI (Google Cloud Console): `https://<your-project-ref>.supabase.co/auth/v1/callback`
7. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (update to your production URL later)
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 3. Get an Anthropic API key

Create one at [console.anthropic.com](https://console.anthropic.com) → API Keys.

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Used by | Exposed to browser? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase-client.ts`, `lib/supabase-server.ts`, `middleware.ts`, auth routes | ✅ Yes (`NEXT_PUBLIC_` prefix) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as above | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Listed in `.env.local.example` / deploy docs | ❌ No — **not currently referenced anywhere in the app code.** Reserved for future server-side admin operations that need to bypass RLS. Keep it secret regardless. |
| `ANTHROPIC_API_KEY` | `lib/claude.ts` (server-only) | ❌ No |
| `NEXT_PUBLIC_APP_URL` | Listed in env files/deploy docs | ⚠️ Not actually read in the current code — OAuth redirects use `window.location.origin` (client) and `request.url`'s origin (server) instead, which is more robust across preview/staging URLs. Safe to keep set for documentation purposes, but it isn't a hard dependency. |

---

## Deployment

See `DEPLOY.md` for the quick version. Summary:

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/inkwell.git
   git push -u origin main
   ```
2. **Import into Vercel** — Next.js is auto-detected via `vercel.json` (region pinned to `bom1`, i.e. Mumbai — change this if your users aren't India-based).
3. **Add environment variables** in Vercel → Settings → Environment Variables (same four+one as above; set `NEXT_PUBLIC_APP_URL` to your production domain for documentation consistency).
4. **Update Supabase redirect URLs:**
   - Site URL → `https://your-app.vercel.app`
   - Redirect URLs → `https://your-app.vercel.app/auth/callback`
5. Every subsequent `git push` to `main` auto-deploys.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Login redirects to an error page | Supabase Site URL / Redirect URLs misconfigured | Authentication → URL Configuration must include your exact local/prod origin + `/auth/callback` |
| Google OAuth fails | Missing/incorrect Google Cloud Console config | Check Authorized JavaScript origins (`http://localhost:3000`) and Authorized redirect URIs (`https://<project-ref>.supabase.co/auth/v1/callback`) |
| Confirmation email never arrives | Email template / spam filtering | Check Supabase → Authentication → Email Templates; check spam; in dev, manually confirm via Authentication → Users |
| AI buttons fail / "AI unavailable" | Missing or invalid `ANTHROPIC_API_KEY`, or stale model string | Verify the key in `.env.local`; restart `npm run dev` after any env change; confirm the model string in `lib/claude.ts` is still valid |
| PDF export does nothing | Browser blocked the popup | Allow popups for the site, then retry |
| Cover image upload fails | `cover-images` storage bucket doesn't exist or isn't public | Create the bucket manually in Supabase Storage (not provisioned by the SQL schema) |
| Cover theme highlighting looks wrong after reload | `cover_theme` JSONB round-trip changes key order, not values | Already handled — `CoverDesigner.tsx` compares by `bg` value, not by `name`, specifically to avoid this |

---

## Recent Bug Fixes

These were already addressed in the current codebase and are documented here for context if you're auditing history or git-blaming something that looks unusual:

**Auth**
- Login/signup form submission and error handling reworked with friendlier inline error messages.
- Google OAuth requests `access_type: 'offline'` + `prompt: 'consent'` so refresh tokens are actually issued (previously missing, causing repeated re-consent).
- Auth callback rewritten to use `createServerClient` directly instead of a shared helper that wasn't persisting cookies correctly in that context.
- Sign-out no longer depends on `NEXT_PUBLIC_APP_URL`; it derives `origin` from `request.url` instead, so it works correctly across environments without needing that env var to be perfectly in sync.
- Middleware now supports a `redirectTo` query param so users land back on the page they originally requested after logging in.

**Editor**
- `BookPreview` is now actually rendered in the Preview tab (previously an empty `<div>`).
- New-book creation now sets state *before* calling `router.replace()`, fixing a race condition where the UI would briefly flash empty.
- Import paths corrected throughout: `@/hooks/useAutoSave` → `@/app/hooks/useAutoSave`, `@/components/*` → `@/app/components/*`, since everything actually lives under `app/`.

**Cover Designer**
- Active theme detection now compares `book.cover_theme?.bg` instead of `book.cover_theme?.name`, because the `name` field can be missing after a JSONB round-trip from Postgres.

**Auto-Save**
- Added a `savingRef` flag to prevent concurrent/duplicate save requests firing on rapid edits.
- `forceSave()` now properly awaits the async save instead of firing-and-forgetting.

**Dashboard**
- Book-fetch errors are now handled gracefully instead of leaving the UI in a stuck loading state.
- Missing `author_name` falls back to `'Unknown Author'` instead of rendering blank.

---

## Known Limitations / Ideas for Improvement

- **`cover_font` column** is used by the app but missing from `supabase-schema.sql` — add it manually (see [Data Model](#data-model)).
- **`cover-images` storage bucket** must be created manually; it isn't provisioned by the SQL schema.
- **Pagination in `BookPreview`/PDF export** uses a flat heuristic (`index * 14 + 1`) rather than counting actual rendered lines per page — fine for a rough TOC, not pixel-accurate.
- **Unused dependencies**: `zustand`, `jspdf`, and `html2canvas` are installed but not wired into any current code path. Either remove them or revisit `lib/pdf.ts` if a canvas-based export (rather than browser print) is desired.
- **No automated tests** are present in the repository.
- **`SUPABASE_SERVICE_ROLE_KEY`** is documented and provisioned for deployment but unused in code — useful to keep reserved for future admin-only operations (e.g., bulk exports, account deletion flows) that need to bypass RLS.
- **Model string pinning**: `lib/claude.ts` hardcodes a single dated model snapshot. Consider moving this to an environment variable so it can be updated without a code change/redeploy.