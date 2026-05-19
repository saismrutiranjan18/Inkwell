'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase-client'
import { CoverDesigner } from '@/app/components/CoverDesigner'
import { BookPreview } from '@/app/components/BookPreview'
import { exportBookAsPDF } from '@/lib/pdf'
import type { Book, Chapter } from '@/types'

type View = 'cover' | 'preview'

export default function CoverPage() {
  const params  = useParams()
  const router  = useRouter()
  const supabase = getSupabaseClient()
  const bookId  = params.id as string

  const [book,      setBook]      = useState<Book | null>(null)
  const [chapters,  setChapters]  = useState<Chapter[]>([])
  const [loading,   setLoading]   = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportErr, setExportErr] = useState('')
  const [view,      setView]      = useState<View>('cover')

  useEffect(() => {
    async function load() {
      const [
        { data: bookData, error: bookErr },
        { data: chapterData },
      ] = await Promise.all([
        supabase.from('books').select('*').eq('id', bookId).single(),
        supabase
          .from('chapters')
          .select('*')
          .eq('book_id', bookId)
          .order('order_index'),
      ])

      if (bookErr || !bookData) { router.push('/dashboard'); return }
      setBook(bookData as Book)
      setChapters((chapterData as Chapter[]) ?? [])
      setLoading(false)
    }
    load()
  }, [bookId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleExport() {
    if (!book) return
    setExporting(true)
    setExportErr('')
    try {
      await exportBookAsPDF(book, chapters)
    } catch (e) {
      setExportErr('Export failed — allow popups and try again.')
      console.error(e)
    } finally {
      setExporting(false)
    }
  }

  if (loading || !book) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <div className="font-serif text-4xl text-gold mb-3 animate-pulse">✦</div>
          <p className="text-ink-400 text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">

      {/* ── Top nav ──────────────────────────────────────── */}
      <nav
        className="bg-ink-900 px-6 flex items-center gap-4 flex-shrink-0"
        style={{ height: '52px' }}
      >
        <Link
          href={`/editor/${bookId}`}
          className="text-gold-500 hover:text-gold text-sm flex-shrink-0 transition-colors"
        >
          ← Back to Editor
        </Link>

        <span className="font-serif text-gold text-base ml-2 truncate max-w-xs">
          {book.title}
        </span>

        {/* View tabs */}
        <div className="flex items-center gap-1 ml-auto">
          {(['cover', 'preview'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === v
                  ? 'bg-gold-900/40 text-gold'
                  : 'text-gold-500 hover:text-gold'
              }`}
            >
              {{ cover: '🎨 Design', preview: '📖 Preview' }[v]}
            </button>
          ))}
        </div>

        {/* Export */}
        <div className="flex items-center gap-2 ml-2">
          {exportErr && (
            <span className="text-red-400 text-xs">{exportErr}</span>
          )}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="bg-gold text-ink-900 text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-gold-300 disabled:opacity-60 transition-colors"
          >
            {exporting ? '⟳ Preparing…' : '⬇ Export PDF'}
          </button>
        </div>
      </nav>

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {view === 'cover' && (
          <>
            {/* Sidebar */}
            <CoverDesigner book={book} onBookChange={setBook} />

            {/* Live preview */}
            <div className="flex-1 bg-[#e8e0d0] overflow-y-auto flex flex-col items-center justify-center p-8">
              <CoverCard book={book} />
              <p className="text-ink-400 text-xs mt-4">
                Live preview — changes save automatically
              </p>
            </div>
          </>
        )}

        {view === 'preview' && (
          <div className="flex-1 bg-[#e8e0d0] overflow-y-auto">
            <BookPreview book={book} chapters={chapters} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Live cover card ─────────────────────────────────────────── */
function CoverCard({ book }: { book: Book }) {
  const theme  = book.cover_theme ?? {
    bg: '#1a1208',
    text: '#c9a84c',
    accent: 'rgba(201,168,76,0.6)',
  }
  const font   = book.cover_font ?? 'Playfair Display'
  const imgUrl = book.cover_image_url
  const imgOpacity = (book.cover_image_opacity ?? 35) / 100

  return (
    <div
      className="relative flex flex-col items-center justify-center text-center transition-all duration-300"
      style={{
        width: '260px',
        height: '374px',
        background: theme.bg,
        color: theme.text,
        boxShadow: '-5px 5px 18px rgba(0,0,0,0.28)',
        borderRadius: '2px 6px 6px 2px',
        padding: '2rem',
        overflow: 'hidden',
      }}
    >
      {/* Spine */}
      <div
        className="absolute left-0 top-0 bottom-0 w-4 rounded-l"
        style={{ background: 'rgba(0,0,0,0.18)' }}
      />

      {/* Background image overlay */}
      {imgUrl && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${imgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: imgOpacity,
          }}
        />
      )}

      {/* Content — above image */}
      <div className="relative z-10 flex flex-col items-center w-full">
        <div className="text-3xl mb-3 opacity-85">
          {book.cover_ornament ?? '✦'}
        </div>
        <div
          className="w-10 border-t mb-4"
          style={{ borderColor: theme.accent }}
        />
        <h2
          className="text-xl font-bold leading-snug mb-2"
          style={{ fontFamily: `'${font}', serif` }}
        >
          {book.title || 'Your Title'}
        </h2>
        {book.cover_subtitle && (
          <p
            className="text-[9px] tracking-[0.18em] uppercase opacity-60 mb-4"
          >
            {book.cover_subtitle}
          </p>
        )}
        <div
          className="w-10 border-t mb-4"
          style={{ borderColor: theme.accent }}
        />
        <p
          className="text-sm opacity-75"
          style={{ fontStyle: 'italic', fontFamily: 'Lora, serif' }}
        >
          {book.author_name || 'Author Name'}
        </p>
      </div>
    </div>
  )
}