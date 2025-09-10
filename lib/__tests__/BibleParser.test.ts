import { BibleParser } from '../BibleParser'

describe('BibleParser', () => {
  let parser: BibleParser

  beforeEach(() => {
    parser = new BibleParser()
  })

  describe('parseReference', () => {
    it('should parse a simple book chapter reference', () => {
      const result = parser.parseReference('John 3')
      expect(result).toEqual({
        book: 'John',
        chapter: 3,
        verse: undefined,
      })
    })

    it('should parse a book chapter:verse reference', () => {
      const result = parser.parseReference('John 3:16')
      expect(result).toEqual({
        book: 'John',
        chapter: 3,
        verse: 16,
      })
    })

    it('should handle book names with numbers', () => {
      const result = parser.parseReference('1 John 3:16')
      expect(result).toEqual({
        book: '1 John',
        chapter: 3,
        verse: 16,
      })
    })

    it('should return null for invalid references', () => {
      const result = parser.parseReference('Invalid Reference')
      expect(result).toBeNull()
    })
  })

  describe('getFormattedReference', () => {
    it('should format a simple reference', () => {
      const formatted = parser.getFormattedReference('John', 3, 16)
      expect(formatted).toBe('John 3:16')
    })

    it('should format a reference without verse', () => {
      const formatted = parser.getFormattedReference('John', 3)
      expect(formatted).toBe('John 3')
    })
  })

  describe('getBooks', () => {
    it('should throw error when Bible not loaded', () => {
      expect(() => parser.getBooks()).toThrow('Bible not loaded')
    })
  })

  describe('getNavigationInfo', () => {
    it('should return navigation info', () => {
      const navInfo = parser.getNavigationInfo()
      expect(navInfo).toHaveProperty('currentBook')
      expect(navInfo).toHaveProperty('currentChapter')
      expect(navInfo).toHaveProperty('hasNext')
      expect(navInfo).toHaveProperty('hasPrev')
      expect(navInfo.currentBook).toBeNull()
      expect(navInfo.currentChapter).toBe(1)
    })
  })

  describe('searchVerses', () => {
    it('should throw error when Bible not loaded', () => {
      expect(() => parser.searchVerses('test')).toThrow('Bible not loaded')
    })
  })

  describe('getChapterCount', () => {
    it('should throw error when Bible not loaded', () => {
      expect(() => parser.getChapterCount('Genesis')).toThrow('Bible not loaded')
    })
  })

  describe('getVerseCount', () => {
    it('should throw error when Bible not loaded', () => {
      expect(() => parser.getVerseCount('Genesis', 1)).toThrow('Bible not loaded')
    })
  })
})