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
| Export     | jsPDF + html2canvas           |
| Deploy     | Vercel                        |

---

## Setup — Step by Step

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Copy your **Project URL** and **anon key** from Settings → API
3. In the **SQL Editor**, paste the entire contents of `supabase-schema.sql` and click **Run**
4. Go to **Authentication → Providers** and enable **Google** (optional)

### 2. Get your Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Copy it

### 3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Then open `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-your-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
inkwell/
├── app/
│   ├── page.tsx                 ← Landing page
│   ├── (auth)/
│   │   ├── login/page.tsx       ← Login
│   │   └── signup/page.tsx      ← Sign up
│   ├── dashboard/page.tsx       ← Books list
│   ├── editor/[id]/page.tsx     ← Write + AI
│   ├── cover/[id]/page.tsx      ← Cover designer
│   └── api/
│       ├── ai/format/           ← Claude format API
│       ├── ai/grammar/          ← Claude grammar API
│       ├── ai/title/            ← Claude title API
│       └── export/pdf/          ← PDF export API
├── components/
│   ├── Editor.tsx               ← TipTap editor
│   ├── ChapterList.tsx          ← Chapter sidebar
│   ├── CoverDesigner.tsx        ← Cover UI
│   ├── BookPreview.tsx          ← Book renderer
│   └── AIToolbar.tsx            ← AI action buttons
├── lib/
│   ├── supabase-client.ts       ← Browser Supabase
│   ├── supabase-server.ts       ← Server Supabase
│   ├── claude.ts                ← AI helpers
│   └── utils.ts                 ← Utilities
├── types/index.ts               ← All TypeScript types
├── middleware.ts                ← Auth protection
└── supabase-schema.sql          ← Run in Supabase SQL Editor
```

---

## Build Phases

- **Phase 1** ✅ Project setup, auth, database schema
- **Phase 2** — TipTap editor + chapter management + auto-save
- **Phase 3** — AI features + cover designer + book preview
- **Phase 4** — PDF export + Vercel deploy

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add your environment variables in the Vercel dashboard under **Settings → Environment Variables**.
