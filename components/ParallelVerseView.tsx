'use client'

import { useState, useEffect } from 'react'
import { BibleParser } from '@/lib/BibleParser'

interface ParallelVerseViewProps {
  primaryVersion: string
  secondaryVersion: string
  book: string
  chapter: number
  verse: number
  onClose: () => void
}

export function ParallelVerseView({
  primaryVersion,
  secondaryVersion,
  book,
  chapter,
  verse,
  onClose
}: ParallelVerseViewProps) {
  const [primaryText, setPrimaryText] = useState<string>('')
  const [secondaryText, setSecondaryText] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVerses()
  }, [primaryVersion, secondaryVersion, book, chapter, verse])

  const loadVerses = async () => {
    setLoading(true)
    try {
      const parser = new BibleParser()
      
      // Load primary version
      await parser.loadBible(primaryVersion)
      const primaryChapter = parser.getChapter(book, chapter)
      if (primaryChapter?.verses[verse]) {
        setPrimaryText(primaryChapter.verses[verse].text)
      }

      // Load secondary version
      await parser.loadBible(secondaryVersion)
      const secondaryChapter = parser.getChapter(book, chapter)
      if (secondaryChapter?.verses[verse]) {
        setSecondaryText(secondaryChapter.verses[verse].text)
      }
    } catch (error) {
      console.error('Failed to load parallel verses:', error)
    } finally {
      setLoading(false)
    }
  }

  const getVersionDisplayName = (version: string) => {
    const versionNames: Record<string, string> = {
      'kjv_strongs': 'KJV with Strong\'s',
      'kjv': 'King James Version',
      'asvs': 'ASV with Strong\'s',
      'asv': 'American Standard Version',
      'web': 'World English Bible',
      'net': 'New English Translation',
      'geneva': 'Geneva Bible',
      'bishops': 'Bishops\' Bible',
      'coverdale': 'Coverdale Bible',
      'tyndale': 'Tyndale Bible'
    }
    return versionNames[version] || version.toUpperCase()
  }

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      zIndex: 1000,
      width: '90%',
      maxWidth: '800px',
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#111827'
        }}>
          {book} {chapter}:{verse} - Parallel Comparison
        </h2>
        <button
          onClick={onClose}
          style={{
            padding: '8px',
            fontSize: '1.5rem',
            color: '#6b7280',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            lineHeight: 1
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#111827'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
        >
          ×
        </button>
      </div>

      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#667eea'
        }}>
          Loading parallel verses...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px'
        }}>
          {/* Primary Version */}
          <div style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: '#667eea',
              marginBottom: '12px'
            }}>
              {getVersionDisplayName(primaryVersion)}
            </h3>
            <p style={{
              fontSize: '1rem',
              lineHeight: '1.8',
              color: '#111827'
            }}>
              <strong style={{ color: '#667eea', marginRight: '8px' }}>{verse}</strong>
              {primaryText}
            </p>
          </div>

          {/* Secondary Version */}
          <div style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: '#764ba2',
              marginBottom: '12px'
            }}>
              {getVersionDisplayName(secondaryVersion)}
            </h3>
            <p style={{
              fontSize: '1rem',
              lineHeight: '1.8',
              color: '#111827'
            }}>
              <strong style={{ color: '#764ba2', marginRight: '8px' }}>{verse}</strong>
              {secondaryText}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}