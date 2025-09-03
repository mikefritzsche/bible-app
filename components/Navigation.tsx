'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()
  
  return (
    <nav style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      gap: '24px',
      alignItems: 'center'
    }}>
      <Link 
        href="/reading-plan" 
        style={{ 
          textDecoration: 'none',
          color: '#667eea',
          fontWeight: 'bold',
          fontSize: '1.25rem'
        }}
      >
        📖 Bible Reading Plan
      </Link>
      <Link 
        href="/" 
        style={{ 
          textDecoration: 'none',
          color: pathname === '/' ? '#667eea' : '#374151',
          padding: '8px 16px',
          borderRadius: '6px',
          backgroundColor: pathname === '/' ? '#eff6ff' : '#f3f4f6',
          fontWeight: pathname === '/' ? 'bold' : 'normal'
        }}
      >
        Bible
      </Link>
      <Link 
        href="/progress" 
        style={{ 
          textDecoration: 'none',
          color: pathname === '/progress' ? '#667eea' : '#374151',
          padding: '8px 16px',
          borderRadius: '6px',
          backgroundColor: pathname === '/progress' ? '#eff6ff' : '#f3f4f6',
          fontWeight: pathname === '/progress' ? 'bold' : 'normal'
        }}
      >
        Progress
      </Link>
      <Link 
        href="/settings" 
        style={{ 
          textDecoration: 'none',
          color: pathname === '/settings' ? '#667eea' : '#374151',
          padding: '8px 16px',
          borderRadius: '6px',
          backgroundColor: pathname === '/settings' ? '#eff6ff' : '#f3f4f6',
          fontWeight: pathname === '/settings' ? 'bold' : 'normal'
        }}
      >
        Settings
      </Link>
    </nav>
  )
}