'use client'

import React, { useState, useRef, useEffect } from 'react'
import { VerseWithStrongs } from '@/components/VerseWithStrongs'
import { HIGHLIGHT_COLORS, HIGHLIGHT_COLORS_LIGHT, HIGHLIGHT_COLORS_DARK } from '@/lib/HighlightManager'
import type { VerseHighlight } from '@/lib/HighlightManager'
import type { VerseNote } from '@/lib/NotesManager'

interface VerseDisplayProps {
  verse: any
  bookName: string
  chapterNumber: number
  isSelected: boolean
  highlight?: VerseHighlight
  highlights?: VerseHighlight[]  // Support multiple highlights per verse
  note?: VerseNote
  hasStrongs: boolean
  fontSize?: string
  lineSpacing?: string
  verseSpacing?: string
  showVerseNumbers?: boolean
  onVerseClick: (verse: any) => void
  onHighlight: (verseNum: number, color: string, selectedText?: string, startOffset?: number, endOffset?: number) => Promise<void>
  onRemoveHighlight: (verseNum: number, startOffset?: number, endOffset?: number) => Promise<void>
  onAddNote: () => void
  onStrongsClick?: (strongsNumber: string, position: { x: number; y: number }) => void
}

// Book abbreviation mapping
const getBookAbbreviation = (bookName: string): string => {
  const abbreviations: Record<string, string> = {
    'Genesis': 'Gen',
    'Exodus': 'Ex',
    'Leviticus': 'Lev',
    'Numbers': 'Num',
    'Deuteronomy': 'Deut',
    'Joshua': 'Josh',
    'Judges': 'Judg',
    'Ruth': 'Ruth',
    '1 Samuel': '1Sam',
    '2 Samuel': '2Sam',
    '1 Kings': '1Kgs',
    '2 Kings': '2Kgs',
    '1 Chronicles': '1Chr',
    '2 Chronicles': '2Chr',
    'Ezra': 'Ezra',
    'Nehemiah': 'Neh',
    'Esther': 'Esth',
    'Job': 'Job',
    'Psalms': 'Ps',
    'Proverbs': 'Prov',
    'Ecclesiastes': 'Eccl',
    'Song of Solomon': 'Song',
    'Isaiah': 'Isa',
    'Jeremiah': 'Jer',
    'Lamentations': 'Lam',
    'Ezekiel': 'Ezek',
    'Daniel': 'Dan',
    'Hosea': 'Hos',
    'Joel': 'Joel',
    'Amos': 'Amos',
    'Obadiah': 'Obad',
    'Jonah': 'Jonah',
    'Micah': 'Mic',
    'Nahum': 'Nah',
    'Habakkuk': 'Hab',
    'Zephaniah': 'Zeph',
    'Haggai': 'Hag',
    'Zechariah': 'Zech',
    'Malachi': 'Mal',
    'Matthew': 'Matt',
    'Mark': 'Mark',
    'Luke': 'Luke',
    'John': 'John',
    'Acts': 'Acts',
    'Romans': 'Rom',
    '1 Corinthians': '1Cor',
    '2 Corinthians': '2Cor',
    'Galatians': 'Gal',
    'Ephesians': 'Eph',
    'Philippians': 'Phil',
    'Colossians': 'Col',
    '1 Thessalonians': '1Thess',
    '2 Thessalonians': '2Thess',
    '1 Timothy': '1Tim',
    '2 Timothy': '2Tim',
    'Titus': 'Titus',
    'Philemon': 'Phlm',
    'Hebrews': 'Heb',
    'James': 'Jas',
    '1 Peter': '1Pet',
    '2 Peter': '2Pet',
    '1 John': '1John',
    '2 John': '2John',
    '3 John': '3John',
    'Jude': 'Jude',
    'Revelation': 'Rev'
  }
  return abbreviations[bookName] || bookName.slice(0, 3)
}

