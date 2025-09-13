import type { StrongsDefinition } from '@/types/bible';

interface RawStrongsEntry {
  id: number;
  number: string;
  root_word?: string;
  transliteration?: string;
  pronunciation?: string;
  entry?: string;
  tvm?: string;
}

export class StrongsManager {
  private definitions: Record<string, StrongsDefinition> | null = null;
  public loaded: boolean = false;

  async loadDefinitions(): Promise<void> {
    if (this.loaded && this.definitions) {
      return;
    }

    try {
      // Load from file - browser will cache this automatically via HTTP caching
      const response = await fetch('/bibles/extras/strongs_definitions.json');
      if (!response.ok) {
        throw new Error(`Failed to load Strong's definitions: ${response.status}`);
      }

      const rawData = await response.json() as RawStrongsEntry[];

      // Convert array to keyed object
      if (Array.isArray(rawData)) {
        this.definitions = {};
        rawData.forEach((entry: RawStrongsEntry) => {
          if (entry.number) {
            this.definitions![entry.number] = {
              word: entry.root_word || '',
              transliteration: entry.transliteration || '',
              pronunciation: entry.pronunciation || '',
              definition: entry.entry || '',
              tvm: entry.tvm || undefined
            };
          }
        });
      } else {
        this.definitions = rawData as Record<string, StrongsDefinition>;
      }

      this.loaded = true;
      console.log(`Loaded ${Object.keys(this.definitions).length} Strong's definitions`);
    } catch (error) {
      console.error('Failed to load Strong\'s definitions:', error);
      throw error;
    }
  }

  lookup(strongsNumber: string): StrongsDefinition | null {
    if (!this.loaded || !this.definitions) {
      console.warn('Strong\'s definitions not loaded');
      return null;
    }

    const normalized = this.normalizeStrongsNumber(strongsNumber);
    const definition = this.definitions[normalized];
    
    if (!definition) {
      console.log(`No definition found for ${normalized}`);
      return null;
    }

    return definition;
  }

  extractStrongsNumbers(text: string): string[] {
    // Pattern matches {H1234} or {G5678} format
    const pattern = /\{([HG]\d{1,5})\}/g;
    const numbers = new Set<string>();
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const number = this.normalizeStrongsNumber(match[1]);
      // Only add if it's not a grammar code (usually 4+ digits or starting with 8/9)
      const numPart = number.slice(1);
      const isGrammarCode = numPart.length > 4 || 
                           (numPart.length === 4 && parseInt(numPart[0]) >= 8);
      if (!isGrammarCode) {
        numbers.add(number);
      }
    }

    return Array.from(numbers);
  }

  preloadDefinitionsForChapter(chapterText: string): void {
    // Extract all Strong's numbers from the chapter
    const numbers = this.extractStrongsNumbers(chapterText);
    
    // Ensure definitions are loaded (this is async but we don't await)
    if (!this.loaded) {
      this.loadDefinitions().catch(err => {
        console.error('Failed to preload definitions:', err);
      });
    }
    
    console.log(`Preloading ${numbers.length} Strong's numbers for chapter`);
  }

  normalizeStrongsNumber(number: string): string {
    // Remove any non-alphanumeric characters
    let cleaned = number.replace(/[^A-Za-z0-9]/g, '');
    
    // Ensure it starts with H or G (uppercase)
    if (cleaned[0].toLowerCase() === 'h' || cleaned[0].toLowerCase() === 'g') {
      cleaned = cleaned[0].toUpperCase() + cleaned.slice(1);
    }
    
    // Don't pad with zeros - keep the original number format
    // Strong's numbers can be H1-H8674 or G1-G5624
    return cleaned;
  }

  getStats(): { loaded: boolean; total?: number; hebrew?: number; greek?: number } {
    if (!this.loaded || !this.definitions) {
      return { loaded: false };
    }

    const keys = Object.keys(this.definitions);
    const hebrewCount = keys.filter(k => k.startsWith('H')).length;
    const greekCount = keys.filter(k => k.startsWith('G')).length;

    return {
      loaded: true,
      total: keys.length,
      hebrew: hebrewCount,
      greek: greekCount
    };
  }

  clearCache(): void {
    // Clear in-memory cache only
    // Browser HTTP cache will handle file caching
    this.definitions = null;
    this.loaded = false;
  }
}