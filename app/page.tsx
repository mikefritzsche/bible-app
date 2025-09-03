'use client'

import { useState, useEffect } from 'react'
import { KJVBibleParser } from '@/lib/KJVBibleParser'
import { StrongsManager } from '@/lib/StrongsManager'
import { VerseWithStrongs } from '@/components/VerseWithStrongs'
import { StrongsPopover } from '@/components/StrongsPopover'
import type { BibleData, Chapter, StrongsDefinition } from '@/types/bible'

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
  const [parser] = useState(() => new KJVBibleParser())
  const [strongsManager] = useState(() => new StrongsManager())
  const [bibleData, setBibleData] = useState<BibleData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedBook, setSelectedBook] = useState('Genesis')
  const [selectedChapter, setSelectedChapter] = useState(1)
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)
  const [selectedVersion, setSelectedVersion] = useState('kjv_strongs')
  const [chapterContent, setChapterContent] = useState<Chapter | null>(null)
  const [strongsPopover, setStrongsPopover] = useState<StrongsPopoverState | null>(null)
  const [strongsHistory, setStrongsHistory] = useState<StrongsHistoryEntry[]>([])
  const [bookNames, setBookNames] = useState<string[]>([])
  const [chapterCount, setChapterCount] = useState(50)
  const [verseCount, setVerseCount] = useState(0)

  // Load Bible on mount
  useEffect(() => {
    loadBible()
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
      }
    }
  }, [bibleData, selectedBook, selectedChapter, parser])

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
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
        {selectedVersion === 'kjv_strongs' ? 'KJV with Strong\'s Concordance' : 
         selectedVersion === 'asvs' ? 'ASV with Strong\'s Concordance' :
         selectedVersion.toUpperCase()}
      </p>

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
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#374151',
                fontSize: '0.875rem'
              }}>
                Bible Version
              </label>
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: '300px',
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
            
            {/* Current Selection Display */}
            <div style={{
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
          </div>

          {/* Chapter Content */}
          {chapterContent && (
            <div style={{
              padding: '24px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
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
              
              <div style={{ fontSize: '1.1rem', lineHeight: '1.9' }}>
                {/* Show all verses */}
                {Object.values(chapterContent.verses).map(verse => (
                  <p 
                    key={verse.verse} 
                    id={`verse-${verse.verse}`}
                    onClick={(e) => {
                      // Only select verse if click wasn't on a Strong's number
                      if (!(e.target as HTMLElement).classList.contains('strongs-link')) {
                        setSelectedVerse(verse.verse === selectedVerse ? null : verse.verse)
                      }
                    }}
                    style={{ 
                      marginBottom: '16px',
                      padding: '8px',
                      borderRadius: '4px',
                      color: '#1f2937',
                      transition: 'background-color 0.3s',
                      backgroundColor: selectedVerse === verse.verse ? '#fef3c7' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedVerse !== verse.verse) {
                        e.currentTarget.style.backgroundColor = '#f9fafb'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedVerse !== verse.verse) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    {(selectedVersion === 'kjv_strongs' || selectedVersion === 'asvs') ? (
                      <VerseWithStrongs
                        text={verse.text}
                        verseNumber={verse.verse}
                        onStrongsClick={handleStrongsClick}
                      />
                    ) : (
                      <span>
                        <strong style={{ color: '#667eea', marginRight: '8px' }}>{verse.verse}</strong>
                        {verse.text}
                      </span>
                    )}
                  </p>
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
    </div>
  )
}