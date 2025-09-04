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
}

export const HIGHLIGHT_COLORS = {
  yellow: '#fef3c7',
  green: '#d1fae5',
  blue: '#dbeafe',
  pink: '#fce7f3',
  purple: '#e9d5ff',
  orange: '#fed7aa',
  red: '#fee2e2',
  gray: '#f3f4f6'
} as const

export type HighlightColor = keyof typeof HIGHLIGHT_COLORS

export class HighlightManager {
  private dbName = 'BibleAppDB'
  private storeName = 'highlights'
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 3) // Increment version
      
      request.onerror = () => reject(request.error)
      
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create highlights store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('reference', 'reference', { unique: false })
          store.createIndex('book', 'book', { unique: false })
          store.createIndex('color', 'color', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  async addHighlight(highlight: Omit<VerseHighlight, 'id' | 'timestamp'>): Promise<void> {
    if (!this.db) await this.init()
    
    // Check if verse is already highlighted
    const existingHighlight = await this.getHighlight(
      highlight.book,
      highlight.chapter,
      highlight.verse,
      highlight.version
    )
    
    const fullHighlight: VerseHighlight = {
      ...highlight,
      id: existingHighlight?.id || `${highlight.reference}-${highlight.version}-${Date.now()}`,
      timestamp: new Date()
    }
    
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

  async removeHighlight(book: string, chapter: number, verse: number, version: string): Promise<void> {
    if (!this.db) await this.init()
    
    const highlight = await this.getHighlight(book, chapter, verse, version)
    if (highlight) {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      store.delete(highlight.id)
    }
  }

  async getHighlight(book: string, chapter: number, verse: number, version: string): Promise<VerseHighlight | null> {
    const reference = `${book} ${chapter}:${verse}`
    const allHighlights = await this.getHighlightsByReference(reference)
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

  async getHighlightsForChapter(book: string, chapter: number, version: string): Promise<Map<number, VerseHighlight>> {
    if (!this.db) await this.init()
    
    const highlights = new Map<number, VerseHighlight>()
    const allHighlights = await this.getAllHighlights()
    
    for (const highlight of allHighlights) {
      if (highlight.book === book && 
          highlight.chapter === chapter && 
          highlight.version === version) {
        highlights.set(highlight.verse, highlight)
      }
    }
    
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