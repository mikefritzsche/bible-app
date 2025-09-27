'use client'

import { useState, useEffect, useRef } from 'react'
import { BibleParser } from '@/lib/BibleParser'
import { VerseWithStrongs } from '@/components/VerseWithStrongs'
import { processBibleText } from '@/lib/textProcessing'

interface ParallelComparisonProps {
  primaryVersion: string
  secondaryVersion: string
  book: string
  chapter: number
  verse: number
  primaryText?: string
  isVisible: boolean
  fontSize?: string
  lineSpacing?: string
  onStrongsClick?: (strongsNumber: string, position: { x: number; y: number }) => void
  className?: string
}

export function ParallelComparison({
  primaryVersion,
  secondaryVersion,
  book,
  chapter,
  verse,
  primaryText,
  isVisible,
  fontSize = '18px',
  lineSpacing = '1.8',
  onStrongsClick,
  className = ''
}: ParallelComparisonProps) {
  const [secondaryText, setSecondaryText] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [currentKey, setCurrentKey] = useState('')
  const [usedFallback, setUsedFallback] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const requestKey = `${secondaryVersion}|${book}|${chapter}|${verse}`

  useEffect(() => {
    if (!isVisible) {
      setSecondaryText('')
      setLoading(false)
      setCurrentKey('')
      setUsedFallback(false)
      return
    }

    if (!verse || verse <= 0) {
      setSecondaryText('')
      setLoading(false)
      setCurrentKey(requestKey)
      setUsedFallback(false)
      return
    }

    if (requestKey === currentKey && secondaryText) {
      return
    }

    let cancelled = false

    const fetchParallel = async () => {
      // Optimistically show the primary text while the secondary version loads
      if (primaryText?.trim()) {
        setSecondaryText(primaryText)
        setUsedFallback(true)
      }

      if (primaryVersion === secondaryVersion) {
        setLoading(false)
        const normalizedPrimary = primaryText?.trim()

        if (!normalizedPrimary) {
          if (!cancelled) {
            setSecondaryText('')
            setCurrentKey(requestKey)
            setUsedFallback(false)
          }
          return
        }

        if (!cancelled) {
          setSecondaryText(primaryText!)
          setCurrentKey(requestKey)
          setUsedFallback(false)
        }
        return
      }

      setLoading(true)
      setUsedFallback(primaryText ? true : false)

      try {
        const parser = new BibleParser()
        await parser.loadBible(secondaryVersion)
        const chapterData = parser.getChapter(book, chapter)
        const verseKey = String(verse)
        const verseData = chapterData?.verses?.[verseKey]

        if (!cancelled) {
          if (verseData?.text) {
            setSecondaryText(verseData.text)
            setCurrentKey(requestKey)
            setUsedFallback(false)
          } else if (primaryText?.trim()) {
            setSecondaryText(primaryText)
            setCurrentKey(requestKey)
            setUsedFallback(true)
          } else {
            setSecondaryText('')
            setCurrentKey(requestKey)
            setUsedFallback(false)
          }
        }
      } catch (error) {
        console.error('Failed to load parallel verse:', error)
        if (!cancelled) {
          if (primaryText?.trim()) {
            setSecondaryText(primaryText)
            setCurrentKey(requestKey)
            setUsedFallback(true)
          } else {
            setSecondaryText('')
            setCurrentKey(requestKey)
            setUsedFallback(false)
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchParallel()

    return () => {
      cancelled = true
    }
  }, [primaryVersion, secondaryVersion, isVisible, primaryText, requestKey, currentKey])

  const getVersionDisplayName = (version: string) => {
    const versionNames: Record<string, string> = {
      'kjv_strongs': "KJV with Strong's",
      'kjv-strongs': "KJV with Strong's",
      'kjv': 'King James Version',
      'asv-strongs': "ASV with Strong's",
      'asv_strongs': "ASV with Strong's",
      'asv': 'American Standard Version',
      'web': 'World English Bible',
      'net': 'NET Bible',
      'geneva': 'Geneva Bible',
      'bishops': "Bishops' Bible",
      'coverdale': 'Coverdale Bible',
      'tyndale': 'Tyndale Bible'
    }
    return versionNames[version] || version.toUpperCase()
  }

  const getVersionBadgeLabel = (version: string) => {
    const shortNames: Record<string, string> = {
      'kjv_strongs': 'KJV+S',
      'kjv-strongs': 'KJV+S',
      'kjv': 'KJV',
      'asv-strongs': 'ASV+S',
      'asv_strongs': 'ASV+S',
      'asv': 'ASV',
      'web': 'WEB',
      'net': 'NET',
      'geneva': 'GEN',
      'bishops': 'Bishops',
      'coverdale': 'Cover.',
      'tyndale': 'Tynd.'
    }
    return shortNames[version] || version.toUpperCase()
  }

  const hasStrongs = (version: string) => {
    return version === 'kjv_strongs' || version === 'kjv-strongs'
  }

  if (!isVisible || verse <= 0) {
    return null
  }

  const hasSecondaryText = (secondaryText ?? '').trim().length > 0
  const effectiveVersion = secondaryVersion
  const shouldUseStrongs = hasSecondaryText && !usedFallback && hasStrongs(secondaryVersion) && onStrongsClick

  const renderVerseContent = () => {
    if (loading && !(secondaryText ?? '').trim()) {
      return (
        <p className="text-sm text-purple-600 dark:text-purple-300 italic">Loading parallel version...</p>
      )
    }

    if (!hasSecondaryText) {
      return null
    }

    return shouldUseStrongs ? (
      <VerseWithStrongs
        text={secondaryText}
        verseNumber={null}
        onStrongsClick={onStrongsClick}
        isDarkMode={false}
        fontSize={fontSize}
        lineHeight={lineSpacing}
      />
    ) : (
      <span
        className="whitespace-pre-line"
        dangerouslySetInnerHTML={{ __html: processBibleText(secondaryText) }}
        style={{ fontSize, lineHeight: lineSpacing }}
      />
    )
  }

  return (
    <div className={`flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm ${className}`}>
      <div
        ref={scrollRef}
        className="parallel-scroll-container flex-1 overflow-y-auto px-4 pb-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        <section className="py-4">
          <div className="flex items-start gap-4">
            <span
              className="mt-1 inline-flex h-6 items-center rounded-full bg-blue-50 px-3 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:bg-blue-900/20 dark:text-blue-300"
              title={getVersionDisplayName(effectiveVersion)}
            >
              {getVersionBadgeLabel(effectiveVersion)}
            </span>
            <div className="flex flex-1 items-start gap-3 text-gray-900 dark:text-gray-100">
              <span className="mt-1 text-sm font-semibold text-gray-500 dark:text-gray-400">
                {verse}
              </span>
              <div
                className="flex-1"
                style={{ lineHeight: lineSpacing, fontSize }}
              >
                {renderVerseContent()}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default ParallelComparison
