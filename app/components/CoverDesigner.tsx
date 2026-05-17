'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { cn } from '@/lib/utils'
import { COVER_THEMES, COVER_ORNAMENTS } from '@/types'
import type { Book, CoverThemeName, CoverTheme } from '@/types'

interface CoverDesignerProps {
  book: Book
  onBookChange: (book: Book) => void
}

export function CoverDesigner({ book, onBookChange }: CoverDesignerProps) {
  const supabase = getSupabaseClient()
  const [saving, setSaving] = useState(false)

  async function updateBook(patch: Partial<Book>) {
    const updated = { ...book, ...patch }
    onBookChange(updated)
    setSaving(true)
    await supabase.from('books').update(patch).eq('id', book.id)
    setSaving(false)
  }

  function setTheme(name: CoverThemeName) {
    updateBook({ cover_theme: COVER_THEMES[name] })
  }

  return (
    <aside className="w-72 bg-cream border-r border-gold-200 flex flex-col overflow-y-auto flex-shrink-0">
      <div className="px-5 py-4 border-b border-gold-200">
        <h2 className="font-serif text-lg text-ink-900">Cover Design</h2>
        <p className="text-xs text-ink-400 mt-0.5">{saving ? '⟳ Saving…' : 'Changes save automatically'}</p>
      </div>

      <div className="p-5 space-y-6">
        <Field label="Cover Title">
          <input value={book.title} onChange={e => updateBook({ title: e.target.value })}
            className={inputCls} placeholder="Your Book Title" />
        </Field>

        <Field label="Cover Subtitle">
          <input value={book.cover_subtitle ?? ''} onChange={e => updateBook({ cover_subtitle: e.target.value })}
            className={inputCls} placeholder="A Novel" />
        </Field>

        <Field label="Author Name">
          <input value={book.author_name} onChange={e => updateBook({ author_name: e.target.value })}
            className={inputCls} placeholder="Your Name" />
        </Field>

        <Field label="Theme">
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(COVER_THEMES) as [CoverThemeName, CoverTheme][]).map(([name, theme]) => (
              <button key={name} onClick={() => setTheme(name)}
                className={cn('py-2.5 px-3 rounded-lg text-xs font-medium capitalize border-2 transition-all',
                  book.cover_theme?.name === name ? 'border-gold scale-[1.02] shadow-md' : 'border-transparent hover:scale-[1.01]')}
                style={{ background: theme.bg, color: theme.text }}>
                {name.replace('-', ' ')}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Ornament">
          <div className="flex flex-wrap gap-2">
            {COVER_ORNAMENTS.map(o => (
              <button key={o} onClick={() => updateBook({ cover_ornament: o })}
                className={cn('w-10 h-10 rounded-lg border text-xl flex items-center justify-center transition-all',
                  book.cover_ornament === o ? 'border-gold bg-gold-50 scale-110 shadow' : 'border-gold-200 hover:border-gold bg-paper')}>
                {o}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </aside>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest font-medium text-ink-400 mb-2">{label}</p>
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-paper border border-gold-200 rounded-lg px-3 py-2 text-sm text-ink-800 outline-none focus:border-gold transition-colors'