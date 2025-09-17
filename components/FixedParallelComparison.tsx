'use client'

import { useState, useEffect } from 'react'
import { BibleParser } from '@/lib/BibleParser'
import { VerseWithStrongs } from '@/components/VerseWithStrongs'

interface FixedParallelComparisonProps {
  primaryVersion: string
  secondaryVersion: string
  book: string
  chapter: number
  verse: number
  primaryText?: string
  isVisible: boolean
  fontSize?: string
  lineSpacing?: string
  verseSpacing?: string
  onStrongsClick?: (strongsNumber: string, position: { x: number; y: number }) => void
}

export function FixedParallelComparison({
  primaryVersion,
  secondaryVersion,
  book,
  chapter,
  verse,
  primaryText,
  isVisible,
  fontSize = '18px',
  lineSpacing = '1.8',
  verseSpacing = '16px',
  onStrongsClick
}: FixedParallelComparisonProps) {
  const [secondaryText, setSecondaryText] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)

  useEffect(() => {
    if (verse && isVisible) {
      loadSecondaryVerse()
    }
  }, [secondaryVersion, book, chapter, verse, isVisible])

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
        const text = chapterData.verses[verse].text
        setSecondaryText(text)
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

  const hasStrongs = (version: string) => {
    return version === 'kjv_strongs' || version === 'asvs'
  }

  // Check if content is scrollable
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const isScrollable = element.scrollHeight > element.clientHeight
    const isAtBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 5
    setShowScrollIndicator(isScrollable && !isAtBottom)
  }

  // Check if content is scrollable on load
  useEffect(() => {
    if (!minimized) {
      const timer = setTimeout(() => {
        const scrollContainer = document.querySelector('.parallel-scroll-container') as HTMLElement
        if (scrollContainer) {
          const isScrollable = scrollContainer.scrollHeight > scrollContainer.clientHeight
          setShowScrollIndicator(isScrollable)
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [minimized, secondaryText, primaryText])

  if (!isVisible || verse <= 0 || primaryVersion === secondaryVersion) {
    return null
  }

  return (
    <div
      className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl z-40 transition-all duration-300 ${
        minimized ? 'translate-y-[calc(100%-48px)]' : ''
      }`}
    >
      <div className="mx-6 bg-white dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700 shadow-2xl">
      {/* Header Bar */}
      <div 
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 flex items-center justify-between cursor-pointer"
        onClick={() => setMinimized(!minimized)}
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-4 h-4 transition-transform ${minimized ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="font-semibold">
            {book} {chapter}:{verse} - Parallel Comparison
          </span>
        </div>
        <div className="text-sm opacity-75">
          Click to {minimized ? 'expand' : 'minimize'}
        </div>
      </div>

      {/* Content */}
      {!minimized && (
        <div className="relative">
          <div 
            className="max-h-48 overflow-y-auto pb-4 parallel-scroll-container"
            onScroll={handleScroll}
          >
            {/* Secondary Version Only */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 pb-6">
              <h4 className="text-sm font-bold text-purple-600 dark:text-purple-400 mb-2">
                {getVersionDisplayName(secondaryVersion)}
              </h4>
              {loading ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
              ) : (
                <div 
                  className="text-gray-900 dark:text-gray-100"
                  style={{ 
                    fontSize: `${fontSize}px`,
                    lineHeight: lineSpacing,
                    marginBottom: verseSpacing 
                  }}
                >
                  {hasStrongs(secondaryVersion) && secondaryText && onStrongsClick ? (
                    <VerseWithStrongs
                      text={secondaryText}
                      verseNumber={verse}
                      onStrongsClick={onStrongsClick}
                    />
                  ) : (
                    <span>
                      <strong className="text-purple-600 dark:text-purple-400 mr-2">{verse}</strong>
                      {secondaryText || 'Loading verse text...'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Scroll indicator */}
          {showScrollIndicator && (
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-gray-200 dark:from-gray-700 to-transparent pointer-events-none flex items-end justify-center pb-1">
              <div className="text-xs text-gray-500 dark:text-gray-400 opacity-75 animate-pulse">
                ↓ Scroll for more
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  )
}