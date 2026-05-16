'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <main className="min-h-screen bg-paper flex flex-col items-center justify-center px-4">
      <Link href="/" className="font-serif text-gold text-3xl mb-8 block">
        <em>Ink</em>well
      </Link>

      <div className="bg-white border border-gold-200 rounded-2xl p-8 w-full max-w-sm shadow-page">
        <h1 className="font-serif text-2xl text-ink-900 mb-1">Welcome back</h1>
        <p className="text-sm text-ink-400 mb-6">Sign in to continue your story</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gold-200 rounded-lg text-sm text-ink-900 bg-paper outline-none focus:border-gold transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gold-200 rounded-lg text-sm text-ink-900 bg-paper outline-none focus:border-gold transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink-900 text-gold font-medium py-2.5 rounded-lg text-sm hover:bg-ink-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 border-t border-gold-100" />
          <span className="text-xs text-ink-300">or</span>
          <div className="flex-1 border-t border-gold-100" />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full border border-gold-200 text-ink-600 text-sm font-medium py-2.5 rounded-lg hover:bg-cream transition-colors flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <p className="text-center text-sm text-ink-400 mt-5">
          No account?{' '}
          <Link href="/signup" className="text-gold-500 hover:text-gold transition-colors">
            Sign up free
          </Link>
        </p>
      </div>
    </main>
  )
}
