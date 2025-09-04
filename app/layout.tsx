import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import { ThemeProvider } from '@/lib/ThemeContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bible Reading Plan - Next.js App',
  description: 'Read the Bible with Strong\'s Concordance and Daily Reading Plans',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <ThemeProvider>
          <div className="min-h-screen p-6">
            <div className="max-w-5xl mx-auto">
              <Navigation />
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}