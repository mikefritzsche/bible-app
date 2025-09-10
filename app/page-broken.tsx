'use client'

import { useState, useEffect } from 'react'
import { BibleParser } from '@/lib/BibleParser'
import { StrongsManager } from '@/lib/StrongsManager'
import { VerseHistoryManager } from '@/lib/VerseHistoryManager'
import { HighlightManager, HIGHLIGHT_COLORS } from '@/lib/HighlightManager'
import { NotesManager } from '@/lib/NotesManager'
import { VerseWithStrongs } from '@/components/VerseWithStrongs'
import { StrongsPopover } from '@/components/StrongsPopover'
import { VerseHistory } from '@/components/VerseHistory'
import { HighlightControls } from '@/components/HighlightControls'
import { ParallelVerseView } from '@/components/ParallelVerseView'
import { ParallelScrollView } from '@/components/ParallelScrollView'
import { InlineParallelVerse } from '@/components/InlineParallelVerse'
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

export default function Home() {
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

  // Load Bible, history, highlights and notes on mount
  useEffect(() => {
    loadBible()
    loadVerseHistory()
    initHighlights()
    initNotes()
    loadAllNotes()
  }, [])

  // Reload Bible when version changes
  useEffect(() => {
    if (selectedVersion) {
      loadBible(selectedVersion)
    }
  }, [selectedVersion])

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
      setVerseHistory(history)
    } catch (error) {
      console.error('Failed to load verse history:', error)
    }
  }

  const handleVerseClick = async (verse: any) => {
    // Track verse in history
    if (chapterContent) {
      const reference = `${selectedBook} ${selectedChapter}:${verse.verse}`
      await historyManager.addToHistory({
        book: selectedBook,
        chapter: selectedChapter,
        verse: verse.verse,
        verseText: verse.text,
        version: selectedVersion,
        reference
      })
      // Reload history
      loadVerseHistory()
    }
    
    // Select/deselect verse
    setSelectedVerse(verse.verse === selectedVerse ? null : verse.verse)
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

  const handleHighlightVerse = async (verse: number, color: string) => {
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
      version: selectedVersion
    })
    
    await loadChapterHighlights()
  }

  const handleRemoveHighlight = async (verse: number) => {
    await highlightManager.removeHighlight(
      selectedBook,
      selectedChapter,
      verse,
      selectedVersion
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

  return (
    <div style={{ 
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '32px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            Bible Reader
          </h1>
          <p style={{ color: '#6b7280' }}>
            {selectedVersion === 'kjv_strongs' ? 'KJV with Strong\'s Concordance' : 
             selectedVersion === 'asvs' ? 'ASV with Strong\'s Concordance' :
             selectedVersion.toUpperCase()}
          </p>
        </div>

        {/* Quick Actions Toolbar */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Notes Button */}
          <button
            onClick={() => setShowNotesPanel(!showNotesPanel)}
            style={{
              padding: '8px 12px',
              backgroundColor: showNotesPanel ? '#667eea' : 'white',
              color: showNotesPanel ? 'white' : '#667eea',
              border: '2px solid #667eea',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <svg
              width="18"
              height="18"
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
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          color: '#667eea'
        }}>
          Loading Bible...
        </div>
      )}

      {!loading && bibleData && (
        <div>
          {/* Verse History */}
          <VerseHistory 
            history={verseHistory}
            onVerseSelect={handleHistoryVerseSelect}
            onClearHistory={handleClearHistory}
            onRemoveEntry={handleRemoveHistoryEntry}
          />
          
          {/* Enhanced Chapter Selector */}
          <div style={{ 
            marginBottom: '24px',
            padding: '20px',
            background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
            borderRadius: '8px',
            border: '1px solid #d1d5db'
          }}>
            {/* Bible Version Selector */}
            <div style={{ 
              marginBottom: '16px',
              paddingBottom: '16px',
              borderBottom: '1px solid #d1d5db'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '500',
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>
                    Primary Bible Version
                  </label>
                  <select
                    value={selectedVersion}
                    onChange={(e) => setSelectedVersion(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '2px solid #d1d5db',
                      backgroundColor: 'white',
                      fontSize: '16px',
                      cursor: 'pointer',
                      outline: 'none',
                      color: '#111827'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
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
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '500',
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>
                    Parallel Comparison Version
                  </label>
                  <select
                    value={parallelVersion}
                    onChange={(e) => setParallelVersion(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '2px solid #d1d5db',
                      backgroundColor: 'white',
                      fontSize: '16px',
                      cursor: 'pointer',
                      outline: 'none',
                      color: '#111827'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#764ba2'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
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
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr 1fr',
              gap: '16px',
              marginBottom: '12px'
            }}>
              {/* Book Selector */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  color: '#374151',
                  fontSize: '0.875rem'
                }}>
                  Book
                </label>
                <select
                  value={selectedBook}
                  onChange={(e) => {
                    setSelectedBook(e.target.value)
                    setSelectedChapter(1)
                    setSelectedVerse(null)
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '2px solid #d1d5db',
                    backgroundColor: 'white',
                    fontSize: '16px',
                    cursor: 'pointer',
                    outline: 'none',
                    color: '#111827'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  {bookNames.map(book => (
                    <option key={book} value={book}>{book}</option>
                  ))}
                </select>
              </div>
              
              {/* Chapter Selector */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  color: '#374151',
                  fontSize: '0.875rem'
                }}>
                  Chapter
                </label>
                <select
                  value={selectedChapter}
                  onChange={(e) => {
                    setSelectedChapter(parseInt(e.target.value))
                    setSelectedVerse(null)
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '2px solid #d1d5db',
                    backgroundColor: 'white',
                    fontSize: '16px',
                    cursor: 'pointer',
                    outline: 'none',
                    color: '#111827'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  {Array.from({ length: chapterCount }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>Chapter {num}</option>
                  ))}
                </select>
              </div>
              
              {/* Verse Selector */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  color: '#374151',
                  fontSize: '0.875rem'
                }}>
                  Verse (Optional)
                </label>
                <select
                  value={selectedVerse || ''}
                  onChange={(e) => setSelectedVerse(e.target.value ? parseInt(e.target.value) : null)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '2px solid #d1d5db',
                    backgroundColor: 'white',
                    fontSize: '16px',
                    cursor: 'pointer',
                    outline: 'none',
                    color: '#111827'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="">All Verses</option>
                  {Array.from({ length: verseCount }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>Verse {num}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Current Selection Display and Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                flex: 1,
                padding: '12px',
                backgroundColor: 'white',
                borderRadius: '6px',
                textAlign: 'center',
                fontSize: '1.1rem',
                fontWeight: '500',
                color: '#667eea'
              }}>
                {selectedBook} {selectedChapter}
                {selectedVerse ? `:${selectedVerse}` : ''}
              </div>
              
              <button
                onClick={() => setShowParallelScroll(true)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#764ba2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6b3e91'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#764ba2'}
                title="Open parallel reading view"
              >
                <svg
                  width="18"
                  height="18"
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
          {chapterContent && (
            <div style={{
              padding: '24px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginBottom: selectedVerse ? '24px' : '0'
            }}>
              <div style={{ 
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '2px solid #e5e7eb'
              }}>
                <h2 style={{ 
                  fontSize: '1.75rem',
                  fontWeight: 'bold',
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  {selectedBook} Chapter {selectedChapter}
                </h2>
                {(selectedVersion === 'kjv_strongs' || selectedVersion === 'asvs') && (
                  <p style={{ 
                    fontSize: '0.9rem', 
                    color: '#6b7280'
                  }}>
                    Click on Strong&apos;s numbers (blue/purple links) to see definitions
                  </p>
                )}
              </div>
              
              <div style={{ 
                fontSize: '1.1rem', 
                lineHeight: '1.9',
                paddingLeft: '100px',
                position: 'relative'
              }}>
                {/* Show all verses */}
                {Object.values(chapterContent.verses).map(verse => {
                  const highlights = chapterHighlights.get(verse.verse) || []
                  const highlight = highlights.length > 0 ? highlights[0] : undefined
                  const note = chapterNotes.get(verse.verse)
                  
                  return (
                    <VerseDisplay
                      key={verse.verse}
                      verse={verse}
                      bookName={selectedBook}
                      chapterNumber={selectedChapter}
                      isSelected={selectedVerse === verse.verse}
                      highlight={highlight}
                      note={note}
                      hasStrongs={selectedVersion === 'kjv_strongs' || selectedVersion === 'asvs'}
                      onVerseClick={handleVerseClick}
                      onHighlight={handleHighlightVerse}
                      onRemoveHighlight={handleRemoveHighlight}
                      onAddNote={() => {
                        setSelectedVerse(verse.verse)
                        // Show note dialog or panel
                      }}
                      onStrongsClick={handleStrongsClick}
                    />
                  )
                })}
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
    </div>
  )
}