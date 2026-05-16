import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { formatDate, wordCount } from '@/lib/utils'
import type { Book } from '@/types'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const displayName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Writer'

  return (
    <main className="min-h-screen bg-paper">
      {/* Nav */}
      <nav className="bg-ink-900 px-8 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="font-serif text-gold text-xl">
          <em>Ink</em>well
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gold-300">{displayName}</span>
          <form action="/auth/signout" method="post">
            <button className="text-xs text-gold-500 hover:text-gold border border-gold-700 px-3 py-1 rounded-md transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-ink-900">Your Books</h1>
            <p className="text-sm text-ink-400 mt-1">
              {books?.length ?? 0} book{books?.length !== 1 ? 's' : ''} in progress
            </p>
          </div>
          <NewBookButton userId={user.id} />
        </div>

        {/* Book grid */}
        {books && books.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {books.map((book: Book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <EmptyState userId={user.id} />
        )}
      </div>
    </main>
  )
}

function BookCard({ book }: { book: Book }) {
  const theme = book.cover_theme
  return (
    <Link href={`/editor/${book.id}`} className="group block">
      {/* Book cover thumbnail */}
      <div
        className="w-full aspect-[2/3] rounded-lg shadow-book flex flex-col items-center justify-center text-center p-4 mb-3 transition-transform group-hover:-rotate-1 group-hover:scale-[1.02]"
        style={{ background: theme?.bg ?? '#1a1208', color: theme?.text ?? '#c9a84c' }}
      >
        <div className="text-xl mb-2 opacity-80">{book.cover_ornament ?? '✦'}</div>
        <div
          className="text-xs uppercase tracking-widest opacity-50 mb-2"
          style={{ borderTop: `1px solid ${theme?.accent ?? 'rgba(201,168,76,0.4)'}`, paddingTop: '8px', width: '40px' }}
        />
        <div className="font-serif text-sm font-semibold leading-snug line-clamp-3">
          {book.title}
        </div>
        <div
          className="text-xs opacity-50 mt-2"
          style={{ borderTop: `1px solid ${theme?.accent ?? 'rgba(201,168,76,0.4)'}`, paddingTop: '8px', width: '40px' }}
        />
        <div className="text-xs opacity-70 mt-1 italic" style={{ fontFamily: 'Lora, serif' }}>
          {book.author_name}
        </div>
      </div>
      {/* Info */}
      <div>
        <p className="text-sm font-medium text-ink-800 truncate">{book.title}</p>
        <p className="text-xs text-ink-400 mt-0.5">
          {book.total_words.toLocaleString()} words · {formatDate(book.updated_at)}
        </p>
      </div>
    </Link>
  )
}

function NewBookButton({ userId }: { userId: string }) {
  return (
    <Link
      href="/editor/new"
      className="bg-ink-900 text-gold text-sm font-medium px-5 py-2 rounded-lg hover:bg-ink-700 transition-colors flex items-center gap-2"
    >
      <span className="text-base">+</span> New Book
    </Link>
  )
}

function EmptyState({ userId }: { userId: string }) {
  return (
    <div className="text-center py-24">
      <div className="text-5xl mb-4">✦</div>
      <h2 className="font-serif text-2xl text-ink-700 mb-2">Your shelf is empty</h2>
      <p className="text-ink-400 text-sm mb-6">Every great book starts with a single word.</p>
      <Link
        href="/editor/new"
        className="bg-ink-900 text-gold text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-ink-700 transition-colors inline-block"
      >
        Write your first book
      </Link>
    </div>
  )
}
