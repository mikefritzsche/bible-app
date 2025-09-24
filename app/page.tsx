'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { BibleParser } from '@/lib/BibleParser'
import { StrongsManager } from '@/lib/StrongsManager'
import { VerseHistoryManager } from '@/lib/VerseHistoryManager'
import { HighlightManager, HIGHLIGHT_COLORS } from '@/lib/HighlightManager'
import { NotesManager } from '@/lib/NotesManager'
import { ReadingPlanManager } from '@/lib/ReadingPlanManager'
import { useSettings } from '@/lib/SettingsContext'
import { VerseWithStrongs } from '@/components/VerseWithStrongs'
import { StrongsPopover } from '@/components/StrongsPopover'
import { HighlightControls } from '@/components/HighlightControls'
import { ParallelVerseView } from '@/components/ParallelVerseView'
import { ParallelScrollView } from '@/components/ParallelScrollView'
import { InlineParallelVerse } from '@/components/InlineParallelVerse'
import { FixedParallelComparison } from '@/components/FixedParallelComparison'
import { BibleSettingsModal } from '@/components/BibleSettingsModal'
import { NotesPanel } from '@/components/NotesPanel'
import { HistoryPanel } from '@/components/HistoryPanel'
import { VerseDisplay } from '@/components/VerseDisplay'
import { CompactBibleControls } from '@/components/CompactBibleControls'
import {
  Settings,
  CalendarCheck,
  History,
  FileText
} from 'lucide-react'
import type { BibleData, Chapter, StrongsDefinition } from '@/types/bible'
import type { VerseHistoryEntry } from '@/lib/VerseHistoryManager'
import type { VerseHighlight } from '@/lib/HighlightManager'
import type { VerseNote } from '@/lib/NotesManager'

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
      return saved ? parseInt(saved) : 1  // Default to verse 1
    }
    return 1  // Default to verse 1
  })
  const [selectedVersion, setSelectedVersion] = useState('kjv_strongs')
  const [chapterContent, setChapterContent] = useState<Chapter | null>(null)
  const [strongsPopover, setStrongsPopover] = useState<StrongsPopoverState | null>(null)
  const [strongsHistory, setStrongsHistory] = useState<StrongsHistoryEntry[]>([])
  const [verseHistory, setVerseHistory] = useState<VerseHistoryEntry[]>([])
  const [chapterHighlights, setChapterHighlights] = useState<Map<number, VerseHighlight[]>>(new Map())
  const [chapterNotes, setChapterNotes] = useState<Map<number, VerseNote>>(new Map())
  const [bookNames, setBookNames] = useState<string[]>([])
  const [chapterCount, setChapterCount] = useState(50)
  const [verseCount, setVerseCount] = useState(0)
  const [showParallelVerse, setShowParallelVerse] = useState(false)
  const [parallelVersion, setParallelVersion] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('parallelVersion') || 'kjv'
    }
    return 'kjv'
  })
  const [parallelVerseData, setParallelVerseData] = useState<{book: string, chapter: number, verse: number} | null>(null)
  const [showParallelScroll, setShowParallelScroll] = useState(false)
  const [showNotesPanel, setShowNotesPanel] = useState(false)
  const [allNotes, setAllNotes] = useState<VerseNote[]>([])
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [parallelComparisonEnabled, setParallelComparisonEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('parallelComparisonEnabled')
      return saved === 'true'
    }
    return false
  })
  const [startingPsalm, setStartingPsalm] = useState(1)
  const [planStartDate, setPlanStartDate] = useState(new Date().toISOString().split('T')[0])
  const [todaysReading, setTodaysReading] = useState<{psalm: number, proverbs: number[]} | null>(null)
  const [isInReadingPlan, setIsInReadingPlan] = useState(false)
  const [readingPlanProgress, setReadingPlanProgress] = useState<{psalmCompleted: boolean, proverbsCompleted: boolean} | null>(null)

  // Load Bible, history, highlights and notes on mount
  useEffect(() => {
    setMounted(true)

    // Load saved preferences from localStorage
    const savedVersion = localStorage.getItem('selectedBibleVersion')
    const savedStartingPsalm = localStorage.getItem('startingPsalm')
    const savedPlanStartDate = localStorage.getItem('planStartDate')

    // Handle URL parameters (override localStorage if present)
    const version = searchParams?.get('version')
    const book = searchParams?.get('book')
    const chapter = searchParams?.get('chapter')
    const verse = searchParams?.get('verse')

    // Set initial values from URL params if they exist, otherwise from localStorage
    if (version) {
      setSelectedVersion(version)
    } else if (savedVersion) {
      setSelectedVersion(savedVersion)
    } else {
      // Only load default if no version in URL or localStorage
      loadBible()
    }

    // Load other saved preferences
    if (savedStartingPsalm) {
      setStartingPsalm(parseInt(savedStartingPsalm))
    }
    if (savedPlanStartDate) {
      setPlanStartDate(savedPlanStartDate)
    }

    if (book) setSelectedBook(book)
    if (chapter) setSelectedChapter(parseInt(chapter))
    if (verse) setSelectedVerse(parseInt(verse))

    loadVerseHistory()
    initHighlights()
    initNotes()
    loadAllNotes()
    initReadingPlan()
  }, [])

  // Reload Bible when version changes
  useEffect(() => {
    if (selectedVersion && mounted) {
      loadBible(selectedVersion)
      // Save version to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedBibleVersion', selectedVersion)
      }
    }
  }, [selectedVersion, mounted])

  const loadBible = async (version: string = 'kjv_strongs') => {
    setLoading(true)
    try {
      const bible = await parser.loadBible(version)
      setBibleData(bible)
      const books = Object.keys(bible.books)
      setBookNames(books)
      
      // Load current chapter (maintain position when switching versions)
      const chapter = parser.getChapter(selectedBook, selectedChapter)
      if (chapter && bible.books[selectedBook]) {
        setChapterContent(chapter)
        const chapters = Object.keys(bible.books[selectedBook].chapters).length
        setChapterCount(chapters)
        setVerseCount(Object.keys(chapter.verses).length)
      } else if (books.length > 0) {
        // Selected book doesn't exist in this version, reset to first book
        setSelectedBook(books[0])
        setSelectedChapter(1)
        const firstChapter = parser.getChapter(books[0], 1)
        if (firstChapter) {
          setChapterContent(firstChapter)
          setChapterCount(Object.keys(bible.books[books[0]].chapters).length)
          setVerseCount(Object.keys(firstChapter.verses).length)
        }
      }
      
      // Preload Strong's definitions (only for versions with Strong's)
      if (version === 'kjv_strongs' || version === 'asvs') {
        strongsManager.loadDefinitions()
          .then(() => console.log('Strong\'s definitions loaded'))
          .catch(err => console.error('Failed to load Strong\'s:', err))
      }
    } catch (error) {
      console.error('Failed to load Bible:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-load chapter when selection changes
  useEffect(() => {
    if (bibleData && selectedBook && selectedChapter) {
      const chapter = parser.getChapter(selectedBook, selectedChapter)
      if (chapter) {
        setChapterContent(chapter)
        setVerseCount(Object.keys(chapter.verses).length)
        // Auto-select verse 1 when chapter changes
        setSelectedVerse(1)
        // Load highlights and notes for this chapter
        loadChapterHighlights()
        loadChapterNotes()
      }
    }
  }, [bibleData, selectedBook, selectedChapter, selectedVersion, parser])

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
  }, [bibleData, selectedBook, selectedChapter])

  const handleStrongsClick = async (strongsNumber: string, position: { x: number; y: number }, isFromPopover = false) => {
    if (!strongsManager.loaded) {
      await strongsManager.loadDefinitions()
    }

    const definition = strongsManager.lookup(strongsNumber)
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
    console.log('Verse clicked:', verse.verse)
    
    // Select/deselect verse first
    const isNewSelection = verse.verse !== selectedVerse
    setSelectedVerse(isNewSelection ? verse.verse : null)
    
    // Track verse in history only for new selections
    if (isNewSelection && chapterContent) {
      const reference = `${selectedBook} ${selectedChapter}:${verse.verse}`
      try {
        await historyManager.addToHistory({
          book: selectedBook,
          chapter: selectedChapter,
          verse: verse.verse,
          verseText: verse.text,
          version: selectedVersion,
          reference
        })
        console.log('Added to history:', reference)
        // Reload history
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
    setShowNotesPanel(false)
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

  // Handle click outside to deselect verse
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Check if click is outside verse content area and controls
      if (!target.closest('#verse-content') && 
          !target.closest('.verse-controls') &&
          !target.closest('.inline-parallel-verse')) {
        setSelectedVerse(null)
      }
    }

    if (selectedVerse) {
      // Use mousedown to capture before click events
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 100)
      
      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handleClickOutside)
      }
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
      <div className="bg-white dark:bg-gray-800 md:rounded-lg md:shadow-sm mt-0 md:mt-6">

      {loading && (
        <div className="p-8 text-center text-blue-600 dark:text-blue-400">
          Loading Bible...
        </div>
      )}

      {!loading && bibleData && (
        <div>
          {/* Compact Bible Controls */}
          <CompactBibleControls
            selectedBook={selectedBook}
            selectedChapter={selectedChapter}
            selectedVerse={selectedVerse}
            selectedVersion={selectedVersion}
            bookNames={bookNames}
            chapterCount={chapterCount}
            verseCount={verseCount}
            onBookChange={(book) => {
              setSelectedBook(book)
              setSelectedChapter(1)
              setSelectedVerse(1)  // Auto-select verse 1 when changing books
            }}
            onChapterChange={(chapter) => {
              setSelectedChapter(chapter)
              setSelectedVerse(1)  // Auto-select verse 1 when changing chapters
            }}
            onVerseChange={setSelectedVerse}
            onVersionChange={setSelectedVersion}
            onPreviousChapter={() => {
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
            }}
            onNextChapter={() => {
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
            }}
            onParallelReading={() => setShowParallelScroll(true)}
            isPreviousDisabled={selectedChapter === 1 && bookNames.indexOf(selectedBook) === 0}
            isNextDisabled={selectedChapter === chapterCount && bookNames.indexOf(selectedBook) === bookNames.length - 1}
            // Quick actions
            onSettingsClick={() => setShowSettingsModal(true)}
            onTodayClick={() => {
              const today = new Date()
              const daysSincePlanStart = Math.floor((today.getTime() - new Date(planStartDate).getTime()) / (1000 * 60 * 60 * 24))
              const todayPsalm = ((daysSincePlanStart + (startingPsalm || 1) - 1) % 150) + 1
              setSelectedBook('Psalms')
              setSelectedChapter(todayPsalm)
              setSelectedVerse(1)
            }}
            onHistoryClick={() => setShowHistoryPanel(!showHistoryPanel)}
            onNotesClick={() => setShowNotesPanel(!showNotesPanel)}
            showHistoryPanel={showHistoryPanel}
            showNotesPanel={showNotesPanel}
            notesCount={allNotes.length}
            isInReadingPlan={isInReadingPlan}
            readingPlanProgress={readingPlanProgress}
            onMarkAsRead={handleMarkAsRead}
          />

          {/* Chapter Content */}
          {mounted && chapterContent && (
            <div
              className="mt-4 p-3 sm:p-4 md:p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              style={{ marginBottom: parallelComparisonEnabled ? '200px' : '24px' }}>
              <div className="mb-4 md:mb-5 pb-3 md:pb-4 border-b-2 border-gray-200 dark:border-gray-600">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1 md:mb-2">
                  {selectedBook} Chapter {selectedChapter}
                </h2>
                {(selectedVersion === 'kjv_strongs' || selectedVersion === 'asvs') && (
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    Click on Strong's numbers (blue/purple links) to see definitions
                  </p>
                )}
              </div>
              
              <div
                id="verse-content"
                className="text-base sm:text-lg leading-relaxed"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain'
                }}
                suppressHydrationWarning>
                {/* Show all verses */}
                {Object.values(chapterContent.verses)
                  .sort((a, b) => a.verse - b.verse)
                  .map(verse => (
                  <VerseDisplay
                    key={verse.verse}
                    verse={verse}
                    bookName={selectedBook}
                    chapterNumber={selectedChapter}
                    isSelected={selectedVerse === verse.verse}
                    highlights={chapterHighlights.get(verse.verse)}
                    note={chapterNotes.get(verse.verse)}
                    hasStrongs={selectedVersion === 'kjv_strongs' || selectedVersion === 'asvs'}
                    fontSize={settings.fontSize}
                    lineSpacing={settings.lineSpacing}
                    verseSpacing={settings.verseSpacing}
                    showVerseNumbers={settings.showVerseNumbers}
                    onVerseClick={handleVerseClick}
                    onHighlight={handleHighlightVerse}
                    onRemoveHighlight={handleRemoveHighlight}
                    onAddNote={() => {
                      setSelectedVerse(verse.verse)
                      // Show note dialog or panel
                    }}
                    onStrongsClick={handleStrongsClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Strong's Popover */}
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

      {/* Parallel Verse View Modal */}
      {showParallelVerse && parallelVerseData && (
        <ParallelVerseView
          primaryVersion={selectedVersion}
          secondaryVersion={parallelVersion}
          book={parallelVerseData.book}
          chapter={parallelVerseData.chapter}
          verse={parallelVerseData.verse}
          onClose={() => setShowParallelVerse(false)}
        />
      )}

      {/* Parallel Scroll View Modal */}
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

      {/* Notes Panel */}
      <NotesPanel
        notes={allNotes}
        onNoteSelect={handleNoteSelect}
        onDeleteNote={handleDeleteNote}
        isOpen={showNotesPanel}
        onClose={() => setShowNotesPanel(false)}
      />

      {/* Settings Modal */}
      <BibleSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        parallelComparisonEnabled={parallelComparisonEnabled}
        onParallelComparisonChange={setParallelComparisonEnabled}
        parallelVersion={parallelVersion}
        onParallelVersionChange={setParallelVersion}
        primaryVersion={selectedVersion}
      />

      {/* History Panel */}
      <HistoryPanel
        history={verseHistory}
        onVerseSelect={handleHistoryVerseSelect}
        onClearHistory={handleClearHistory}
        onRemoveEntry={handleRemoveHistoryEntry}
        onStrongsClick={handleStrongsClick}
        isOpen={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
      />
    </div>

    {/* Fixed Parallel Comparison - Outside main content */}
    {mounted && chapterContent && (
      <FixedParallelComparison
        primaryVersion={selectedVersion}
        secondaryVersion={parallelVersion}
        book={selectedBook}
        chapter={selectedChapter}
        verse={selectedVerse || 1}
        primaryText={
          selectedVerse
            ? chapterContent.verses[selectedVerse]?.text
            : chapterContent.verses[1]?.text
        }
        isVisible={parallelComparisonEnabled && chapterContent !== null}
        fontSize={settings.fontSize}
        lineSpacing={settings.lineSpacing}
        verseSpacing={settings.verseSpacing}
        onStrongsClick={handleStrongsClick}
      />
    )}
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