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
    <div className={`fixed right-0 top-0 bottom-0 w-[400px] bg-white dark:bg-gray-800 shadow-xl z-[100] flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      {/* Header */}
      <div className="p-5 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            My Notes ({notes.length})
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-2xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 leading-none transition-colors"
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
          className="w-full px-3 py-2.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredNotes.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 py-10 px-5">
            {searchQuery ? 'No notes found matching your search.' : 'No notes yet. Select a verse and add a note to get started.'}
          </p>
        ) : (
          filteredNotes.map(note => (
            <div
              key={note.id}
              className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-blue-500 dark:hover:border-blue-400"
              onClick={() => onNoteSelect(note.book, note.chapter, note.verse)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <strong className="text-blue-600 dark:text-blue-400">
                    {note.reference}
                  </strong>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {note.version.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteNote(note.id)
                  }}
                  className="px-1.5 py-0.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xl leading-none transition-colors"
                  title="Delete note"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-2 line-clamp-3">
                {note.note}
              </p>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                {formatDate(note.lastModified)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}