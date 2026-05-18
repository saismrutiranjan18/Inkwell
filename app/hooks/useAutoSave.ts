import { useEffect, useRef, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { stripHtml, wordCount } from '@/lib/utils'
import type { Chapter } from '@/types'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseAutoSaveProps {
  chapter: Chapter | null
  content: string   // TipTap HTML
  title: string
  onStatusChange: (status: SaveStatus) => void
}

export function useAutoSave({
  chapter,
  content,
  title,
  onStatusChange,
}: UseAutoSaveProps) {
  const supabase = getSupabaseClient()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')
  const savingRef = useRef(false)

  const save = useCallback(async () => {
    if (!chapter) return
    if (savingRef.current) return // duplicate save prevent karo

    const key = `${title}::${content}`
    if (key === lastSavedRef.current) return // kuch change nahi hua

    savingRef.current = true
    onStatusChange('saving')

    const plainText = stripHtml(content)
    const wc = wordCount(plainText)

    const { error } = await supabase
      .from('chapters')
      .update({
        title,
        content,
        content_text: plainText,
        word_count: wc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chapter.id)

    savingRef.current = false

    if (error) {
      console.error('Auto-save error:', error)
      onStatusChange('error')
    } else {
      lastSavedRef.current = key
      onStatusChange('saved')
      setTimeout(() => onStatusChange('idle'), 2000)
    }
  }, [chapter, content, title, onStatusChange, supabase])

  // Debounced auto-save: 1.5 seconds baad save karo
  useEffect(() => {
    if (!chapter) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(save, 1500)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [content, title, chapter, save])

  // Force save (e.g. chapter switch se pehle)
  const forceSave = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    await save()
  }, [save])

  return { forceSave }
}
