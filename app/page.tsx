'use client'

import { useState, useEffect, Suspense, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { BibleParser } from '@/lib/BibleParser'
import { StrongsManager } from '@/lib/StrongsManager'
import { VerseHistoryManager } from '@/lib/VerseHistoryManager'
import { HighlightManager } from '@/lib/HighlightManager'
import { NotesManager } from '@/lib/NotesManager'
import { ReadingPlanManager } from '@/lib/ReadingPlanManager'
import { useSettings } from '@/lib/SettingsContext'
import { usePanels } from '@/lib/contexts/PanelContext'
import { panelRegistry } from '@/lib/panels/PanelRegistry'
import { StrongsPopover } from '@/components/StrongsPopover'
import { ParallelScrollView } from '@/components/ParallelScrollView'
import { BibleSettingsModal } from '@/components/BibleSettingsModal'
import { NotesPanelComponent } from '@/components/panels/NotesPanel'
import { HistoryPanelComponent } from '@/components/panels/HistoryPanel'
import { BibleReaderPanel } from '@/components/panels/BibleReaderPanel'
import type { BibleData, Chapter, StrongsDefinition } from '@/types/bible'
import type { VerseHistoryEntry } from '@/lib/VerseHistoryManager'
import type { VerseHighlight } from '@/lib/HighlightManager'
import type { VerseNote } from '@/lib/NotesManager'

const normalizeVersionValue = (value: string) => value.replace(/_/g, '-').toLowerCase()

interface StrongsPopoverState {
  strongsNumber: string;
  definition: StrongsDefinition;
  position: { x: number; y: number };
}

interface StrongsHistoryEntry {
  strongsNumber: string;
  definition: StrongsDefinition;
}

function BibleApp() {
  const searchParams = useSearchParams()
  const { settings } = useSettings()
  const { panelManager, togglePanel, visiblePanels, refreshPanels } = usePanels()
  const bibleReaderPanelVisible = visiblePanels.some(panel => panel.id === 'bible-reader' && panel.isVisible)
  const historyPanelVisible = visiblePanels.some(panel => panel.id === 'history' && panel.isVisible)
  const notesPanelVisible = visiblePanels.some(panel => panel.id === 'notes' && panel.isVisible)
  const searchParamsString = searchParams?.toString()
  const hasEnsuredBiblePanel = useRef(false)
  const hasEnsuredCrossPanel = useRef(false)
  const [mounted, setMounted] = useState(false)
  const [parser] = useState(() => new BibleParser())
  const [strongsManager] = useState(() => new StrongsManager())
  const [historyManager] = useState(() => new VerseHistoryManager())
  const [highlightManager] = useState(() => new HighlightManager())
  const [notesManager] = useState(() => new NotesManager())
  const [readingPlanManager] = useState(() => new ReadingPlanManager())
  const [bibleData, setBibleData] = useState<BibleData | null>(null)

  const [loading, setLoading] = useState(false)
  const [selectedBook, setSelectedBook] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedBook') || 'Genesis'
    }
    return 'Genesis'
  })
  const [selectedChapter, setSelectedChapter] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedChapter')
      return saved ? parseInt(saved) : 1
    }
    return 1
  })
  const [selectedVerse, setSelectedVerse] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedVerse')
      return saved ? parseInt(saved) : null
    }
    return null
  })
  const selectedBookRef = useRef(selectedBook)
  const selectedChapterRef = useRef(selectedChapter)
  const selectedVerseRef = useRef(selectedVerse)
  const [selectedVersion, setSelectedVersionInternal] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('selectedBibleVersion')
      if (stored) {
        return normalizeVersionValue(stored) || 'kjv-strongs'
      }
    }
    return 'kjv-strongs'
  })
  const [lastLoadedVersion, setLastLoadedVersion] = useState<string | null>(null)

  const setSelectedVersion = (version: string) => {
    const normalized = normalizeVersionValue(version || '')
    const nextVersion = normalized || 'kjv-strongs'
    const currentVersion = normalizeVersionValue(selectedVersion)

    if (!normalized && version) {
      console.warn('Unrecognized Bible version, defaulting to kjv-strongs:', version)
    }

    if (currentVersion === nextVersion) {
      return
    }

    setLastLoadedVersion(null)
    setSelectedVersionInternal(nextVersion)
    setBibleData(null)
    setChapterContent(null)

    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedBibleVersion', nextVersion)
    }

    // Reset verse/chapter selection references so the new version loads correctly
    selectedBookRef.current = selectedBook
    selectedChapterRef.current = selectedChapter
    selectedVerseRef.current = selectedVerse
  }
  const [chapterContent, setChapterContent] = useState<Chapter | null>(null)
  const [strongsPopover, setStrongsPopover] = useState<StrongsPopoverState | null>(null)
  const [strongsHistory, setStrongsHistory] = useState<StrongsHistoryEntry[]>([])
  const [verseHistory, setVerseHistory] = useState<VerseHistoryEntry[]>([])
  const [chapterHighlights, setChapterHighlights] = useState<Map<number, VerseHighlight[]>>(new Map())
  const [chapterNotes, setChapterNotes] = useState<Map<number, VerseNote>>(new Map())
  const [bookNames, setBookNames] = useState<string[]>([])
  const [chapterCount, setChapterCount] = useState(50)
  const [verseCount, setVerseCount] = useState(0)
  const [parallelVersion, setParallelVersionInternal] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('parallelVersion')
      if (saved) {
        return normalizeVersionValue(saved)
      }
      return 'kjv'
    }
    return 'kjv'
  })

  const setParallelVersion = (version: string) => {
    const normalized = normalizeVersionValue(version || '')
    const nextVersion = normalized || 'kjv'

    if (!normalized && version) {
      console.warn('Unrecognized parallel version, defaulting to kjv:', version)
    }

    setParallelVersionInternal(nextVersion)

    if (typeof window !== 'undefined') {
      localStorage.setItem('parallelVersion', nextVersion)
    }
  }

  const refreshChapterContent = useCallback(async (book: string, chapterNum: number) => {
    let localBible = bibleData
    if (!localBible) {
      try {
        const stored = await parser.loadBible(selectedVersion)
        setBibleData(stored)
        localBible = stored
      } catch (error) {
        return
      }
    }

    const availableBooks = Object.keys(localBible.books)
    const safeBook = localBible.books[book] ? book : availableBooks[0]
    if (!safeBook) return

    let totalChapters = 0
    try {
      totalChapters = parser.getChapterCount(safeBook)
    } catch {
      totalChapters = localBible.books[safeBook]?.chapters.length ?? 0
    }

    if (totalChapters <= 0) return

    const normalizedChapter = Math.min(Math.max(chapterNum, 1), totalChapters)
    setChapterCount(totalChapters)

    const chapterData = parser.getChapter(safeBook, normalizedChapter)
    if (chapterData) {
      setChapterContent(chapterData)
      setVerseCount(Object.keys(chapterData.verses).length)
      selectedBookRef.current = safeBook
      selectedChapterRef.current = normalizedChapter
      refreshPanels()
    }
  }, [bibleData, parser, selectedVersion, refreshPanels])

  const handleBookChange = (book: string) => {
    setSelectedBook(book)
    setSelectedChapter(1)
    setSelectedVerse(1)
    selectedBookRef.current = book
    selectedChapterRef.current = 1
    selectedVerseRef.current = 1
    setPreviousChapter({ book, chapter: 1 })
    refreshChapterContent(book, 1)
  }

  const handleChapterChange = (chapter: number) => {
    setSelectedChapter(chapter)
    setSelectedVerse(1)
    selectedChapterRef.current = chapter
    selectedVerseRef.current = 1
    setPreviousChapter({ book: selectedBookRef.current || selectedBook, chapter })
    refreshChapterContent(selectedBookRef.current || selectedBook, chapter)
  }

  const handleVerseChange = (verse: number | null) => {
    setSelectedVerse(verse)
    selectedVerseRef.current = verse
    refreshPanels()
  }

  const handleVersionChange = (version: string) => {
    console.log('[BibleApp] handleVersionChange', version)
    setSelectedVersion(version)
  }

  const handlePreviousChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1)
      setSelectedVerse(1)
      selectedChapterRef.current = selectedChapter - 1
      selectedVerseRef.current = 1
      const newChapter = selectedChapter - 1
      setPreviousChapter({ book: selectedBookRef.current || selectedBook, chapter: newChapter })
      refreshChapterContent(selectedBookRef.current || selectedBook, newChapter)
    } else if (bookNames.indexOf(selectedBook) > 0 && bibleData) {
      const prevBookIndex = bookNames.indexOf(selectedBook) - 1
      const prevBook = bookNames[prevBookIndex]
      if (bibleData.books[prevBook]) {
        const prevBookChapters = Object.keys(bibleData.books[prevBook].chapters).length
        setSelectedBook(prevBook)
        setSelectedChapter(prevBookChapters)
        setSelectedVerse(1)
        selectedBookRef.current = prevBook
        selectedChapterRef.current = prevBookChapters
        selectedVerseRef.current = 1
        setPreviousChapter({ book: prevBook, chapter: prevBookChapters })
        refreshChapterContent(prevBook, prevBookChapters)
      }
    }
  }

  const handleNextChapter = () => {
    if (selectedChapter < chapterCount) {
      setSelectedChapter(selectedChapter + 1)
      setSelectedVerse(1)
      selectedChapterRef.current = selectedChapter + 1
      selectedVerseRef.current = 1
      const newChapter = selectedChapter + 1
      setPreviousChapter({ book: selectedBookRef.current || selectedBook, chapter: newChapter })
      refreshChapterContent(selectedBookRef.current || selectedBook, newChapter)
    } else if (bookNames.indexOf(selectedBook) < bookNames.length - 1) {
      const nextBookIndex = bookNames.indexOf(selectedBook) + 1
      const nextBook = bookNames[nextBookIndex]
      setSelectedBook(nextBook)
      setSelectedChapter(1)
      setSelectedVerse(1)
      selectedBookRef.current = nextBook
      selectedChapterRef.current = 1
      selectedVerseRef.current = 1
      setPreviousChapter({ book: nextBook, chapter: 1 })
      refreshChapterContent(nextBook, 1)
    }
  }

  const handleParallelReading = () => {
    setShowParallelScroll(true)
  }

  const handleSettingsClick = () => {
    setShowSettingsModal(true)
  }

  const handleTodayClick = () => {
    const today = new Date()
    const daysSincePlanStart = Math.floor((today.getTime() - new Date(planStartDate).getTime()) / (1000 * 60 * 60 * 24))
    const todayPsalm = ((daysSincePlanStart + (startingPsalm || 1) - 1) % 150) + 1
    setSelectedBook('Psalms')
    setSelectedChapter(todayPsalm)
    setSelectedVerse(1)
  }

  const handleHistoryToggle = () => {
    togglePanel('history')
  }

  const handleNotesToggle = () => {
    togglePanel('notes')
  }

  const handleAddNoteRequest = (verse: number) => {
    setSelectedVerse(verse)
    refreshPanels()
  }

  useEffect(() => {
    selectedBookRef.current = selectedBook
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedBook', selectedBook)
    }
  }, [selectedBook])

  useEffect(() => {
    selectedChapterRef.current = selectedChapter
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedChapter', selectedChapter.toString())
    }
  }, [selectedChapter])

  useEffect(() => {
    selectedVerseRef.current = selectedVerse
    if (typeof window !== 'undefined') {
      if (selectedVerse === null) {
        localStorage.removeItem('selectedVerse')
      } else {
        localStorage.setItem('selectedVerse', selectedVerse.toString())
      }
    }
  }, [selectedVerse])
  const [showParallelScroll, setShowParallelScroll] = useState(false)
  const [allNotes, setAllNotes] = useState<VerseNote[]>([])

  const NotesPanelWithData = (props: any) => (
    <NotesPanelComponent
      {...props}
      notes={allNotes}
      onNoteSelect={handleNoteSelect}
      onDeleteNote={handleDeleteNote}
    />
  )

  const HistoryPanelWithData = (props: any) => (
    <HistoryPanelComponent
      {...props}
      history={verseHistory}
      onVerseSelect={handleHistoryVerseSelect}
      onClearHistory={handleClearHistory}
      onRemoveEntry={handleRemoveHistoryEntry}
      onStrongsClick={handleStrongsClick}
    />
  )

  const BibleReaderPanelWithData = (panelProps: any) => {
    console.log('[BibleApp] render BibleReaderPanelWithData', {
      loading,
      hasChapterContent: !!chapterContent,
      verses: chapterContent ? Object.keys(chapterContent.verses || {}).length : 0,
      book: selectedBook,
      chapter: selectedChapter
    })
    return (
      <BibleReaderPanel
        {...panelProps}
        loading={loading}
        chapterContent={chapterContent}
        selectedBook={selectedBook}
        selectedChapter={selectedChapter}
      selectedVerse={selectedVerse}
      selectedVersion={selectedVersion}
      bookNames={bookNames}
      chapterCount={chapterCount}
      verseCount={verseCount}
      settings={settings}
      onBookChange={handleBookChange}
      onChapterChange={handleChapterChange}
      onVerseChange={handleVerseChange}
      onVersionChange={handleVersionChange}
      onPreviousChapter={handlePreviousChapter}
      onNextChapter={handleNextChapter}
      onParallelReading={() => setShowParallelScroll(true)}
      onSettingsClick={handleSettingsClick}
      onTodayClick={handleTodayClick}
      onHistoryClick={handleHistoryToggle}
      onNotesClick={handleNotesToggle}
      showHistoryPanel={historyPanelVisible}
      showNotesPanel={notesPanelVisible}
      notesCount={allNotes.length}
      isInReadingPlan={isInReadingPlan}
      readingPlanProgress={readingPlanProgress}
      onMarkAsRead={handleMarkAsRead}
      chapterHighlights={chapterHighlights}
      chapterNotes={chapterNotes}
      onVerseClick={handleVerseClick}
      onHighlightVerse={handleHighlightVerse}
        onRemoveHighlight={handleRemoveHighlight}
        onAddNote={handleAddNoteRequest}
        onStrongsClick={handleStrongsClick}
        showParallelComparison={parallelComparisonEnabled}
        parallelVersion={parallelVersion}
      />
    )
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    console.log('[BibleApp] effect:setPanelComponent')
    panelRegistry.setPanelComponent('bible-reader', BibleReaderPanelWithData)
    panelRegistry.setPanelComponent('notes', NotesPanelWithData)
    panelRegistry.setPanelComponent('history', HistoryPanelWithData)

    // Import and set placeholder panel components dynamically
    import('@/components/panels/CommentaryPanel').then(({ CommentaryPanel }) => {
      panelRegistry.setPanelComponent('commentary', CommentaryPanel)
    })
    import('@/components/panels/DictionaryPanel').then(({ DictionaryPanel }) => {
      panelRegistry.setPanelComponent('dictionary', DictionaryPanel)
    })
    import('@/components/panels/CrossReferencesPanel').then(({ CrossReferencesPanel }) => {
      panelRegistry.setPanelComponent('cross-references', CrossReferencesPanel)
    })

    panelManager.showPanel('bible-reader')
    panelManager.movePanel('bible-reader', 'main')
    hasEnsuredBiblePanel.current = true

    const crossVisible = visiblePanels.some(panel => panel.id === 'cross-references' && panel.isVisible)
    if (!crossVisible) {
      panelManager.showPanel('cross-references')
    }
    hasEnsuredCrossPanel.current = true
  }, [panelManager, visiblePanels, BibleReaderPanelWithData, NotesPanelWithData, HistoryPanelWithData])
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [parallelComparisonEnabled, setParallelComparisonEnabledState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('parallelComparisonEnabled')
      return saved === 'true'
    }
    return false
  })

  const setParallelComparisonEnabled = (enabled: boolean) => {
    setParallelComparisonEnabledState(enabled)
    if (typeof window !== 'undefined') {
      localStorage.setItem('parallelComparisonEnabled', enabled ? 'true' : 'false')
    }
  }
  const [startingPsalm, setStartingPsalm] = useState(1)
  const [planStartDate, setPlanStartDate] = useState(new Date().toISOString().split('T')[0])
  const [todaysReading, setTodaysReading] = useState<{psalm: number, proverbs: number[]} | null>(null)
  const [isInReadingPlan, setIsInReadingPlan] = useState(false)
  const [readingPlanProgress, setReadingPlanProgress] = useState<{psalmCompleted: boolean, proverbsCompleted: boolean} | null>(null)
  const [previousChapter, setPreviousChapter] = useState<{book: string, chapter: number} | null>(null)

  // Load Bible, history, highlights and notes on mount
  const loadBible = useCallback(async (version: string) => {
    const normalizedVersion = normalizeVersionValue(version || 'kjv-strongs')
    setLastLoadedVersion(normalizedVersion)
    setLoading(true)
    try {
      const bible = await parser.loadBible(normalizedVersion)
      setBibleData(bible)
      let books: string[] = []
      try {
        books = parser.getBooks()
      } catch {
        books = Object.keys(bible.books)
      }
      setBookNames(books)

      const currentBook = selectedBookRef.current || 'Genesis'
      const currentChapter = selectedChapterRef.current || 1
      const currentBookExists = bible.books[currentBook]
      let nextBook = currentBook
      let nextChapter = currentChapter

      if (!currentBookExists && books.length > 0) {
        nextBook = books[0]
        nextChapter = 1
        setSelectedBook(nextBook)
        setSelectedChapter(nextChapter)
        selectedBookRef.current = nextBook
        selectedChapterRef.current = nextChapter
        setSelectedVerse(1)
        selectedVerseRef.current = 1
      }

      let chapter = parser.getChapter(nextBook, nextChapter)
      if (!chapter) {
        nextChapter = 1
        setSelectedChapter(nextChapter)
        selectedChapterRef.current = nextChapter
        setSelectedVerse(1)
        selectedVerseRef.current = 1
        chapter = parser.getChapter(nextBook, nextChapter)
      }

      if (chapter) {
        setChapterContent(chapter)
        try {
          setChapterCount(parser.getChapterCount(nextBook))
        } catch {
          setChapterCount(Object.keys(bible.books[nextBook].chapters).length)
        }
        setVerseCount(Object.keys(chapter.verses).length)
        refreshPanels()
      }

      if (normalizedVersion === 'kjv-strongs' || normalizedVersion === 'asv-strongs') {
        strongsManager
          .loadDefinitions()
          .then(() => console.log('Strong\'s definitions loaded'))
          .catch(err => console.error('Failed to load Strong\'s:', err))
      }
    } catch (error) {
      setLastLoadedVersion(prev => (prev === normalizedVersion ? null : prev))
    } finally {
      setLoading(false)
    }
  }, [parser, strongsManager])

  useEffect(() => {
    setMounted(true)

    const savedVersion = localStorage.getItem('selectedBibleVersion')
    const savedStartingPsalm = localStorage.getItem('startingPsalm')
    const savedPlanStartDate = localStorage.getItem('planStartDate')

    const params = searchParamsString ? new URLSearchParams(searchParamsString) : null
    const versionParamRaw = params?.get('version')
    const bookParam = params?.get('book')
    const chapterParam = params?.get('chapter')
    const verseParam = params?.get('verse')

    const validVersions = ['kjv', 'kjv-strongs', 'asv', 'asv-strongs', 'kjv_strongs', 'asv_strongs'].map(normalizeVersionValue)

    let initialVersion = selectedVersion || 'kjv-strongs'
    if (versionParamRaw && validVersions.includes(normalizeVersionValue(versionParamRaw))) {
      initialVersion = normalizeVersionValue(versionParamRaw)
    } else if (savedVersion && validVersions.includes(normalizeVersionValue(savedVersion))) {
      initialVersion = normalizeVersionValue(savedVersion)
    }

    let initialBook = selectedBookRef.current || selectedBook
    if (bookParam) {
      initialBook = bookParam
    } else if (typeof window !== 'undefined') {
      const storedBook = localStorage.getItem('selectedBook')
      if (storedBook) {
        initialBook = storedBook
      }
    }

    let initialChapter = selectedChapterRef.current || selectedChapter
    if (chapterParam) {
      const parsedChapter = parseInt(chapterParam)
      if (!Number.isNaN(parsedChapter)) {
        initialChapter = parsedChapter
      }
    } else if (typeof window !== 'undefined') {
      const storedChapter = localStorage.getItem('selectedChapter')
      if (storedChapter) {
        const parsedChapter = parseInt(storedChapter)
        if (!Number.isNaN(parsedChapter)) {
          initialChapter = parsedChapter
        }
      }
    }

    let initialVerse: number | null = selectedVerseRef.current ?? selectedVerse
    if (verseParam) {
      const parsedVerse = parseInt(verseParam)
      if (!Number.isNaN(parsedVerse)) {
        initialVerse = parsedVerse
      }
    } else if (typeof window !== 'undefined') {
      const storedVerse = localStorage.getItem('selectedVerse')
      if (storedVerse) {
        const parsedVerse = parseInt(storedVerse)
        if (!Number.isNaN(parsedVerse)) {
          initialVerse = parsedVerse
        }
      } else {
        initialVerse = null
      }
    }

    selectedBookRef.current = initialBook
    selectedChapterRef.current = initialChapter
    selectedVerseRef.current = initialVerse

    if (initialBook !== selectedBook) {
      setSelectedBook(initialBook)
    }
    if (initialChapter !== selectedChapter) {
      setSelectedChapter(initialChapter)
    }
    if ((initialVerse ?? 1) !== selectedVerse) {
      setSelectedVerse(initialVerse ?? 1)
    }

    setSelectedVersion(initialVersion)
    loadBible(initialVersion)

    if (savedStartingPsalm) {
      setStartingPsalm(parseInt(savedStartingPsalm))
    }
    if (savedPlanStartDate) {
      setPlanStartDate(savedPlanStartDate)
    }

    loadVerseHistory()
    initHighlights()
    initNotes()
    loadAllNotes()
    initReadingPlan()
  }, [loadBible, searchParamsString])

  // Reload Bible when version changes
  useEffect(() => {
    if (!mounted) return
    if (!selectedVersion) return

    if (!lastLoadedVersion || normalizeVersionValue(lastLoadedVersion) !== normalizeVersionValue(selectedVersion)) {
      loadBible(selectedVersion)
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedBibleVersion', selectedVersion)
    }
  }, [selectedVersion, mounted, lastLoadedVersion, loadBible])

  useEffect(() => {
    if (!bibleData) {
      console.log('[BibleApp] effect:bibleData -> no bibleData yet')
      return
    }
    console.log('[BibleApp] effect:bibleData -> refresh', selectedBook, selectedChapter)
    refreshChapterContent(selectedBook, selectedChapter)
    setPreviousChapter({ book: selectedBook, chapter: selectedChapter })
    loadChapterHighlights()
    loadChapterNotes()
  }, [bibleData, selectedBook, selectedChapter, refreshChapterContent])

  // Check if current passage is in reading plan
  useEffect(() => {
    if (todaysReading && selectedBook && selectedChapter) {
      const planType = checkIfInReadingPlan()
      setIsInReadingPlan(!!planType)
    }
  }, [selectedBook, selectedChapter, todaysReading])

  // Update chapter count when book changes
  useEffect(() => {
    if (bibleData && selectedBook && bibleData.books[selectedBook]) {
      const chapters = Object.keys(bibleData.books[selectedBook].chapters).length
      setChapterCount(chapters)
      // Reset chapter to 1 if current selection is out of range
      if (selectedChapter > chapters) {
        setSelectedChapter(1)
      }
    } else if (bibleData && selectedBook && bookNames.length > 0) {
      // Selected book doesn't exist in this Bible version, reset to first available book
      setSelectedBook(bookNames[0])
      setSelectedChapter(1)
    }
  }, [bibleData, selectedBook, selectedChapter, bookNames])

  useEffect(() => {
    if (!mounted) return
    refreshPanels()
  }, [mounted, selectedBook, selectedChapter, selectedVerse, selectedVersion, parallelVersion, refreshPanels])

  const handleStrongsClick = async (strongsNumber: string, position: { x: number; y: number }, isFromPopover = false) => {
    console.log('🔍 [Main App] handleStrongsClick called with:', strongsNumber, 'isFromPopover:', isFromPopover);
    if (!strongsManager.loaded) {
      console.log('🔍 [Main App] Loading Strong\'s definitions...');
      await strongsManager.loadDefinitions()
    }

    const definition = strongsManager.lookup(strongsNumber)
    console.log('🔍 [Main App] Definition lookup result:', !!definition);
    if (definition) {
      if (isFromPopover && strongsPopover) {
        // Save current to history and replace content
        setStrongsHistory(prev => [...prev, {
          strongsNumber: strongsPopover.strongsNumber,
          definition: strongsPopover.definition
        }])
        setStrongsPopover({
          strongsNumber,
          definition,
          position: strongsPopover.position // Keep the same position for popover clicks
        })
      } else if (strongsPopover && strongsPopover.strongsNumber !== strongsNumber) {
        // Clicking a different Strong's number while popover is open
        // Update the popover with new content and new position
        setStrongsHistory([]) // Clear history for new selection
        setStrongsPopover({
          strongsNumber,
          definition,
          position // Use the new click position
        })
      } else if (!strongsPopover) {
        // Opening a new popover (no popover currently open)
        setStrongsHistory([])
        setStrongsPopover({
          strongsNumber,
          definition,
          position
        })
      }
    } else {
      console.warn(`No definition found for ${strongsNumber}`)
    }
  }

  const goBackInHistory = () => {
    if (strongsHistory.length > 0) {
      const previous = strongsHistory[strongsHistory.length - 1]
      setStrongsHistory(prev => prev.slice(0, -1))
      setStrongsPopover({
        ...strongsPopover!,
        strongsNumber: previous.strongsNumber,
        definition: previous.definition
      })
    }
  }

  const closeStrongsPopover = () => {
    setStrongsPopover(null)
    setStrongsHistory([])
  }

  const loadVerseHistory = async () => {
    try {
      await historyManager.init()
      const history = await historyManager.getHistory(50)
      console.log('Loaded history:', history)
      setVerseHistory(history)
    } catch (error) {
      console.error('Failed to load verse history:', error)
    }
  }

  const handleVerseClick = async (verse: any) => {
    if (!verse) return

    const verseNumber = Number(verse.verse)
    if (Number.isNaN(verseNumber)) {
      return
    }

    const isNewVerse = verseNumber !== selectedVerse

    setSelectedVerse(verseNumber)
    selectedVerseRef.current = verseNumber
    refreshPanels()

    if (chapterContent && isNewVerse) {
      const reference = `${selectedBook} ${selectedChapter}:${verseNumber}`

      try {
        await historyManager.addToHistory({
          book: selectedBook,
          chapter: selectedChapter,
          verse: verseNumber,
          verseText: verse.text,
          version: selectedVersion,
          reference
        })
        await loadVerseHistory()
      } catch (error) {
        console.error('Failed to add to history:', error)
      }
    }
  }

  const handleHistoryVerseSelect = (book: string, chapter: number, verse: number) => {
    setSelectedBook(book)
    setSelectedChapter(chapter)
    setSelectedVerse(verse)
  }

  const handleClearHistory = async () => {
    await historyManager.clearHistory()
    setVerseHistory([])
  }

  const handleRemoveHistoryEntry = async (id: string) => {
    await historyManager.removeFromHistory(id)
    loadVerseHistory()
  }

  const initHighlights = async () => {
    try {
      await highlightManager.init()
    } catch (error) {
      console.error('Failed to initialize highlights:', error)
    }
  }

  const loadChapterHighlights = async () => {
    try {
      const highlights = await highlightManager.getHighlightsForChapter(
        selectedBook,
        selectedChapter,
        selectedVersion
      )
      setChapterHighlights(highlights)
    } catch (error) {
      console.error('Failed to load chapter highlights:', error)
    }
  }

  const handleHighlightVerse = async (verse: number, color: string, selectedText?: string, startOffset?: number, endOffset?: number) => {
    if (!chapterContent) return
    
    const verseData = chapterContent.verses[verse]
    if (!verseData) return
    
    const reference = `${selectedBook} ${selectedChapter}:${verse}`
    
    await highlightManager.addHighlight({
      book: selectedBook,
      chapter: selectedChapter,
      verse,
      color,
      reference,
      version: selectedVersion,
      selectedText,
      startOffset,
      endOffset
    })
    
    await loadChapterHighlights()
  }

  const handleRemoveHighlight = async (verse: number, startOffset?: number, endOffset?: number) => {
    await highlightManager.removeHighlight(
      selectedBook,
      selectedChapter,
      verse,
      selectedVersion,
      startOffset,
      endOffset
    )
    
    await loadChapterHighlights()
  }

  const initNotes = async () => {
    try {
      await notesManager.init()
    } catch (error) {
      console.error('Failed to initialize notes:', error)
    }
  }

  const loadChapterNotes = async () => {
    try {
      const notes = await notesManager.getNotesForChapter(
        selectedBook,
        selectedChapter,
        selectedVersion
      )
      setChapterNotes(notes)
    } catch (error) {
      console.error('Failed to load chapter notes:', error)
    }
  }

  const loadAllNotes = async () => {
    try {
      const notes = await notesManager.getAllNotes()
      setAllNotes(notes)
    } catch (error) {
      console.error('Failed to load all notes:', error)
    }
  }

  const initReadingPlan = async () => {
    try {
      await readingPlanManager.init()
      await checkTodaysReading()
    } catch (error) {
      console.error('Failed to init reading plan:', error)
    }
  }

  const checkTodaysReading = async () => {
    const today = new Date()
    const savedStartingPsalm = localStorage.getItem('startingPsalm')
    const savedPlanStartDate = localStorage.getItem('planStartDate')
    const startPsalm = savedStartingPsalm ? parseInt(savedStartingPsalm) : 1
    const startDate = savedPlanStartDate ? new Date(savedPlanStartDate) : new Date()

    const psalm = readingPlanManager.calculatePsalm(today, startPsalm, startDate)
    const proverbs = readingPlanManager.calculateProverbs(today)

    setTodaysReading({ psalm, proverbs })

    // Check progress for today
    const dateStr = today.toISOString().split('T')[0]
    const progress = await readingPlanManager.getProgress(dateStr)
    if (progress) {
      setReadingPlanProgress({
        psalmCompleted: progress.psalmCompleted,
        proverbsCompleted: progress.proverbsCompleted
      })
    }
  }

  const checkIfInReadingPlan = () => {
    if (!todaysReading) return false

    // Check if current passage is Psalms
    if (selectedBook === 'Psalms' && selectedChapter === todaysReading.psalm) {
      return 'psalm'
    }

    // Check if current passage is Proverbs
    if (selectedBook === 'Proverbs' && todaysReading.proverbs.includes(selectedChapter)) {
      return 'proverbs'
    }

    return false
  }

  const handleMarkAsRead = async () => {
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0]
    const readingType = checkIfInReadingPlan()

    if (readingType) {
      await readingPlanManager.markAsRead(dateStr, readingType)
      await checkTodaysReading() // Refresh progress
    }
  }

  const handleAddNote = async (verse: number, noteText: string) => {
    if (!chapterContent) return
    
    const reference = `${selectedBook} ${selectedChapter}:${verse}`
    
    await notesManager.addOrUpdateNote({
      book: selectedBook,
      chapter: selectedChapter,
      verse,
      note: noteText,
      reference,
      version: selectedVersion
    })
    
    await loadChapterNotes()
    await loadAllNotes()
  }

  const handleDeleteNote = async (id: string) => {
    await notesManager.deleteNote(id)
    await loadChapterNotes()
    await loadAllNotes()
  }

  const handleNoteSelect = (book: string, chapter: number, verse: number) => {
    setSelectedBook(book)
    setSelectedChapter(chapter)
    setSelectedVerse(verse)
    if (notesPanelVisible) {
      togglePanel('notes')
    }
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Handle Escape for Strong's popover
      if (e.key === 'Escape' && strongsPopover) {
        if (strongsHistory.length > 0) {
          goBackInHistory()
        } else {
          closeStrongsPopover()
        }
        return
      }

      // Don't handle navigation shortcuts if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Navigation shortcuts
      if (e.key === 'j' || e.key === 'J') {
        // Previous chapter
        if (selectedChapter > 1) {
          setSelectedChapter(selectedChapter - 1)
          setSelectedVerse(1)  // Auto-select verse 1
        } else if (bookNames.indexOf(selectedBook) > 0) {
          const prevBookIndex = bookNames.indexOf(selectedBook) - 1
          const prevBook = bookNames[prevBookIndex]
          if (bibleData && bibleData.books[prevBook]) {
            const prevBookChapters = Object.keys(bibleData.books[prevBook].chapters).length
            setSelectedBook(prevBook)
            setSelectedChapter(prevBookChapters)
            setSelectedVerse(1)  // Auto-select verse 1
          }
        }
      } else if (e.key === 'k' || e.key === 'K') {
        // Next chapter
        if (selectedChapter < chapterCount) {
          setSelectedChapter(selectedChapter + 1)
          setSelectedVerse(1)  // Auto-select verse 1
        } else if (bookNames.indexOf(selectedBook) < bookNames.length - 1) {
          const nextBookIndex = bookNames.indexOf(selectedBook) + 1
          const nextBook = bookNames[nextBookIndex]
          setSelectedBook(nextBook)
          setSelectedChapter(1)
          setSelectedVerse(1)  // Auto-select verse 1
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [strongsPopover, strongsHistory, selectedChapter, selectedBook, bookNames, bibleData, chapterCount])

  // Scroll to verse when selected
  useEffect(() => {
    if (selectedVerse) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        const verseElement = document.getElementById(`verse-${selectedVerse}`)
        if (verseElement) {
          verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [selectedVerse])

  // Save parallel comparison preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('parallelComparisonEnabled', parallelComparisonEnabled.toString())
    }
  }, [parallelComparisonEnabled])

  // Save parallel version preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('parallelVersion', parallelVersion)
    }
  }, [parallelVersion])

  // Save selected book
  useEffect(() => {
    if (typeof window !== 'undefined' && mounted) {
      localStorage.setItem('selectedBook', selectedBook)
    }
  }, [selectedBook, mounted])

  // Save selected chapter
  useEffect(() => {
    if (typeof window !== 'undefined' && mounted) {
      localStorage.setItem('selectedChapter', selectedChapter.toString())
    }
  }, [selectedChapter, mounted])

  // Save selected verse
  useEffect(() => {
    if (typeof window !== 'undefined' && mounted) {
      if (selectedVerse !== null) {
        localStorage.setItem('selectedVerse', selectedVerse.toString())
      } else {
        localStorage.removeItem('selectedVerse')
      }
    }
  }, [selectedVerse, mounted])


  return (
    <>
      {!bibleReaderPanelVisible && (
        <div className="flex h-full items-center justify-center p-8 text-gray-500 dark:text-gray-400">
          <div className="text-center space-y-2">
            <div className="text-sm uppercase tracking-wide">Preparing layout</div>
            <div className="text-base">Loading Bible reader…</div>
          </div>
        </div>
      )}

      {strongsPopover && (
        <StrongsPopover
          strongsNumber={strongsPopover.strongsNumber}
          definition={strongsPopover.definition}
          position={strongsPopover.position}
          onClose={closeStrongsPopover}
          onStrongsClick={(num, pos) => handleStrongsClick(num, pos, true)}
          onBack={strongsHistory.length > 0 ? goBackInHistory : undefined}
          hasHistory={strongsHistory.length > 0}
        />
      )}

      {showParallelScroll && (
        <ParallelScrollView
          primaryVersion={selectedVersion}
          secondaryVersion={parallelVersion}
          book={selectedBook}
          chapter={selectedChapter}
          onClose={() => setShowParallelScroll(false)}
          onStrongsClick={handleStrongsClick}
        />
      )}

      <BibleSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        parallelComparisonEnabled={parallelComparisonEnabled}
        onParallelComparisonChange={setParallelComparisonEnabled}
        parallelVersion={parallelVersion}
        onParallelVersionChange={setParallelVersion}
        primaryVersion={selectedVersion}
      />
    </>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BibleApp />
    </Suspense>
  )
}
