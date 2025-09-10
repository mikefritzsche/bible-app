'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HighlightManager, VerseHighlight, HIGHLIGHT_COLORS, HIGHLIGHT_COLORS_LIGHT, HIGHLIGHT_COLORS_DARK } from '@/lib/HighlightManager';
import { BibleParser } from '@/lib/BibleParser';
import { useTheme } from '@/lib/ThemeContext';
import { VerseWithStrongs } from '@/components/VerseWithStrongs';

// Component to render verse text with highlight applied
function HighlightedVerse({ text, highlight, theme, verseNumber }: { 
  text: string; 
  highlight: VerseHighlight; 
  theme: 'light' | 'dark';
  verseNumber: number;
}) {
  
  // Check if this is a Strong's version (contains {H or {G codes)
  const hasStrongs = text.includes('{H') || text.includes('{G');
  const highlightColors = theme === 'dark' ? HIGHLIGHT_COLORS_DARK : HIGHLIGHT_COLORS_LIGHT;
  const highlightColor = highlightColors[highlight.color as keyof typeof highlightColors];
  
  
  if (hasStrongs) {
    // For Strong's versions, use the VerseWithStrongs component to properly display Strong's numbers
    
    // Check if this is a full verse highlight (no offsets) or partial
    if (highlight.startOffset === undefined || highlight.endOffset === undefined) {
      // Full verse highlight - wrap the entire VerseWithStrongs output
      return (
        <span style={{ backgroundColor: highlightColor }}>
          <VerseWithStrongs
            text={text}
            verseNumber={null}  // Don't show verse number here, we show it separately
            highlights={[]}  // No partial highlights
            isDarkMode={theme === 'dark'}
            onStrongsClick={() => {}} // No Strong's interaction in highlights page
          />
        </span>
      );
    } else {
      // Partial highlight - pass the offsets to VerseWithStrongs
      const highlightInfo = [{
        startOffset: highlight.startOffset,
        endOffset: highlight.endOffset,
        color: highlight.color
      }];
      
      return (
        <VerseWithStrongs
          text={text}
          verseNumber={null}  // Don't show verse number here, we show it separately
          highlights={highlightInfo}
          isDarkMode={theme === 'dark'}
          onStrongsClick={() => {}} // No Strong's interaction in highlights page
        />
      );
    }
  }
  
  // For non-Strong's versions, use simple highlighting
  
  // If we have start and end offsets, highlight only that portion
  if (highlight.startOffset !== undefined && highlight.endOffset !== undefined) {
    const beforeHighlight = text.substring(0, highlight.startOffset);
    const highlightedText = text.substring(highlight.startOffset, highlight.endOffset);
    const afterHighlight = text.substring(highlight.endOffset);
    
    return (
      <>
        {beforeHighlight}
        <span style={{ backgroundColor: highlightColor }}>
          {highlightedText}
        </span>
        {afterHighlight}
      </>
    );
  }
  
  // Otherwise highlight the entire verse
  return (
    <span style={{ backgroundColor: highlightColor }}>
      {text}
    </span>
  );
}

