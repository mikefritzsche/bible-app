'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { BasePanel, type PanelProps } from './BasePanel'
import { CompactBibleControls } from '@/components/CompactBibleControls'
import { VerseDisplay } from '@/components/VerseDisplay'
import { ParallelComparison } from '@/components/ParallelComparison'
import { Clock, ArrowLeft, BookOpen } from 'lucide-react'
import type { Chapter } from '@/types/bible'
import type { VerseHighlight } from '@/lib/HighlightManager'
import type { VerseNote } from '@/lib/NotesManager'
import type { VerseHistoryEntry } from '@/lib/VerseHistoryManager'

const MIN_PARALLEL_HEIGHT = 80
const MAX_PARALLEL_HEIGHT = 640
const DEFAULT_PARALLEL_HEIGHT = 360
const PARALLEL_HEIGHT_STORAGE_KEY = 'bible-reader-parallel-height'

interface ReaderSettings {
  fontSize: string
  lineSpacing: string
  verseSpacing: string
  showVerseNumbers: boolean
}

interface ReadingPlanProgress {
  psalmCompleted: boolean
  proverbsCompleted: boolean
}

type HighlightHandler = (
  verse: number,
  startOffset?: number,
  endOffset?: number,
  color?: string
) => void | Promise<void>

type RemoveHighlightHandler = (
  verse: number,
  startOffset?: number,
  endOffset?: number
) => void | Promise<void>

type VerseClickHandler = (verse: { verse: number; text: string }) => void

type StrongsClickHandler = (
  strongsNumber: string,
  position: { x: number; y: number }
) => void

interface BibleReaderPanelProps extends PanelProps {
  loading: boolean
  chapterContent: Chapter | null
  selectedBook: string
  selectedChapter: number
  selectedVerse: number | null
  selectedVersion: string
  bookNames: string[]
  chapterCount: number
  verseCount: number
  settings: ReaderSettings
  onBookChange: (book: string) => void
  onChapterChange: (chapter: number) => void
  onVerseChange: (verse: number | null) => void
  onVersionChange: (version: string) => void
  onPreviousChapter: () => void
  onNextChapter: () => void
  onParallelReading: () => void
  onSettingsClick: () => void
  onTodayClick: () => void
  onHistoryClick: () => void
  onNotesClick: () => void
  showHistoryPanel?: boolean
  showNotesPanel?: boolean
  notesCount: number
  isInReadingPlan: boolean
  readingPlanProgress: ReadingPlanProgress | null
  onMarkAsRead: () => void
  chapterHighlights: Map<number, VerseHighlight[]>
  chapterNotes: Map<number, VerseNote>
  onVerseClick: VerseClickHandler
  onHighlightVerse: HighlightHandler
  onRemoveHighlight: RemoveHighlightHandler
  onAddNote: (verse: number) => void
  onStrongsClick: StrongsClickHandler
  showParallelComparison: boolean
  parallelVersion: string
  // History navigation
  canGoBack: boolean
  canGoForward: boolean
  onGoBack: () => void
  onGoForward: () => void
  // History display mode
  displayMode: 'bible' | 'history'
  historyEntries: VerseHistoryEntry[]
  onHistoryEntryClick: (entry: VerseHistoryEntry) => void
  onExitHistoryMode: () => void
}

