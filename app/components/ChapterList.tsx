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

  async function addChapter() {
    setAdding(true)
    const newIndex = chapters.length

    const { data, error } = await supabase
      .from('chapters')
      .insert({
        book_id: bookId,
        title: `Chapter ${newIndex + 1}`,
        content: '',
        content_text: '',
        order_index: newIndex,
        word_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Add chapter error:', error)
    } else if (data) {
      const updated = [...chapters, data as Chapter]
      onChaptersChange(updated)
      onSelect(data as Chapter)
    }
    setAdding(false)
  }

  async function deleteChapter(chapter: Chapter) {
    if (chapters.length <= 1) return
    if (!confirm(`"${chapter.title}" delete karein? Yeh wapas nahi ho sakta.`)) return

    setDeletingId(chapter.id)
    const { error } = await supabase.from('chapters').delete().eq('id', chapter.id)

    if (error) {
      console.error('Delete chapter error:', error)
    } else {
      const updated = chapters.filter(c => c.id !== chapter.id)
      onChaptersChange(updated)
      if (activeChapterId === chapter.id && updated.length > 0) {
        onSelect(updated[0])
      }
    }
    setDeletingId(null)
  }

  async function moveChapter(chapter: Chapter, direction: 'up' | 'down') {
    const idx = chapters.findIndex(c => c.id === chapter.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= chapters.length) return

    const reordered = [...chapters]
    ;[reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]]

    const [err1, err2] = await Promise.all([
      supabase.from('chapters').update({ order_index: idx }).eq('id', reordered[idx].id),
      supabase.from('chapters').update({ order_index: swapIdx }).eq('id', reordered[swapIdx].id),
    ])

    if (err1.error || err2.error) {
      console.error('Move chapter error:', err1.error ?? err2.error)
      return
    }

    onChaptersChange(reordered.map((c, i) => ({ ...c, order_index: i })))
  }

  const totalWords = chapters.reduce((sum, c) => sum + (c.word_count ?? 0), 0)

  return (
    <aside className="w-60 bg-cream border-r border-gold-200 flex flex-col flex-shrink-0 h-full">
      <div className="px-4 py-3 border-b border-gold-200 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-ink-400">Chapters</p>
          <p className="text-[11px] text-ink-300 mt-0.5">{totalWords.toLocaleString()} total words</p>
        </div>
        <button
          onClick={addChapter}
          disabled={adding}
          title="Add chapter"
          className="w-7 h-7 bg-ink-900 text-gold rounded-md flex items-center justify-center text-lg hover:bg-ink-700 transition-colors disabled:opacity-50"
        >
          +
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {chapters.map((ch, idx) => {
          const isActive = ch.id === activeChapterId
          const isDeleting = ch.id === deletingId

          return (
            <div
              key={ch.id}
              onClick={() => !isDeleting && onSelect(ch)}
              className={cn(
                'group relative rounded-lg border px-3 py-2.5 cursor-pointer transition-all',
                isActive
                  ? 'bg-paper border-gold-300 shadow-sm'
                  : 'border-transparent hover:bg-paper hover:border-gold-100',
                isDeleting && 'opacity-40 pointer-events-none'
              )}
            >
              <p className="text-[10px] font-medium uppercase tracking-widest text-ink-300">
                Chapter {idx + 1}
              </p>
              <p className="text-[13px] text-ink-800 font-body italic mt-0.5 truncate">
                {ch.title || 'Untitled'}
              </p>
              <p className="text-[10px] text-ink-300 mt-1">
                {(ch.word_count ?? 0).toLocaleString()} words
              </p>

              {/* Action buttons on hover */}
              <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-0.5">
                <button
                  onClick={e => { e.stopPropagation(); moveChapter(ch, 'up') }}
                  disabled={idx === 0}
                  title="Move up"
                  className="w-5 h-5 text-ink-300 hover:text-ink-700 disabled:opacity-20 text-xs flex items-center justify-center"
                >
                  ↑
                </button>
                <button
                  onClick={e => { e.stopPropagation(); moveChapter(ch, 'down') }}
                  disabled={idx === chapters.length - 1}
                  title="Move down"
                  className="w-5 h-5 text-ink-300 hover:text-ink-700 disabled:opacity-20 text-xs flex items-center justify-center"
                >
                  ↓
                </button>
                <button
                  onClick={e => { e.stopPropagation(); deleteChapter(ch) }}
                  disabled={chapters.length <= 1}
                  title="Delete chapter"
                  className="w-5 h-5 text-red-300 hover:text-red-600 disabled:opacity-20 text-xs flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
