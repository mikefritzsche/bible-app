import type { BibleData, Book, Chapter, Verse } from '@/types/bible';

export class BibleParser {
  private bibleData: BibleData | null = null;
  private currentBook: string | null = null;
  private currentChapter: number = 1;

  async loadBible(version: string = 'kjv_strongs'): Promise<BibleData> {
    try {
      const response = await fetch(`/bibles/json/${version}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load Bible: ${response.status}`);
      }
      
      const rawData = await response.json();
      
      // Transform flat verse array into hierarchical structure
      const books: Record<string, Book> = {};
      
      if (rawData.verses && Array.isArray(rawData.verses)) {
        rawData.verses.forEach((verse: any) => {
          const bookName = verse.book_name;
          
          if (!books[bookName]) {
            books[bookName] = {
              book: bookName,
              chapters: []
            };
          }
          
          // Find or create chapter
          let chapter = books[bookName].chapters.find(c => c.chapter === verse.chapter);
          if (!chapter) {
            chapter = {
              chapter: verse.chapter,
              name: `${bookName} ${verse.chapter}`,
              verses: {}
            };
            books[bookName].chapters.push(chapter);
          }
          
          // Add verse to chapter
          chapter.verses[verse.verse.toString()] = {
            chapter: verse.chapter,
            verse: verse.verse,
            name: `${bookName} ${verse.chapter}:${verse.verse}`,
            text: verse.text
          };
        });
        
        // Sort chapters in each book
        Object.values(books).forEach(book => {
          book.chapters.sort((a, b) => a.chapter - b.chapter);
        });
      }
      
      this.bibleData = {
        version: version,
        books: books
      };
      
      console.log(`Loaded ${version} Bible with ${Object.keys(this.bibleData.books).length} books`);
      return this.bibleData;
    } catch (error) {
      console.error('Error loading Bible:', error);
      throw error;
    }
  }

  getBooks(): string[] {
    if (!this.bibleData) {
      throw new Error('Bible not loaded');
    }
    return Object.keys(this.bibleData.books);
  }

  getBook(bookName: string): Book | null {
    if (!this.bibleData) {
      throw new Error('Bible not loaded');
    }
    return this.bibleData.books[bookName] || null;
  }

  getChapter(bookName: string, chapterNumber: number): Chapter | null {
    const book = this.getBook(bookName);
    if (!book) return null;
    
    // Chapters are 1-indexed
    const chapterIndex = chapterNumber - 1;
    if (chapterIndex < 0 || chapterIndex >= book.chapters.length) {
      return null;
    }
    
    this.currentBook = bookName;
    this.currentChapter = chapterNumber;
    
    return book.chapters[chapterIndex];
  }

  getVerse(bookName: string, chapterNumber: number, verseNumber: number): Verse | null {
    const chapter = this.getChapter(bookName, chapterNumber);
    if (!chapter) return null;
    
    // Verses are stored in an object with string keys
    return chapter.verses[verseNumber.toString()] || null;
  }

  getChapterCount(bookName: string): number {
    const book = this.getBook(bookName);
    return book ? book.chapters.length : 0;
  }

  getVerseCount(bookName: string, chapterNumber: number): number {
    const chapter = this.getChapter(bookName, chapterNumber);
    return chapter ? Object.keys(chapter.verses).length : 0;
  }

  searchVerses(searchTerm: string, bookFilter?: string): Verse[] {
    if (!this.bibleData) {
      throw new Error('Bible not loaded');
    }

    const results: Verse[] = [];
    const searchLower = searchTerm.toLowerCase();
    const books = bookFilter ? [bookFilter] : Object.keys(this.bibleData.books);

    for (const bookName of books) {
      const book = this.bibleData.books[bookName];
      if (!book) continue;

      for (const chapter of book.chapters) {
        for (const verse of Object.values(chapter.verses)) {
          if (verse.text.toLowerCase().includes(searchLower)) {
            results.push(verse);
          }
        }
      }
    }

    return results;
  }

  getFormattedReference(bookName: string, chapterNumber: number, verseNumber?: number): string {
    if (verseNumber) {
      return `${bookName} ${chapterNumber}:${verseNumber}`;
    }
    return `${bookName} ${chapterNumber}`;
  }

  parseReference(reference: string): { book: string; chapter: number; verse?: number } | null {
    // Parse references like "Genesis 1:1" or "John 3:16" or "Psalms 23"
    const match = reference.match(/^(.+?)\s+(\d+)(?::(\d+))?$/);
    if (!match) return null;

    return {
      book: match[1],
      chapter: parseInt(match[2], 10),
      verse: match[3] ? parseInt(match[3], 10) : undefined
    };
  }

  getNavigationInfo(): { 
    currentBook: string | null; 
    currentChapter: number;
    hasNext: boolean;
    hasPrev: boolean;
  } {
    const hasNext = this.currentBook !== null && 
                   this.currentChapter < this.getChapterCount(this.currentBook);
    const hasPrev = this.currentChapter > 1;

    return {
      currentBook: this.currentBook,
      currentChapter: this.currentChapter,
      hasNext,
      hasPrev
    };
  }

  navigateNext(): Chapter | null {
    if (!this.currentBook) return null;
    
    const nextChapter = this.currentChapter + 1;
    if (nextChapter <= this.getChapterCount(this.currentBook)) {
      return this.getChapter(this.currentBook, nextChapter);
    }
    
    // Move to next book if available
    const books = this.getBooks();
    const currentIndex = books.indexOf(this.currentBook);
    if (currentIndex < books.length - 1) {
      const nextBook = books[currentIndex + 1];
      return this.getChapter(nextBook, 1);
    }
    
    return null;
  }

  navigatePrev(): Chapter | null {
    if (!this.currentBook) return null;
    
    const prevChapter = this.currentChapter - 1;
    if (prevChapter >= 1) {
      return this.getChapter(this.currentBook, prevChapter);
    }
    
    // Move to previous book if available
    const books = this.getBooks();
    const currentIndex = books.indexOf(this.currentBook);
    if (currentIndex > 0) {
      const prevBook = books[currentIndex - 1];
      const lastChapter = this.getChapterCount(prevBook);
      return this.getChapter(prevBook, lastChapter);
    }
    
    return null;
  }
}