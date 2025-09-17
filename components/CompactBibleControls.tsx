'use client'

import { useState } from 'react'

type SelectorMode = 'book' | 'chapter' | 'verse' | null

interface CompactBibleControlsProps {
  selectedBook: string
  selectedChapter: number
  selectedVerse: number | null
  selectedVersion: string
  bookNames: string[]
  chapterCount: number
  verseCount: number
  onBookChange: (book: string) => void
  onChapterChange: (chapter: number) => void
  onVerseChange: (verse: number | null) => void
  onVersionChange: (version: string) => void
  onPreviousChapter: () => void
  onNextChapter: () => void
  onParallelReading: () => void
  isPreviousDisabled: boolean
  isNextDisabled: boolean
}

const BIBLE_VERSIONS = [
  { value: 'kjv_strongs', label: 'KJV with Strong\'s' },
  { value: 'kjv', label: 'KJV' },
  { value: 'asvs', label: 'ASV with Strong\'s' },
  { value: 'asv', label: 'ASV' },
  { value: 'web', label: 'WEB' },
  { value: 'net', label: 'NET' },
  { value: 'geneva', label: 'Geneva' },
  { value: 'bishops', label: 'Bishops\'' },
  { value: 'coverdale', label: 'Coverdale' },
  { value: 'tyndale', label: 'Tyndale' }
]

export function CompactBibleControls({
  selectedBook,
  selectedChapter,
  selectedVerse,
  selectedVersion,
  bookNames,
  chapterCount,
  verseCount,
  onBookChange,
  onChapterChange,
  onVerseChange,
  onVersionChange,
  onPreviousChapter,
  onNextChapter,
  onParallelReading,
  isPreviousDisabled,
  isNextDisabled
}: CompactBibleControlsProps) {
  const [selectorMode, setSelectorMode] = useState<SelectorMode>(null)
  const [showVersionDropdown, setShowVersionDropdown] = useState(false)

  const getVersionDisplay = (version: string) => {
    const found = BIBLE_VERSIONS.find(v => v.value === version)
    return found ? found.label : version.toUpperCase()
  }

  const getCompactVersionDisplay = (version: string) => {
    switch(version) {
      case 'kjv_strongs': return 'KJV+S'
      case 'kjv': return 'KJV'
      case 'asvs': return 'ASV+S'
      case 'asv': return 'ASV'
      case 'web': return 'WEB'
      case 'net': return 'NET'
      case 'geneva': return 'Geneva'
      case 'bishops': return 'Bishops'
      case 'coverdale': return 'Cover.'
      case 'tyndale': return 'Tynd.'
      default: return version.toUpperCase()
    }
  }

  return (
    <>
      {/* Compact Controls Bar */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between px-4 py-2 h-14">
          {/* Left: Location Display */}
          <div className="flex items-center gap-2">
            {/* Book Icon */}
            <span className="text-blue-600 dark:text-blue-400 text-lg">📖</span>

            {/* Location - Independent clickable parts with visual indicators */}
            <div className="flex items-center gap-1 text-lg font-medium">
              {/* Book */}
              <button
                onClick={() => setSelectorMode('book')}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group"
                title="Select Book"
              >
                <span className="border-b border-dotted border-gray-400 group-hover:border-blue-600 dark:group-hover:border-blue-400">
                  {selectedBook}
                </span>
              </button>

              {/* Chapter */}
              <button
                onClick={() => setSelectorMode('chapter')}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group"
                title="Select Chapter"
              >
                <span className="border-b border-dotted border-gray-400 group-hover:border-blue-600 dark:group-hover:border-blue-400">
                  {selectedChapter}
                </span>
              </button>

              <span className="text-gray-400">:</span>

              {/* Verse */}
              <button
                onClick={() => setSelectorMode('verse')}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group inline-block min-w-[2.5rem] text-left"
                title="Select Verse"
              >
                <span className="border-b border-dotted border-gray-400 group-hover:border-blue-600 dark:group-hover:border-blue-400">
                  {selectedVerse || 'All'}
                </span>
              </button>
            </div>

            {/* Version Badge */}
            <div className="relative ml-2">
              <button
                onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
              >
                {getCompactVersionDisplay(selectedVersion)}
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Version Dropdown */}
              {showVersionDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowVersionDropdown(false)}
                  />
                  <div className="absolute top-full mt-1 left-0 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-40">
                    {BIBLE_VERSIONS.map(version => (
                      <button
                        key={version.value}
                        onClick={() => {
                          onVersionChange(version.value)
                          setShowVersionDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          selectedVersion === version.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
                        }`}
                      >
                        {version.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Navigation and Actions */}
          <div className="flex items-center gap-2">
            {/* Previous Chapter */}
            <button
              onClick={onPreviousChapter}
              disabled={isPreviousDisabled}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Previous Chapter (J)"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {/* Next Chapter */}
            <button
              onClick={onNextChapter}
              disabled={isNextDisabled}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next Chapter (K)"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Parallel Reading */}
            <button
              onClick={onParallelReading}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Parallel Reading"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="12" y1="3" x2="12" y2="21" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Progressive Selector Overlay */}
      {selectorMode && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectorMode(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-2xl max-h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 overflow-hidden">
            {/* Breadcrumb Navigation */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center gap-2 text-sm mb-2">
                <button
                  onClick={() => setSelectorMode('book')}
                  className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                    selectorMode === 'book' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Book
                </button>
                {(selectorMode === 'chapter' || selectorMode === 'verse') && (
                  <>
                    <span className="text-gray-400">›</span>
                    <button
                      onClick={() => setSelectorMode('chapter')}
                      className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                        selectorMode === 'chapter' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Chapter
                    </button>
                  </>
                )}
                {selectorMode === 'verse' && (
                  <>
                    <span className="text-gray-400">›</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">Verse</span>
                  </>
                )}
              </div>
              <h2 className="text-xl font-bold">
                {selectorMode === 'book' && 'Select Book'}
                {selectorMode === 'chapter' && `Select Chapter in ${selectedBook}`}
                {selectorMode === 'verse' && `Select Verse in ${selectedBook} ${selectedChapter}`}
              </h2>
            </div>

            {/* Content Area */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-100px)]">
              {/* Book Selection */}
              {selectorMode === 'book' && (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {bookNames.map(book => (
                      <button
                        key={book}
                        onClick={() => {
                          onBookChange(book)
                          // Always advance to chapter selection after selecting a book
                          setSelectorMode('chapter')
                        }}
                        className={`p-3 rounded-lg text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${
                          selectedBook === book ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' : ''
                        }`}
                      >
                        {book}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Chapter Selection */}
              {selectorMode === 'chapter' && (
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                  {Array.from({ length: chapterCount }, (_, i) => i + 1).map(num => (
                    <button
                      key={num}
                      onClick={() => {
                        onChapterChange(num)
                        setSelectorMode(null)  // Close instead of progressing to verse
                      }}
                      className={`p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${
                        selectedChapter === num ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' : ''
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}

              {/* Verse Selection */}
              {selectorMode === 'verse' && (
                <>
                  <button
                    onClick={() => {
                      onVerseChange(null)
                      setSelectorMode(null)
                    }}
                    className={`w-full mb-3 p-3 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      selectedVerse === null ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' : ''
                    }`}
                  >
                    Show All Verses
                  </button>
                  <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                    {Array.from({ length: verseCount }, (_, i) => i + 1).map(num => (
                      <button
                        key={num}
                        onClick={() => {
                          onVerseChange(num)
                          setSelectorMode(null)
                        }}
                        className={`p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${
                          selectedVerse === num ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' : ''
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}