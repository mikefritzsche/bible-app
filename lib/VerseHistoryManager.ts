export interface VerseHistoryEntry {
  id: string
  book: string
  chapter: number
  verse: number
  verseText: string
  version: string
  timestamp: Date
  reference: string // "Genesis 1:1"
}

export class VerseHistoryManager {
  private dbName = 'BibleAppDB'
  private storeName = 'verseHistory'
  private db: IDBDatabase | null = null
  private maxHistoryItems = 100

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 6) // Use consistent version
      
      request.onerror = () => reject(request.error)
      
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create verse history store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('reference', 'reference', { unique: false })
          store.createIndex('book', 'book', { unique: false })
        }
        
        // Ensure highlights store exists
        if (!db.objectStoreNames.contains('highlights')) {
          const store = db.createObjectStore('highlights', { keyPath: 'id' })
          store.createIndex('reference', 'reference', { unique: false })
          store.createIndex('book', 'book', { unique: false })
          store.createIndex('color', 'color', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('version', 'version', { unique: false })
        }
        
        // Ensure notes store exists
        if (!db.objectStoreNames.contains('notes')) {
          const store = db.createObjectStore('notes', { keyPath: 'id' })
          store.createIndex('reference', 'reference', { unique: false })
          store.createIndex('book', 'book', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('lastModified', 'lastModified', { unique: false })
          store.createIndex('version', 'version', { unique: false })
        }
      }
    })
  }

  async addToHistory(entry: Omit<VerseHistoryEntry, 'id' | 'timestamp'>): Promise<void> {
    if (!this.db) await this.init()
    
    const fullEntry: VerseHistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
      timestamp: new Date()
    }
    
    // Create a new transaction for the add operation
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const request = store.add(fullEntry)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
    
    // Check and cleanup in a separate operation
    const allEntries = await this.getHistory()
    if (allEntries.length > this.maxHistoryItems) {
      const entriesToRemove = allEntries.slice(this.maxHistoryItems)
      for (const entry of entriesToRemove) {
        await this.removeFromHistory(entry.id)
      }
    }
  }

  async getHistory(limit?: number): Promise<VerseHistoryEntry[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('timestamp')
      
      const entries: VerseHistoryEntry[] = []
      const request = index.openCursor(null, 'prev') // Get newest first
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor && (!limit || entries.length < limit)) {
          entries.push(cursor.value)
          cursor.continue()
        } else {
          resolve(entries)
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async clearHistory(): Promise<void> {
    if (!this.db) await this.init()
    
    const transaction = this.db!.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    store.clear()
  }

  async removeFromHistory(id: string): Promise<void> {
    if (!this.db) await this.init()
    
    const transaction = this.db!.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    store.delete(id)
  }

  private async cleanupOldEntries(): Promise<void> {
    const allEntries = await this.getHistory()
    if (allEntries.length > this.maxHistoryItems) {
      const entriesToRemove = allEntries.slice(this.maxHistoryItems)
      for (const entry of entriesToRemove) {
        await this.removeFromHistory(entry.id)
      }
    }
  }

  async searchHistory(query: string): Promise<VerseHistoryEntry[]> {
    const allEntries = await this.getHistory()
    const lowercaseQuery = query.toLowerCase()
    
    return allEntries.filter(entry =>
      entry.reference.toLowerCase().includes(lowercaseQuery) ||
      entry.verseText.toLowerCase().includes(lowercaseQuery) ||
      entry.book.toLowerCase().includes(lowercaseQuery)
    )
  }

  async getUniqueBooks(): Promise<string[]> {
    const entries = await this.getHistory()
    const books = new Set(entries.map(e => e.book))
    return Array.from(books)
  }

  async getHistoryForBook(book: string): Promise<VerseHistoryEntry[]> {
    const entries = await this.getHistory()
    return entries.filter(e => e.book === book)
  }
}