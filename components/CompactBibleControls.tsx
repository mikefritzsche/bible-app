'use client'

import { useState } from 'react'
import {
  Book,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Columns2,
  Settings,
  CalendarCheck,
  History,
  FileText
} from 'lucide-react'

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
  // New props for quick actions
  onSettingsClick?: () => void
  onTodayClick?: () => void
  onHistoryClick?: () => void
  onNotesClick?: () => void
  showHistoryPanel?: boolean
  showNotesPanel?: boolean
  notesCount?: number
  // Reading plan integration
  isInReadingPlan?: boolean
  readingPlanProgress?: {psalmCompleted: boolean, proverbsCompleted: boolean} | null
  onMarkAsRead?: () => void
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
  isNextDisabled,
  onSettingsClick,
  onTodayClick,
  onHistoryClick,
  onNotesClick,
  showHistoryPanel = false,
  showNotesPanel = false,
  notesCount = 0,
  isInReadingPlan = false,
  readingPlanProgress = null,
  onMarkAsRead
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
      {/* Compact Controls Bar - Mobile Responsive */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Top Row: Location + Version + Quick Actions (icons only) */}
          <div className="flex items-center justify-between px-3 py-2 min-h-[44px]">
            <div className="flex items-center gap-2 flex-1">
              <Book className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <button
                onClick={() => setSelectorMode('book')}
                className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {selectedBook}
              </button>
              <button
                onClick={() => setSelectorMode('chapter')}
                className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {selectedChapter}
              </button>
              <span className="text-gray-400">:</span>
              <button
                onClick={() => setSelectorMode('verse')}
                className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-w-[2rem]"
              >
                {selectedVerse || 'All'}
              </button>
            </div>

            {/* Quick Action Icons */}
            <div className="flex items-center gap-1">
              {onSettingsClick && (
                <button
                  onClick={onSettingsClick}
                  className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
              {onTodayClick && (
                <button
                  onClick={onTodayClick}
                  className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Today's Reading"
                >
                  <CalendarCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                </button>
              )}
              {isInReadingPlan && onMarkAsRead && (
                <button
                  onClick={onMarkAsRead}
                  className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 relative ${
                    (selectedBook === 'Psalms' && readingPlanProgress?.psalmCompleted) ||
                    (selectedBook === 'Proverbs' && readingPlanProgress?.proverbsCompleted)
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 animate-pulse border border-amber-400 dark:border-amber-600'
                  }`}
                  title={
                    (selectedBook === 'Psalms' && readingPlanProgress?.psalmCompleted) ||
                    (selectedBook === 'Proverbs' && readingPlanProgress?.proverbsCompleted)
                      ? "Already marked as read in today's plan"
                      : "Mark as complete in today's reading plan"
                  }
                >
                  {(selectedBook === 'Psalms' && readingPlanProgress?.psalmCompleted) ||
                  (selectedBook === 'Proverbs' && readingPlanProgress?.proverbsCompleted) ? (
                    <>
                      <span className="text-sm font-bold">✓</span>
                      <span className="text-xs font-medium">Read</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-bold">Mark</span>
                      <span className="text-xs font-normal">Read</span>
                    </>
                  )}
                </button>
              )}
              {onHistoryClick && (
                <button
                  onClick={onHistoryClick}
                  className={`p-2 rounded transition-colors ${
                    showHistoryPanel
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="History"
                >
                  <History className="w-4 h-4" />
                </button>
              )}
              {onNotesClick && (
                <button
                  onClick={onNotesClick}
                  className={`p-2 rounded transition-colors relative ${
                    showNotesPanel
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Notes"
                >
                  <FileText className="w-4 h-4" />
                  {notesCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {notesCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row: Version + Navigation Controls */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={onPreviousChapter}
              disabled={isPreviousDisabled}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
              >
                {getCompactVersionDisplay(selectedVersion)}
                <ChevronDown className="w-3 h-3" />
              </button>

              <button
                onClick={onParallelReading}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Parallel"
              >
                <Columns2 className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={onNextChapter}
              disabled={isNextDisabled}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between px-4 py-2 h-14">
          {/* Left: Location Display */}
          <div className="flex items-center gap-2">
            <Book className="w-5 h-5 text-blue-600 dark:text-blue-400" />

            {/* Location - Independent clickable parts */}
            <div className="flex items-center gap-1 text-lg font-medium">
              <button
                onClick={() => setSelectorMode('book')}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group"
                title="Select Book"
              >
                <span className="border-b border-dotted border-gray-400 group-hover:border-blue-600 dark:group-hover:border-blue-400">
                  {selectedBook}
                </span>
              </button>

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
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Right: Navigation and Actions */}
          <div className="flex items-center gap-2">
            {/* Navigation */}
            <button
              onClick={onPreviousChapter}
              disabled={isPreviousDisabled}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Previous Chapter (J)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={onNextChapter}
              disabled={isNextDisabled}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next Chapter (K)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

            <button
              onClick={onParallelReading}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Parallel Reading"
            >
              <Columns2 className="w-5 h-5" />
            </button>

            {/* Quick Actions - Desktop with labels */}
            {onSettingsClick && (
              <button
                onClick={onSettingsClick}
                className="px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden lg:inline">Settings</span>
              </button>
            )}
            {onTodayClick && (
              <button
                onClick={onTodayClick}
                className="px-3 py-1.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center gap-2 text-sm"
                title="Today's Reading"
              >
                <CalendarCheck className="w-4 h-4" />
                <span className="hidden lg:inline">Today</span>
              </button>
            )}
            {isInReadingPlan && onMarkAsRead && (
              <button
                onClick={onMarkAsRead}
                className={`px-3 py-1.5 rounded transition-colors flex items-center gap-2 text-sm ${
                  (selectedBook === 'Psalms' && readingPlanProgress?.psalmCompleted) ||
                  (selectedBook === 'Proverbs' && readingPlanProgress?.proverbsCompleted)
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 animate-pulse'
                }`}
                title={
                  (selectedBook === 'Psalms' && readingPlanProgress?.psalmCompleted) ||
                  (selectedBook === 'Proverbs' && readingPlanProgress?.proverbsCompleted)
                    ? "Already marked as read in today's plan"
                    : "Mark as complete in today's reading plan"
                }
              >
                {(selectedBook === 'Psalms' && readingPlanProgress?.psalmCompleted) ||
                (selectedBook === 'Proverbs' && readingPlanProgress?.proverbsCompleted) ? (
                  <>
                    <CalendarCheck className="w-4 h-4" />
                    <span className="hidden lg:inline">Completed</span>
                    <span className="hidden sm:inline lg:hidden">Done</span>
                  </>
                ) : (
                  <>
                    <CalendarCheck className="w-4 h-4" />
                    <span className="hidden lg:inline">Mark as Read</span>
                    <span className="hidden sm:inline lg:hidden">Mark Read</span>
                  </>
                )}
              </button>
            )}
            {onHistoryClick && (
              <button
                onClick={onHistoryClick}
                className={`px-3 py-1.5 rounded transition-colors flex items-center gap-2 text-sm ${
                  showHistoryPanel
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="History"
              >
                <History className="w-4 h-4" />
                <span className="hidden lg:inline">History</span>
              </button>
            )}
            {onNotesClick && (
              <button
                onClick={onNotesClick}
                className={`px-3 py-1.5 rounded transition-colors flex items-center gap-2 text-sm relative ${
                  showNotesPanel
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Notes"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden lg:inline">Notes</span>
                {notesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {notesCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Version Dropdown - shared between mobile and desktop */}
        {showVersionDropdown && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowVersionDropdown(false)}
            />
            <div className="absolute top-full mt-1 left-3 md:left-auto right-3 md:right-auto w-auto md:w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-40 max-h-[60vh] overflow-y-auto">
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
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