export function BibleReaderPanel({
  id,
  title,
  isVisible,
  position,
  size,
  onResize,
  minSize,
  maxSize,
  loading,
  chapterContent,
  selectedBook,
  selectedChapter,
  selectedVerse,
  selectedVersion,
  bookNames,
  chapterCount,
  verseCount,
  settings,
  onBookChange,
  onChapterChange,
  onVerseChange,
  onVersionChange,
  onPreviousChapter,
  onNextChapter,
  onParallelReading,
  onSettingsClick,
  onTodayClick,
  onHistoryClick,
  onNotesClick,
  showHistoryPanel = false,
  showNotesPanel = false,
  notesCount,
  isInReadingPlan,
  readingPlanProgress,
  onMarkAsRead,
  chapterHighlights,
  chapterNotes,
  onVerseClick,
  onHighlightVerse,
  onRemoveHighlight,
  onAddNote,
  onStrongsClick,
  showParallelComparison,
  parallelVersion,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  displayMode = 'bible',
  historyEntries = [],
  onHistoryEntryClick,
  onExitHistoryMode
}: BibleReaderPanelProps) {
  console.log('[BibleReaderPanel] Rendering with props:', {
    displayMode,
    historyEntriesLength: historyEntries?.length,
    historyEntries: historyEntries?.slice(0, 3), // Log first 3 entries
    selectedBook,
    selectedChapter
  })
  console.log('[BibleReaderPanel] render with displayMode:', displayMode)
  // Wrapper function to handle parameter order difference
  const handleVerseHighlight = async (
    verseNum: number,
    color: string,
    selectedText?: string,
    startOffset?: number,
    endOffset?: number
  ) => {
    return onHighlightVerse(verseNum, startOffset, endOffset, color)
  }

  // Wrapper function to ensure Promise<void> return type
  const handleRemoveHighlight = async (
    verseNum: number,
    startOffset?: number,
    endOffset?: number
  ): Promise<void> => {
    const result = onRemoveHighlight(verseNum, startOffset, endOffset)
    if (result instanceof Promise) {
      return result
    }
  }

  const activeVerseNumber = selectedVerse && selectedVerse > 0 ? selectedVerse : 1
  const activePrimaryText = chapterContent?.verses?.[String(activeVerseNumber)]?.text

  const [parallelHeight, setParallelHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = Number(localStorage.getItem(PARALLEL_HEIGHT_STORAGE_KEY))
      if (!Number.isNaN(stored)) {
        return Math.min(MAX_PARALLEL_HEIGHT, Math.max(MIN_PARALLEL_HEIGHT, stored))
      }
    }
    return DEFAULT_PARALLEL_HEIGHT
  })
  const [isResizingParallel, setIsResizingParallel] = useState(false)
  const resizeCleanupRef = useRef<(() => void) | null>(null)
  const parallelContainerRef = useRef<HTMLDivElement>(null)

  const startParallelResize = useCallback((startClientY: number) => {
    const normalizedStartHeight = Math.max(
      MIN_PARALLEL_HEIGHT,
      Math.min(MAX_PARALLEL_HEIGHT, parallelHeight)
    )

    if (normalizedStartHeight !== parallelHeight) {
      setParallelHeight(normalizedStartHeight)
    }

    setIsResizingParallel(true)

    const previousUserSelect = document.body.style.userSelect
    const previousCursor = document.body.style.cursor
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'row-resize'

    const updateHeight = (clientY: number) => {
      const delta = startClientY - clientY
      const nextHeight = Math.max(
        MIN_PARALLEL_HEIGHT,
        Math.min(MAX_PARALLEL_HEIGHT, normalizedStartHeight + delta)
      )
      setParallelHeight(nextHeight)
    }

    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault()
      updateHeight(event.clientY)
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        event.preventDefault()
        updateHeight(event.touches[0].clientY)
      }
    }

    const stopResizing = () => {
      setIsResizingParallel(false)
      document.body.style.userSelect = previousUserSelect
      document.body.style.cursor = previousCursor
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', stopResizing)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', stopResizing)
      document.removeEventListener('touchcancel', stopResizing)
      resizeCleanupRef.current = null
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', stopResizing)
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', stopResizing)
    document.addEventListener('touchcancel', stopResizing)

    resizeCleanupRef.current = stopResizing
  }, [parallelHeight])

  const handleParallelResizeMouseStart = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    startParallelResize(event.clientY)
  }, [startParallelResize])

  const handleParallelResizeTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length > 0) {
      event.preventDefault()
      startParallelResize(event.touches[0].clientY)
    }
  }, [startParallelResize])

  useEffect(() => {
    return () => {
      if (resizeCleanupRef.current) {
        resizeCleanupRef.current()
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PARALLEL_HEIGHT_STORAGE_KEY, String(Math.round(parallelHeight)))
    }
  }, [parallelHeight])

  return (
    <BasePanel
      id={id}
      title={title}
      isVisible={isVisible}
      position={position}
      size={size}
      onResize={onResize}
      minSize={minSize}
      maxSize={maxSize}
      showHeader={false}
      isCollapsible={false}
      isResizable={false}
      className="h-full"
    >
      <div className="flex h-full flex-col bg-white dark:bg-gray-900" data-bible-pane>
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
          <CompactBibleControls
            selectedBook={selectedBook}
            selectedChapter={selectedChapter}
            selectedVerse={selectedVerse}
            selectedVersion={selectedVersion}
            bookNames={bookNames}
            chapterCount={chapterCount}
            verseCount={verseCount}
            onBookChange={onBookChange}
            onChapterChange={onChapterChange}
            onVerseChange={onVerseChange}
            onVersionChange={onVersionChange}
            onPreviousChapter={onPreviousChapter}
            onNextChapter={onNextChapter}
            onParallelReading={onParallelReading}
            isPreviousDisabled={selectedChapter === 1 && bookNames.indexOf(selectedBook) === 0}
            isNextDisabled={selectedChapter === chapterCount && bookNames.indexOf(selectedBook) === bookNames.length - 1}
            onSettingsClick={onSettingsClick}
            onTodayClick={onTodayClick}
            onHistoryClick={onHistoryClick}
            onNotesClick={onNotesClick}
            showHistoryPanel={showHistoryPanel}
            showNotesPanel={showNotesPanel}
            notesCount={notesCount}
            isInReadingPlan={isInReadingPlan}
            readingPlanProgress={readingPlanProgress}
            onMarkAsRead={onMarkAsRead}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onGoBack={onGoBack}
            onGoForward={onGoForward}
            displayMode={displayMode}
            onExitHistoryMode={onExitHistoryMode}
          />
        </div>

        <div
          id="bible-reader-scroll"
          className="flex-1 min-h-0 px-3 sm:px-4 md:px-6 pb-8"
          data-bible-scroll
        >
          {displayMode === 'bible' && chapterContent && (
            <div className="flex h-full flex-col gap-4">
              <div className="flex-1 min-h-0">
                <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                  <div className="px-4 sm:px-6 md:px-8 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {selectedBook} {selectedChapter}
                    </h2>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 space-y-2">
                    {Object.values(chapterContent.verses)
                      .sort((a, b) => a.verse - b.verse)
                      .map((verse) => (
                        <VerseDisplay
                          key={verse.verse}
                          verse={verse}
                          bookName={selectedBook}
                          chapterNumber={selectedChapter}
                          isSelected={selectedVerse === verse.verse}
                          highlights={chapterHighlights.get(verse.verse)}
                          note={chapterNotes.get(verse.verse)}
                          hasStrongs={selectedVersion === 'kjv-strongs' || selectedVersion === 'asv-strongs'}
                          fontSize={settings.fontSize}
                          lineSpacing={settings.lineSpacing}
                          verseSpacing={settings.verseSpacing}
                          showVerseNumbers={settings.showVerseNumbers}
                          onVerseClick={onVerseClick}
                          onHighlight={handleVerseHighlight}
                          onRemoveHighlight={handleRemoveHighlight}
                          onAddNote={() => onAddNote(verse.verse)}
                          onStrongsClick={onStrongsClick}
                        />
                      ))}
                  </div>
                </div>
              </div>

              {showParallelComparison && (
                <div className="flex-none">
                  <div
                    role="separator"
                    aria-orientation="horizontal"
                    aria-label="Resize parallel comparison"
                    className={`group flex h-3 items-center justify-center cursor-row-resize select-none transition-colors ${
                      isResizingParallel ? 'text-blue-500' : 'text-gray-400'
                    }`}
                    onMouseDown={handleParallelResizeMouseStart}
                    onTouchStart={handleParallelResizeTouchStart}
                  >
                    <span
                      className={`block h-1 w-12 rounded-full transition-colors ${
                        isResizingParallel
                          ? 'bg-blue-500'
                          : 'bg-gray-400 group-hover:bg-blue-400'
                      }`}
                    />
                  </div>
                  <div
                    ref={parallelContainerRef}
                    className="mt-2 rounded-lg"
                    style={{
                      height: `${parallelHeight}px`,
                      minHeight: `${MIN_PARALLEL_HEIGHT}px`,
                      maxHeight: `${MAX_PARALLEL_HEIGHT}px`,
                      overflow: 'hidden'
                    }}
                  >
                    <ParallelComparison
                      primaryVersion={selectedVersion}
                      secondaryVersion={parallelVersion}
                      book={selectedBook}
                      chapter={selectedChapter}
                      verse={activeVerseNumber}
                      primaryText={activePrimaryText}
                      isVisible={showParallelComparison}
                      fontSize={`${settings.fontSize}px`}
                      lineSpacing={settings.lineSpacing}
                      onStrongsClick={onStrongsClick}
                      className="h-full"
                    />
                  </div>
                  {isResizingParallel && (
                    <div className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
                      Height: {Math.round(parallelHeight)}px
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {displayMode === 'history' && (
            <div className="flex h-full flex-col">
              <div className="flex-1 min-h-0">
                <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                  <div className="px-4 sm:px-6 md:px-8 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                          Reading History
                        </h2>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {historyEntries.length} entries
                      </span>
                    </div>
                    <button
                      onClick={onExitHistoryMode}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Bible
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {historyEntries.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500 dark:text-gray-400">
                        <Clock className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" />
                        <p className="text-lg font-medium mb-2">No reading history</p>
                        <p className="text-sm">Your reading history will appear here as you navigate through the Bible.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {historyEntries.map((entry) => (
                          <div
                            key={entry.id}
                            onClick={() => onHistoryEntryClick(entry)}
                            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <BookOpen className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                                  <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                    {entry.reference}
                                  </h3>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                    {entry.version}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 line-clamp-2">
                                  {entry.verseText}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(entry.timestamp).toLocaleDateString()} at {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transform rotate-180" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {displayMode === 'bible' && !chapterContent && (
            <div className="flex h-full items-center justify-center p-8 text-gray-500 dark:text-gray-400">
              {loading ? 'Loading Bible…' : 'Select a book and chapter to begin reading.'}
            </div>
          )}
        </div>
      </div>
    </BasePanel>
  )
}

export default BibleReaderPanel
