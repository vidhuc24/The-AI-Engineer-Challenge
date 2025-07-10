import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PyPal - Python Programming Assistant',
  description: 'Your intelligent Python programming companion with access to comprehensive documentation and code examples.',
  keywords: ['python', 'programming', 'assistant', 'ai', 'code', 'documentation'],
  authors: [{ name: 'PyPal Team' }],
  openGraph: {
    title: 'PyPal - Python Programming Assistant',
    description: 'Your intelligent Python programming companion',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
