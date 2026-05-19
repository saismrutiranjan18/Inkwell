'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase-client'
import { stripHtml } from '@/lib/utils'
import { ChapterList } from '@/app/components/ChapterList'
import { Editor } from '@/app/components/Editor'
import { AIToolbar } from '@/app/components/AIToolbar'
import { BookPreview } from '@/app/components/BookPreview'
import { useAutoSave } from '@/app/hooks/useAutoSave'
import type { Book, Chapter } from '@/types'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
type Tab = 'write' | 'preview'

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = getSupabaseClient()
  const bookId = params.id as string

  const [book, setBook] = useState<Book | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null)
  const [editorContent, setEditorContent] = useState('')
  const [chapterTitle, setChapterTitle] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('write')

  // ── Load book + chapters ──────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)

      if (bookId === 'new') {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data: newBook, error: bookError } = await supabase
          .from('books')
          .insert({
            user_id: user.id,
            title: 'Untitled Book',
            author_name: '',
            total_words: 0,
          })
          .select()
          .single()

        if (bookError || !newBook) { router.push('/dashboard'); return }

        const { data: firstChapter, error: chapterError } = await supabase
          .from('chapters')
          .insert({
            book_id: newBook.id,
            title: 'Chapter 1',
            content: '',
            content_text: '',
            order_index: 0,
            word_count: 0,
          })
          .select()
          .single()

        if (chapterError || !firstChapter) { router.push('/dashboard'); return }

        setBook(newBook as Book)
        setChapters([firstChapter as Chapter])
        setActiveChapter(firstChapter as Chapter)
        setChapterTitle(firstChapter.title)
        setEditorContent(firstChapter.content ?? '')
        setLoading(false)
        router.replace(`/editor/${newBook.id}`)
        return
      }

      // Existing book
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
      const chs = (chapterData as Chapter[]) ?? []
      setChapters(chs)

      if (chs.length > 0) {
        setActiveChapter(chs[0])
        setChapterTitle(chs[0].title)
        setEditorContent(chs[0].content ?? '')
      }
      setLoading(false)
    }

    load()
  }, [bookId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── AI title apply event ──────────────────────────────────
  useEffect(() => {
    function onApplyTitle(e: Event) {
      const title = (e as CustomEvent<string>).detail
      setChapterTitle(title)
      setChapters(prev =>
        prev.map(c =>
          c.id === activeChapter?.id ? { ...c, title } : c
        )
      )
    }
    window.addEventListener('inkwell:apply-title', onApplyTitle)
    return () =>
      window.removeEventListener('inkwell:apply-title', onApplyTitle)
  }, [activeChapter?.id])

  // ── Auto-save hook ────────────────────────────────────────
  const { forceSave } = useAutoSave({
    chapter: activeChapter,
    content: editorContent,
    title: chapterTitle,
    onStatusChange: setSaveStatus,
  })

  // ── Chapter select (force-save current first) ─────────────
  const handleChapterSelect = useCallback(
    async (chapter: Chapter) => {
      await forceSave()
      setActiveChapter(chapter)
      setChapterTitle(chapter.title)
      setEditorContent(chapter.content ?? '')
    },
    [forceSave]
  )

  // ── Save book-level fields (title / author_name) ──────────
  async function saveBookField(
    field: 'title' | 'author_name',
    value: string
  ) {
    if (!book) return
    setBook(prev => (prev ? { ...prev, [field]: value } : prev))
    await supabase
      .from('books')
      .update({ [field]: value })
      .eq('id', book.id)
  }

  // ── Apply AI content to editor ────────────────────────────
  function handleApplyContent(text: string) {
    const html = text
      .split('\n\n')
      .map(p => (p.trim() ? `<p>${p.replace(/\n/g, '<br>')}</p>` : ''))
      .filter(Boolean)
      .join('')
    setEditorContent(html || '<p></p>')
  }

  // ── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <div className="font-serif text-4xl text-gold mb-4 animate-pulse">
            ✦
          </div>
          <p className="text-ink-400 text-sm">Loading your book…</p>
        </div>
      </div>
    )
  }

  if (!book) return null

  const totalWords = chapters.reduce(
    (s, c) => s + (c.word_count ?? 0),
    0
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-paper">

      {/* ── Top nav ──────────────────────────────────────── */}
      <nav
        className="bg-ink-900 px-5 flex items-center gap-3 flex-shrink-0"
        style={{ height: '52px' }}
      >
        <Link
          href="/dashboard"
          className="text-gold-500 hover:text-gold text-sm flex-shrink-0 transition-colors"
        >
          ← Dashboard
        </Link>

        <div className="w-px h-4 bg-gold-800 mx-1 flex-shrink-0" />

        {/* Editable book title */}
        <input
          value={book.title ?? ''}
          onChange={e => saveBookField('title', e.target.value)}
          className="bg-transparent text-gold font-serif text-base outline-none border-b border-transparent focus:border-gold-700 min-w-0 flex-1 max-w-xs transition-colors placeholder:text-gold-800 truncate"
          placeholder="Book Title"
        />

        {/* Write / Preview tabs */}
        <div className="flex items-center gap-1 ml-auto">
          {(['write', 'preview'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => {
                forceSave()
                setActiveTab(tab)
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-gold-900/40 text-gold'
                  : 'text-gold-500 hover:text-gold'
              }`}
            >
              {{ write: '✍ Write', preview: '📖 Preview' }[tab]}
            </button>
          ))}
        </div>

        {/* Cover & Export button */}
        <Link
          href={`/cover/${bookId}`}
          onClick={() => forceSave()}
          className="bg-gold text-ink-900 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gold-300 ml-1 flex-shrink-0 transition-colors"
        >
          🎨 Cover & Export
        </Link>
      </nav>

      {/* ── Main area ────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── WRITE TAB ────────────────────────────────── */}
        {activeTab === 'write' && (
          <>
            {/* Left sidebar */}
            <div className="flex flex-col flex-shrink-0 border-r border-gold-200"
              style={{ width: '220px' }}>

              {/* Chapter list — scrollable, takes all remaining height */}
              <div className="flex-1 overflow-hidden">
                <ChapterList
                  bookId={bookId}
                  chapters={chapters}
                  activeChapterId={activeChapter?.id ?? null}
                  onSelect={handleChapterSelect}
                  onChaptersChange={setChapters}
                />
              </div>

              {/* Total word count strip */}
              <div className="px-3 py-2 border-t border-gold-100 bg-cream flex-shrink-0">
                <p className="text-[10px] uppercase tracking-widest text-ink-300">
                  {totalWords.toLocaleString()} total words
                </p>
              </div>

              {/* ── Author name — always visible ─────────── */}
              <div className="px-3 py-3 border-t border-gold-200 bg-cream flex-shrink-0">
                <p className="text-[10px] font-medium uppercase tracking-widest text-ink-400 mb-1.5">
                  Author Name
                </p>
                <input
                  value={book.author_name ?? ''}
                  onChange={e =>
                    saveBookField('author_name', e.target.value)
                  }
                  className="w-full bg-paper border border-gold-200 rounded-md px-2.5 py-1.5 text-xs text-ink-800 outline-none focus:border-gold transition-colors placeholder:text-ink-300"
                  placeholder="Your name here"
                />
              </div>
            </div>

            {/* Editor area */}
            <div className="flex-1 flex flex-col overflow-hidden">

              {/* Chapter title input */}
              <div className="px-8 pt-6 pb-2 border-b border-gold-50 bg-paper flex-shrink-0">
                <input
                  value={chapterTitle}
                  onChange={e => {
                    setChapterTitle(e.target.value)
                    setChapters(prev =>
                      prev.map(c =>
                        c.id === activeChapter?.id
                          ? { ...c, title: e.target.value }
                          : c
                      )
                    )
                  }}
                  className="font-serif text-3xl text-ink-900 bg-transparent outline-none w-full placeholder:text-gold-200 transition-colors"
                  placeholder="Chapter Title…"
                />
              </div>

              {/* Rich-text editor */}
              <div className="flex-1 overflow-hidden">
                <Editor
                  content={editorContent}
                  onChange={setEditorContent}
                  placeholder="Your story begins here…"
                />
              </div>

              {/* AI toolbar (also shows save status) */}
              <AIToolbar
                chapterText={stripHtml(editorContent)}
                onApplyContent={handleApplyContent}
                saveStatus={saveStatus}
              />
            </div>
          </>
        )}

        {/* ── PREVIEW TAB ──────────────────────────────── */}
        {activeTab === 'preview' && (
          <div className="flex-1 bg-[#e8e0d0] overflow-y-auto">
            <BookPreview book={book} chapters={chapters} />
          </div>
        )}
      </div>
    </div>
  )
}