'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { BasePanel, type PanelProps } from './BasePanel'
import { CompactBibleControls } from '@/components/CompactBibleControls'
import { VerseDisplay } from '@/components/VerseDisplay'
import { ParallelComparison } from '@/components/ParallelComparison'
import type { Chapter } from '@/types/bible'
import type { VerseHighlight } from '@/lib/HighlightManager'
import type { VerseNote } from '@/lib/NotesManager'

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
  parallelVersion
}: BibleReaderPanelProps) {
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
          />
        </div>

        <div
          id="bible-reader-scroll"
          className="flex-1 min-h-0 px-3 sm:px-4 md:px-6 pb-8"
          data-bible-scroll
        >
          {chapterContent && (
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
                          onHighlight={onHighlightVerse}
                          onRemoveHighlight={onRemoveHighlight}
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

          {!chapterContent && (
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
