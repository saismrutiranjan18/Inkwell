import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Inkwell — Write Your Book',
  description: 'Turn your story into a beautifully formatted book. Write, design your cover, and export as PDF.',
  keywords: ['book writing', 'novel', 'story', 'self-publishing'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
