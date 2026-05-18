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

  useEffect(() => {
    async function load() {
      setLoading(true)

      if (bookId === 'new') {
        const { data: { user } } = await supabase.auth.getUser()
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

        if (bookError || !newBook) {
          console.error('Book creation failed:', bookError)
          router.push('/dashboard')
          return
        }

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

        if (chapterError || !firstChapter) {
          console.error('Chapter creation failed:', chapterError)
          router.push('/dashboard')
          return
        }

        // Pehle state set karo, phir redirect
        setBook(newBook as Book)
        setChapters([firstChapter as Chapter])
        setActiveChapter(firstChapter as Chapter)
        setChapterTitle(firstChapter.title)
        setEditorContent(firstChapter.content ?? '')
        setLoading(false)

        // URL update karo without re-render
        router.replace(`/editor/${newBook.id}`)
        return
      }

      // Existing book load karo
      const [{ data: bookData, error: bookErr }, { data: chapterData, error: chapterErr }] =
        await Promise.all([
          supabase.from('books').select('*').eq('id', bookId).single(),
          supabase.from('chapters').select('*').eq('book_id', bookId).order('order_index'),
        ])

      if (bookErr || !bookData) {
        console.error('Book not found:', bookErr)
        router.push('/dashboard')
        return
      }

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

  // AI title apply karne ka event listener
  useEffect(() => {
    function onApplyTitle(e: Event) {
      const title = (e as CustomEvent<string>).detail
      setChapterTitle(title)
      setChapters(prev => prev.map(c => c.id === activeChapter?.id ? { ...c, title } : c))
    }
    window.addEventListener('inkwell:apply-title', onApplyTitle)
    return () => window.removeEventListener('inkwell:apply-title', onApplyTitle)
  }, [activeChapter?.id])

  const { forceSave } = useAutoSave({
    chapter: activeChapter,
    content: editorContent,
    title: chapterTitle,
    onStatusChange: setSaveStatus,
  })

  const handleChapterSelect = useCallback(async (chapter: Chapter) => {
    await forceSave()
    setActiveChapter(chapter)
    setChapterTitle(chapter.title)
    setEditorContent(chapter.content ?? '')
  }, [forceSave])

  async function saveBookMeta(field: 'title' | 'author_name', value: string) {
    if (!book) return
    setBook(prev => prev ? { ...prev, [field]: value } : prev)
    const { error } = await supabase.from('books').update({ [field]: value }).eq('id', book.id)
    if (error) console.error('Book meta save error:', error)
  }

  function handleApplyContent(text: string) {
    // Plain text ko TipTap HTML mein convert karo
    const html = text
      .split('\n\n')
      .map(p => p.trim() ? `<p>${p.replace(/\n/g, '<br>')}</p>` : '')
      .filter(Boolean)
      .join('')
    setEditorContent(html || '<p></p>')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <div className="font-serif text-4xl text-gold mb-4 animate-pulse">✦</div>
          <p className="text-ink-400 text-sm">Loading your book…</p>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-400">Book nahi mili. Dashboard pe wapas jaayein.</p>
          <Link href="/dashboard" className="mt-4 inline-block bg-ink-900 text-gold px-4 py-2 rounded-lg text-sm">
            Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-paper">
      {/* Top Navigation */}
      <nav className="bg-ink-900 px-6 flex items-center gap-4 flex-shrink-0" style={{ height: '52px' }}>
        <Link href="/dashboard" className="text-gold-500 hover:text-gold text-sm mr-2 flex-shrink-0">
          ← Dashboard
        </Link>
        <input
          value={book.title ?? ''}
          onChange={e => saveBookMeta('title', e.target.value)}
          className="bg-transparent text-gold font-serif text-lg outline-none border-b border-transparent focus:border-gold-700 min-w-0 flex-1 max-w-xs truncate"
          placeholder="Book Title"
        />
        <div className="flex items-center gap-1 ml-auto">
          {(['write', 'preview'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => { forceSave(); setActiveTab(tab) }}
              className={`px-3 py-1 rounded-md text-sm capitalize ${activeTab === tab ? 'bg-gold-800/30 text-gold' : 'text-gold-500 hover:text-gold'}`}
            >
              {{ write: '✍ Write', preview: '📖 Preview' }[tab]}
            </button>
          ))}
        </div>
        <Link
          href={`/cover/${bookId}`}
          onClick={() => forceSave()}
          className="bg-gold text-ink-900 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gold-300 ml-2 flex-shrink-0"
        >
          🎨 Cover & Export
        </Link>
      </nav>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Write Tab */}
        {activeTab === 'write' && (
          <>
            {/* Left sidebar: chapters + author */}
            <div className="flex flex-col flex-shrink-0">
              <ChapterList
                bookId={bookId}
                chapters={chapters}
                activeChapterId={activeChapter?.id ?? null}
                onSelect={handleChapterSelect}
                onChaptersChange={setChapters}
              />
              <div className="border-t border-gold-200 p-3 bg-cream w-60">
                <p className="text-[10px] uppercase tracking-widest text-ink-300 mb-1">Author Name</p>
                <input
                  value={book.author_name ?? ''}
                  onChange={e => saveBookMeta('author_name', e.target.value)}
                  className="w-full bg-paper border border-gold-200 rounded-md px-2 py-1 text-xs text-ink-700 outline-none focus:border-gold"
                  placeholder="Your name"
                />
              </div>
            </div>

            {/* Editor area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-8 pt-6 pb-1 border-b border-gold-50">
                <input
                  value={chapterTitle}
                  onChange={e => {
                    setChapterTitle(e.target.value)
                    setChapters(prev => prev.map(c =>
                      c.id === activeChapter?.id ? { ...c, title: e.target.value } : c
                    ))
                  }}
                  className="font-serif text-3xl text-ink-900 bg-transparent outline-none w-full placeholder:text-gold-200"
                  placeholder="Chapter Title…"
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <Editor
                  content={editorContent}
                  onChange={setEditorContent}
                  placeholder="Your story begins here…"
                />
              </div>
              <AIToolbar
                chapterText={stripHtml(editorContent)}
                onApplyContent={handleApplyContent}
                saveStatus={saveStatus}
              />
            </div>
          </>
        )}

        {/* Preview Tab - FIXED: BookPreview actually render ho raha hai */}
        {activeTab === 'preview' && (
          <div className="flex-1 bg-[#e8e0d0] overflow-y-auto">
            <BookPreview book={book} chapters={chapters} />
          </div>
        )}
      </div>
    </div>
  )
}
