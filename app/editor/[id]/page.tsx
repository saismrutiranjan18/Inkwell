'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase-client'
import { stripHtml } from '@/lib/utils'
import { ChapterList } from '@/components/ChapterList'
import { Editor } from '@/components/Editor'
import { AIToolbar } from '@/components/AIToolbar'
import { useAutoSave } from '@/hooks/useAutoSave'
import type { Book, Chapter } from '@/types'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
type Tab = 'write' | 'cover' | 'preview'

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
        const { data: newBook } = await supabase
          .from('books').insert({ user_id: user.id, title: 'Untitled Book', author_name: '' }).select().single()
        if (!newBook) { router.push('/dashboard'); return }
        const { data: firstChapter } = await supabase
          .from('chapters').insert({ book_id: newBook.id, title: 'Chapter 1', order_index: 0 }).select().single()
        router.replace(`/editor/${newBook.id}`)
        setBook(newBook as Book)
        if (firstChapter) { setChapters([firstChapter as Chapter]); setActiveChapter(firstChapter as Chapter); setChapterTitle(firstChapter.title); setEditorContent(firstChapter.content ?? '') }
        setLoading(false); return
      }
      const [{ data: bookData }, { data: chapterData }] = await Promise.all([
        supabase.from('books').select('*').eq('id', bookId).single(),
        supabase.from('chapters').select('*').eq('book_id', bookId).order('order_index'),
      ])
      if (!bookData) { router.push('/dashboard'); return }
      setBook(bookData as Book)
      const chs = (chapterData as Chapter[]) ?? []
      setChapters(chs)
      if (chs.length > 0) { setActiveChapter(chs[0]); setChapterTitle(chs[0].title); setEditorContent(chs[0].content ?? '') }
      setLoading(false)
    }
    load()
  }, [bookId])

  useEffect(() => {
    function onApplyTitle(e: Event) {
      const title = (e as CustomEvent<string>).detail
      setChapterTitle(title)
      setChapters(prev => prev.map(c => c.id === activeChapter?.id ? { ...c, title } : c))
    }
    window.addEventListener('inkwell:apply-title', onApplyTitle)
    return () => window.removeEventListener('inkwell:apply-title', onApplyTitle)
  }, [activeChapter?.id])

  const { forceSave } = useAutoSave({ chapter: activeChapter, content: editorContent, title: chapterTitle, onStatusChange: setSaveStatus })

  const handleChapterSelect = useCallback(async (chapter: Chapter) => {
    await forceSave()
    setActiveChapter(chapter); setChapterTitle(chapter.title); setEditorContent(chapter.content ?? '')
  }, [forceSave])

  async function saveBookMeta(field: 'title' | 'author_name', value: string) {
    if (!book) return
    setBook(prev => prev ? { ...prev, [field]: value } : prev)
    await supabase.from('books').update({ [field]: value }).eq('id', book.id)
  }

  function handleApplyContent(text: string) {
    const html = text.split('\n\n').map(p => p.trim() ? `<p>${p.replace(/\n/g, '<br>')}</p>` : '<p></p>').join('')
    setEditorContent(html)
  }

  if (loading) return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div className="text-center"><div className="font-serif text-4xl text-gold mb-4">✦</div><p className="text-ink-400 text-sm">Loading your book…</p></div>
    </div>
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-paper">
      <nav className="bg-ink-900 px-6 flex items-center gap-4 flex-shrink-0" style={{ height: '52px' }}>
        <Link href="/dashboard" className="text-gold-500 hover:text-gold text-sm mr-2">← Dashboard</Link>
        <input value={book?.title ?? ''} onChange={e => saveBookMeta('title', e.target.value)}
          className="bg-transparent text-gold font-serif text-lg outline-none border-b border-transparent focus:border-gold-700 min-w-0 flex-1 max-w-xs" placeholder="Book Title" />
        <div className="flex items-center gap-1 ml-auto">
          {(['write', 'cover', 'preview'] as Tab[]).map(tab => (
            <button key={tab} onClick={() => { forceSave(); setActiveTab(tab) }}
              className={`px-3 py-1 rounded-md text-sm capitalize ${activeTab === tab ? 'bg-gold-800/30 text-gold' : 'text-gold-500 hover:text-gold'}`}>
              {{ write: '✍ Write', cover: '🎨 Cover', preview: '📖 Preview' }[tab]}
            </button>
          ))}
        </div>
        <Link href={`/cover/${bookId}`} className="bg-gold text-ink-900 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gold-300 ml-2">Export PDF</Link>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'write' && (
          <>
            <div className="flex flex-col flex-shrink-0">
              <ChapterList bookId={bookId} chapters={chapters} activeChapterId={activeChapter?.id ?? null} onSelect={handleChapterSelect} onChaptersChange={setChapters} />
              <div className="border-t border-gold-200 p-3 bg-cream w-60">
                <p className="text-[10px] uppercase tracking-widest text-ink-300 mb-1">Author Name</p>
                <input value={book?.author_name ?? ''} onChange={e => saveBookMeta('author_name', e.target.value)}
                  className="w-full bg-paper border border-gold-200 rounded-md px-2 py-1 text-xs text-ink-700 outline-none focus:border-gold" placeholder="Your name" />
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-8 pt-6 pb-1 border-b border-gold-50">
                <input value={chapterTitle} onChange={e => { setChapterTitle(e.target.value); setChapters(prev => prev.map(c => c.id === activeChapter?.id ? { ...c, title: e.target.value } : c)) }}
                  className="font-serif text-3xl text-ink-900 bg-transparent outline-none w-full placeholder:text-gold-200" placeholder="Chapter Title…" />
              </div>
              <div className="flex-1 overflow-hidden">
                <Editor content={editorContent} onChange={setEditorContent} placeholder="Your story begins here…" />
              </div>
              <AIToolbar chapterText={stripHtml(editorContent)} onApplyContent={handleApplyContent} saveStatus={saveStatus} />
            </div>
          </>
        )}
        {activeTab === 'preview' && (
          <div className="flex-1 bg-gray-200 overflow-y-auto flex flex-col items-center py-8 gap-6">
            {/* BookPreview component here */}
          </div>
        )}
      </div>
    </div>
  )
}