export default function HighlightsPage() {
  const [highlightManager] = useState(() => new HighlightManager());
  const [parser] = useState(() => new BibleParser());
  const [highlights, setHighlights] = useState<VerseHighlight[]>([]);
  const [filteredHighlights, setFilteredHighlights] = useState<VerseHighlight[]>([]);
  const [verseTexts, setVerseTexts] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'reference'>('date');
  const [isLoading, setIsLoading] = useState(true);
  const [loadedVersions, setLoadedVersions] = useState<Set<string>>(new Set());
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    loadHighlights();
  }, []);

  useEffect(() => {
    filterAndSortHighlights();
  }, [highlights, selectedColor, searchTerm, sortBy]);

  const loadHighlights = async () => {
    setIsLoading(true);
    try {
      await highlightManager.init();
      const allHighlights = await highlightManager.getAllHighlights();
      setHighlights(allHighlights);
      
      // Load verse texts for all highlights
      const texts: Record<string, string> = {};
      const versionsToLoad = new Set<string>();
      
      // Identify all unique versions needed
      allHighlights.forEach(h => {
        const version = h.version || 'kjv';
        if (!loadedVersions.has(version)) {
          versionsToLoad.add(version);
        }
      });
      
      // Load each version and get verses
      for (const version of versionsToLoad) {
        try {
          await parser.loadBible(version);
          loadedVersions.add(version);
          
          // Get verses for highlights of this version right after loading
          allHighlights.filter(h => (h.version || 'kjv') === version).forEach(h => {
            const verse = parser.getVerse(h.book, h.chapter, h.verse);
            if (verse) {
              texts[h.id] = verse.text;
            }
          });
        } catch (error) {
          console.error(`Error loading Bible version ${version}:`, error);
        }
      }
      
      setVerseTexts(texts);
    } catch (error) {
      console.error('Error loading highlights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortHighlights = () => {
    let filtered = [...highlights];

    // Filter by color
    if (selectedColor !== 'all') {
      filtered = filtered.filter(h => h.color === selectedColor);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(h => 
        h.reference.toLowerCase().includes(term) ||
        h.selectedText?.toLowerCase().includes(term) ||
        h.note?.toLowerCase().includes(term)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else {
        // Sort by book, chapter, verse
        const bookOrder = getBookOrder(a.book) - getBookOrder(b.book);
        if (bookOrder !== 0) return bookOrder;
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.verse - b.verse;
      }
    });

    setFilteredHighlights(filtered);
  };

  const getBookOrder = (book: string): number => {
    const books = [
      'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
      'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
      '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
      'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
      'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
      'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
      'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
      'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
      'Matthew', 'Mark', 'Luke', 'John', 'Acts',
      'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
      'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy',
      '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
      '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
      'Jude', 'Revelation'
    ];
    return books.indexOf(book);
  };

  const navigateToVerse = (highlight: VerseHighlight) => {
    const params = new URLSearchParams({
      book: highlight.book,
      chapter: highlight.chapter.toString(),
      verse: highlight.verse.toString(),
      version: highlight.version || 'kjv'
    });
    router.push(`/?${params.toString()}`);
  };

  const deleteHighlight = async (highlight: VerseHighlight) => {
    if (confirm(`Delete highlight for ${highlight.reference}?`)) {
      try {
        await highlightManager.removeHighlight(
          highlight.book,
          highlight.chapter,
          highlight.verse,
          highlight.version || 'kjv',
          highlight.startOffset,
          highlight.endOffset
        );
        await loadHighlights();
      } catch (error) {
        console.error('Error deleting highlight:', error);
      }
    }
  };

  const exportHighlights = async () => {
    try {
      const json = await highlightManager.exportHighlights();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bible-highlights-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting highlights:', error);
    }
  };

  const importHighlights = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await highlightManager.importHighlights(text);
      await loadHighlights();
      alert('Highlights imported successfully!');
    } catch (error) {
      console.error('Error importing highlights:', error);
      alert('Error importing highlights. Please check the file format.');
    }
  };

  const getColorStats = () => {
    const stats = new Map<string, number>();
    highlights.forEach(h => {
      stats.set(h.color, (stats.get(h.color) || 0) + 1);
    });
    return stats;
  };

  const colorStats = getColorStats();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading highlights...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-3 text-gray-900 dark:text-gray-100">My Highlights</h1>
      
      {/* Stats Bar */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mb-3">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total: <span className="font-bold text-gray-900 dark:text-gray-100">{highlights.length}</span> highlights
          </div>
          <div className="flex gap-2">
            {Array.from(colorStats.entries()).map(([color, count]) => (
              <div
                key={color}
                className="flex items-center gap-1 px-2 py-1 rounded"
                style={{ backgroundColor: `${HIGHLIGHT_COLORS[color as keyof typeof HIGHLIGHT_COLORS]}20` }}
              >
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: HIGHLIGHT_COLORS[color as keyof typeof HIGHLIGHT_COLORS] }}
                />
                <span className="text-xs">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search text or notes..."
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          {/* Color Filter */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Filter by Color</label>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="all">All Colors</option>
              {Object.keys(HIGHLIGHT_COLORS).map(color => (
                <option key={color} value={color}>
                  {color.charAt(0).toUpperCase() + color.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'reference')}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="date">Date (Newest First)</option>
              <option value="reference">Bible Order</option>
            </select>
          </div>

          {/* Actions */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Actions</label>
            <div className="flex gap-2">
              <button
                onClick={exportHighlights}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Export
              </button>
              <label className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer">
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importHighlights}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Highlights List */}
      <div className="space-y-2">
        {filteredHighlights.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {highlights.length === 0 
              ? "No highlights yet. Start highlighting verses to see them here!"
              : "No highlights match your filters."}
          </div>
        ) : (
          filteredHighlights.map((highlight) => (
            <div
              key={highlight.id}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-3 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-4 h-4 rounded"
                      style={{
                        backgroundColor: HIGHLIGHT_COLORS[highlight.color as keyof typeof HIGHLIGHT_COLORS]
                      }}
                    />
                    <button
                      onClick={() => navigateToVerse(highlight)}
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {highlight.reference}
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({highlight.version || 'KJV'})
                    </span>
                  </div>
                  
                  <div className="text-gray-700 dark:text-gray-300 mb-1 leading-relaxed">
                    {verseTexts[highlight.id] ? (
                      <>
                        <strong className="text-blue-600 dark:text-blue-400 mr-2">{highlight.verse}</strong>
                        <HighlightedVerse 
                          text={verseTexts[highlight.id]} 
                          highlight={highlight}
                          theme={theme === 'system' ? 'light' : theme}
                          verseNumber={highlight.verse}
                        />
                      </>
                    ) : (
                      <span className="italic">{highlight.selectedText || 'Loading verse...'}</span>
                    )}
                  </div>
                  
                  {highlight.note && (
                    <div className="bg-gray-100 dark:bg-gray-800 rounded p-1 mb-1">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Note: </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{highlight.note}</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(highlight.timestamp).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>
                
                <button
                  onClick={() => deleteHighlight(highlight)}
                  className="ml-4 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  title="Delete highlight"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}