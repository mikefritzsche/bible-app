export interface BibleBook {
  name: string;
  chapters: number;
  testament: 'OT' | 'NT';
  order: number; // For chronological ordering
  chronologicalOrder?: number; // Optional different order for chronological reading
}

export const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament
  { name: 'Genesis', chapters: 50, testament: 'OT', order: 1, chronologicalOrder: 1 },
  { name: 'Exodus', chapters: 40, testament: 'OT', order: 2, chronologicalOrder: 2 },
  { name: 'Leviticus', chapters: 27, testament: 'OT', order: 3, chronologicalOrder: 3 },
  { name: 'Numbers', chapters: 36, testament: 'OT', order: 4, chronologicalOrder: 4 },
  { name: 'Deuteronomy', chapters: 34, testament: 'OT', order: 5, chronologicalOrder: 5 },
  { name: 'Joshua', chapters: 24, testament: 'OT', order: 6, chronologicalOrder: 6 },
  { name: 'Judges', chapters: 21, testament: 'OT', order: 7, chronologicalOrder: 7 },
  { name: 'Ruth', chapters: 4, testament: 'OT', order: 8, chronologicalOrder: 8 },
  { name: '1 Samuel', chapters: 31, testament: 'OT', order: 9, chronologicalOrder: 9 },
  { name: '2 Samuel', chapters: 24, testament: 'OT', order: 10, chronologicalOrder: 10 },
  { name: '1 Kings', chapters: 22, testament: 'OT', order: 11, chronologicalOrder: 11 },
  { name: '2 Kings', chapters: 25, testament: 'OT', order: 12, chronologicalOrder: 12 },
  { name: '1 Chronicles', chapters: 29, testament: 'OT', order: 13, chronologicalOrder: 13 },
  { name: '2 Chronicles', chapters: 36, testament: 'OT', order: 14, chronologicalOrder: 14 },
  { name: 'Ezra', chapters: 10, testament: 'OT', order: 15, chronologicalOrder: 15 },
  { name: 'Nehemiah', chapters: 13, testament: 'OT', order: 16, chronologicalOrder: 16 },
  { name: 'Esther', chapters: 10, testament: 'OT', order: 17, chronologicalOrder: 17 },
  { name: 'Job', chapters: 42, testament: 'OT', order: 18, chronologicalOrder: 1.5 }, // During patriarchal period
  { name: 'Psalms', chapters: 150, testament: 'OT', order: 19, chronologicalOrder: 11.5 }, // During David's reign
  { name: 'Proverbs', chapters: 31, testament: 'OT', order: 20, chronologicalOrder: 11.6 },
  { name: 'Ecclesiastes', chapters: 12, testament: 'OT', order: 21, chronologicalOrder: 11.7 },
  { name: 'Song of Solomon', chapters: 8, testament: 'OT', order: 22, chronologicalOrder: 11.8 },
  { name: 'Isaiah', chapters: 66, testament: 'OT', order: 23, chronologicalOrder: 18 },
  { name: 'Jeremiah', chapters: 52, testament: 'OT', order: 24, chronologicalOrder: 19 },
  { name: 'Lamentations', chapters: 5, testament: 'OT', order: 25, chronologicalOrder: 20 },
  { name: 'Ezekiel', chapters: 48, testament: 'OT', order: 26, chronologicalOrder: 21 },
  { name: 'Daniel', chapters: 12, testament: 'OT', order: 27, chronologicalOrder: 22 },
  { name: 'Hosea', chapters: 14, testament: 'OT', order: 28, chronologicalOrder: 23 },
  { name: 'Joel', chapters: 3, testament: 'OT', order: 29, chronologicalOrder: 24 },
  { name: 'Amos', chapters: 9, testament: 'OT', order: 30, chronologicalOrder: 25 },
  { name: 'Obadiah', chapters: 1, testament: 'OT', order: 31, chronologicalOrder: 26 },
  { name: 'Jonah', chapters: 4, testament: 'OT', order: 32, chronologicalOrder: 27 },
  { name: 'Micah', chapters: 7, testament: 'OT', order: 33, chronologicalOrder: 28 },
  { name: 'Nahum', chapters: 3, testament: 'OT', order: 34, chronologicalOrder: 29 },
  { name: 'Habakkuk', chapters: 3, testament: 'OT', order: 35, chronologicalOrder: 30 },
  { name: 'Zephaniah', chapters: 3, testament: 'OT', order: 36, chronologicalOrder: 31 },
  { name: 'Haggai', chapters: 2, testament: 'OT', order: 37, chronologicalOrder: 32 },
  { name: 'Zechariah', chapters: 14, testament: 'OT', order: 38, chronologicalOrder: 33 },
  { name: 'Malachi', chapters: 4, testament: 'OT', order: 39, chronologicalOrder: 34 },
  
  // New Testament
  { name: 'Matthew', chapters: 28, testament: 'NT', order: 40, chronologicalOrder: 40 },
  { name: 'Mark', chapters: 16, testament: 'NT', order: 41, chronologicalOrder: 41 },
  { name: 'Luke', chapters: 24, testament: 'NT', order: 42, chronologicalOrder: 42 },
  { name: 'John', chapters: 21, testament: 'NT', order: 43, chronologicalOrder: 43 },
  { name: 'Acts', chapters: 28, testament: 'NT', order: 44, chronologicalOrder: 44 },
  { name: 'Romans', chapters: 16, testament: 'NT', order: 45, chronologicalOrder: 45 },
  { name: '1 Corinthians', chapters: 16, testament: 'NT', order: 46, chronologicalOrder: 46 },
  { name: '2 Corinthians', chapters: 13, testament: 'NT', order: 47, chronologicalOrder: 47 },
  { name: 'Galatians', chapters: 6, testament: 'NT', order: 48, chronologicalOrder: 48 },
  { name: 'Ephesians', chapters: 6, testament: 'NT', order: 49, chronologicalOrder: 49 },
  { name: 'Philippians', chapters: 4, testament: 'NT', order: 50, chronologicalOrder: 50 },
  { name: 'Colossians', chapters: 4, testament: 'NT', order: 51, chronologicalOrder: 51 },
  { name: '1 Thessalonians', chapters: 5, testament: 'NT', order: 52, chronologicalOrder: 52 },
  { name: '2 Thessalonians', chapters: 3, testament: 'NT', order: 53, chronologicalOrder: 53 },
  { name: '1 Timothy', chapters: 6, testament: 'NT', order: 54, chronologicalOrder: 54 },
  { name: '2 Timothy', chapters: 4, testament: 'NT', order: 55, chronologicalOrder: 55 },
  { name: 'Titus', chapters: 3, testament: 'NT', order: 56, chronologicalOrder: 56 },
  { name: 'Philemon', chapters: 1, testament: 'NT', order: 57, chronologicalOrder: 57 },
  { name: 'Hebrews', chapters: 13, testament: 'NT', order: 58, chronologicalOrder: 58 },
  { name: 'James', chapters: 5, testament: 'NT', order: 59, chronologicalOrder: 35 }, // Early epistle
  { name: '1 Peter', chapters: 5, testament: 'NT', order: 60, chronologicalOrder: 60 },
  { name: '2 Peter', chapters: 3, testament: 'NT', order: 61, chronologicalOrder: 61 },
  { name: '1 John', chapters: 5, testament: 'NT', order: 62, chronologicalOrder: 62 },
  { name: '2 John', chapters: 1, testament: 'NT', order: 63, chronologicalOrder: 63 },
  { name: '3 John', chapters: 1, testament: 'NT', order: 64, chronologicalOrder: 64 },
  { name: 'Jude', chapters: 1, testament: 'NT', order: 65, chronologicalOrder: 65 },
  { name: 'Revelation', chapters: 22, testament: 'NT', order: 66, chronologicalOrder: 66 }
];

