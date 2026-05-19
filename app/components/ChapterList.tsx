'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { cn } from '@/lib/utils'
import type { Chapter } from '@/types'

interface ChapterListProps {
  bookId: string
  chapters: Chapter[]
  activeChapterId: string | null
  onSelect: (chapter: Chapter) => void
  onChaptersChange: (chapters: Chapter[]) => void
}

export function ChapterList({
  bookId,
  chapters,
  activeChapterId,
  onSelect,
  onChaptersChange,
}: ChapterListProps) {
  const supabase = getSupabaseClient()
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Add chapter ────────────────────────────────────────────
  async function addChapter() {
    setAdding(true)
    const { data, error } = await supabase
      .from('chapters')
      .insert({
        book_id: bookId,
        title: `Chapter ${chapters.length + 1}`,
        content: '',
        content_text: '',
        order_index: chapters.length,
        word_count: 0,
      })
      .select()
      .single()

    if (!error && data) {
      const updated = [...chapters, data as Chapter]
      onChaptersChange(updated)
      onSelect(data as Chapter)
    }
    setAdding(false)
  }

  // ── Delete chapter ─────────────────────────────────────────
  async function deleteChapter(chapter: Chapter) {
    if (chapters.length <= 1) return
    if (!confirm(`Delete "${chapter.title}"? This cannot be undone.`)) return

    setDeletingId(chapter.id)
    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', chapter.id)

    if (!error) {
      const updated = chapters.filter(c => c.id !== chapter.id)
      onChaptersChange(updated)
      if (activeChapterId === chapter.id) onSelect(updated[0])
    }
    setDeletingId(null)
  }

  // ── Move chapter up / down ────────────────────────────────
  async function moveChapter(chapter: Chapter, dir: 'up' | 'down') {
    const idx = chapters.findIndex(c => c.id === chapter.id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= chapters.length) return

    const reordered = [...chapters]
    ;[reordered[idx], reordered[swapIdx]] = [
      reordered[swapIdx],
      reordered[idx],
    ]

    await Promise.all([
      supabase
        .from('chapters')
        .update({ order_index: idx })
        .eq('id', reordered[idx].id),
      supabase
        .from('chapters')
        .update({ order_index: swapIdx })
        .eq('id', reordered[swapIdx].id),
    ])

    onChaptersChange(
      reordered.map((c, i) => ({ ...c, order_index: i }))
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-cream">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="px-3 py-3 border-b border-gold-200 flex items-center justify-between flex-shrink-0">
        <p className="text-[10px] font-medium uppercase tracking-widest text-ink-400">
          Chapters
        </p>
        <button
          onClick={addChapter}
          disabled={adding}
          title="Add chapter"
          className="w-6 h-6 bg-ink-900 text-gold rounded flex items-center justify-center text-sm leading-none hover:bg-ink-700 transition-colors disabled:opacity-50"
        >
          +
        </button>
      </div>

      {/* ── Scrollable list ────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-1.5 px-2 space-y-0.5">
        {chapters.map((ch, idx) => {
          const isActive = ch.id === activeChapterId
          const isDeleting = ch.id === deletingId

          return (
            <div
              key={ch.id}
              onClick={() => !isDeleting && onSelect(ch)}
              className={cn(
                'group relative rounded-lg border px-2.5 py-2.5 cursor-pointer transition-all select-none',
                isActive
                  ? 'bg-paper border-gold-200 shadow-sm border-l-2 border-l-gold'
                  : 'border-transparent hover:bg-paper/70 hover:border-gold-100',
                isDeleting && 'opacity-40 pointer-events-none'
              )}
            >
              {/* Chapter number */}
              <p className="text-[9px] font-medium uppercase tracking-widest text-ink-300">
                Ch. {idx + 1}
              </p>

              {/* Chapter title */}
              <p className="text-[12px] text-ink-800 font-body italic mt-0.5 truncate leading-snug">
                {ch.title || 'Untitled'}
              </p>

              {/* Word count */}
              <p className="text-[10px] text-ink-300 mt-0.5">
                {(ch.word_count ?? 0).toLocaleString()} words
              </p>

              {/* ── Hover action buttons ──────────────── */}
              <div className="absolute right-1.5 top-1.5 hidden group-hover:flex items-center gap-0.5">
                <button
                  onClick={e => {
                    e.stopPropagation()
                    moveChapter(ch, 'up')
                  }}
                  disabled={idx === 0}
                  title="Move up"
                  className="w-4 h-4 text-ink-300 hover:text-ink-700 disabled:opacity-20 text-[10px] flex items-center justify-center transition-colors"
                >
                  ↑
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    moveChapter(ch, 'down')
                  }}
                  disabled={idx === chapters.length - 1}
                  title="Move down"
                  className="w-4 h-4 text-ink-300 hover:text-ink-700 disabled:opacity-20 text-[10px] flex items-center justify-center transition-colors"
                >
                  ↓
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    deleteChapter(ch)
                  }}
                  disabled={chapters.length <= 1}
                  title="Delete chapter"
                  className="w-4 h-4 text-red-300 hover:text-red-600 disabled:opacity-20 text-[10px] flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}