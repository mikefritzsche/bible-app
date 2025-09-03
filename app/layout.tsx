import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
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
    <html lang="en">
      <body>
        <div style={{ 
          backgroundColor: '#f3f4f6', 
          minHeight: '100vh',
          padding: '24px'
        }}>
          <div style={{ 
            maxWidth: '1024px', 
            margin: '0 auto'
          }}>
            <Navigation />
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}