export function VerseDisplay({
  verse,
  bookName,
  chapterNumber,
  isSelected,
  highlight,
  highlights,
  note,
  hasStrongs,
  fontSize = '16',
  lineSpacing = '1.8',
  verseSpacing = '16',
  showVerseNumbers = true,
  onVerseClick,
  onHighlight,
  onRemoveHighlight,
  onAddNote,
  onStrongsClick
}: VerseDisplayProps) {
  const [showReferenceMenu, setShowReferenceMenu] = useState(false)
  const [showVerseMenu, setShowVerseMenu] = useState(false)
  const [controlsPosition, setControlsPosition] = useState({ x: 0, y: 0 })
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [showServicesMenu, setShowServicesMenu] = useState(false)
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [selectedWordRange, setSelectedWordRange] = useState<Range | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  const verseTextRef = useRef<HTMLDivElement>(null)
  const bookAbbrev = getBookAbbreviation(bookName)
  
  // Get the highlight color for this verse (use different colors for dark mode)
  const getHighlightColor = () => {
    // First check if we have highlights array
    if (highlights && highlights.length > 0) {
      // Use the first full-verse highlight color if no partial highlights
      const fullVerseHighlight = highlights.find(h => h.startOffset === undefined || h.endOffset === undefined)
      if (fullVerseHighlight) {
        const colorKey = fullVerseHighlight.color as keyof typeof HIGHLIGHT_COLORS
        return isDarkMode ? HIGHLIGHT_COLORS_DARK[colorKey] : HIGHLIGHT_COLORS_LIGHT[colorKey]
      }
    }
    // Fall back to single highlight prop
    if (!highlight) return undefined
    const colorKey = highlight.color as keyof typeof HIGHLIGHT_COLORS
    return isDarkMode ? HIGHLIGHT_COLORS_DARK[colorKey] : HIGHLIGHT_COLORS_LIGHT[colorKey]
  }
  const highlightColor = getHighlightColor()
  
  // Helper function to process text for italics
  const processTextForItalics = (text: string) => {
    // Process {{ pattern - everything from {{ to end should be italicized
    const doubleBraceIndex = text.indexOf('{{');
    if (doubleBraceIndex !== -1) {
      const beforeBrace = text.substring(0, doubleBraceIndex);
      const afterBrace = text.substring(doubleBraceIndex + 2);
      return beforeBrace + '[' + afterBrace + ']';
    }
    return text;
  }

  // Helper to render text with italic brackets
  const renderTextWithItalics = (text: string, keyPrefix: string = '') => {
    const processedText = processTextForItalics(text);
    const segments = processedText.split(/(\[[^\]]+\])/);
    if (segments.length > 1) {
      return segments.map((segment, index) => {
        if (segment.startsWith('[') && segment.endsWith(']')) {
          const content = segment.slice(1, -1);
          return <em key={`${keyPrefix}-${index}`} className="font-light">{content}</em>;
        }
        return segment || null;
      }).filter(Boolean);
    }
    return processedText;
  }

  // Render verse text with partial highlights
  const renderHighlightedText = (text: string) => {

    // Collect all highlights
    const allHighlights: VerseHighlight[] = []

    // Add highlights array if present
    if (highlights && highlights.length > 0) {
      allHighlights.push(...highlights)
    }

    // Add single highlight if present and not in highlights array
    if (highlight && (!highlights || !highlights.find(h => h.id === highlight.id))) {
      allHighlights.push(highlight)
    }

    // If no highlights, process text for italics
    if (allHighlights.length === 0) {
      return renderTextWithItalics(text, 'no-hl');
    }
    
    // Separate partial and full highlights
    const partialHighlights = allHighlights.filter(h => h.startOffset !== undefined && h.endOffset !== undefined)
    const fullHighlights = allHighlights.filter(h => h.startOffset === undefined || h.endOffset === undefined)
    
    // If no partial highlights, process text for italics
    if (partialHighlights.length === 0) {
      // For full-verse highlights, let the parent span handle the background color
      // But still process text for italics
      return renderTextWithItalics(text, 'full-hl');
    }
    
    // Sort partial highlights by start position
    const sortedHighlights = [...partialHighlights].sort((a, b) => 
      (a.startOffset || 0) - (b.startOffset || 0)
    )
    
    const segments: React.ReactNode[] = []
    let lastEnd = 0
    
    sortedHighlights.forEach((hl, index) => {
      // Since we filtered for partial highlights, these should always have offsets
      const start = hl.startOffset ?? 0
      const end = hl.endOffset ?? text.length
      const colorKey = hl.color as keyof typeof HIGHLIGHT_COLORS
      const color = isDarkMode ? HIGHLIGHT_COLORS_DARK[colorKey] : HIGHLIGHT_COLORS_LIGHT[colorKey]
      
      // Add unhighlighted text before this highlight
      if (start > lastEnd) {
        const unhighlightedText = text.substring(lastEnd, start);
        const rendered = renderTextWithItalics(unhighlightedText, `before-${index}`);
        if (Array.isArray(rendered)) {
          segments.push(...rendered);
        } else {
          segments.push(rendered);
        }
      }

      // Add highlighted text
      const highlightedText = text.substring(start, end);
      const highlightContent = renderTextWithItalics(highlightedText, `hl-${index}`);

      segments.push(
        <span
          key={`highlight-${index}`}
          style={{
            backgroundColor: color,
            padding: '2px 4px',
            borderRadius: '3px'
          }}
        >
          {highlightContent}
        </span>
      )
      
      lastEnd = end
    })
    
    // Add any remaining unhighlighted text
    if (lastEnd < text.length) {
      const remainingText = text.substring(lastEnd);
      const rendered = renderTextWithItalics(remainingText, 'end');
      if (Array.isArray(rendered)) {
        segments.push(...rendered);
      } else {
        segments.push(rendered);
      }
    }
    
    return segments
  }
  
  // Check dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    
    // Set up observer for class changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    
    return () => observer.disconnect()
  }, [])

  // Handle right-click on verse reference
  const handleReferenceContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setControlsPosition({ x: e.clientX, y: e.clientY })
    setShowReferenceMenu(true)
    setShowVerseMenu(false)
    setShowHighlightPicker(false)
    setSelectedWord(null)
  }

  // Handle right-click on verse text
  const handleVerseContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const selection = window.getSelection()
    
    // Check if there's already a text selection (user dragged to select)
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      // User has selected text, use that selection
      const range = selection.getRangeAt(0)
      const selectedText = range.toString()
      setSelectedWord(selectedText)
      setSelectedWordRange(range)
    } else if (selection) {
      // No selection, select the word at click position
      selection.removeAllRanges()
      
      // Create a range at the click position
      const range = document.caretRangeFromPoint(e.clientX, e.clientY)
      if (range) {
        // Expand the range to include the whole word
        const textNode = range.startContainer
        const text = textNode.textContent || ''
        let startOffset = range.startOffset
        let endOffset = range.startOffset
        
        // Find word boundaries
        while (startOffset > 0 && !/\s|[.,;:!?]/.test(text[startOffset - 1])) {
          startOffset--
        }
        while (endOffset < text.length && !/\s|[.,;:!?]/.test(text[endOffset])) {
          endOffset++
        }
        
        // Select the word
        range.setStart(textNode, startOffset)
        range.setEnd(textNode, endOffset)
        selection.addRange(range)
        
        const word = text.substring(startOffset, endOffset)
        setSelectedWord(word)
        setSelectedWordRange(range)
      }
    }
    
    setControlsPosition({ x: e.clientX, y: e.clientY })
    setShowVerseMenu(true)
    setShowReferenceMenu(false)
    setShowHighlightPicker(false)
  }

  const handleClickOutside = () => {
    setShowReferenceMenu(false)
    setShowVerseMenu(false)
    setShowHighlightPicker(false)
    setShowServicesMenu(false)
    setSelectedWord(null)
    
    // Clear text selection
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
    }
  }

  useEffect(() => {
    if (showReferenceMenu || showVerseMenu || showHighlightPicker) {
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
      }, 100)
      
      return () => {
        clearTimeout(timer)
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [showReferenceMenu, showVerseMenu, showHighlightPicker])

  const handleHighlightClick = async (color: string) => {
    // Calculate offsets if we have a selected range
    let startOffset: number | undefined
    let endOffset: number | undefined
    let selectedText: string | undefined
    
    if (selectedWordRange && verseTextRef.current) {
      // For Strong's text, we need to calculate offsets based on the original text with Strong's codes
      if (hasStrongs && onStrongsClick) {
        // The original verse.text contains Strong's codes like {H1234}
        const originalText = verse.text
        // The DOM text has Strong's codes displayed as superscripts
        const domText = verseTextRef.current.textContent || ''
        selectedText = selectedWordRange.toString()
        
        console.log('Selected text:', selectedText)
        console.log('Original text:', originalText)
        console.log('DOM text:', domText)
        
        // The DOM text includes Strong's numbers as visible superscript text
        // We need to find where the selected text appears in the original text
        // The DOM shows Strong's numbers, so "darknessH2822" in DOM corresponds to "darkness{H2822}" in original
        
        // Find the selected text in the DOM text
        const domSelectionStart = domText.indexOf(selectedText)
        if (domSelectionStart === -1) {
          console.error('Could not find selected text in DOM')
          return
        }
        
        // Now map this position to the original text
        // We need to account for the fact that Strong's codes are shown differently
        // In original: "darkness{H2822}"
        // In DOM: "darknessH2822" (where H2822 is a superscript)
        
        // Simple approach: find the selected text directly in the original after stripping Strong's codes
        const strippedOriginal = originalText.replace(/\{[^}]+\}/g, '')
        const strippedSelectionStart = strippedOriginal.indexOf(selectedText)
        
        if (strippedSelectionStart === -1) {
          console.error('Could not find selected text in stripped original')
          return
        }
        
        // Now map back to the original text with Strong's codes
        let originalPos = 0
        let strippedPos = 0
        
        // Find start position
        while (strippedPos < strippedSelectionStart && originalPos < originalText.length) {
          if (originalText[originalPos] === '{') {
            // Skip Strong's code
            while (originalPos < originalText.length && originalText[originalPos] !== '}') {
              originalPos++
            }
            originalPos++ // Skip the closing }
          } else {
            strippedPos++
            originalPos++
          }
        }
        startOffset = originalPos
        
        // Find end position
        while (strippedPos < strippedSelectionStart + selectedText.length && originalPos < originalText.length) {
          if (originalText[originalPos] === '{') {
            // Skip Strong's code
            while (originalPos < originalText.length && originalText[originalPos] !== '}') {
              originalPos++
            }
            originalPos++ // Skip the closing }
          } else {
            strippedPos++
            originalPos++
          }
        }
        endOffset = originalPos
        
        console.log('Calculated offsets:', { startOffset, endOffset })
        console.log('Text at those offsets:', originalText.substring(startOffset, endOffset))
      } else {
        // Regular text without Strong's codes
        const verseText = verseTextRef.current.textContent || ''
        selectedText = selectedWordRange.toString()
        
        // Calculate the offset of the selected text within the entire verse
        const range = selectedWordRange
        const preRange = document.createRange()
        preRange.selectNodeContents(verseTextRef.current)
        preRange.setEnd(range.startContainer, range.startOffset)
        startOffset = preRange.toString().length
        endOffset = startOffset + selectedText.length
      }
    }
    
    await onHighlight(verse.verse, color, selectedText, startOffset, endOffset)
    setShowHighlightPicker(false)
    setShowVerseMenu(false)
    setShowReferenceMenu(false)
    setSelectedWord(null)
    setSelectedWordRange(null)
  }

  const handleRemoveHighlightClick = async () => {
    await onRemoveHighlight(verse.verse)
    setShowVerseMenu(false)
  }
  
  // Menu styles
  const menuStyles = {
    backgroundColor: isDarkMode ? '#1f2937' : 'white',
    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
    color: isDarkMode ? '#f3f4f6' : '#111827'
  }
  
  const menuButtonStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '8px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'background-color 0.1s',
    color: 'inherit'
  }
  
  const hoverColor = isDarkMode ? '#374151' : '#f3f4f6'
  const dividerColor = isDarkMode ? '#374151' : '#e5e7eb'

  return (
    <div
      id={`verse-${verse.verse}`}
      style={{ 
        position: 'relative'
      }}
    >
      {/* Reference context menu */}
      {showReferenceMenu && (
        <div 
          className="verse-controls"
          style={{
            position: 'fixed',
            left: `${controlsPosition.x}px`,
            top: `${controlsPosition.y}px`,
            ...menuStyles,
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '160px',
            padding: '4px 0',
            fontSize: '0.875rem'
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Bookmark functionality to be implemented
              setShowReferenceMenu(false)
            }}
            style={menuButtonStyles}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span>Bookmark</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Copy verses functionality
              navigator.clipboard.writeText(`${bookName} ${chapterNumber}:${verse.verse} - ${verse.text}`)
              setShowReferenceMenu(false)
            }}
            style={menuButtonStyles}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span>Copy Verses</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
            }}
            style={menuButtonStyles}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = hoverColor
              setShowHighlightPicker(true)
              setShowServicesMenu(false)
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <span style={{ fontSize: '1.2em' }}>›</span>
            <span>Highlight</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAddNote()
              setShowReferenceMenu(false)
            }}
            style={menuButtonStyles}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span>Note</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Tag functionality to be implemented
              setShowReferenceMenu(false)
            }}
            style={menuButtonStyles}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span>Tag</span>
          </button>
          
          <div style={{ height: '1px', backgroundColor: dividerColor, margin: '4px 0' }} />
          
          <button
            onClick={(e) => {
              e.stopPropagation()
            }}
            style={menuButtonStyles}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = hoverColor
              setShowServicesMenu(true)
              setShowHighlightPicker(false)
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <span style={{ fontSize: '1.2em' }}>›</span>
            <span>Services</span>
          </button>
        </div>
      )}

      {/* Verse text context menu */}
      {showVerseMenu && (
        <div 
          className="verse-controls"
          style={{
            position: 'fixed',
            left: `${controlsPosition.x}px`,
            top: `${controlsPosition.y}px`,
            ...menuStyles,
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '200px',
            padding: '4px 0',
            fontSize: '0.875rem'
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (selectedWord) {
                navigator.clipboard.writeText(selectedWord)
              }
              setShowVerseMenu(false)
            }}
            style={menuButtonStyles}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span>Copy</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Copy to Topic Notes functionality
              setShowVerseMenu(false)
            }}
            style={menuButtonStyles}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span>Copy into Topic Notes</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Select all text in verse
              if (verseTextRef.current) {
                const selection = window.getSelection()
                const range = document.createRange()
                range.selectNodeContents(verseTextRef.current)
                selection?.removeAllRanges()
                selection?.addRange(range)
              }
              setShowVerseMenu(false)
            }}
            style={menuButtonStyles}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span>Select All</span>
          </button>
          
          <div style={{ height: '1px', backgroundColor: dividerColor, margin: '4px 0' }} />
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (selectedWord) {
                // Search functionality for the selected word
                console.log('Search for:', selectedWord)
              }
              setShowVerseMenu(false)
            }}
            style={menuButtonStyles}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span>Search "{selectedWord}"</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
            }}
            style={menuButtonStyles}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = hoverColor
              setShowHighlightPicker(true)
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <span style={{ fontSize: '1.2em' }}>›</span>
            <span>Highlight</span>
          </button>

          {(highlight || (highlights && highlights.length > 0)) && (
            <button
              onClick={handleRemoveHighlightClick}
              style={{
                ...menuButtonStyles,
                color: '#dc2626'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span>✕</span>
              <span>Remove Highlight</span>
            </button>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Print functionality
              window.print()
              setShowVerseMenu(false)
            }}
            style={menuButtonStyles}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span>Print</span>
          </button>
          
          <div style={{ height: '1px', backgroundColor: dividerColor, margin: '4px 0' }} />
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Apple Look Up functionality
              setShowVerseMenu(false)
            }}
            style={menuButtonStyles}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span>Apple Look Up "{selectedWord}"</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (selectedWord) {
                window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedWord)}`, '_blank')
              }
              setShowVerseMenu(false)
            }}
            style={menuButtonStyles}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span>Search with Google</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Share functionality
              setShowVerseMenu(false)
            }}
            style={menuButtonStyles}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ fontSize: '1.2em' }}>›</span>
            <span>Share</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Speech functionality
              setShowVerseMenu(false)
            }}
            style={menuButtonStyles}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ fontSize: '1.2em' }}>›</span>
            <span>Speech</span>
          </button>
          
          <div style={{ height: '1px', backgroundColor: dividerColor, margin: '4px 0' }} />
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Services functionality
              setShowVerseMenu(false)
            }}
            style={menuButtonStyles}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ fontSize: '1.2em' }}>›</span>
            <span>Services</span>
          </button>
        </div>
      )}

      {/* Highlight color picker - positioned as submenu */}
      {showHighlightPicker && (
        <div 
          className="verse-controls"
          style={{
            position: 'fixed',
            left: showReferenceMenu ? `${controlsPosition.x + 210}px` : (showVerseMenu ? `${controlsPosition.x + 210}px` : `${controlsPosition.x}px`),
            top: showReferenceMenu ? `${controlsPosition.y + 85}px` : (showVerseMenu ? `${controlsPosition.y + 145}px` : `${controlsPosition.y}px`),
            backgroundColor: isDarkMode ? '#1f2937' : 'white',
            borderRadius: '6px',
            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1001,
            padding: '4px 0',
            minWidth: '160px',
            fontSize: '0.875rem'
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setShowHighlightPicker(true)}
          onMouseLeave={() => setShowHighlightPicker(false)}
        >
          {Object.entries(HIGHLIGHT_COLORS).map(([name, color]) => (
            <button
              key={name}
              onClick={(e) => {
                e.stopPropagation()
                handleHighlightClick(name)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.1s',
                color: isDarkMode ? '#f3f4f6' : '#111827',
                textTransform: 'capitalize'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverColor}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: color,  // Always show original colors in picker
                  border: `1px solid ${isDarkMode ? '#374151' : '#d1d5db'}`,
                  flexShrink: 0
                }}
              />
              <span>{name.charAt(0).toUpperCase() + name.slice(1)}</span>
            </button>
          ))}
          
          {(highlight || (highlights && highlights.length > 0)) && (
            <>
              <div style={{ height: '1px', backgroundColor: dividerColor, margin: '4px 0' }} />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveHighlightClick()
                  setShowHighlightPicker(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.1s',
                  color: isDarkMode ? '#f3f4f6' : '#111827'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverColor}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span>Remove Highlight</span>
              </button>
            </>
          )}
        </div>
      )}
      
      {/* Services submenu */}
      {showServicesMenu && (
        <div 
          className="verse-controls"
          style={{
            position: 'fixed',
            left: `${controlsPosition.x + 210}px`,
            top: showReferenceMenu ? `${controlsPosition.y + 200}px` : `${controlsPosition.y}px`,
            backgroundColor: isDarkMode ? '#1f2937' : 'white',
            borderRadius: '6px',
            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1001,
            padding: '4px 0',
            minWidth: '160px',
            fontSize: '0.875rem'
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setShowServicesMenu(true)}
          onMouseLeave={() => setShowServicesMenu(false)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Lookup functionality
              setShowReferenceMenu(false)
              setShowServicesMenu(false)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 0.1s',
              color: isDarkMode ? '#f3f4f6' : '#111827'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span>Lookup</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Share functionality
              setShowReferenceMenu(false)
              setShowServicesMenu(false)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 0.1s',
              color: isDarkMode ? '#f3f4f6' : '#111827'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span>Share</span>
          </button>
        </div>
      )}
      
      <div
        className={`verse-display text-gray-900 dark:text-gray-100`}
        style={{ 
          padding: '0 12px',
          paddingTop: `${Math.max(0, parseInt(verseSpacing) / 2)}px`,
          paddingBottom: `${Math.max(0, parseInt(verseSpacing) / 2)}px`,
          borderRadius: '4px',
          position: 'relative',
          fontSize: `${fontSize}px`,
          lineHeight: lineSpacing
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ flex: 1, display: 'inline' }}>
            {/* Verse reference button - NOT highlighted, stays inline */}
            {showVerseNumbers && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onVerseClick(verse)
                }}
                onContextMenu={handleReferenceContextMenu}
                className="text-blue-600 dark:text-blue-400 font-bold mr-2 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer transition-colors"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  padding: 0,
                  display: 'inline',
                  verticalAlign: 'baseline'
                }}
              >
                {bookAbbrev} {chapterNumber}:{verse.verse}
              </button>
            )}
            
            {/* Verse text - supports partial highlights */}
            <span 
              ref={verseTextRef}
              onContextMenu={handleVerseContextMenu}
              style={{ 
                userSelect: 'text',
                backgroundColor: (() => {
                  // Check if we have partial highlights
                  const hasPartial = (highlights && highlights.length > 0 && highlights.some(h => h.startOffset !== undefined && h.endOffset !== undefined)) ||
                                   (highlight && highlight.startOffset !== undefined && highlight.endOffset !== undefined)
                  
                  if (hasPartial) return 'transparent'
                  
                  // Apply highlight color for full-verse highlights
                  return highlightColor || (isSelected 
                    ? (isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)')
                    : 'transparent')
                })(),
                padding: (() => {
                  const hasPartial = (highlights && highlights.length > 0 && highlights.some(h => h.startOffset !== undefined && h.endOffset !== undefined)) ||
                                   (highlight && highlight.startOffset !== undefined && highlight.endOffset !== undefined)
                  
                  if (hasPartial) return '0'
                  
                  return (highlightColor || isSelected) ? '2px 4px' : '0'
                })(),
                borderRadius: (() => {
                  const hasPartial = (highlights && highlights.length > 0 && highlights.some(h => h.startOffset !== undefined && h.endOffset !== undefined)) ||
                                   (highlight && highlight.startOffset !== undefined && highlight.endOffset !== undefined)
                  
                  if (hasPartial) return '0'
                  
                  return (highlightColor || isSelected) ? '3px' : '0'
                })(),
                transition: 'all 0.2s',
                display: 'inline'
              }}
              onMouseEnter={(e) => {
                if (!isSelected && !highlightColor && (!highlights || highlights.length === 0)) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(249, 250, 251, 0.8)'
                  e.currentTarget.style.padding = '2px 4px'
                  e.currentTarget.style.borderRadius = '3px'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected && !highlightColor && (!highlights || highlights.length === 0)) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.padding = '0'
                  e.currentTarget.style.borderRadius = '0'
                } else if (isSelected && !highlightColor && (!highlights || highlights.length === 0)) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'
                } else if (highlightColor && (!highlights || highlights.length === 0)) {
                  e.currentTarget.style.backgroundColor = highlightColor
                }
              }}
            >
              {hasStrongs && onStrongsClick ? (
                <VerseWithStrongs
                  text={verse.text}
                  verseNumber={null}
                  onStrongsClick={onStrongsClick}
                  highlights={(() => {
                    // Collect all partial highlights
                    const allHighlights: any[] = []
                    if (highlights && highlights.length > 0) {
                      highlights.forEach(h => {
                        if (h.startOffset !== undefined && h.endOffset !== undefined) {
                          allHighlights.push({
                            startOffset: h.startOffset,
                            endOffset: h.endOffset,
                            color: h.color
                          })
                        }
                      })
                    }
                    return allHighlights.length > 0 ? allHighlights : undefined
                  })()}
                  isDarkMode={isDarkMode}
                />
              ) : (
                renderHighlightedText(verse.text)
              )}
            </span>
          </div>
          
          {note && (
            <div
              style={{
                padding: '2px 6px',
                backgroundColor: isDarkMode ? 'rgba(30, 64, 175, 0.3)' : '#dbeafe',
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: isDarkMode ? '#93c5fd' : '#1e40af',
                cursor: 'help',
                flexShrink: 0
              }}
              title={note.note}
            >
              📝
            </div>
          )}
        </div>
      </div>
    </div>
  )
}