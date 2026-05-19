'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase-client'
import { formatDate } from '@/lib/utils'
import type { Book } from '@/types'

type Filter = 'all' | 'in-progress' | 'completed'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [books, setBooks] = useState<Book[]>([])
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      setUserName(
        user.user_metadata?.full_name ??
          user.email?.split('@')[0] ??
          'Writer'
      )

      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (!error && data) setBooks(data as Book[])
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function createBook() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: newBook, error } = await supabase
      .from('books')
      .insert({
        user_id: user.id,
        title: 'Untitled Book',
        author_name: '',
        total_words: 0,
      })
      .select()
      .single()

    if (!error && newBook) router.push(`/editor/${newBook.id}`)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', deleteTarget.id)
    if (!error) setBooks(prev => prev.filter(b => b.id !== deleteTarget.id))
    setDeleting(false)
    setDeleteTarget(null)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filtered = books.filter(b => {
    if (filter === 'in-progress') return b.status === 'draft'
    if (filter === 'completed') return b.status === 'published'
    return true
  })

  const totalWords = books.reduce((s, b) => s + (b.total_words ?? 0), 0)
  const avgWords =
    books.length > 0 ? Math.round(totalWords / books.length) : 0
  const inProgressCount = books.filter(b => b.status === 'draft').length

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <div className="font-serif text-4xl text-gold animate-pulse mb-3">
            ✦
          </div>
          <p className="text-ink-400 text-sm">Loading your library…</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-paper">
      {/* ── Navigation ─────────────────────────────── */}
      <nav className="bg-ink-900 px-8 h-14 flex items-center justify-between">
        <span className="font-serif text-gold text-xl italic">Inkwell</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gold-300 hidden sm:block">
            {userName.toUpperCase()}
          </span>
          <button
            onClick={handleSignOut}
            className="text-xs text-gold-500 hover:text-gold border border-gold-700 hover:border-gold px-3 py-1 rounded-md transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* ── Header row ─────────────────────────────── */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-ink-900">Your Library</h1>
            <p className="text-sm text-ink-400 mt-1">
              {books.length} book{books.length !== 1 ? 's' : ''} · last
              edited today
            </p>
          </div>
          <button
            onClick={createBook}
            className="bg-ink-900 text-gold text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-ink-700 transition-colors flex items-center gap-2 shadow-book"
          >
            <span className="text-base leading-none">+</span> New Book
          </button>
        </div>

        {/* ── Stats row ──────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total Books', value: books.length },
            { label: 'Total Words', value: totalWords.toLocaleString() },
            {
              label: 'Avg. per Book',
              value: avgWords.toLocaleString() + ' wds',
            },
            { label: 'In Progress', value: inProgressCount },
          ].map(s => (
            <div
              key={s.label}
              className="bg-cream border border-gold-100 rounded-xl px-4 py-3"
            >
              <p className="text-[10px] font-medium uppercase tracking-widest text-ink-400 mb-1">
                {s.label}
              </p>
              <p className="font-serif text-2xl text-ink-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Filter tabs ────────────────────────────── */}
        <div className="flex gap-1 border-b border-gold-100 mb-6">
          {(['all', 'in-progress', 'completed'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm rounded-t-lg border-b-2 -mb-px transition-colors ${
                filter === f
                  ? 'border-gold text-gold-500 font-medium'
                  : 'border-transparent text-ink-400 hover:text-ink-700'
              }`}
            >
              {f === 'all'
                ? 'All books'
                : f === 'in-progress'
                ? 'In progress'
                : 'Completed'}
            </button>
          ))}
        </div>

        {/* ── Books grid ─────────────────────────────── */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {filtered.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onDelete={() => setDeleteTarget(book)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="text-5xl mb-4 opacity-30">✦</div>
            <h2 className="font-serif text-2xl text-ink-700 mb-2">
              {filter === 'all'
                ? 'Your shelf is empty'
                : `No ${filter} books`}
            </h2>
            <p className="text-ink-400 text-sm mb-6">
              Every great book starts with a single word.
            </p>
            <button
              onClick={createBook}
              className="bg-ink-900 text-gold text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-ink-700 transition-colors"
            >
              Write your first book
            </button>
          </div>
        )}
      </div>

      {/* ── Delete modal ───────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-ink-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-paper border border-gold-200 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="text-3xl mb-3 opacity-40">✕</div>
            <h3 className="font-serif text-xl text-ink-900 mb-2">
              Delete this book?
            </h3>
            <p className="text-sm text-ink-500 mb-1">
              <span className="font-medium text-ink-800">
                "{deleteTarget.title}"
              </span>{' '}
              will be permanently removed.
            </p>
            <p className="text-xs text-ink-300 mb-6">
              All chapters and cover settings will be lost. This cannot be
              undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-gold-200 text-sm text-ink-600 hover:bg-cream transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-800 text-red-100 text-sm font-medium hover:bg-red-900 transition-colors disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

/* ── BookCard ──────────────────────────────────────────────── */
function BookCard({
  book,
  onDelete,
}: {
  book: Book
  onDelete: () => void
}) {
  const theme = book.cover_theme
  const words = book.total_words ?? 0
  // 50 000 words = 100 % (a typical novel)
  const progress = Math.min(100, Math.round((words / 50000) * 100))

  return (
    <div className="group relative">
      {/* Cover thumbnail */}
      <Link href={`/editor/${book.id}`}>
        <div
          className="w-full aspect-[2/3] rounded-lg flex flex-col items-center justify-center text-center p-4 mb-3 transition-all duration-200 group-hover:-rotate-1 group-hover:scale-[1.03] relative overflow-hidden"
          style={{
            background: theme?.bg ?? '#1a1208',
            color: theme?.text ?? '#c9a84c',
            boxShadow:
              '-4px 4px 16px rgba(0,0,0,0.22), 2px -1px 0 rgba(0,0,0,0.08)',
          }}
        >
          {/* Book spine shadow */}
          <div
            className="absolute left-0 top-0 bottom-0 w-2.5 rounded-l-lg"
            style={{ background: 'rgba(0,0,0,0.18)' }}
          />

          <div className="text-xl mb-1.5 opacity-80">
            {book.cover_ornament ?? '✦'}
          </div>
          <div
            className="w-8 border-t opacity-40 mb-2"
            style={{
              borderColor: theme?.accent ?? 'rgba(201,168,76,0.4)',
            }}
          />
          <div className="font-serif text-xs font-bold leading-snug line-clamp-3 mb-1.5">
            {book.title}
          </div>
          <div
            className="w-8 border-t opacity-40 mb-2"
            style={{
              borderColor: theme?.accent ?? 'rgba(201,168,76,0.4)',
            }}
          />
          <div
            className="text-[10px] italic opacity-70"
            style={{ fontFamily: 'Lora, serif' }}
          >
            {book.author_name || 'Unknown Author'}
          </div>
        </div>
      </Link>

      {/* Hover action buttons */}
      <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto">
        <Link
          href={`/editor/${book.id}`}
          title="Edit book"
          className="w-7 h-7 bg-ink-900/90 text-gold rounded-md flex items-center justify-center text-xs hover:bg-ink-700 transition-colors"
        >
          ✍
        </Link>
        <Link
          href={`/cover/${book.id}`}
          title="Cover & design"
          className="w-7 h-7 bg-ink-900/90 text-gold rounded-md flex items-center justify-center text-xs hover:bg-ink-700 transition-colors"
        >
          🎨
        </Link>
        <button
          onClick={e => {
            e.preventDefault()
            onDelete()
          }}
          title="Delete book"
          className="w-7 h-7 bg-red-900/90 text-red-200 rounded-md flex items-center justify-center text-xs hover:bg-red-800 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Book info below cover */}
      <div>
        <p className="text-sm font-medium text-ink-800 truncate">{book.title}</p>
        <p className="text-xs text-ink-400 mt-0.5">
          {words.toLocaleString()} words · {formatDate(book.updated_at)}
        </p>
        {/* Progress bar */}
        <div className="mt-2 h-0.5 bg-gold-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-ink-300 mt-1">{progress}% of a novel</p>
      </div>
    </div>
  )
}