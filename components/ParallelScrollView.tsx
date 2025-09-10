'use client'

import { useState, useEffect, useRef } from 'react'
import { BibleParser } from '@/lib/BibleParser'
import { VerseWithStrongs } from '@/components/VerseWithStrongs'
import type { Chapter } from '@/types/bible'

interface ParallelScrollViewProps {
  primaryVersion: string
  secondaryVersion: string
  book: string
  chapter: number
  onClose: () => void
  onStrongsClick?: (strongsNumber: string, position: { x: number; y: number }) => void
}

export function ParallelScrollView({
  primaryVersion,
  secondaryVersion,
  book,
  chapter,
  onClose,
  onStrongsClick
}: ParallelScrollViewProps) {
  const [primaryChapter, setPrimaryChapter] = useState<Chapter | null>(null)
  const [secondaryChapter, setSecondaryChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)
  
  const primaryScrollRef = useRef<HTMLDivElement>(null)
  const secondaryScrollRef = useRef<HTMLDivElement>(null)
  const isSyncingScroll = useRef(false)

  useEffect(() => {
    loadChapters()
  }, [primaryVersion, secondaryVersion, book, chapter])

  const loadChapters = async () => {
    setLoading(true)
    try {
      const parser = new BibleParser()
      
      // Load primary version
      await parser.loadBible(primaryVersion)
      const primaryChapterData = parser.getChapter(book, chapter)
      if (primaryChapterData) {
        setPrimaryChapter(primaryChapterData)
      }

      // Load secondary version
      await parser.loadBible(secondaryVersion)
      const secondaryChapterData = parser.getChapter(book, chapter)
      if (secondaryChapterData) {
        setSecondaryChapter(secondaryChapterData)
      }
    } catch (error) {
      console.error('Failed to load parallel chapters:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScroll = (source: 'primary' | 'secondary') => {
    if (isSyncingScroll.current) return
    
    isSyncingScroll.current = true
    
    const sourceRef = source === 'primary' ? primaryScrollRef : secondaryScrollRef
    const targetRef = source === 'primary' ? secondaryScrollRef : primaryScrollRef
    
    if (sourceRef.current && targetRef.current) {
      const scrollPercentage = sourceRef.current.scrollTop / 
        (sourceRef.current.scrollHeight - sourceRef.current.clientHeight)
      
      targetRef.current.scrollTop = scrollPercentage * 
        (targetRef.current.scrollHeight - targetRef.current.clientHeight)
    }
    
    setTimeout(() => {
      isSyncingScroll.current = false
    }, 10)
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
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 999
    }}>
      <div style={{
        position: 'absolute',
        top: '5%',
        left: '5%',
        right: '5%',
        bottom: '5%',
        backgroundColor: 'white',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '2px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827'
          }}>
            {book} {chapter} - Parallel Reading
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: '1rem',
              color: 'white',
              backgroundColor: '#667eea',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

        {loading ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#667eea'
          }}>
            Loading parallel chapters...
          </div>
        ) : (
          <div style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            overflow: 'hidden'
          }}>
            {/* Primary Version */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              borderRight: '2px solid #e5e7eb',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '12px 20px',
                backgroundColor: '#f3f4f6',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 'bold',
                  color: '#667eea'
                }}>
                  {getVersionDisplayName(primaryVersion)}
                </h3>
              </div>
              <div
                ref={primaryScrollRef}
                onScroll={() => handleScroll('primary')}
                style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: '20px',
                  fontSize: '1.05rem',
                  lineHeight: '1.8'
                }}
              >
                {primaryChapter && Object.values(primaryChapter.verses).map(verse => (
                  <p
                    key={verse.verse}
                    style={{
                      marginBottom: '16px',
                      color: '#1f2937'
                    }}
                  >
                    {(primaryVersion === 'kjv_strongs' || primaryVersion === 'asvs') && onStrongsClick ? (
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
                  </p>
                ))}
              </div>
            </div>

            {/* Secondary Version */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '12px 20px',
                backgroundColor: '#f3f4f6',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 'bold',
                  color: '#764ba2'
                }}>
                  {getVersionDisplayName(secondaryVersion)}
                </h3>
              </div>
              <div
                ref={secondaryScrollRef}
                onScroll={() => handleScroll('secondary')}
                style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: '20px',
                  fontSize: '1.05rem',
                  lineHeight: '1.8'
                }}
              >
                {secondaryChapter && Object.values(secondaryChapter.verses).map(verse => (
                  <p
                    key={verse.verse}
                    style={{
                      marginBottom: '16px',
                      color: '#1f2937'
                    }}
                  >
                    {(secondaryVersion === 'kjv_strongs' || secondaryVersion === 'asvs') && onStrongsClick ? (
                      <VerseWithStrongs
                        text={verse.text}
                        verseNumber={verse.verse}
                        onStrongsClick={onStrongsClick}
                      />
                    ) : (
                      <span>
                        <strong style={{ color: '#764ba2', marginRight: '8px' }}>{verse.verse}</strong>
                        {verse.text}
                      </span>
                    )}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}