'use client'

import React, { useState } from 'react'
import { VerseWithStrongs } from '@/components/VerseWithStrongs'
import { HIGHLIGHT_COLORS } from '@/lib/HighlightManager'
import type { VerseHighlight } from '@/lib/HighlightManager'
import type { VerseNote } from '@/lib/NotesManager'

interface VerseDisplayProps {
  verse: any
  isSelected: boolean
  highlight?: VerseHighlight
  note?: VerseNote
  hasStrongs: boolean
  onVerseClick: (verse: any) => void
  onHighlight: (verseNum: number, color: string) => void
  onRemoveHighlight: (verseNum: number) => void
  onAddNote: () => void
  onStrongsClick?: (strongsNumber: string, position: { x: number; y: number }) => void
}

export function VerseDisplay({
  verse,
  isSelected,
  highlight,
  note,
  hasStrongs,
  onVerseClick,
  onHighlight,
  onRemoveHighlight,
  onAddNote,
  onStrongsClick
}: VerseDisplayProps) {
  const [showControls, setShowControls] = useState(false)
  const [controlsPosition, setControlsPosition] = useState({ x: 0, y: 0 })
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const highlightColor = highlight ? HIGHLIGHT_COLORS[highlight.color as keyof typeof HIGHLIGHT_COLORS] : undefined

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setControlsPosition({ x: e.clientX, y: e.clientY })
    setShowControls(true)
    setShowHighlightPicker(false)
  }

  const handleClickOutside = () => {
    setShowControls(false)
    setShowHighlightPicker(false)
  }

  React.useEffect(() => {
    if (showControls || showHighlightPicker) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showControls, showHighlightPicker])

  return (
    <div
      id={`verse-${verse.verse}`}
      style={{ 
        marginBottom: '16px',
        position: 'relative'
      }}
      onContextMenu={handleContextMenu}
    >
      {/* Text-based context menu */}
      {showControls && (
        <div 
          className="verse-controls"
          style={{
            position: 'fixed',
            left: `${controlsPosition.x}px`,
            top: `${controlsPosition.y}px`,
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '160px',
            padding: '4px 0',
            fontSize: '0.875rem'
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowControls(false)
              setShowHighlightPicker(true)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 0.1s',
              color: '#111827'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '3px',
              background: highlight ? HIGHLIGHT_COLORS[highlight.color as keyof typeof HIGHLIGHT_COLORS] : 'linear-gradient(45deg, #fef3c7, #dbeafe)',
              border: '1px solid #d1d5db'
            }} />
            <span style={{ color: '#111827' }}>{highlight ? 'Change Highlight' : 'Highlight Verse'}</span>
          </button>

          {highlight && (
            <button
              onClick={async (e) => {
                e.stopPropagation()
                await onRemoveHighlight(verse.verse)
                setShowControls(false)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.1s',
                color: '#111827'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{ color: '#dc2626' }}>✕</span>
              <span style={{ color: '#111827' }}>Remove Highlight</span>
            </button>
          )}

          <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '4px 0' }} />

          <button
            onClick={(e) => {
              e.stopPropagation()
              onAddNote()
              setShowControls(false)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 0.1s',
              color: '#111827'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span>📝</span>
            <span style={{ color: '#111827' }}>{note ? 'Edit Note' : 'Add Note'}</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onVerseClick(verse)
              setShowControls(false)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 0.1s',
              color: '#111827'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span>📖</span>
            <span style={{ color: '#111827' }}>Select Verse</span>
          </button>
        </div>
      )}

      {/* Highlight color picker */}
      {showHighlightPicker && (
        <div 
          className="verse-controls"
          style={{
            position: 'fixed',
            left: `${controlsPosition.x}px`,
            top: `${controlsPosition.y}px`,
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            padding: '8px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '4px'
          }}
        >
          {Object.entries(HIGHLIGHT_COLORS).map(([name, color]) => (
            <button
              key={name}
              onClick={async (e) => {
                e.stopPropagation()
                await onHighlight(verse.verse, name)
                setShowHighlightPicker(false)
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                backgroundColor: color,
                border: highlight?.color === name ? '2px solid #667eea' : '1px solid #d1d5db',
                cursor: 'pointer',
                transition: 'transform 0.1s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              title={name}
            />
          ))}
        </div>
      )}
      
      <div
        className="verse-display"
        onClick={(e) => {
          const target = e.target as HTMLElement
          if (!target.classList.contains('strongs-link')) {
            e.stopPropagation()
            onVerseClick(verse)
          }
        }}
        style={{ 
          padding: '8px 12px',
          borderRadius: '4px',
          color: '#1f2937',
          transition: 'all 0.2s',
          backgroundColor: highlightColor || (isSelected ? '#dbeafe' : 'transparent'),
          cursor: 'pointer',
          position: 'relative',
          border: isSelected ? '2px solid #667eea' : '2px solid transparent'
        }}
        onMouseEnter={(e) => {
          if (!isSelected && !highlightColor) {
            e.currentTarget.style.backgroundColor = '#f9fafb'
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected && !highlightColor) {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            {hasStrongs && onStrongsClick ? (
              <VerseWithStrongs
                text={verse.text}
                verseNumber={verse.verse}
                onStrongsClick={onStrongsClick}
              />
            ) : (
              <span>
                <strong style={{ color: '#667eea', marginRight: '8px' }}>{verse.verse}</strong>
                {verse.text}
              </span>
            )}
          </div>
          {note && (
            <div
              style={{
                padding: '2px 6px',
                backgroundColor: '#dbeafe',
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: '#1e40af',
                cursor: 'help',
                flexShrink: 0
              }}
              title={note.note}
            >
              📝
            </div>
          )}
        </div>
      </div>
    </div>
  )
}