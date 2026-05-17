'use client'

import type { Book, Chapter } from '@/types'

interface BookPreviewProps {
  book: Book
  chapters: Chapter[]
  previewRef?: React.RefObject<HTMLDivElement>
}

export function BookPreview({ book, chapters, previewRef }: BookPreviewProps) {
  const theme = book.cover_theme ?? { bg: '#1a1208', text: '#c9a84c', accent: 'rgba(201,168,76,0.6)' }
  const filledChapters = chapters.filter(ch => ch.content_text?.trim())

  return (
    <div ref={previewRef} id="book-preview-root" className="flex flex-col items-center gap-8 py-8 px-4">

      {/* Cover Page */}
      <Page id="cover-page">
        <div className="w-full h-full flex flex-col items-center justify-center text-center px-14"
          style={{ background: theme.bg, color: theme.text }}>
          <div className="text-4xl mb-4 opacity-80">{book.cover_ornament ?? '✦'}</div>
          <div className="w-14 border-t mb-6" style={{ borderColor: theme.accent }} />
          <h1 className="font-serif text-4xl font-bold leading-tight mb-3">{book.title || 'Untitled'}</h1>
          {(book.cover_subtitle || book.subtitle) && (
            <p className="text-xs tracking-[0.2em] uppercase opacity-60 mb-8">
              {book.cover_subtitle || book.subtitle}
            </p>
          )}
          <div className="w-14 border-t mb-6" style={{ borderColor: theme.accent }} />
          <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic' }} className="text-base opacity-80">
            {book.author_name || 'Author'}
          </p>
        </div>
      </Page>

      {/* Table of Contents */}
      {filledChapters.length > 0 && (
        <Page>
          <PageHeader bookTitle={book.title} />
          <div className="flex-1 px-14 py-10">
            <h2 className="font-serif text-2xl text-center text-ink-900 mb-8">Contents</h2>
            <div className="space-y-3">
              {filledChapters.map((ch, i) => (
                <div key={ch.id} className="flex items-baseline gap-1">
                  <span style={{ fontFamily: 'Lora, serif', fontStyle: 'italic' }} className="text-sm text-ink-700">{ch.title}</span>
                  <span className="flex-1 border-b border-dotted border-ink-200 mx-2" />
                  <span className="text-xs text-ink-300 tabular-nums">{i * 14 + 1}</span>
                </div>
              ))}
            </div>
          </div>
          <PageFooter page={0} />
        </Page>
      )}

      {/* Chapter Pages */}
      {filledChapters.map((ch, chIdx) => {
        const paragraphs = (ch.content_text ?? '').split('\n').map(p => p.trim()).filter(Boolean)
        return (
          <Page key={ch.id}>
            <PageHeader bookTitle={book.title} chapterTitle={ch.title} />
            <div className="flex-1 px-14 py-8 overflow-hidden">
              <p className="text-[9px] tracking-[0.25em] uppercase text-ink-300 text-center mb-1">Chapter {chIdx + 1}</p>
              <h2 className="font-serif text-2xl text-center text-ink-900 mb-8">{ch.title}</h2>
              {paragraphs.map((p, pi) =>
                p === '* * *'
                  ? <p key={pi} className="text-center text-ink-300 tracking-[0.5em] my-5 text-sm">* * *</p>
                  : <p key={pi} className={`text-sm leading-7 text-ink-800 text-justify mb-3 ${pi === 0 ? 'book-drop-cap' : ''}`}
                      style={{ fontFamily: 'Lora, serif' }}>{p}</p>
              )}
            </div>
            <PageFooter page={chIdx * 14 + 1} />
          </Page>
        )
      })}
    </div>
  )
}

function Page({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="relative bg-white flex flex-col"
      style={{ width: '500px', minHeight: '680px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)', borderRadius: '2px' }}>
      {children}
    </div>
  )
}

function PageHeader({ bookTitle, chapterTitle }: { bookTitle: string; chapterTitle?: string }) {
  return (
    <div className="px-14 pt-8 pb-3 border-b border-ink-100 flex justify-between">
      <span className="text-[8px] tracking-[0.2em] uppercase text-ink-300">{bookTitle?.toUpperCase()}</span>
      {chapterTitle && <span className="text-[8px] tracking-[0.15em] uppercase text-ink-300">{chapterTitle?.toUpperCase()}</span>}
    </div>
  )
}

function PageFooter({ page }: { page: number }) {
  return (
    <div className="px-14 pb-6 pt-3 border-t border-ink-100 flex justify-center">
      <span className="text-[9px] text-ink-300 tracking-widest">{page || ''}</span>
    </div>
  )
}