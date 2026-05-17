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

export function AIToolbar({ chapterText, onApplyContent, saveStatus }: AIToolbarProps) {
  const [loading, setLoading] = useState<AIAction | null>(null)
  const [modal, setModal] = useState<AIResult | null>(null)
  const [error, setError] = useState('')

  async function callAI(action: AIAction) {
    if (!chapterText.trim()) { setError('Write something first!'); setTimeout(() => setError(''), 2500); return }
    setLoading(action); setError('')
    try {
      const res = await fetch(`/api/ai/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chapterText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'AI error')
      if (action === 'title') setModal({ action, result: '', titles: data.titles })
      else setModal({ action, result: data.result })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI unavailable')
      setTimeout(() => setError(''), 3000)
    }
    setLoading(null)
  }

  function applyTitle(title: string) {
    window.dispatchEvent(new CustomEvent('inkwell:apply-title', { detail: title }))
    setModal(null)
  }

  const saveLabel = { idle: '', saving: '⟳ Saving…', saved: '✓ Saved', error: '✕ Save failed' }[saveStatus]
  const saveColor = { idle: '', saving: 'text-ink-300', saved: 'text-green-600', error: 'text-red-500' }[saveStatus]

  return (
    <>
      <div className="bg-ink-900 px-6 py-2.5 flex items-center gap-3 flex-wrap border-t border-ink-800">
        <span className="text-[11px] font-medium text-gold tracking-widest uppercase">✦ AI</span>
        {(['format', 'grammar', 'title', 'continue'] as AIAction[]).map(action => (
          <button key={action} onClick={() => callAI(action)} disabled={!!loading}
            className="border border-gold-700 text-gold-300 text-xs px-3 py-1 rounded-md hover:border-gold hover:text-gold transition-colors disabled:opacity-40">
            {loading === action ? '…' : { format: 'Format Chapter', grammar: 'Fix Grammar', title: 'Suggest Title', continue: 'Continue Writing' }[action]}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-4">
          {error && <span className="text-red-400 text-xs">{error}</span>}
          {saveStatus !== 'idle' && <span className={`text-xs ${saveColor}`}>{saveLabel}</span>}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-ink-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-paper border border-gold-200 rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="font-serif text-xl text-ink-900 mb-1">
              {{ format: 'Formatted Chapter', grammar: 'Grammar Fixed', title: 'Title Suggestions', continue: 'Story Continuation' }[modal.action]}
            </h3>
            <p className="text-sm text-ink-400 mb-4">
              {modal.action === 'title' ? 'Click a title to apply it.' : 'Review below, then click Apply.'}
            </p>
            {modal.action === 'title' && modal.titles && (
              <div className="space-y-2 mb-4">
                {modal.titles.map((t, i) => (
                  <button key={i} onClick={() => applyTitle(t)}
                    className="w-full text-left px-4 py-2.5 rounded-lg border border-gold-200 text-sm font-body italic text-ink-700 hover:bg-cream transition-colors">
                    {t}
                  </button>
                ))}
              </div>
            )}
            {modal.action !== 'title' && modal.result && (
              <div className="bg-cream rounded-xl p-4 max-h-64 overflow-y-auto text-sm font-body text-ink-700 leading-relaxed mb-4">
                {modal.result.split('\n').map((line, i) => <p key={i} className="mb-1">{line}</p>)}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-gold-200 text-sm text-ink-600 hover:bg-cream">Dismiss</button>
              {modal.action !== 'title' && (
                <button onClick={() => { onApplyContent(modal.result); setModal(null) }}
                  className="px-4 py-2 rounded-lg bg-ink-900 text-gold text-sm font-medium hover:bg-ink-700">Apply to Chapter</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}