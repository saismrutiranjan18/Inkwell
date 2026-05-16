'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-client'

export default function SignupPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-paper flex flex-col items-center justify-center px-4">
        <div className="bg-white border border-gold-200 rounded-2xl p-8 w-full max-w-sm shadow-page text-center">
          <div className="text-4xl mb-4">✦</div>
          <h2 className="font-serif text-2xl text-ink-900 mb-2">Check your email</h2>
          <p className="text-sm text-ink-400 leading-relaxed">
            We sent a confirmation link to <strong className="text-ink-700">{email}</strong>.
            Click it to activate your account and start writing.
          </p>
          <Link href="/login" className="mt-6 inline-block text-sm text-gold-500 hover:text-gold">
            Back to sign in
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-paper flex flex-col items-center justify-center px-4">
      <Link href="/" className="font-serif text-gold text-3xl mb-8 block">
        <em>Ink</em>well
      </Link>

      <div className="bg-white border border-gold-200 rounded-2xl p-8 w-full max-w-sm shadow-page">
        <h1 className="font-serif text-2xl text-ink-900 mb-1">Start your book</h1>
        <p className="text-sm text-ink-400 mb-6">Free forever. No credit card needed.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide mb-1.5">
              Your name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gold-200 rounded-lg text-sm text-ink-900 bg-paper outline-none focus:border-gold transition-colors"
              placeholder="Arjun Sharma"
            />
          </div>

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
              minLength={8}
              className="w-full px-3 py-2.5 border border-gold-200 rounded-lg text-sm text-ink-900 bg-paper outline-none focus:border-gold transition-colors"
              placeholder="Min. 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink-900 text-gold font-medium py-2.5 rounded-lg text-sm hover:bg-ink-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-400 mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-gold-500 hover:text-gold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
