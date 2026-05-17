import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-paper flex flex-col items-center justify-center px-6 text-center">
      <div className="font-serif text-6xl text-gold opacity-40 mb-6">✦</div>
      <h1 className="font-serif text-4xl text-ink-900 mb-3">Page Not Found</h1>
      <p className="text-ink-400 text-base max-w-sm mb-8 leading-relaxed">
        The page you're looking for doesn't exist — or perhaps your story hasn't reached this chapter yet.
      </p>
      <div className="flex gap-3">
        <Link href="/dashboard" className="bg-ink-900 text-gold font-medium px-6 py-2.5 rounded-xl text-sm hover:bg-ink-700 transition-colors">
          Go to Dashboard
        </Link>
        <Link href="/" className="border border-gold-200 text-ink-600 font-medium px-6 py-2.5 rounded-xl text-sm hover:bg-cream transition-colors">
          Home
        </Link>
      </div>
    </main>
  )
}