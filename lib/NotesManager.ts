export interface VerseNote {
  id: string
  book: string
  chapter: number
  verse: number
  note: string
  reference: string // "Genesis 1:1"
  timestamp: Date
  lastModified: Date
  version: string
  tags?: string[]
}

export class NotesManager {
  private dbName = 'BibleAppDB'
  private storeName = 'notes'
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 4) // Increment version
      
      request.onerror = () => reject(request.error)
      
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create notes store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('reference', 'reference', { unique: false })
          store.createIndex('book', 'book', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('lastModified', 'lastModified', { unique: false })
        }
      }
    })
  }

  async addOrUpdateNote(note: Omit<VerseNote, 'id' | 'timestamp' | 'lastModified'>): Promise<void> {
    if (!this.db) await this.init()
    
    const existingNote = await this.getNote(note.book, note.chapter, note.verse, note.version)
    
    const fullNote: VerseNote = {
      ...note,
      id: existingNote?.id || `${note.reference}-${note.version}-${Date.now()}`,
      timestamp: existingNote?.timestamp || new Date(),
      lastModified: new Date()
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const request = existingNote
        ? store.put(fullNote)
        : store.add(fullNote)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getNote(book: string, chapter: number, verse: number, version: string): Promise<VerseNote | null> {
    const reference = `${book} ${chapter}:${verse}`
    const notes = await this.getNotesByReference(reference)
    return notes.find(n => n.version === version) || null
  }

  async getNotesByReference(reference: string): Promise<VerseNote[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('reference')
      
      const notes: VerseNote[] = []
      const request = index.openCursor(IDBKeyRange.only(reference))
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          notes.push(cursor.value)
          cursor.continue()
        } else {
          resolve(notes)
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async getNotesForChapter(book: string, chapter: number, version: string): Promise<Map<number, VerseNote>> {
    if (!this.db) await this.init()
    
    const notes = new Map<number, VerseNote>()
    const allNotes = await this.getAllNotes()
    
    for (const note of allNotes) {
      if (note.book === book && 
          note.chapter === chapter && 
          note.version === version) {
        notes.set(note.verse, note)
      }
    }
    
    return notes
  }

  async getAllNotes(): Promise<VerseNote[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('lastModified')
      
      const notes: VerseNote[] = []
      const request = index.openCursor(null, 'prev') // Get newest first
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          notes.push(cursor.value)
          cursor.continue()
        } else {
          resolve(notes)
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async searchNotes(query: string): Promise<VerseNote[]> {
    const allNotes = await this.getAllNotes()
    const lowercaseQuery = query.toLowerCase()
    
    return allNotes.filter(note =>
      note.note.toLowerCase().includes(lowercaseQuery) ||
      note.reference.toLowerCase().includes(lowercaseQuery) ||
      note.book.toLowerCase().includes(lowercaseQuery) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)))
    )
  }

  async deleteNote(id: string): Promise<void> {
    if (!this.db) await this.init()
    
    const transaction = this.db!.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    store.delete(id)
  }

  async clearAllNotes(): Promise<void> {
    if (!this.db) await this.init()
    
    const transaction = this.db!.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    store.clear()
  }

  async exportNotes(): Promise<string> {
    const notes = await this.getAllNotes()
    return JSON.stringify(notes, null, 2)
  }

  async importNotes(jsonString: string): Promise<void> {
    try {
      const notes = JSON.parse(jsonString) as VerseNote[]
      
      for (const note of notes) {
        await this.addOrUpdateNote({
          book: note.book,
          chapter: note.chapter,
          verse: note.verse,
          note: note.note,
          reference: note.reference,
          version: note.version,
          tags: note.tags
        })
      }
    } catch (error) {
      throw new Error('Invalid notes JSON format')
    }
  }

  async getNotesByTag(tag: string): Promise<VerseNote[]> {
    const allNotes = await this.getAllNotes()
    return allNotes.filter(note => 
      note.tags && note.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    )
  }

  async getAllTags(): Promise<string[]> {
    const allNotes = await this.getAllNotes()
    const tags = new Set<string>()
    
    for (const note of allNotes) {
      if (note.tags) {
        note.tags.forEach(tag => tags.add(tag))
      }
    }
    
    return Array.from(tags).sort()
  }
}