export type ReadingPlanType = 
  | 'psalms-proverbs' 
  | 'bible-in-year' 
  | 'chronological' 
  | 'nt-90-days' 
  | 'gospels-daily'
  | 'ot-nt-psalms'
  | 'mcheyne'
  | 'bible-in-90';

export interface ReadingPlanInfo {
  id: ReadingPlanType;
  name: string;
  description: string;
  duration: number; // in days
  dailyTime: string; // estimated reading time
  category: 'devotional' | 'comprehensive' | 'focused';
}

export const READING_PLANS: ReadingPlanInfo[] = [
  {
    id: 'psalms-proverbs',
    name: 'Psalms & Proverbs',
    description: 'Read through Psalms in 150 days and Proverbs monthly',
    duration: 365,
    dailyTime: '10-15 min',
    category: 'devotional'
  },
  {
    id: 'bible-in-year',
    name: 'Bible in a Year',
    description: 'Read the entire Bible in one year with 3-4 chapters daily',
    duration: 365,
    dailyTime: '15-20 min',
    category: 'comprehensive'
  },
  {
    id: 'chronological',
    name: 'Chronological Bible',
    description: 'Read the Bible in the order events occurred historically',
    duration: 365,
    dailyTime: '15-20 min',
    category: 'comprehensive'
  },
  {
    id: 'nt-90-days',
    name: 'New Testament in 90 Days',
    description: 'Read through the entire New Testament in 90 days',
    duration: 90,
    dailyTime: '15 min',
    category: 'focused'
  },
  {
    id: 'gospels-daily',
    name: 'Daily Gospels',
    description: 'Read one Gospel chapter each day, rotating through Matthew, Mark, Luke, and John',
    duration: 89,
    dailyTime: '5-10 min',
    category: 'devotional'
  },
  {
    id: 'ot-nt-psalms',
    name: 'OT/NT/Psalms Daily',
    description: 'Read from Old Testament, New Testament, and Psalms each day',
    duration: 365,
    dailyTime: '20-25 min',
    category: 'comprehensive'
  },
  {
    id: 'mcheyne',
    name: "M'Cheyne Reading Plan",
    description: 'Robert Murray M\'Cheyne\'s plan: Read the OT once and NT/Psalms twice per year',
    duration: 365,
    dailyTime: '30 min',
    category: 'comprehensive'
  },
  {
    id: 'bible-in-90',
    name: 'Bible in 90 Days',
    description: 'Intensive reading plan to complete the entire Bible in 90 days',
    duration: 90,
    dailyTime: '45-60 min',
    category: 'comprehensive'
  }
];

