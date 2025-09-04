'use client'

import { useState } from 'react'
import { HIGHLIGHT_COLORS, type HighlightColor } from '@/lib/HighlightManager'

interface HighlightControlsProps {
  isHighlighted: boolean
  currentColor?: string
  onHighlight: (color: string) => void
  onRemoveHighlight: () => void
  onAddNote?: (note: string) => void
  currentNote?: string
}

export function HighlightControls({
  isHighlighted,
  currentColor,
  onHighlight,
  onRemoveHighlight,
  onAddNote,
  currentNote
}: HighlightControlsProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [note, setNote] = useState(currentNote || '')

  const handleColorSelect = (color: string) => {
    onHighlight(color)
    setShowColorPicker(false)
  }

  const handleSaveNote = () => {
    if (onAddNote) {
      onAddNote(note)
      setShowNoteInput(false)
    }
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      position: 'relative'
    }}>
      {/* Highlight button */}
      <button
        onClick={() => setShowColorPicker(!showColorPicker)}
        style={{
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid #d1d5db',
          backgroundColor: isHighlighted ? HIGHLIGHT_COLORS[currentColor as HighlightColor] || '#fef3c7' : 'white',
          cursor: 'pointer',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
        title={isHighlighted ? "Change highlight color" : "Highlight verse"}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        {isHighlighted && 'Highlighted'}
      </button>

      {/* Remove highlight button */}
      {isHighlighted && (
        <button
          onClick={onRemoveHighlight}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #dc2626',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
          title="Remove highlight"
        >
          Remove
        </button>
      )}

      {/* Note button */}
      {onAddNote && (
        <button
          onClick={() => setShowNoteInput(!showNoteInput)}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #d1d5db',
            backgroundColor: currentNote ? '#dbeafe' : 'white',
            cursor: 'pointer',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title={currentNote ? "Edit note" : "Add note"}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          {currentNote && 'Note'}
        </button>
      )}

      {/* Color picker dropdown */}
      {showColorPicker && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '4px',
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          padding: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '4px'
        }}>
          {Object.entries(HIGHLIGHT_COLORS).map(([name, color]) => (
            <button
              key={name}
              onClick={() => handleColorSelect(name)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                backgroundColor: color,
                border: currentColor === name ? '2px solid #667eea' : '1px solid #d1d5db',
                cursor: 'pointer'
              }}
              title={name}
            />
          ))}
        </div>
      )}

      {/* Note input modal */}
      {showNoteInput && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          zIndex: 1001,
          width: '400px',
          maxWidth: '90vw'
        }}>
          <h3 style={{ marginBottom: '12px', fontSize: '1.125rem', fontWeight: 'bold' }}>
            {currentNote ? 'Edit Note' : 'Add Note'}
          </h3>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Enter your note here..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem',
              resize: 'vertical'
            }}
          />
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => {
                setShowNoteInput(false)
                setNote(currentNote || '')
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNote}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#667eea',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}