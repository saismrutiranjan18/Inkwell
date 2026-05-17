import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/app/components/Toast'
import { ErrorBoundary } from '@/app/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Inkwell — Write Your Book',
  description: 'Turn your story into a beautifully formatted book. Write, design your cover, and export as PDF.',
  openGraph: {
    title: 'Inkwell — Write Your Book',
    description: 'Turn your story into a beautifully formatted book.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}