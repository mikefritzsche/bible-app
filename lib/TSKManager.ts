interface TSKReference {
  book: string
  bookKey: number
  chapter: number
  startVerse: number
  endVerse: number
  original: string
}

interface TSKEntry {
  word: string
  sort_order: number
  references: TSKReference[]
}

interface TSKData {
  metadata: {
    name: string
    description: string
    totalEntries: number
    totalVerses: number
    source: string
    generatedAt: string
  }
  data: Record<string, TSKEntry[]>
}

export class TSKManager {
  private static instance: TSKManager
  private tskData: TSKData | null = null
  private isLoading = false
  private loadPromise: Promise<void> | null = null

  private constructor() {}

  static getInstance(): TSKManager {
    if (!TSKManager.instance) {
      TSKManager.instance = new TSKManager()
    }
    return TSKManager.instance
  }

  async loadData(): Promise<void> {
    if (this.tskData) return
    if (this.isLoading && this.loadPromise) return this.loadPromise

    this.isLoading = true
    this.loadPromise = (async () => {
      try {
        const response = await fetch('/bibles/extras/tsk.json')
        if (!response.ok) {
          throw new Error(`Failed to load TSK data: ${response.status}`)
        }
        this.tskData = await response.json()
        console.log('TSK data loaded successfully:', this.tskData?.metadata)
      } catch (error) {
        console.error('Error loading TSK data:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    })()

    return this.loadPromise
  }

  getReferencesForVerse(book: string, chapter: number, verse: number): TSKEntry[] | null {
    if (!this.tskData) return null

    const verseKey = `${book} ${chapter}:${verse}`
    console.log('📖 TSKManager: Looking up verse key:', verseKey)
    console.log('📖 TSKManager: Available keys sample:', Object.keys(this.tskData.data).slice(0, 5))

    const result = this.tskData.data[verseKey] || null
    console.log('📖 TSKManager: Found result:', result?.length || 0, 'entries')
    return result
  }

  hasReferencesForVerse(book: string, chapter: number, verse: number): boolean {
    const references = this.getReferencesForVerse(book, chapter, verse)
    return references !== null && references.length > 0
  }

  searchByWord(word: string): Array<{ verse: string; entries: TSKEntry[] }> {
    if (!this.tskData) return []

    const results: Array<{ verse: string; entries: TSKEntry[] }> = []
    const searchWord = word.toLowerCase()

    Object.entries(this.tskData.data).forEach(([verseKey, entries]) => {
      const matchingEntries = entries.filter(entry =>
        entry.word.toLowerCase().includes(searchWord)
      )

      if (matchingEntries.length > 0) {
        results.push({
          verse: verseKey,
          entries: matchingEntries
        })
      }
    })

    return results
  }

  getVerseReferenceText(reference: TSKReference): string {
    if (reference.startVerse === reference.endVerse) {
      return `${reference.book} ${reference.chapter}:${reference.startVerse}`
    } else {
      return `${reference.book} ${reference.chapter}:${reference.startVerse}-${reference.endVerse}`
    }
  }

  isLoaded(): boolean {
    return this.tskData !== null
  }

  getMetadata() {
    return this.tskData?.metadata || null
  }
}