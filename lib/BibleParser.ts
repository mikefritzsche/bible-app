import type { BibleData, Book, Chapter, Verse } from '@/types/bible';
import ModuleManagerInstance from '@/lib/modules/ModuleManager';

// Helper function to map version names for module system compatibility
function mapVersionForModuleSystem(version: string): string {
  const versionMap: Record<string, string> = {
    'kjv_strongs': 'kjv-strongs',
    'kjv': 'kjv',
    'asv': 'asv',
    'asvs': 'asvs', // This might need to be mapped to something else
    'geneva': 'geneva',
    'web': 'web'
  };

  return versionMap[version] || version;
}

// Helper function to map module system names back to app version names
function mapVersionFromModuleSystem(moduleVersion: string): string {
  const versionMap: Record<string, string> = {
    'kjv-strongs': 'kjv_strongs',
    'kjv': 'kjv',
    'asv': 'asv',
    'asvs': 'asvs',
    'geneva': 'geneva',
    'web': 'web'
  };

  return versionMap[moduleVersion] || moduleVersion;
}

export class BibleParser {
  private bibleData: BibleData | null = null;
  private currentBook: string | null = null;
  private currentChapter: number = 1;
  private moduleManager: any = null;

  async loadBible(version: string = 'kjv_strongs'): Promise<BibleData> {
    try {
      // First try to load from module system (only on client side)
      if (typeof window !== 'undefined') {
        if (!this.moduleManager) {
          this.moduleManager = ModuleManagerInstance;
        }

        try {
          // Map version names for module system compatibility
          const moduleVersion = mapVersionForModuleSystem(version);
          console.log(`Checking if module ${moduleVersion} is installed for version ${version}...`);
          const isInstalled = await this.moduleManager.isModuleInstalled(moduleVersion);
          console.log(`Module ${moduleVersion} installed:`, isInstalled);

          if (isInstalled) {
            console.log(`Loading ${version} from module system...`);
            const moduleData = await this.moduleManager.getModuleData(moduleVersion);
            if (moduleData) {
              console.log(`Successfully loaded ${version} from module system`);
              console.log('Module data structure:', Object.keys(moduleData));

              if (moduleData.verses) {
                console.log(`Module data contains ${moduleData.verses.length} verses`);
                // Check if Psalms is in the verses
                const psalmsVerses = moduleData.verses.filter((v: any) => v.book_name === 'Psalms');
                console.log(`Found ${psalmsVerses.length} Psalms verses`);
              }

              if (moduleData.books) {
                console.log(`Module data contains ${Object.keys(moduleData.books).length} books:`, Object.keys(moduleData.books));
              }

              this.bibleData = await this.transformModuleData(moduleData, version);
              return this.bibleData;
            } else {
              console.log(`Module system returned null data for ${moduleVersion}`);
            }
          }
        } catch (moduleError) {
          console.warn('Module system failed, falling back to static files:', moduleError);
        }
      }

      // Fall back to static files
      console.log(`Loading ${version} from static files...`);
      const response = await fetch(`/bibles/json/${version}.json`);
      if (!response.ok) {
        console.error(`Failed to load Bible ${version}: HTTP ${response.status}`);
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
      const bookNames = Object.keys(this.bibleData.books);
      console.log('Available books:', bookNames.slice(0, 10), '...');

      // Check for common book name variations
      const psalmsVariations = ['Psalms', 'Psalm', 'Psalme', 'Psalme', 'The Psalms'];
      const foundPsalms = psalmsVariations.find(name => bookNames.includes(name));
      if (foundPsalms) {
        console.log(`Found Psalms as: "${foundPsalms}"`);
      } else {
        console.log('Psalms not found in any of these variations:', psalmsVariations);
        console.log('All available books:', bookNames);
      }

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
    if (!book) {
      console.log(`Book "${bookName}" not found in Bible data`);
      return null;
    }

    // Chapters are 1-indexed
    const chapterIndex = chapterNumber - 1;
    if (chapterIndex < 0 || chapterIndex >= book.chapters.length) {
      console.log(`Chapter ${chapterNumber} not found in book "${bookName}" (has ${book.chapters.length} chapters)`);
      return null;
    }

    this.currentBook = bookName;
    this.currentChapter = chapterNumber;

    const chapter = book.chapters[chapterIndex];
    console.log(`Retrieved ${bookName} ${chapterNumber} with ${Object.keys(chapter.verses).length} verses`);
    return chapter;
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

  private async transformModuleData(moduleData: any, version: string): Promise<BibleData> {
    // Transform module data into our BibleData format
    const books: Record<string, Book> = {};

    if (moduleData.verses && Array.isArray(moduleData.verses)) {
      // Handle flat verse array format
      moduleData.verses.forEach((verse: any) => {
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
    } else if (moduleData.books) {
      // Handle hierarchical book format
      Object.entries(moduleData.books).forEach(([bookName, bookData]: [string, any]) => {
        books[bookName] = {
          book: bookName,
          chapters: bookData.chapters || []
        };
      });
    }

    // Sort chapters in each book
    Object.values(books).forEach(book => {
      book.chapters.sort((a, b) => a.chapter - b.chapter);
    });

    return {
      version: version,
      books: books
    };
  }

  // New method to get available Bible versions
  async getAvailableVersions(): Promise<string[]> {
    try {
      if (typeof window !== 'undefined') {
        if (!this.moduleManager) {
          this.moduleManager = ModuleManagerInstance;
        }
        const availableModules = await this.moduleManager.getAvailableModules();
        return Object.values(availableModules)
          .filter((module: any) => module.type === 'bible')
          .map((module: any) => module.id);
      }
      return ['kjv_strongs']; // Fallback for SSR
    } catch (error) {
      console.error('Error getting available versions:', error);
      return ['kjv_strongs']; // Fallback to default
    }
  }

  // New method to check if a version is installed
  async isVersionInstalled(version: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        if (!this.moduleManager) {
          this.moduleManager = ModuleManagerInstance;
        }
        return await this.moduleManager.isModuleInstalled(version);
      }
      return false; // Fallback for SSR
    } catch (error) {
      console.error('Error checking if version is installed:', error);
      return false;
    }
  }

  // New method to download a version
  async downloadVersion(version: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        if (!this.moduleManager) {
          this.moduleManager = ModuleManagerInstance;
        }
        await this.moduleManager.downloadModule(version);
        return true;
      }
      return false; // Fallback for SSR
    } catch (error) {
      console.error('Error downloading version:', error);
      return false;
    }
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