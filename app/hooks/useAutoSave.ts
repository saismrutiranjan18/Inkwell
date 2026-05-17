import { useEffect, useRef, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { stripHtml, wordCount } from '@/lib/utils'
import type { Chapter } from '@/types'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseAutoSaveProps {
  chapter: Chapter | null
  content: string          // TipTap HTML string
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

  const save = useCallback(async () => {
    if (!chapter) return
    const key = `${title}::${content}`
    if (key === lastSavedRef.current) return   // nothing changed

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

    if (error) {
      console.error('Auto-save error:', error)
      onStatusChange('error')
    } else {
      lastSavedRef.current = key
      onStatusChange('saved')
      setTimeout(() => onStatusChange('idle'), 2000)
    }
  }, [chapter, content, title, onStatusChange, supabase])

  useEffect(() => {
    if (!chapter) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(save, 1500)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [content, title, chapter, save])

  const forceSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    save()
  }, [save])

  return { forceSave }
}