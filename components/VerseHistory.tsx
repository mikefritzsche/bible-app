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
      <div style={{
        textAlign: 'center',
        padding: '32px',
        color: '#6b7280',
        fontSize: '0.95rem'
      }}>
        <p style={{ marginBottom: '8px' }}>No verse history yet.</p>
        <p style={{ fontSize: '0.875rem' }}>Click on verses to track your reading history.</p>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '24px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#111827'
        }}>
          Verse History
        </h3>
        <button
          onClick={onClearHistory}
          style={{
            padding: '6px 12px',
            fontSize: '0.875rem',
            color: '#dc2626',
            backgroundColor: '#fee2e2',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
        >
          Clear All
        </button>
      </div>

      {history.length > 5 && (
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem',
              outline: 'none'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
          />
        </div>
      )}

      <div style={{
        maxHeight: isExpanded ? '600px' : '400px',
        overflowY: 'auto',
        paddingRight: '4px'
      }}>
        {displayedHistory.map((entry) => (
          <div
            key={entry.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '12px',
              marginBottom: '8px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: '1px solid transparent'
            }}
            onClick={() => onVerseSelect(entry.book, entry.chapter, entry.verse)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6'
              e.currentTarget.style.borderColor = '#667eea'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb'
              e.currentTarget.style.borderColor = 'transparent'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px'
              }}>
                <strong style={{ color: '#667eea', fontSize: '0.95rem' }}>
                  {entry.reference}
                </strong>
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: '#9ca3af',
                  padding: '2px 6px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '3px'
                }}>
                  {entry.version.toUpperCase()}
                </span>
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#4b5563',
                lineHeight: '1.4',
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {entry.verseText}
              </p>
              <span style={{
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginTop: '4px',
                display: 'inline-block'
              }}>
                {formatTimestamp(entry.timestamp)}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemoveEntry(entry.id)
              }}
              style={{
                padding: '4px',
                marginLeft: '8px',
                color: '#9ca3af',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                lineHeight: 1,
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
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
          style={{
            width: '100%',
            padding: '8px',
            marginTop: '12px',
            color: '#667eea',
            backgroundColor: '#f3f4f6',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
        >
          {isExpanded ? 'Show Less' : `Show All (${filteredHistory.length})`}
        </button>
      )}
    </div>
  )
}