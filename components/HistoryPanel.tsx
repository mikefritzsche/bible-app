'use client'

import { useState, useEffect } from 'react'
import { SlideOutPanel } from './SlideOutPanel'
import { VerseWithStrongs } from '@/components/VerseWithStrongs'
import type { VerseHistoryEntry } from '@/lib/VerseHistoryManager'

interface HistoryPanelProps {
  history: VerseHistoryEntry[]
  onVerseSelect: (book: string, chapter: number, verse: number) => void
  onClearHistory: () => void
  onRemoveEntry: (id: string) => void
  onStrongsClick?: (strongsNumber: string, position: { x: number; y: number }) => void
  isOpen: boolean
  onClose: () => void
}

export function HistoryPanel({
  history,
  onVerseSelect,
  onClearHistory,
  onRemoveEntry,
  onStrongsClick,
  isOpen,
  onClose
}: HistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredHistory, setFilteredHistory] = useState(history)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    if (searchQuery) {
      const filtered = history.filter(entry =>
        entry.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.verseText.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredHistory(filtered)
    } else {
      setFilteredHistory(history)
    }
  }, [searchQuery, history])

  // Check dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()

    // Set up observer for class changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  const hasStrongsNumbers = (text: string) => {
    return /\{[HG]\d+\}/.test(text)
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const timestamp = new Date(date)
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

    return timestamp.toLocaleDateString()
  }

  const handleVerseSelect = (book: string, chapter: number, verse: number) => {
    onVerseSelect(book, chapter, verse)
    onClose()
  }

  return (
    <SlideOutPanel
      isOpen={isOpen}
      onClose={onClose}
      title="History"
      subtitle={`${history.length} verse${history.length !== 1 ? 's' : ''} visited`}
      position="right"
      width="w-96 md:w-[28rem]"
    >
      <div className="flex flex-col h-full">
        {/* Search and Clear */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-500"
            />
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors whitespace-nowrap"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-10 px-5 text-gray-400 dark:text-gray-500">
              {searchQuery ? (
                <p>No history entries found matching your search.</p>
              ) : (
                <>
                  <p className="mb-2">No verse history yet.</p>
                  <p className="text-sm">Click on verses to track your reading history.</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer transition-all border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-blue-500 dark:hover:border-blue-400 group"
                  onClick={() => handleVerseSelect(entry.book, entry.chapter, entry.verse)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <strong className="text-blue-600 dark:text-blue-400">
                        {entry.reference}
                      </strong>
                      <span className="text-xs text-gray-500 dark:text-gray-400 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">
                        {entry.version.toUpperCase()}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveEntry(entry.id)
                      }}
                      className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 text-xl leading-none transition-all"
                      title="Remove from history"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2 mb-2">
                    {hasStrongsNumbers(entry.verseText) && onStrongsClick ? (
                      <VerseWithStrongs
                        text={entry.verseText}
                        verseNumber={null}
                        onStrongsClick={onStrongsClick}
                        isDarkMode={isDarkMode}
                      />
                    ) : (
                      entry.verseText
                    )}
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SlideOutPanel>
  )
}