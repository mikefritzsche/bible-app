'use client'

import { useState, useEffect } from 'react'
import { BibleParser } from '@/lib/BibleParser'

interface InlineParallelVerseProps {
  primaryVersion: string
  secondaryVersion: string
  book: string
  chapter: number
  verse: number
  primaryText?: string
}

export function InlineParallelVerse({
  primaryVersion,
  secondaryVersion,
  book,
  chapter,
  verse,
  primaryText
}: InlineParallelVerseProps) {
  const [secondaryText, setSecondaryText] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (verse) {
      loadSecondaryVerse()
    }
  }, [secondaryVersion, book, chapter, verse])

  const loadSecondaryVerse = async () => {
    if (primaryVersion === secondaryVersion) {
      setSecondaryText('')
      return
    }
    
    setLoading(true)
    try {
      const parser = new BibleParser()
      await parser.loadBible(secondaryVersion)
      const chapterData = parser.getChapter(book, chapter)
      if (chapterData?.verses[verse]) {
        setSecondaryText(chapterData.verses[verse].text)
      }
    } catch (error) {
      console.error('Failed to load parallel verse:', error)
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

  if (primaryVersion === secondaryVersion) {
    return null
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '12px 20px',
        fontWeight: 'bold'
      }}>
        {book} {chapter}:{verse} - Parallel Comparison
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2px',
        backgroundColor: '#e5e7eb'
      }}>
        {/* Primary Version */}
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '16px'
        }}>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: 'bold',
            color: '#667eea',
            marginBottom: '8px'
          }}>
            {getVersionDisplayName(primaryVersion)}
          </h4>
          <p style={{
            fontSize: '1rem',
            lineHeight: '1.6',
            color: '#111827'
          }}>
            <strong style={{ color: '#667eea', marginRight: '8px' }}>{verse}</strong>
            {primaryText}
          </p>
        </div>

        {/* Secondary Version */}
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '16px'
        }}>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: 'bold',
            color: '#764ba2',
            marginBottom: '8px'
          }}>
            {getVersionDisplayName(secondaryVersion)}
          </h4>
          {loading ? (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Loading...</p>
          ) : (
            <p style={{
              fontSize: '1rem',
              lineHeight: '1.6',
              color: '#111827'
            }}>
              <strong style={{ color: '#764ba2', marginRight: '8px' }}>{verse}</strong>
              {secondaryText}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}