export interface DailyReading {
  date: Date;
  readings: ReadingItem[];
  isToday: boolean;
  isCompleted?: boolean;
  planId: ReadingPlanType;
}

export interface ReadingItem {
  book: string;
  chapters: number[];
  type?: 'psalm' | 'proverb' | 'ot' | 'nt' | 'gospel';
}

export interface ReadingProgress {
  date: string;
  planId: ReadingPlanType;
  completedReadings: string[]; // Array of "Book Chapter" strings e.g. ["Genesis 1", "Matthew 1"]
  timestamp: number;
}

export class EnhancedReadingPlanManager {
  private static DB_NAME = 'BibleReadingPlanEnhanced';
  private static DB_VERSION = 1;
  private static PROGRESS_STORE = 'reading_progress';
  private static PREFERENCES_STORE = 'plan_preferences';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(EnhancedReadingPlanManager.DB_NAME, EnhancedReadingPlanManager.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create reading progress store
        if (!db.objectStoreNames.contains(EnhancedReadingPlanManager.PROGRESS_STORE)) {
          const store = db.createObjectStore(EnhancedReadingPlanManager.PROGRESS_STORE, {
            keyPath: ['date', 'planId']
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('planId', 'planId', { unique: false });
        }

        // Create preferences store
        if (!db.objectStoreNames.contains(EnhancedReadingPlanManager.PREFERENCES_STORE)) {
          db.createObjectStore(EnhancedReadingPlanManager.PREFERENCES_STORE, {
            keyPath: 'planId'
          });
        }
      };
    });
  }

  /**
   * Generate reading schedule for Bible in a Year plan
   */
  private generateBibleInYearSchedule(startDate: Date, days: number): DailyReading[] {
    const schedule: DailyReading[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const totalChapters = BIBLE_BOOKS.reduce((sum, book) => sum + book.chapters, 0); // 1189 chapters
    const chaptersPerDay = Math.ceil(totalChapters / 365);
    
    let currentBookIndex = 0;
    let currentChapter = 1;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      
      const readings: ReadingItem[] = [];
      let chaptersToRead = chaptersPerDay;
      
      while (chaptersToRead > 0 && currentBookIndex < BIBLE_BOOKS.length) {
        const currentBook = BIBLE_BOOKS[currentBookIndex];
        const chaptersInBook = currentBook.chapters - currentChapter + 1;
        const chaptersFromThisBook = Math.min(chaptersToRead, chaptersInBook);
        
        readings.push({
          book: currentBook.name,
          chapters: Array.from(
            { length: chaptersFromThisBook }, 
            (_, idx) => currentChapter + idx
          ),
          type: currentBook.testament === 'OT' ? 'ot' : 'nt'
        });
        
        currentChapter += chaptersFromThisBook;
        chaptersToRead -= chaptersFromThisBook;
        
        if (currentChapter > currentBook.chapters) {
          currentBookIndex++;
          currentChapter = 1;
        }
      }
      
      schedule.push({
        date,
        readings,
        isToday: dateOnly.getTime() === today.getTime(),
        planId: 'bible-in-year'
      });
    }
    
    return schedule;
  }

  /**
   * Generate reading schedule for Chronological Bible plan
   */
  private generateChronologicalSchedule(startDate: Date, days: number): DailyReading[] {
    const schedule: DailyReading[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Sort books by chronological order
    const chronologicalBooks = [...BIBLE_BOOKS].sort((a, b) => 
      (a.chronologicalOrder || a.order) - (b.chronologicalOrder || b.order)
    );
    
    const totalChapters = chronologicalBooks.reduce((sum, book) => sum + book.chapters, 0);
    const chaptersPerDay = Math.ceil(totalChapters / 365);
    
    let currentBookIndex = 0;
    let currentChapter = 1;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      
      const readings: ReadingItem[] = [];
      let chaptersToRead = chaptersPerDay;
      
      while (chaptersToRead > 0 && currentBookIndex < chronologicalBooks.length) {
        const currentBook = chronologicalBooks[currentBookIndex];
        const chaptersInBook = currentBook.chapters - currentChapter + 1;
        const chaptersFromThisBook = Math.min(chaptersToRead, chaptersInBook);
        
        readings.push({
          book: currentBook.name,
          chapters: Array.from(
            { length: chaptersFromThisBook }, 
            (_, idx) => currentChapter + idx
          ),
          type: currentBook.testament === 'OT' ? 'ot' : 'nt'
        });
        
        currentChapter += chaptersFromThisBook;
        chaptersToRead -= chaptersFromThisBook;
        
        if (currentChapter > currentBook.chapters) {
          currentBookIndex++;
          currentChapter = 1;
        }
      }
      
      schedule.push({
        date,
        readings,
        isToday: dateOnly.getTime() === today.getTime(),
        planId: 'chronological'
      });
    }
    
    return schedule;
  }

  /**
   * Generate reading schedule for New Testament in 90 Days
   */
  private generateNT90DaysSchedule(startDate: Date, days: number): DailyReading[] {
    const schedule: DailyReading[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const ntBooks = BIBLE_BOOKS.filter(book => book.testament === 'NT');
    const totalChapters = ntBooks.reduce((sum, book) => sum + book.chapters, 0); // 260 chapters
    const chaptersPerDay = Math.ceil(totalChapters / 90);
    
    let currentBookIndex = 0;
    let currentChapter = 1;
    
    for (let i = 0; i < Math.min(days, 90); i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      
      const readings: ReadingItem[] = [];
      let chaptersToRead = chaptersPerDay;
      
      while (chaptersToRead > 0 && currentBookIndex < ntBooks.length) {
        const currentBook = ntBooks[currentBookIndex];
        const chaptersInBook = currentBook.chapters - currentChapter + 1;
        const chaptersFromThisBook = Math.min(chaptersToRead, chaptersInBook);
        
        readings.push({
          book: currentBook.name,
          chapters: Array.from(
            { length: chaptersFromThisBook }, 
            (_, idx) => currentChapter + idx
          ),
          type: 'nt'
        });
        
        currentChapter += chaptersFromThisBook;
        chaptersToRead -= chaptersFromThisBook;
        
        if (currentChapter > currentBook.chapters) {
          currentBookIndex++;
          currentChapter = 1;
        }
      }
      
      schedule.push({
        date,
        readings,
        isToday: dateOnly.getTime() === today.getTime(),
        planId: 'nt-90-days'
      });
    }
    
    return schedule;
  }

  /**
   * Generate reading schedule for Daily Gospels rotation
   */
  private generateGospelsSchedule(startDate: Date, days: number): DailyReading[] {
    const schedule: DailyReading[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const gospels = ['Matthew', 'Mark', 'Luke', 'John'];
    const gospelBooks = BIBLE_BOOKS.filter(book => gospels.includes(book.name));
    
    let currentGospelIndex = 0;
    let currentChapter = 1;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      
      const currentGospel = gospelBooks[currentGospelIndex];
      
      schedule.push({
        date,
        readings: [{
          book: currentGospel.name,
          chapters: [currentChapter],
          type: 'gospel'
        }],
        isToday: dateOnly.getTime() === today.getTime(),
        planId: 'gospels-daily'
      });
      
      currentChapter++;
      if (currentChapter > currentGospel.chapters) {
        currentGospelIndex = (currentGospelIndex + 1) % gospelBooks.length;
        currentChapter = 1;
      }
    }
    
    return schedule;
  }

  /**
   * Generate reading schedule for OT/NT/Psalms daily plan
   */
  private generateOTNTPsalmsSchedule(startDate: Date, days: number): DailyReading[] {
    const schedule: DailyReading[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const otBooks = BIBLE_BOOKS.filter(book => book.testament === 'OT' && book.name !== 'Psalms');
    const ntBooks = BIBLE_BOOKS.filter(book => book.testament === 'NT');
    const psalms = BIBLE_BOOKS.find(book => book.name === 'Psalms')!;
    
    // Calculate chapters per day for each section
    const otChaptersPerDay = Math.ceil(otBooks.reduce((sum, b) => sum + b.chapters, 0) / 365);
    const ntChaptersPerDay = Math.ceil(ntBooks.reduce((sum, b) => sum + b.chapters, 0) / 365);
    
    let otBookIndex = 0, otChapter = 1;
    let ntBookIndex = 0, ntChapter = 1;
    let psalmNumber = 1;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      
      const readings: ReadingItem[] = [];
      
      // Add OT reading
      if (otBookIndex < otBooks.length) {
        const otBook = otBooks[otBookIndex];
        const chaptersAvailable = otBook.chapters - otChapter + 1;
        const chaptersToRead = Math.min(otChaptersPerDay, chaptersAvailable);
        
        readings.push({
          book: otBook.name,
          chapters: Array.from({ length: chaptersToRead }, (_, idx) => otChapter + idx),
          type: 'ot'
        });
        
        otChapter += chaptersToRead;
        if (otChapter > otBook.chapters) {
          otBookIndex++;
          otChapter = 1;
        }
      }
      
      // Add NT reading
      if (ntBookIndex < ntBooks.length) {
        const ntBook = ntBooks[ntBookIndex];
        const chaptersAvailable = ntBook.chapters - ntChapter + 1;
        const chaptersToRead = Math.min(ntChaptersPerDay, chaptersAvailable);
        
        readings.push({
          book: ntBook.name,
          chapters: Array.from({ length: chaptersToRead }, (_, idx) => ntChapter + idx),
          type: 'nt'
        });
        
        ntChapter += chaptersToRead;
        if (ntChapter > ntBook.chapters) {
          ntBookIndex++;
          ntChapter = 1;
        }
      }
      
      // Add Psalm
      readings.push({
        book: 'Psalms',
        chapters: [psalmNumber],
        type: 'psalm'
      });
      
      psalmNumber = (psalmNumber % 150) + 1;
      
      schedule.push({
        date,
        readings,
        isToday: dateOnly.getTime() === today.getTime(),
        planId: 'ot-nt-psalms'
      });
    }
    
    return schedule;
  }

  /**
   * Generate reading schedule for M'Cheyne plan
   */
  private generateMCheyneSchedule(startDate: Date, days: number): DailyReading[] {
    const schedule: DailyReading[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // M'Cheyne plan has 4 readings per day:
    // 1. OT (once through in a year)
    // 2. NT (twice through in a year) - first pass
    // 3. Psalms (twice through in a year)
    // 4. NT (twice through in a year) - second pass
    
    const otBooks = BIBLE_BOOKS.filter(book => book.testament === 'OT' && book.name !== 'Psalms');
    const ntBooks = BIBLE_BOOKS.filter(book => book.testament === 'NT');
    const psalms = BIBLE_BOOKS.find(book => book.name === 'Psalms')!;
    
    let otBookIndex = 0, otChapter = 1;
    let nt1BookIndex = 0, nt1Chapter = 1;
    let nt2BookIndex = 0, nt2Chapter = 1;
    let psalmNumber = 1;
    
    const otChaptersPerDay = Math.ceil(otBooks.reduce((sum, b) => sum + b.chapters, 0) / 365);
    const ntChaptersPerDay = Math.ceil(ntBooks.reduce((sum, b) => sum + b.chapters, 0) / 183); // Twice in a year
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      
      const readings: ReadingItem[] = [];
      
      // Add OT reading
      if (otBookIndex < otBooks.length) {
        const otBook = otBooks[otBookIndex];
        readings.push({
          book: otBook.name,
          chapters: [otChapter],
          type: 'ot'
        });
        otChapter++;
        if (otChapter > otBook.chapters) {
          otBookIndex++;
          otChapter = 1;
        }
      }
      
      // Add first NT reading
      const nt1Book = ntBooks[nt1BookIndex % ntBooks.length];
      readings.push({
        book: nt1Book.name,
        chapters: [nt1Chapter],
        type: 'nt'
      });
      nt1Chapter++;
      if (nt1Chapter > nt1Book.chapters) {
        nt1BookIndex++;
        nt1Chapter = 1;
      }
      
      // Add Psalms
      readings.push({
        book: 'Psalms',
        chapters: [psalmNumber],
        type: 'psalm'
      });
      psalmNumber++;
      if (psalmNumber > 150) {
        psalmNumber = 1;
      }
      
      // Add second NT reading (offset by half the NT)
      const nt2Book = ntBooks[nt2BookIndex % ntBooks.length];
      readings.push({
        book: nt2Book.name,
        chapters: [nt2Chapter],
        type: 'nt'
      });
      nt2Chapter++;
      if (nt2Chapter > nt2Book.chapters) {
        nt2BookIndex++;
        nt2Chapter = 1;
      }
      
      schedule.push({
        date,
        readings,
        isToday: dateOnly.getTime() === today.getTime(),
        planId: 'mcheyne'
      });
    }
    
    return schedule;
  }

  /**
   * Generate reading schedule for Bible in 90 Days intensive plan
   */
  private generateBibleIn90Schedule(startDate: Date, days: number): DailyReading[] {
    const schedule: DailyReading[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const totalChapters = BIBLE_BOOKS.reduce((sum, book) => sum + book.chapters, 0);
    const chaptersPerDay = Math.ceil(totalChapters / 90); // About 13 chapters per day
    
    let currentBookIndex = 0;
    let currentChapter = 1;
    
    for (let i = 0; i < Math.min(days, 90); i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      
      const readings: ReadingItem[] = [];
      let chaptersToRead = chaptersPerDay;
      
      while (chaptersToRead > 0 && currentBookIndex < BIBLE_BOOKS.length) {
        const currentBook = BIBLE_BOOKS[currentBookIndex];
        const chaptersInBook = currentBook.chapters - currentChapter + 1;
        const chaptersFromThisBook = Math.min(chaptersToRead, chaptersInBook);
        
        readings.push({
          book: currentBook.name,
          chapters: Array.from(
            { length: chaptersFromThisBook }, 
            (_, idx) => currentChapter + idx
          ),
          type: currentBook.testament === 'OT' ? 'ot' : 'nt'
        });
        
        currentChapter += chaptersFromThisBook;
        chaptersToRead -= chaptersFromThisBook;
        
        if (currentChapter > currentBook.chapters) {
          currentBookIndex++;
          currentChapter = 1;
        }
      }
      
      schedule.push({
        date,
        readings,
        isToday: dateOnly.getTime() === today.getTime(),
        planId: 'bible-in-90'
      });
    }
    
    return schedule;
  }

  /**
   * Generate reading schedule for Psalms & Proverbs plan
   */
  private generatePsalmsProverbsSchedule(
    startDate: Date, 
    days: number,
    startingPsalm: number = 1,
    planStartDate: Date = new Date()
  ): DailyReading[] {
    const schedule: DailyReading[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      
      // Calculate Psalm (150-day cycle)
      const daysSincePlanStart = Math.floor((date.getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24));
      const psalmNumber = ((daysSincePlanStart + startingPsalm - 1) % 150) + 1;
      
      // Calculate Proverbs (based on day of month)
      const day = date.getDate();
      const month = date.getMonth();
      const year = date.getFullYear();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      let proverbsChapters: number[] = [];
      if (daysInMonth === 31) {
        proverbsChapters = [day];
      } else if (daysInMonth === 30) {
        if (day === 30) proverbsChapters = [30, 31];
        else proverbsChapters = [day];
      } else if (daysInMonth === 29) {
        if (day === 28) proverbsChapters = [28, 30];
        else if (day === 29) proverbsChapters = [29, 31];
        else proverbsChapters = [day];
      } else if (daysInMonth === 28) {
        if (day === 26) proverbsChapters = [26, 29];
        else if (day === 27) proverbsChapters = [27, 30];
        else if (day === 28) proverbsChapters = [28, 31];
        else proverbsChapters = [day];
      }
      
      schedule.push({
        date,
        readings: [
          { book: 'Psalms', chapters: [psalmNumber], type: 'psalm' },
          { book: 'Proverbs', chapters: proverbsChapters, type: 'proverb' }
        ],
        isToday: dateOnly.getTime() === today.getTime(),
        planId: 'psalms-proverbs'
      });
    }
    
    return schedule;
  }

  /**
   * Generate schedule for any reading plan
   */
  generateSchedule(
    planId: ReadingPlanType,
    startDate: Date,
    days: number,
    options?: {
      startingPsalm?: number;
      planStartDate?: Date;
    }
  ): DailyReading[] {
    switch (planId) {
      case 'psalms-proverbs':
        return this.generatePsalmsProverbsSchedule(
          startDate, 
          days, 
          options?.startingPsalm, 
          options?.planStartDate
        );
      case 'bible-in-year':
        return this.generateBibleInYearSchedule(startDate, days);
      case 'chronological':
        return this.generateChronologicalSchedule(startDate, days);
      case 'nt-90-days':
        return this.generateNT90DaysSchedule(startDate, days);
      case 'gospels-daily':
        return this.generateGospelsSchedule(startDate, days);
      case 'ot-nt-psalms':
        return this.generateOTNTPsalmsSchedule(startDate, days);
      case 'mcheyne':
        return this.generateMCheyneSchedule(startDate, days);
      case 'bible-in-90':
        return this.generateBibleIn90Schedule(startDate, days);
      default:
        return [];
    }
  }

  /**
   * Mark readings as complete
   */
  async markAsRead(
    date: string,
    planId: ReadingPlanType,
    readings: string[]
  ): Promise<void> {
    if (!this.db) await this.init();

    const existing = await this.getProgress(date, planId);
    const progress: ReadingProgress = existing || {
      date,
      planId,
      completedReadings: [],
      timestamp: Date.now()
    };

    // Add new readings to completed list (avoid duplicates)
    readings.forEach(reading => {
      if (!progress.completedReadings.includes(reading)) {
        progress.completedReadings.push(reading);
      }
    });
    progress.timestamp = Date.now();

    const transaction = this.db!.transaction([EnhancedReadingPlanManager.PROGRESS_STORE], 'readwrite');
    const store = transaction.objectStore(EnhancedReadingPlanManager.PROGRESS_STORE);
    await store.put(progress);
  }

  /**
   * Mark readings as incomplete
   */
  async markAsUnread(
    date: string,
    planId: ReadingPlanType,
    readings: string[]
  ): Promise<void> {
    if (!this.db) await this.init();

    const existing = await this.getProgress(date, planId);
    if (!existing) return;

    // Remove specified readings from completed list
    existing.completedReadings = existing.completedReadings.filter(
      r => !readings.includes(r)
    );

    if (existing.completedReadings.length === 0) {
      // If no readings are complete, delete the record
      const transaction = this.db!.transaction([EnhancedReadingPlanManager.PROGRESS_STORE], 'readwrite');
      const store = transaction.objectStore(EnhancedReadingPlanManager.PROGRESS_STORE);
      await store.delete([date, planId]);
    } else {
      // Otherwise update the record
      const transaction = this.db!.transaction([EnhancedReadingPlanManager.PROGRESS_STORE], 'readwrite');
      const store = transaction.objectStore(EnhancedReadingPlanManager.PROGRESS_STORE);
      await store.put(existing);
    }
  }

  /**
   * Get progress for a specific date and plan
   */
  async getProgress(date: string, planId: ReadingPlanType): Promise<ReadingProgress | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EnhancedReadingPlanManager.PROGRESS_STORE], 'readonly');
      const store = transaction.objectStore(EnhancedReadingPlanManager.PROGRESS_STORE);
      const request = store.get([date, planId]);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all progress for a specific plan
   */
  async getPlanProgress(planId: ReadingPlanType): Promise<ReadingProgress[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EnhancedReadingPlanManager.PROGRESS_STORE], 'readonly');
      const store = transaction.objectStore(EnhancedReadingPlanManager.PROGRESS_STORE);
      const index = store.index('planId');
      const request = index.getAll(planId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Calculate reading statistics for a plan
   */
  async getStatistics(planId: ReadingPlanType): Promise<{
    totalDaysRead: number;
    completionRate: number;
    currentStreak: number;
    longestStreak: number;
    percentComplete: number;
  }> {
    const allProgress = await this.getPlanProgress(planId);
    if (allProgress.length === 0) {
      return {
        totalDaysRead: 0,
        completionRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        percentComplete: 0
      };
    }

    // Sort by date
    allProgress.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const progress of allProgress) {
      const date = new Date(progress.date);
      date.setHours(0, 0, 0, 0);

      if (lastDate) {
        const dayDiff = Math.floor((date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }

      longestStreak = Math.max(longestStreak, tempStreak);
      lastDate = date;

      // Check if this streak includes today or yesterday
      const daysSinceLastRead = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastRead <= 1) {
        currentStreak = tempStreak;
      }
    }

    // Calculate completion rate for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentProgress = allProgress.filter(p => {
      const date = new Date(p.date);
      return date >= thirtyDaysAgo;
    });

    const completionRate = recentProgress.length > 0
      ? (recentProgress.length / 30) * 100
      : 0;

    // Calculate percent complete based on plan duration
    const planInfo = READING_PLANS.find(p => p.id === planId);
    const percentComplete = planInfo
      ? (allProgress.length / planInfo.duration) * 100
      : 0;

    return {
      totalDaysRead: allProgress.length,
      completionRate: Math.round(completionRate),
      currentStreak,
      longestStreak,
      percentComplete: Math.min(100, Math.round(percentComplete))
    };
  }

  /**
   * Save plan preferences
   */
  async savePlanPreferences(planId: ReadingPlanType, preferences: any): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction([EnhancedReadingPlanManager.PREFERENCES_STORE], 'readwrite');
    const store = transaction.objectStore(EnhancedReadingPlanManager.PREFERENCES_STORE);
    await store.put({ planId, ...preferences });
  }

  /**
   * Get plan preferences
   */
  async getPlanPreferences(planId: ReadingPlanType): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EnhancedReadingPlanManager.PREFERENCES_STORE], 'readonly');
      const store = transaction.objectStore(EnhancedReadingPlanManager.PREFERENCES_STORE);
      const request = store.get(planId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
}