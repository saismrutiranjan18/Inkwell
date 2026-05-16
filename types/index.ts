// ── Database row types (mirrors Supabase tables) ──────────

export type User = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export type Book = {
  id: string
  user_id: string
  title: string
  author_name: string
  subtitle: string | null
  description: string | null
  cover_theme: CoverTheme
  cover_ornament: string
  cover_subtitle: string | null
  status: 'draft' | 'published'
  total_words: number
  created_at: string
  updated_at: string
}

export type Chapter = {
  id: string
  book_id: string
  title: string
  content: string          // TipTap JSON string
  content_text: string     // plain text for word count / AI
  order_index: number
  word_count: number
  created_at: string
  updated_at: string
}

// ── Cover ─────────────────────────────────────────────────

export type CoverThemeName =
  | 'dark-gold'
  | 'midnight'
  | 'crimson'
  | 'forest'
  | 'parchment'
  | 'violet'

export type CoverTheme = {
  name: CoverThemeName
  bg: string
  text: string
  accent: string
}

export const COVER_THEMES: Record<CoverThemeName, CoverTheme> = {
  'dark-gold':  { name: 'dark-gold',  bg: '#1a1208', text: '#c9a84c', accent: 'rgba(201,168,76,0.6)' },
  'midnight':   { name: 'midnight',   bg: '#2a3a4a', text: '#e8d5a3', accent: 'rgba(232,213,163,0.5)' },
  'crimson':    { name: 'crimson',    bg: '#3d1f1f', text: '#f5e0c8', accent: 'rgba(245,224,200,0.5)' },
  'forest':     { name: 'forest',     bg: '#1f3329', text: '#c8e8d0', accent: 'rgba(200,232,208,0.5)' },
  'parchment':  { name: 'parchment',  bg: '#faf7f2', text: '#1a1208', accent: 'rgba(26,18,8,0.3)' },
  'violet':     { name: 'violet',     bg: '#2d1a4a', text: '#e8c8f0', accent: 'rgba(232,200,240,0.5)' },
}

export const COVER_ORNAMENTS = ['✦', '⚜', '❧', '✿', '☽', '⚡', '🌿', '🗡️']

// ── AI ────────────────────────────────────────────────────

export type AIAction = 'format' | 'grammar' | 'title' | 'continue'

export type AIResponse = {
  result: string
  action: AIAction
}

// ── Editor state ──────────────────────────────────────────

export type EditorTab = 'write' | 'cover' | 'preview'

export type BookWithChapters = Book & {
  chapters: Chapter[]
}
