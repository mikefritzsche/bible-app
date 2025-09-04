'use client'

import { useState, useEffect } from 'react'
import type { VerseNote } from '@/lib/NotesManager'

interface NotesPanelProps {
  notes: VerseNote[]
  onNoteSelect: (book: string, chapter: number, verse: number) => void
  onDeleteNote: (id: string) => void
  isOpen: boolean
  onClose: () => void
}

export function NotesPanel({
  notes,
  onNoteSelect,
  onDeleteNote,
  isOpen,
  onClose
}: NotesPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredNotes, setFilteredNotes] = useState(notes)

  useEffect(() => {
    if (searchQuery) {
      const filtered = notes.filter(note =>
        note.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.reference.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredNotes(filtered)
    } else {
      setFilteredNotes(notes)
    }
  }, [searchQuery, notes])

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      bottom: 0,
      width: '400px',
      backgroundColor: 'white',
      boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '2px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827'
          }}>
            My Notes ({notes.length})
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              fontSize: '1.5rem',
              color: '#6b7280',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '0.875rem',
            outline: 'none'
          }}
        />
      </div>

      {/* Notes List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px'
      }}>
        {filteredNotes.length === 0 ? (
          <p style={{
            textAlign: 'center',
            color: '#9ca3af',
            padding: '40px 20px'
          }}>
            {searchQuery ? 'No notes found matching your search.' : 'No notes yet. Select a verse and add a note to get started.'}
          </p>
        ) : (
          filteredNotes.map(note => (
            <div
              key={note.id}
              style={{
                marginBottom: '16px',
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => onNoteSelect(note.book, note.chapter, note.verse)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
                e.currentTarget.style.borderColor = '#667eea'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb'
                e.currentTarget.style.borderColor = '#e5e7eb'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '8px'
              }}>
                <div>
                  <strong style={{
                    color: '#667eea',
                    fontSize: '0.95rem'
                  }}>
                    {note.reference}
                  </strong>
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#9ca3af',
                    marginLeft: '8px'
                  }}>
                    {note.version.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteNote(note.id)
                  }}
                  style={{
                    padding: '2px 6px',
                    color: '#dc2626',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    lineHeight: 1
                  }}
                  title="Delete note"
                >
                  ×
                </button>
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#4b5563',
                lineHeight: '1.5',
                marginBottom: '8px',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {note.note}
              </p>
              <div style={{
                fontSize: '0.75rem',
                color: '#9ca3af'
              }}>
                {formatDate(note.lastModified)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}