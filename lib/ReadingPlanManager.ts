export interface DailyReading {
  date: Date;
  psalm: number;
  proverbs: number[];
  isToday: boolean;
  isCompleted?: boolean;
}

export interface ReadingProgress {
  date: string;
  psalmCompleted: boolean;
  proverbsCompleted: boolean;
  timestamp: number;
}

export class ReadingPlanManager {
  private static DB_NAME = 'BibleReadingPlan';
  private static DB_VERSION = 1;
  private static PROGRESS_STORE = 'reading_progress';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(ReadingPlanManager.DB_NAME, ReadingPlanManager.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create reading progress store
        if (!db.objectStoreNames.contains(ReadingPlanManager.PROGRESS_STORE)) {
          const store = db.createObjectStore(ReadingPlanManager.PROGRESS_STORE, {
            keyPath: 'date'
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Calculate which Psalm to read based on a 150-day cycle
   */
  calculatePsalm(date: Date, startingPsalm: number = 1, planStartDate: Date = new Date()): number {
    const daysSincePlanStart = Math.floor((date.getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24));
    return ((daysSincePlanStart + startingPsalm - 1) % 150) + 1;
  }

  /**
   * Calculate which Proverbs chapter(s) to read based on the day of month
   * Handles months with fewer than 31 days by distributing extra chapters
   */
  calculateProverbs(date: Date): number[] {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // For months with 31 days, simple 1:1 mapping
    if (daysInMonth === 31) {
      return [day];
    }

    // For months with fewer days, distribute the extra chapters
    if (daysInMonth === 30) {
      // Day 30 gets Proverbs 30 and 31
      if (day === 30) return [30, 31];
      return [day];
    }

    if (daysInMonth === 29) {
      // Days 28-29 get extra chapters
      if (day === 28) return [28, 30];
      if (day === 29) return [29, 31];
      return [day];
    }

    if (daysInMonth === 28) {
      // Days 26-28 get extra chapters
      if (day === 26) return [26, 29];
      if (day === 27) return [27, 30];
      if (day === 28) return [28, 31];
      return [day];
    }

    return [day];
  }

  /**
   * Generate reading schedule for a given number of days
   */
  generateSchedule(
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
      
      schedule.push({
        date,
        psalm: this.calculatePsalm(date, startingPsalm, planStartDate),
        proverbs: this.calculateProverbs(date),
        isToday: dateOnly.getTime() === today.getTime()
      });
    }

    return schedule;
  }

  /**
   * Mark a reading as complete
   */
  async markAsRead(date: string, type: 'psalm' | 'proverbs' | 'both'): Promise<void> {
    if (!this.db) await this.init();

    const existing = await this.getProgress(date);
    const progress: ReadingProgress = existing || {
      date,
      psalmCompleted: false,
      proverbsCompleted: false,
      timestamp: Date.now()
    };

    if (type === 'psalm' || type === 'both') {
      progress.psalmCompleted = true;
    }
    if (type === 'proverbs' || type === 'both') {
      progress.proverbsCompleted = true;
    }
    progress.timestamp = Date.now();

    const transaction = this.db!.transaction([ReadingPlanManager.PROGRESS_STORE], 'readwrite');
    const store = transaction.objectStore(ReadingPlanManager.PROGRESS_STORE);
    await store.put(progress);
  }

  /**
   * Mark a reading as incomplete
   */
  async markAsUnread(date: string, type: 'psalm' | 'proverbs' | 'both'): Promise<void> {
    if (!this.db) await this.init();

    const existing = await this.getProgress(date);
    if (!existing) return;

    if (type === 'psalm' || type === 'both') {
      existing.psalmCompleted = false;
    }
    if (type === 'proverbs' || type === 'both') {
      existing.proverbsCompleted = false;
    }

    // If both are now false, delete the record
    if (!existing.psalmCompleted && !existing.proverbsCompleted) {
      const transaction = this.db!.transaction([ReadingPlanManager.PROGRESS_STORE], 'readwrite');
      const store = transaction.objectStore(ReadingPlanManager.PROGRESS_STORE);
      await store.delete(date);
    } else {
      const transaction = this.db!.transaction([ReadingPlanManager.PROGRESS_STORE], 'readwrite');
      const store = transaction.objectStore(ReadingPlanManager.PROGRESS_STORE);
      await store.put(existing);
    }
  }

  /**
   * Get progress for a specific date
   */
  async getProgress(date: string): Promise<ReadingProgress | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ReadingPlanManager.PROGRESS_STORE], 'readonly');
      const store = transaction.objectStore(ReadingPlanManager.PROGRESS_STORE);
      const request = store.get(date);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all progress records
   */
  async getAllProgress(): Promise<ReadingProgress[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ReadingPlanManager.PROGRESS_STORE], 'readonly');
      const store = transaction.objectStore(ReadingPlanManager.PROGRESS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Calculate reading streak
   */
  async getReadingStreak(): Promise<{ current: number; longest: number }> {
    const allProgress = await this.getAllProgress();
    if (allProgress.length === 0) return { current: 0, longest: 0 };

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

      // Check if both readings are complete
      if (progress.psalmCompleted && progress.proverbsCompleted) {
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
    }

    return { current: currentStreak, longest: longestStreak };
  }

  /**
   * Get reading statistics
   */
  async getStatistics(): Promise<{
    totalDaysRead: number;
    psalmsRead: number;
    proverbsRead: number;
    completionRate: number;
    currentStreak: number;
    longestStreak: number;
  }> {
    const allProgress = await this.getAllProgress();
    const streak = await this.getReadingStreak();

    const psalmsRead = allProgress.filter(p => p.psalmCompleted).length;
    const proverbsRead = allProgress.filter(p => p.proverbsCompleted).length;
    const totalDaysRead = allProgress.filter(p => p.psalmCompleted && p.proverbsCompleted).length;

    // Calculate completion rate for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentProgress = allProgress.filter(p => {
      const date = new Date(p.date);
      return date >= thirtyDaysAgo;
    });

    const completionRate = recentProgress.length > 0
      ? (recentProgress.filter(p => p.psalmCompleted && p.proverbsCompleted).length / 30) * 100
      : 0;

    return {
      totalDaysRead,
      psalmsRead,
      proverbsRead,
      completionRate: Math.round(completionRate),
      currentStreak: streak.current,
      longestStreak: streak.longest
    };
  }
}