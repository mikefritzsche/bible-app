'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Book,
  CalendarCheck,
  TrendingUp,
  Bookmark,
  Settings,
  Cloud,
  Menu,
  X
} from 'lucide-react'
import { PanelControls } from './PanelControls'

export default function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  const navItems = [
    { href: '/', label: 'Bible', icon: Book },
    { href: '/reading-plan', label: 'Reading Plan', icon: CalendarCheck },
    { href: '/progress', label: 'Progress', icon: TrendingUp },
    { href: '/highlights', label: 'Highlights', icon: Bookmark },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/sync-demo', label: 'Sync', icon: Cloud }
  ]

  const getCurrentViewName = () => {
    if (pathname === '/') return 'Bible'
    if (pathname.startsWith('/reading-plan')) return 'Reading Plan'
    if (pathname.startsWith('/progress')) return 'Progress'
    if (pathname.startsWith('/highlights')) return 'Highlights'
    if (pathname.startsWith('/settings')) return 'Settings'
    if (pathname.startsWith('/sync')) return 'Sync'
    return 'Bible'
  }

  const getCurrentIcon = () => {
    const currentItem = navItems.find(item => {
      if (item.href === '/') return pathname === '/'
      return pathname.startsWith(item.href)
    })
    return currentItem?.icon || Book
  }

  const CurrentIcon = getCurrentIcon()

  return (
    <>
      <nav className="bg-white dark:bg-gray-800 p-4">
        {/* Mobile Navigation Header */}
        <div className="flex md:hidden items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-lg">
            <CurrentIcon className="w-5 h-5" />
            <span>{getCurrentViewName()}</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/reading-plan"
              className="text-blue-600 dark:text-blue-400 font-bold text-xl no-underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-2"
            >
              <CalendarCheck className="w-6 h-6" />
              <span>Reading Plan</span>
            </Link>
            <div className="flex gap-2">
              {navItems.filter(item => item.href !== '/reading-plan').map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-md transition-colors no-underline flex items-center gap-2 ${
                      isActive(item.href) && (item.href === '/' ? pathname === '/' : true)
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Panel Controls */}
          <div className="flex items-center gap-4">
            <PanelControls />
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-white dark:bg-gray-800 z-50 md:hidden shadow-2xl">
            <div className="p-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors no-underline ${
                        isActive(item.href) && (item.href === '/' ? pathname === '/' : true)
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  )
}