'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'loading'
interface Toast { id: string; message: string; type: ToastType }
interface ToastContextValue {
  success: (msg: string) => void
  error:   (msg: string) => void
  info:    (msg: string) => void
  loading: (msg: string) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const add = useCallback((message: string, type: ToastType, autoDismiss = true): string => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    if (autoDismiss && type !== 'loading') {
      timerRef.current[id] = setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
        delete timerRef.current[id]
      }, type === 'error' ? 4000 : 2500)
    }
    return id
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    if (timerRef.current[id]) {
      clearTimeout(timerRef.current[id])
      delete timerRef.current[id]
    }
  }, [])

  const value: ToastContextValue = {
    success: (msg) => { add(msg, 'success') },
    error:   (msg) => { add(msg, 'error') },
    info:    (msg) => { add(msg, 'info') },
    loading: (msg) => add(msg, 'loading', false),
    dismiss,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={[
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-xl pointer-events-auto',
              toast.type === 'success' ? 'bg-[#1a1208] text-[#c9a84c] border border-[#c9a84c33]' :
              toast.type === 'error'   ? 'bg-red-950 text-red-200 border border-red-800' :
              toast.type === 'loading' ? 'bg-[#1a1208] text-[#e8d5a3] border border-[#ffffff22]' :
                                         'bg-[#2d2010] text-[#e8d5a3] border border-[#ffffff22]'
            ].join(' ')}
          >
            <span>
              {toast.type === 'success' ? '✓' :
               toast.type === 'error'   ? '✕' :
               toast.type === 'loading' ? '⟳' : 'ℹ'}
            </span>
            <span>{toast.message}</span>
            {toast.type !== 'loading' && (
              <button
                onClick={() => dismiss(toast.id)}
                className="ml-2 opacity-50 hover:opacity-100 transition-opacity text-xs"
              >✕</button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}