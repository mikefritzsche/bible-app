'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { BibleParser } from '@/lib/BibleParser'
import { StrongsManager } from '@/lib/StrongsManager'
import { VerseHistoryManager } from '@/lib/VerseHistoryManager'
import { HighlightManager, HIGHLIGHT_COLORS } from '@/lib/HighlightManager'
import { NotesManager } from '@/lib/NotesManager'
import { useSettings } from '@/lib/SettingsContext'
import { VerseWithStrongs } from '@/components/VerseWithStrongs'
import { StrongsPopover } from '@/components/StrongsPopover'
import { VerseHistory } from '@/components/VerseHistory'
import { HighlightControls } from '@/components/HighlightControls'
import { ParallelVerseView } from '@/components/ParallelVerseView'
import { ParallelScrollView } from '@/components/ParallelScrollView'
import { InlineParallelVerse } from '@/components/InlineParallelVerse'
import { FixedParallelComparison } from '@/components/FixedParallelComparison'
import { BibleSettingsModal } from '@/components/BibleSettingsModal'
import { NotesPanel } from '@/components/NotesPanel'
import { VerseDisplay } from '@/components/VerseDisplay'
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
  const [bibleData, setBibleData] = useState<BibleData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedBook, setSelectedBook] = useState('Genesis')
  const [selectedChapter, setSelectedChapter] = useState(1)
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)
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
  const [parallelVersion, setParallelVersion] = useState('kjv')
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
  const [startingPsalm] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('startingPsalm')
      return saved ? parseInt(saved) : 1
    }
    return 1
  })
  const [planStartDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('planStartDate')
      return saved || new Date().toISOString().split('T')[0]
    }
    return new Date().toISOString().split('T')[0]
  })

  // Load Bible, history, highlights and notes on mount
  useEffect(() => {
    setMounted(true)
    
    // Handle URL parameters
    const version = searchParams?.get('version')
    const book = searchParams?.get('book') 
    const chapter = searchParams?.get('chapter')
    const verse = searchParams?.get('verse')
    
    // Set initial values from URL params if they exist
    if (version) {
      setSelectedVersion(version)
      // Don't load Bible here - let the selectedVersion effect handle it
    } else {
      // Only load default if no version in URL
      loadBible()
    }
    
    if (book) setSelectedBook(book)
    if (chapter) setSelectedChapter(parseInt(chapter))
    if (verse) setSelectedVerse(parseInt(verse))
    
    loadVerseHistory()
    initHighlights()
    initNotes()
    loadAllNotes()
  }, [])

  // Reload Bible when version changes
  useEffect(() => {
    if (selectedVersion && mounted) {
      loadBible(selectedVersion)
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
      if (chapter) {
        setChapterContent(chapter)
        const chapters = Object.keys(bible.books[selectedBook].chapters).length
        setChapterCount(chapters)
        setVerseCount(Object.keys(chapter.verses).length)
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
        // Reset verse selection when chapter changes
        setSelectedVerse(null)
        // Load highlights and notes for this chapter
        loadChapterHighlights()
        loadChapterNotes()
      }
    }
  }, [bibleData, selectedBook, selectedChapter, selectedVersion, parser])

  // Update chapter count when book changes
  useEffect(() => {
    if (bibleData && selectedBook) {
      const chapters = Object.keys(bibleData.books[selectedBook].chapters).length
      setChapterCount(chapters)
      // Reset chapter to 1 if current selection is out of range
      if (selectedChapter > chapters) {
        setSelectedChapter(1)
      }
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
          position: strongsPopover.position
        })
      } else {
        // New popover from main text
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

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && strongsPopover) {
        if (strongsHistory.length > 0) {
          goBackInHistory()
        } else {
          closeStrongsPopover()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [strongsPopover, strongsHistory])

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

  // Load parallel version preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('parallelVersion')
      if (saved) {
        setParallelVersion(saved)
      }
    }
  }, [])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Bible Reader
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {selectedVersion === 'kjv_strongs' ? 'KJV with Strong\'s Concordance' : 
             selectedVersion === 'asvs' ? 'ASV with Strong\'s Concordance' :
             selectedVersion.toUpperCase()}
          </p>
        </div>

        {/* Quick Actions Toolbar */}
        <div className="flex gap-2">
          {/* Settings Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors flex items-center gap-2 text-sm font-medium"
            title="Bible display settings"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m16.24-6.36l-4.24 4.24M7.76 7.76L3.52 3.52m16.72 16.72l-4.24-4.24M7.76 16.24L3.52 20.48" />
            </svg>
            Settings
          </button>

          {/* Today's Reading Button */}
          <button
            onClick={() => {
              // Navigate to today's reading
              const today = new Date()
              const dayOfMonth = today.getDate()
              const daysSincePlanStart = Math.floor((today.getTime() - new Date(planStartDate).getTime()) / (1000 * 60 * 60 * 24))
              const todayPsalm = ((daysSincePlanStart + (startingPsalm || 1) - 1) % 150) + 1
              
              // Navigate to Psalms for today's reading
              setSelectedBook('Psalms')
              setSelectedChapter(todayPsalm)
              setSelectedVerse(null)
            }}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center gap-2 text-sm font-medium"
            title="Go to today's reading plan"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="M9 16l2 2 4-4" />
            </svg>
            Today's Reading
          </button>

          {/* History Button */}
          <button
            onClick={() => setShowHistoryPanel(!showHistoryPanel)}
            className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium ${
              showHistoryPanel 
                ? 'bg-blue-600 text-white' 
                : 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400'
            }`}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            History
          </button>

          {/* Notes Button */}
          <button
            onClick={() => setShowNotesPanel(!showNotesPanel)}
            className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium ${
              showNotesPanel 
                ? 'bg-blue-600 text-white' 
                : 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400'
            }`}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Notes {allNotes.length > 0 && `(${allNotes.length})`}
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center text-blue-600 dark:text-blue-400">
          Loading Bible...
        </div>
      )}

      {!loading && bibleData && (
        <div>
          {/* Enhanced Chapter Selector */}
          <div className="mb-6 p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-gray-200 dark:border-gray-600">
            {/* Bible Version Selector */}
            <div className="mb-4 pb-4 border-b border-gray-300 dark:border-gray-500">
              <div>
                <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">
                  Bible Version
                </label>
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border-2 border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none transition-colors [&>option]:bg-white dark:[&>option]:bg-gray-700 [&>option]:text-gray-900 dark:[&>option]:text-gray-100"
                >
                  <option value="kjv_strongs">KJV with Strong's</option>
                  <option value="kjv">KJV (King James Version)</option>
                  <option value="asvs">ASV with Strong's</option>
                  <option value="asv">ASV (American Standard Version)</option>
                  <option value="web">WEB (World English Bible)</option>
                  <option value="net">NET (New English Translation)</option>
                  <option value="geneva">Geneva Bible</option>
                  <option value="bishops">Bishops' Bible</option>
                  <option value="coverdale">Coverdale Bible</option>
                  <option value="tyndale">Tyndale Bible</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
              {/* Book Selector */}
              <div className="col-span-2 md:col-span-1">
                <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">
                  Book
                </label>
                <select
                  value={selectedBook}
                  onChange={(e) => {
                    setSelectedBook(e.target.value)
                    setSelectedChapter(1)
                    setSelectedVerse(null)
                  }}
                  className="w-full px-3 py-2 rounded-md border-2 border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none transition-colors [&>option]:bg-white dark:[&>option]:bg-gray-700 [&>option]:text-gray-900 dark:[&>option]:text-gray-100"
                >
                  {bookNames.map(book => (
                    <option key={book} value={book}>{book}</option>
                  ))}
                </select>
              </div>
              
              {/* Chapter Selector */}
              <div>
                <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">
                  Chapter
                </label>
                <select
                  value={selectedChapter}
                  onChange={(e) => {
                    setSelectedChapter(parseInt(e.target.value))
                    setSelectedVerse(null)
                  }}
                  className="w-full px-3 py-2 rounded-md border-2 border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none transition-colors [&>option]:bg-white dark:[&>option]:bg-gray-700 [&>option]:text-gray-900 dark:[&>option]:text-gray-100"
                >
                  {Array.from({ length: chapterCount }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>Chapter {num}</option>
                  ))}
                </select>
              </div>
              
              {/* Verse Selector */}
              <div>
                <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300 text-sm">
                  Verse (Optional)
                </label>
                <select
                  value={selectedVerse || ''}
                  onChange={(e) => setSelectedVerse(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 rounded-md border-2 border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none transition-colors [&>option]:bg-white dark:[&>option]:bg-gray-700 [&>option]:text-gray-900 dark:[&>option]:text-gray-100"
                >
                  <option value="">All Verses</option>
                  {Array.from({ length: verseCount }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>Verse {num}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Current Selection Display and Actions */}
            <div className="flex justify-between items-center gap-3">
              <div className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 rounded-md text-center text-lg font-medium text-blue-600 dark:text-blue-400">
                {selectedBook} {selectedChapter}
                {selectedVerse ? `:${selectedVerse}` : ''}
              </div>
              
              <button
                onClick={() => setShowParallelScroll(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors flex items-center gap-2 text-sm"
                title="Open parallel reading view"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="12" y1="3" x2="12" y2="21" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                </svg>
                Parallel Reading
              </button>
            </div>
          </div>

          {/* Chapter Content */}
          {mounted && chapterContent && (
            <div 
              className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              style={{ marginBottom: parallelComparisonEnabled && selectedVerse ? '200px' : '24px' }}>
              <div className="mb-5 pb-4 border-b-2 border-gray-200 dark:border-gray-600">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {selectedBook} Chapter {selectedChapter}
                </h2>
                {(selectedVersion === 'kjv_strongs' || selectedVersion === 'asvs') && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click on Strong's numbers (blue/purple links) to see definitions
                  </p>
                )}
              </div>
              
              <div 
                id="verse-content"
                className="text-lg leading-relaxed"
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

          {/* Fixed Parallel Comparison */}
          <FixedParallelComparison
            primaryVersion={selectedVersion}
            secondaryVersion={parallelVersion}
            book={selectedBook}
            chapter={selectedChapter}
            verse={selectedVerse || 0}
            primaryText={selectedVerse && chapterContent?.verses[selectedVerse] ? chapterContent.verses[selectedVerse].text : undefined}
            isVisible={parallelComparisonEnabled && selectedVerse !== null}
            fontSize={settings.fontSize}
            lineSpacing={settings.lineSpacing}
            verseSpacing={settings.verseSpacing}
            onStrongsClick={handleStrongsClick}
          />
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
      {showHistoryPanel && (
        <div className={`fixed left-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-800 shadow-xl z-50 flex flex-col transform transition-transform duration-300 ${
          showHistoryPanel ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-5 border-b-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Verse History
            </h2>
            <button
              onClick={() => setShowHistoryPanel(false)}
              className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <VerseHistory 
              history={verseHistory}
              onVerseSelect={(book, chapter, verse) => {
                handleHistoryVerseSelect(book, chapter, verse)
                setShowHistoryPanel(false)
              }}
              onClearHistory={handleClearHistory}
              onRemoveEntry={handleRemoveHistoryEntry}
              onStrongsClick={handleStrongsClick}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BibleApp />
    </Suspense>
  )
}