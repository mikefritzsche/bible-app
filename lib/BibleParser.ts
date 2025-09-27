import type { BibleData, Book, Chapter, Verse } from '@/types/bible';
import getModuleManager from '@/lib/modules/ModuleManager';

// Helper function to map version names for module system compatibility
function mapVersionForModuleSystem(version: string): string {
  const versionMap: Record<string, string> = {
    'kjv-strongs': 'kjv-strongs',
    'kjv_strongs': 'kjv-strongs',
    'kjv': 'kjv',
    'asv-strongs': 'asv-strongs',
    'asv_strongs': 'asv-strongs',
    'asv': 'asv',
    'geneva': 'geneva',
    'web': 'web'
  };

  return versionMap[version] || version;
}

// Helper function to map module system names back to app version names
function mapVersionFromModuleSystem(moduleVersion: string): string {
  const versionMap: Record<string, string> = {
    'kjv-strongs': 'kjv-strongs',
    'kjv_strongs': 'kjv-strongs',
    'kjv': 'kjv',
    'asv-strongs': 'asv-strongs',
    'asv_strongs': 'asv-strongs',
    'asv': 'asv',
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

  async loadBible(version: string = 'kjv-strongs'): Promise<BibleData> {
    const normalizedVersion = version.toLowerCase();
    const requiresStrongs = normalizedVersion.includes('strongs');
    let lastError: unknown = null;

    const attemptModuleFirst = requiresStrongs;
    let bible: BibleData | null = null;
    let fallbackBible: BibleData | null = null;

    if (attemptModuleFirst) {
      const moduleResult = await this.loadBibleFromModuleSystem(version, requiresStrongs);
      if (moduleResult) {
        if (!requiresStrongs || moduleResult.hasStrongs) {
          bible = moduleResult.bible;
        } else {
          fallbackBible = moduleResult.bible;
        }
      }
    }

    if (!bible) {
      try {
        const staticResult = await this.loadBibleFromStatic(version, requiresStrongs);
        if (staticResult) {
          if (!requiresStrongs || staticResult.hasStrongs) {
            bible = staticResult.bible;
          } else {
            fallbackBible = fallbackBible ?? staticResult.bible;
          }
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (!bible && !attemptModuleFirst) {
      const moduleResult = await this.loadBibleFromModuleSystem(version, requiresStrongs);
      if (moduleResult) {
        if (!requiresStrongs || moduleResult.hasStrongs) {
          bible = moduleResult.bible;
        } else {
          fallbackBible = fallbackBible ?? moduleResult.bible;
        }
      }
    }

    if (!bible && requiresStrongs) {
      // One more attempt in case a module became available after the static fallback failed validation
      const moduleResult = await this.loadBibleFromModuleSystem(version, requiresStrongs);
      if (moduleResult) {
        if (!requiresStrongs || moduleResult.hasStrongs) {
          bible = moduleResult.bible;
        } else {
          fallbackBible = fallbackBible ?? moduleResult.bible;
        }
      }
    }

    if (!bible && fallbackBible) {
      bible = fallbackBible;
    }

    if (!bible) {
      if (lastError) {
        console.error('Error loading Bible:', lastError);
        throw lastError;
      }
      const message = requiresStrongs
        ? `Failed to load Strong's-enabled Bible data for version ${version}. Please download the module or ensure the dataset includes Strong's annotations.`
        : `Failed to load Bible data for version ${version}`;
      throw new Error(message);
    }

    this.bibleData = bible;

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
  }

  private async loadFromStaticFiles(version: string): Promise<any> {
    const normalizedVersion = version.replace('_', '-');

    const candidatePaths = Array.from(new Set([
      `/bibles/modules/${normalizedVersion}.json`,
      `/bibles/modules/${version}.json`,
      `/bibles/json/${normalizedVersion}.json`,
      `/bibles/json/${version}.json`,
      normalizedVersion === 'kjv-strongs' ? '/bibles/json/kjv_complete.json' : null
    ].filter(Boolean) as string[]));

    let lastError: any = null;
    for (const path of candidatePaths) {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          lastError = new Error(`HTTP ${response.status} for ${path}`);
          console.warn(`Static Bible source not found at ${path}`);
          continue;
        }

        const data = await response.json();
        if (normalizedVersion === 'kjv-strongs' && data?.verses && data.verses.length < 30000) {
          console.warn(`Static Bible data from ${path} appears incomplete (${data.verses.length} verses). Trying next fallback.`);
          continue;
        }
        console.log(`Loaded static Bible data from ${path}`);
        return data;
      } catch (error) {
        lastError = error;
        console.warn(`Failed to load Bible data from ${path}:`, error);
      }
    }

    throw lastError ?? new Error(`No static Bible data available for version ${version}`);
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
      const hasZeroChapter = moduleData.verses.some((verse: any) => Number(verse.chapter) === 0);
      const hasZeroVerse = moduleData.verses.some((verse: any) => Number(verse.verse) === 0);
      const chapterOffset = hasZeroChapter ? 1 : 0;
      const verseOffset = hasZeroVerse ? 1 : 0;

      moduleData.verses.forEach((verse: any) => {
        const bookName = verse.book_name;

        if (!books[bookName]) {
          books[bookName] = {
            book: bookName,
            chapters: []
          };
        }

        // Find or create chapter
        const rawChapter = typeof verse.chapter === 'number' ? verse.chapter : parseInt(verse.chapter, 10);
        const rawVerse = typeof verse.verse === 'number' ? verse.verse : parseInt(verse.verse, 10);
        const normalizedChapter = rawChapter + chapterOffset;
        const normalizedVerse = rawVerse + verseOffset;

        let chapter = books[bookName].chapters.find(c => c.chapter === normalizedChapter);
        if (!chapter) {
          chapter = {
            chapter: normalizedChapter,
            name: `${bookName} ${normalizedChapter}`,
            verses: {}
          };
          books[bookName].chapters.push(chapter);
        }

        // Add verse to chapter
        chapter.verses[normalizedVerse.toString()] = {
          chapter: normalizedChapter,
          verse: normalizedVerse,
          name: `${bookName} ${normalizedChapter}:${normalizedVerse}`,
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

  private containsStrongsData(bible: BibleData | null): boolean {
    if (!bible) return false;

    const books = Object.values(bible.books);
    for (const book of books) {
      for (const chapter of book.chapters) {
        for (const verse of Object.values(chapter.verses)) {
          if (verse.text && /\{[HG]\d{1,5}\}/.test(verse.text)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private async loadBibleFromStatic(version: string, requiresStrongs: boolean): Promise<{ bible: BibleData; hasStrongs: boolean } | null> {
    try {
      console.log(`Loading ${version} from static files...`);
      const rawData = await this.loadFromStaticFiles(version);
      const transformed = await this.transformModuleData(rawData, version);
      const hasStrongs = this.containsStrongsData(transformed);

      if (requiresStrongs && !hasStrongs) {
        console.warn(`Static data for ${version} is missing Strong's annotations. Will try module sources.`);
      }

      return { bible: transformed, hasStrongs };
    } catch (error) {
      console.warn(`Static lookup for ${version} failed:`, error);
      throw error;
    }
  }

  private async loadBibleFromModuleSystem(version: string, requiresStrongs: boolean): Promise<{ bible: BibleData; hasStrongs: boolean } | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!this.moduleManager) {
      this.moduleManager = getModuleManager();
    }

    try {
      const moduleVersion = mapVersionForModuleSystem(version);
      const isInstalled = await this.moduleManager.isModuleInstalled(moduleVersion);

      if (!isInstalled) {
        console.log('🔍 [BibleParser] Module not installed:', moduleVersion);
        return null;
      }

      console.log('🔍 [BibleParser] Loading module data for:', moduleVersion);
      const moduleData = await this.moduleManager.getModuleData(moduleVersion);
      if (!moduleData) {
        console.warn('🔍 [BibleParser] Module returned no data:', moduleVersion);
        return null;
      }

      const transformed = await this.transformModuleData(moduleData, version);
      const hasStrongs = this.containsStrongsData(transformed);
      if (requiresStrongs && !hasStrongs) {
        console.warn(`Module data for ${version} is missing Strong's annotations.`);
        return { bible: transformed, hasStrongs: false };
      }

      return { bible: transformed, hasStrongs };
    } catch (error) {
      console.warn('Module system failed while loading', version, error);
      return null;
    }
  }

  // New method to get available Bible versions
  async getAvailableVersions(): Promise<string[]> {
    try {
      if (typeof window !== 'undefined') {
        if (!this.moduleManager) {
          this.moduleManager = getModuleManager();
        }
        const availableModules = await this.moduleManager.getAvailableModules();
        return Object.values(availableModules)
          .filter((module: any) => module.type === 'bible')
          .map((module: any) => module.id);
      }
      return ['kjv-strongs']; // Fallback for SSR
    } catch (error) {
      console.error('Error getting available versions:', error);
      return ['kjv-strongs']; // Fallback to default
    }
  }

  // New method to check if a version is installed
  async isVersionInstalled(version: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        if (!this.moduleManager) {
          this.moduleManager = getModuleManager();
        }
        const normalized = version.replace('_', '-');
        return await this.moduleManager.isModuleInstalled(normalized);
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
          this.moduleManager = getModuleManager();
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
