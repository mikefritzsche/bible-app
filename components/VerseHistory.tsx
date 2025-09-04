'use client'

import { useState, useEffect } from 'react'
import type { VerseHistoryEntry } from '@/lib/VerseHistoryManager'

interface VerseHistoryProps {
  history: VerseHistoryEntry[]
  onVerseSelect: (book: string, chapter: number, verse: number) => void
  onClearHistory: () => void
  onRemoveEntry: (id: string) => void
}

export function VerseHistory({ 
  history, 
  onVerseSelect, 
  onClearHistory,
  onRemoveEntry 
}: VerseHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredHistory, setFilteredHistory] = useState(history)
  const [isExpanded, setIsExpanded] = useState(false)

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

  const displayedHistory = isExpanded ? filteredHistory : filteredHistory.slice(0, 10)

  if (history.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 dark:text-gray-400">
        <p className="mb-2">No verse history yet.</p>
        <p className="text-sm">Click on verses to track your reading history.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Verse History
        </h3>
        <button
          onClick={onClearHistory}
          className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          Clear All
        </button>
      </div>

      {history.length > 5 && (
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      )}

      <div className={`${isExpanded ? 'max-h-[600px]' : 'max-h-[400px]'} overflow-y-auto pr-1`}>
        {displayedHistory.map((entry) => (
          <div
            key={entry.id}
            className="flex justify-between items-start p-3 mb-2 bg-gray-50 dark:bg-gray-700/50 rounded-md cursor-pointer transition-all border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-blue-500 dark:hover:border-blue-400"
            onClick={() => onVerseSelect(entry.book, entry.chapter, entry.verse)}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <strong className="text-blue-600 dark:text-blue-400">
                  {entry.reference}
                </strong>
                <span className="text-xs text-gray-500 dark:text-gray-400 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">
                  {entry.version.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                {entry.verseText}
              </p>
              <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 inline-block">
                {formatTimestamp(entry.timestamp)}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemoveEntry(entry.id)
              }}
              className="p-1 ml-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 text-xl leading-none transition-colors"
              title="Remove from history"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {filteredHistory.length > 10 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2 mt-3 text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm transition-colors"
        >
          {isExpanded ? 'Show Less' : `Show All (${filteredHistory.length})`}
        </button>
      )}
    </div>
  )
}