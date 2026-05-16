import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper flex flex-col">
      {/* Nav */}
      <nav className="bg-ink-900 px-8 h-14 flex items-center justify-between">
        <span className="font-serif text-gold text-2xl">
          <em>Ink</em>well
        </span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gold-300 hover:text-gold transition-colors">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="bg-gold text-ink-900 text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-gold-300 transition-colors"
          >
            Start writing
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <p className="text-sm font-medium tracking-widest text-gold uppercase mb-6">
          Your story deserves to be a book
        </p>
        <h1 className="font-serif text-5xl md:text-7xl text-ink-900 leading-tight max-w-3xl mb-6">
          Write it.<br />
          <em className="text-gold-500">Format it.</em><br />
          Publish it.
        </h1>
        <p className="text-ink-400 text-lg max-w-xl mb-10 leading-relaxed">
          Inkwell turns your writing into a beautifully formatted book — complete with a custom cover,
          table of contents, and print-ready PDF export.
        </p>
        <Link
          href="/signup"
          className="bg-ink-900 text-gold font-medium px-8 py-3 rounded-xl text-base hover:bg-ink-700 transition-colors shadow-book"
        >
          Start your book — it&apos;s free
        </Link>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-12">
          {[
            '✍ Rich text editor',
            '✦ AI formatting',
            '🎨 Cover designer',
            '📖 Book preview',
            '⬇ PDF export',
          ].map(f => (
            <span key={f} className="bg-cream border border-gold-200 text-ink-600 text-sm px-4 py-1.5 rounded-full">
              {f}
            </span>
          ))}
        </div>
      </section>
    </main>
  )
}
