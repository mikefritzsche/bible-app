'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()
  
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }
  
  return (
    <nav className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-6">
        <Link 
          href="/reading-plan" 
          className="text-blue-600 dark:text-blue-400 font-bold text-xl no-underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          📖 Bible Reading Plan
        </Link>
        <div className="flex gap-2">
          <Link 
            href="/" 
            className={`px-4 py-2 rounded-md transition-colors no-underline ${
              isActive('/') && pathname === '/'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Bible
          </Link>
          <Link 
            href="/progress" 
            className={`px-4 py-2 rounded-md transition-colors no-underline ${
              isActive('/progress')
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Progress
          </Link>
          <Link 
            href="/highlights" 
            className={`px-4 py-2 rounded-md transition-colors no-underline ${
              isActive('/highlights')
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Highlights
          </Link>
          <Link 
            href="/settings" 
            className={`px-4 py-2 rounded-md transition-colors no-underline ${
              isActive('/settings')
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Settings
          </Link>
          <Link 
            href="/sync-demo" 
            className={`px-4 py-2 rounded-md transition-colors no-underline ${
              isActive('/sync-demo')
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Sync
          </Link>
        </div>
      </div>
    </nav>
  )
}