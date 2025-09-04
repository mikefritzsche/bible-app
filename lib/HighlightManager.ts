export interface VerseHighlight {
  id: string
  book: string
  chapter: number
  verse: number
  color: string
  note?: string
  reference: string // "Genesis 1:1"
  timestamp: Date
  version: string
  selectedText?: string // The actual text that was highlighted
  startOffset?: number // Character position where highlight starts
  endOffset?: number // Character position where highlight ends
}

// Original colors for the picker display
export const HIGHLIGHT_COLORS = {
  orange: '#ffcc99',
  yellow: '#ffff99',
  chartreuse: '#ccff99',
  green: '#99ffcc',
  aqua: '#99ffff',
  blue: '#99ccff',
  purple: '#cc99ff',
  pink: '#ff99ff',
  red: '#ff9999',
  gray: '#cccccc'
} as const

// Light mode colors with transparency for better readability
export const HIGHLIGHT_COLORS_LIGHT = {
  orange: 'rgba(255, 204, 153, 0.5)',
  yellow: 'rgba(255, 255, 153, 0.5)',
  chartreuse: 'rgba(204, 255, 153, 0.5)',
  green: 'rgba(153, 255, 204, 0.5)',
  aqua: 'rgba(153, 255, 255, 0.5)',
  blue: 'rgba(153, 204, 255, 0.5)',
  purple: 'rgba(204, 153, 255, 0.5)',
  pink: 'rgba(255, 153, 255, 0.5)',
  red: 'rgba(255, 153, 153, 0.5)',
  gray: 'rgba(204, 204, 204, 0.5)'
} as const

// Dark mode colors with adjusted transparency
export const HIGHLIGHT_COLORS_DARK = {
  orange: 'rgba(255, 165, 0, 0.25)',
  yellow: 'rgba(255, 235, 59, 0.25)',
  chartreuse: 'rgba(205, 220, 57, 0.25)',
  green: 'rgba(76, 175, 80, 0.25)',
  aqua: 'rgba(0, 188, 212, 0.25)',
  blue: 'rgba(33, 150, 243, 0.25)',
  purple: 'rgba(156, 39, 176, 0.25)',
  pink: 'rgba(233, 30, 99, 0.25)',
  red: 'rgba(244, 67, 54, 0.25)',
  gray: 'rgba(158, 158, 158, 0.25)'
} as const

export type HighlightColor = keyof typeof HIGHLIGHT_COLORS

export class HighlightManager {
  private dbName = 'BibleAppDB'
  private storeName = 'highlights'
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 6) // Increment version for new fields
      
      request.onerror = () => reject(request.error)
      
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const oldVersion = event.oldVersion
        console.log(`Upgrading database from version ${oldVersion} to ${db.version}`)
        
        // Create highlights store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          console.log('Creating highlights store')
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('reference', 'reference', { unique: false })
          store.createIndex('book', 'book', { unique: false })
          store.createIndex('color', 'color', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('version', 'version', { unique: false })
        }
      }
    })
  }

  async addHighlight(highlight: Omit<VerseHighlight, 'id' | 'timestamp'>): Promise<void> {
    console.log('HighlightManager.addHighlight called with:', highlight)
    if (!this.db) await this.init()
    
    // Check if this exact highlight already exists
    const existingHighlight = await this.getHighlight(
      highlight.book,
      highlight.chapter,
      highlight.verse,
      highlight.version,
      highlight.startOffset,
      highlight.endOffset
    )
    console.log('Existing highlight:', existingHighlight)
    
    const fullHighlight: VerseHighlight = {
      ...highlight,
      id: existingHighlight?.id || `${highlight.reference}-${highlight.version}-${highlight.startOffset || 0}-${highlight.endOffset || 'full'}-${Date.now()}`,
      timestamp: new Date()
    }
    console.log('Saving highlight:', fullHighlight)
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const request = existingHighlight 
        ? store.put(fullHighlight)
        : store.add(fullHighlight)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async removeHighlight(book: string, chapter: number, verse: number, version: string, startOffset?: number, endOffset?: number): Promise<void> {
    if (!this.db) await this.init()
    
    const highlight = await this.getHighlight(book, chapter, verse, version, startOffset, endOffset)
    if (highlight) {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      store.delete(highlight.id)
    }
  }

  async getHighlight(book: string, chapter: number, verse: number, version: string, startOffset?: number, endOffset?: number): Promise<VerseHighlight | null> {
    const reference = `${book} ${chapter}:${verse}`
    const allHighlights = await this.getHighlightsByReference(reference)
    
    // If looking for a specific text range
    if (startOffset !== undefined && endOffset !== undefined) {
      return allHighlights.find(h => 
        h.version === version && 
        h.startOffset === startOffset && 
        h.endOffset === endOffset
      ) || null
    }
    
    // Otherwise return any highlight for this verse
    return allHighlights.find(h => h.version === version) || null
  }

  async getHighlightsByReference(reference: string): Promise<VerseHighlight[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('reference')
      
      const highlights: VerseHighlight[] = []
      const request = index.openCursor(IDBKeyRange.only(reference))
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          highlights.push(cursor.value)
          cursor.continue()
        } else {
          resolve(highlights)
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async getHighlightsForChapter(book: string, chapter: number, version: string): Promise<Map<number, VerseHighlight[]>> {
    console.log('getHighlightsForChapter called:', { book, chapter, version })
    if (!this.db) await this.init()
    
    const highlights = new Map<number, VerseHighlight[]>()
    const allHighlights = await this.getAllHighlights()
    console.log('All highlights in DB:', allHighlights)
    
    for (const highlight of allHighlights) {
      if (highlight.book === book && 
          highlight.chapter === chapter && 
          highlight.version === version) {
        const verseHighlights = highlights.get(highlight.verse) || []
        verseHighlights.push(highlight)
        highlights.set(highlight.verse, verseHighlights)
        console.log(`Adding highlight for verse ${highlight.verse}:`, highlight)
      }
    }
    
    console.log('Returning highlights Map:', highlights)
    return highlights
  }

  async getAllHighlights(): Promise<VerseHighlight[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()
      
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getHighlightsByColor(color: string): Promise<VerseHighlight[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('color')
      
      const highlights: VerseHighlight[] = []
      const request = index.openCursor(IDBKeyRange.only(color))
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          highlights.push(cursor.value)
          cursor.continue()
        } else {
          resolve(highlights)
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async clearAllHighlights(): Promise<void> {
    if (!this.db) await this.init()
    
    const transaction = this.db!.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    store.clear()
  }

  async exportHighlights(): Promise<string> {
    const highlights = await this.getAllHighlights()
    return JSON.stringify(highlights, null, 2)
  }

  async importHighlights(jsonString: string): Promise<void> {
    try {
      const highlights = JSON.parse(jsonString) as VerseHighlight[]
      
      for (const highlight of highlights) {
        await this.addHighlight({
          book: highlight.book,
          chapter: highlight.chapter,
          verse: highlight.verse,
          color: highlight.color,
          note: highlight.note,
          reference: highlight.reference,
          version: highlight.version
        })
      }
    } catch (error) {
      throw new Error('Invalid highlights JSON format')
    }
  }
}