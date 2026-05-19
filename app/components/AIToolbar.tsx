'use client'

import { useState } from 'react'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface AIToolbarProps {
  chapterText: string
  onApplyContent: (text: string) => void
  saveStatus: SaveStatus
}

type AIAction = 'format' | 'grammar' | 'title' | 'continue'

interface AIResult {
  action: AIAction
  result: string
  titles?: string[]
}

const ACTION_LABELS: Record<AIAction, string> = {
  format:   'Format Chapter',
  grammar:  'Fix Grammar',
  title:    'Suggest Title',
  continue: 'Continue Writing',
}

const MODAL_TITLES: Record<AIAction, string> = {
  format:   'Formatted Chapter',
  grammar:  'Grammar Fixed',
  title:    'Title Suggestions',
  continue: 'Story Continuation',
}

export function AIToolbar({
  chapterText,
  onApplyContent,
  saveStatus,
}: AIToolbarProps) {
  const [loading, setLoading] = useState<AIAction | null>(null)
  const [modal, setModal]     = useState<AIResult | null>(null)
  const [error, setError]     = useState('')

  // ── Call AI endpoint ──────────────────────────────────────
  async function callAI(action: AIAction) {
    if (!chapterText.trim()) {
      setError('Write something first!')
      setTimeout(() => setError(''), 2500)
      return
    }

    setLoading(action)
    setError('')

    try {
      const res = await fetch(`/api/ai/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chapterText }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'AI error')

      if (action === 'title') {
        setModal({ action, result: '', titles: data.titles })
      } else {
        setModal({ action, result: data.result })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI unavailable'
      setError(msg)
      setTimeout(() => setError(''), 4000)
    } finally {
      setLoading(null)
    }
  }

  // ── Apply AI-suggested title ──────────────────────────────
  function applyTitle(title: string) {
    window.dispatchEvent(
      new CustomEvent('inkwell:apply-title', { detail: title })
    )
    setModal(null)
  }

  // ── Save status pill ──────────────────────────────────────
  const saveConfig = {
    idle:   { label: '',            color: '' },
    saving: { label: '⟳ Saving…',  color: 'text-gold-400' },
    saved:  { label: '✓ Saved',     color: 'text-green-400' },
    error:  { label: '✕ Save error',color: 'text-red-400' },
  }[saveStatus]

  return (
    <>
      {/* ── Toolbar strip ──────────────────────────────────── */}
      <div className="bg-ink-900 px-5 py-2 flex items-center gap-2 flex-wrap border-t border-ink-800 flex-shrink-0">

        {/* AI label */}
        <span className="text-[10px] font-semibold text-gold tracking-[0.15em] uppercase flex-shrink-0">
          ✦ AI
        </span>

        {/* Vertical divider */}
        <div className="w-px h-4 bg-ink-700 flex-shrink-0" />

        {/* Action buttons */}
        {(Object.keys(ACTION_LABELS) as AIAction[]).map(action => (
          <button
            key={action}
            onClick={() => callAI(action)}
            disabled={!!loading}
            className="border border-ink-700 hover:border-gold-600 text-gold-400 hover:text-gold text-[11px] px-3 py-1 rounded-md transition-colors disabled:opacity-40 flex-shrink-0"
          >
            {loading === action ? (
              <span className="inline-flex items-center gap-1">
                <span className="animate-spin">⟳</span>
                {ACTION_LABELS[action]}
              </span>
            ) : (
              ACTION_LABELS[action]
            )}
          </button>
        ))}

        {/* Right side: error + save status */}
        <div className="ml-auto flex items-center gap-3 flex-shrink-0">
          {error && (
            <span className="text-red-400 text-[11px]">{error}</span>
          )}
          {saveStatus !== 'idle' && (
            <span className={`text-[11px] font-medium ${saveConfig.color}`}>
              {saveConfig.label}
            </span>
          )}
        </div>
      </div>

      {/* ── AI Result Modal ────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 bg-ink-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-paper border border-gold-200 rounded-2xl p-6 w-full max-w-lg shadow-xl">

            {/* Modal header */}
            <h3 className="font-serif text-xl text-ink-900 mb-1">
              {MODAL_TITLES[modal.action]}
            </h3>
            <p className="text-sm text-ink-400 mb-4">
              {modal.action === 'title'
                ? 'Click a title to apply it to this chapter.'
                : 'Review the result below, then apply or dismiss.'}
            </p>

            {/* Title suggestions */}
            {modal.action === 'title' && modal.titles && (
              <div className="space-y-2 mb-4">
                {modal.titles.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => applyTitle(t)}
                    className="w-full text-left px-4 py-2.5 rounded-lg border border-gold-200 text-sm font-body italic text-ink-700 hover:bg-cream hover:border-gold transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            {/* Text result */}
            {modal.action !== 'title' && modal.result && (
              <div className="bg-cream rounded-xl p-4 max-h-64 overflow-y-auto text-sm font-body text-ink-700 leading-relaxed mb-4 border border-gold-100">
                {modal.result.split('\n').map((line, i) => (
                  <p key={i} className={line.trim() ? 'mb-2' : 'mb-1'}>
                    {line}
                  </p>
                ))}
              </div>
            )}

            {/* Modal actions */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 rounded-lg border border-gold-200 text-sm text-ink-600 hover:bg-cream transition-colors"
              >
                Dismiss
              </button>
              {modal.action !== 'title' && (
                <button
                  onClick={() => {
                    onApplyContent(modal.result)
                    setModal(null)
                  }}
                  className="px-4 py-2 rounded-lg bg-ink-900 text-gold text-sm font-medium hover:bg-ink-700 transition-colors"
                >
                  Apply to Chapter
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}