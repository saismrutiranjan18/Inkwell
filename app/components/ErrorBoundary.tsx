'use client'

import { Component, type ReactNode } from 'react'
import Link from 'next/link'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4 opacity-60">✦</div>
            <h2 className="font-serif text-2xl text-[#1a1208] mb-2">Something went wrong</h2>
            <p className="text-sm text-[#8a7f72] mb-2 leading-relaxed">
              An unexpected error occurred. Your writing is safe — it auto-saves every few seconds.
            </p>
            {this.state.message && (
              <p className="text-xs text-red-400 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-6 font-mono">
                {this.state.message}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, message: '' })}
                className="bg-[#1a1208] text-[#c9a84c] text-sm font-medium px-5 py-2 rounded-lg"
              >
                Try again
              </button>
              <Link href="/dashboard" className="border border-[#ddd5c5] text-[#5f5038] text-sm px-5 py-2 rounded-lg">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export function PageSkeleton({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl text-[#c9a84c] mb-4 animate-pulse">✦</div>
        <p className="text-[#8a7f72] text-sm">{label}</p>
      </div>
    </div>
  )
}

export function NotFound({ message }: { message?: string }) {
  return (
    <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4 opacity-50">✦</div>
        <h2 className="text-2xl text-[#1a1208] mb-2" style={{ fontFamily: 'serif' }}>Not Found</h2>
        <p className="text-sm text-[#8a7f72] mb-6">{message ?? "This page doesn't exist."}</p>
        <Link href="/dashboard" className="bg-[#1a1208] text-[#c9a84c] text-sm font-medium px-5 py-2 rounded-lg inline-block">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}