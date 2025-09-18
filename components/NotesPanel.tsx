'use client'

import { useState, useEffect } from 'react'
import { SlideOutPanel } from './SlideOutPanel'
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

  const handleNoteSelect = (book: string, chapter: number, verse: number) => {
    onNoteSelect(book, chapter, verse)
    onClose()
  }

  return (
    <SlideOutPanel
      isOpen={isOpen}
      onClose={onClose}
      title="My Notes"
      subtitle={`${notes.length} note${notes.length !== 1 ? 's' : ''}`}
      position="left"
      width="w-96 md:w-[28rem]"
    >
      <div className="flex flex-col h-full">
        {/* Search */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-10 px-5 text-gray-400 dark:text-gray-500">
              {searchQuery ? (
                <p>No notes found matching your search.</p>
              ) : (
                <>
                  <p className="mb-2">No notes yet.</p>
                  <p className="text-sm">Select a verse and add a note to get started.</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map(note => (
                <div
                  key={note.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer transition-all border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-blue-500 dark:hover:border-blue-400 group"
                  onClick={() => handleNoteSelect(note.book, note.chapter, note.verse)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <strong className="text-blue-600 dark:text-blue-400">
                        {note.reference}
                      </strong>
                      <span className="text-xs text-gray-500 dark:text-gray-400 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">
                        {note.version.toUpperCase()}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteNote(note.id)
                      }}
                      className="p-1 opacity-0 group-hover:opacity-100 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xl leading-none transition-all"
                      title="Delete note"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3 mb-2">
                    {note.note}
                  </p>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {formatDate(note.lastModified)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SlideOutPanel>
  )
}