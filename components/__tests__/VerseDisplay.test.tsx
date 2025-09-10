import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { VerseDisplay } from '../VerseDisplay'

jest.mock('../../lib/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      fontSize: 'medium',
      lineSpacing: 'normal',
      fontFamily: 'sans-serif',
    },
  }),
}))

describe('VerseDisplay', () => {
  const mockOnVerseClick = jest.fn()
  const mockOnHighlight = jest.fn()
  const mockOnRemoveHighlight = jest.fn()
  const mockOnAddNote = jest.fn()
  const mockOnStrongsClick = jest.fn()

  const defaultProps = {
    verse: {
      verse: 16,
      text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
    },
    bookName: 'John',
    chapterNumber: 3,
    isSelected: false,
    hasStrongs: false,
    onVerseClick: mockOnVerseClick,
    onHighlight: mockOnHighlight,
    onRemoveHighlight: mockOnRemoveHighlight,
    onAddNote: mockOnAddNote,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render verse text correctly', () => {
    render(<VerseDisplay {...defaultProps} />)
    
    expect(screen.getByText(/For God so loved the world/)).toBeInTheDocument()
  })

  it('should display verse reference', () => {
    render(<VerseDisplay {...defaultProps} />)
    
    expect(screen.getByText('John 3:16')).toBeInTheDocument()
  })

  it('should handle verse click', () => {
    render(<VerseDisplay {...defaultProps} />)
    
    const verseRef = screen.getByText('John 3:16')
    fireEvent.click(verseRef)
    
    expect(mockOnVerseClick).toHaveBeenCalledWith(defaultProps.verse)
  })

  it('should hide verse numbers when showVerseNumbers is false', () => {
    render(<VerseDisplay {...defaultProps} showVerseNumbers={false} />)
    
    expect(screen.queryByText('John 3:16')).not.toBeInTheDocument()
  })

  it('should apply custom font size', () => {
    const { container } = render(<VerseDisplay {...defaultProps} fontSize="20" />)
    const verseDisplay = container.querySelector('.verse-display')
    
    expect(verseDisplay).toHaveStyle({ fontSize: '20px' })
  })

  it('should apply custom line spacing', () => {
    const { container } = render(<VerseDisplay {...defaultProps} lineSpacing="2.0" />)
    const verseDisplay = container.querySelector('.verse-display')
    
    expect(verseDisplay).toHaveStyle({ lineHeight: '2.0' })
  })

  it('should render note indicator when note is provided', () => {
    const noteProps = {
      ...defaultProps,
      note: {
        id: '1',
        verseReference: 'John 3:16',
        note: 'Test note',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }
    
    render(<VerseDisplay {...noteProps} />)
    expect(screen.getByText('📝')).toBeInTheDocument()
  })

  it('should handle verses with Strong\'s numbers', () => {
    const versesWithStrongs = {
      ...defaultProps,
      verse: {
        verse: 1,
        text: 'In the beginning{H7225} God{H430} created{H1254} the heaven{H8064} and the earth{H776}.',
      },
      bookName: 'Genesis',
      chapterNumber: 1,
      hasStrongs: true,
      onStrongsClick: mockOnStrongsClick,
    }
    
    render(<VerseDisplay {...versesWithStrongs} />)
    expect(screen.getByText(/In the beginning/)).toBeInTheDocument()
  })

  it('should show highlight color when highlight prop is provided', () => {
    const highlightProps = {
      ...defaultProps,
      highlight: {
        id: '1',
        verseReference: 'John 3:16',
        color: 'yellow',
        selectedText: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }
    
    const { container } = render(<VerseDisplay {...highlightProps} />)
    const verseText = container.querySelector('.verse-display span[style*="background"]')
    expect(verseText).toBeTruthy()
  })
})