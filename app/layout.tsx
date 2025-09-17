import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import { ThemeProvider } from '@/lib/ThemeContext'
import { SettingsProvider } from '@/lib/SettingsContext'
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
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 h-screen overflow-hidden">
        <ThemeProvider>
          <SettingsProvider>
            <div className="h-screen flex flex-col">
              {/* Fixed Navigation */}
              <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-5xl mx-auto px-6">
                  <Navigation />
                </div>
              </div>
              {/* Scrollable Main Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-6">
                  {children}
                </div>
              </div>
            </div>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}