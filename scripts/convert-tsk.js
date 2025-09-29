#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Book mapping from TSK format to book names and abbreviations
const BOOK_MAPPING = {
  1: { name: 'Genesis', abbrev: 'ge' },
  2: { name: 'Exodus', abbrev: 'ex' },
  3: { name: 'Leviticus', abbrev: 'le' },
  4: { name: 'Numbers', abbrev: 'nu' },
  5: { name: 'Deuteronomy', abbrev: 'de' },
  6: { name: 'Joshua', abbrev: 'jos' },
  7: { name: 'Judges', abbrev: 'jud' },
  8: { name: 'Ruth', abbrev: 'ru' },
  9: { name: '1 Samuel', abbrev: '1sa' },
  10: { name: '2 Samuel', abbrev: '2sa' },
  11: { name: '1 Kings', abbrev: '1ki' },
  12: { name: '2 Kings', abbrev: '2ki' },
  13: { name: '1 Chronicles', abbrev: '1ch' },
  14: { name: '2 Chronicles', abbrev: '2ch' },
  15: { name: 'Ezra', abbrev: 'ezr' },
  16: { name: 'Nehemiah', abbrev: 'ne' },
  17: { name: 'Esther', abbrev: 'es' },
  18: { name: 'Job', abbrev: 'job' },
  19: { name: 'Psalms', abbrev: 'ps' },
  20: { name: 'Proverbs', abbrev: 'pr' },
  21: { name: 'Ecclesiastes', abbrev: 'ec' },
  22: { name: 'Song of Solomon', abbrev: 'so' },
  23: { name: 'Isaiah', abbrev: 'isa' },
  24: { name: 'Jeremiah', abbrev: 'jer' },
  25: { name: 'Lamentations', abbrev: 'la' },
  26: { name: 'Ezekiel', abbrev: 'eze' },
  27: { name: 'Daniel', abbrev: 'da' },
  28: { name: 'Hosea', abbrev: 'ho' },
  29: { name: 'Joel', abbrev: 'joe' },
  30: { name: 'Amos', abbrev: 'am' },
  31: { name: 'Obadiah', abbrev: 'ob' },
  32: { name: 'Jonah', abbrev: 'jon' },
  33: { name: 'Micah', abbrev: 'mic' },
  34: { name: 'Nahum', abbrev: 'na' },
  35: { name: 'Habakkuk', abbrev: 'hab' },
  36: { name: 'Zephaniah', abbrev: 'zep' },
  37: { name: 'Haggai', abbrev: 'hag' },
  38: { name: 'Zechariah', abbrev: 'zec' },
  39: { name: 'Malachi', abbrev: 'mal' },
  40: { name: 'Matthew', abbrev: 'mt' },
  41: { name: 'Mark', abbrev: 'mr' },
  42: { name: 'Luke', abbrev: 'lu' },
  43: { name: 'John', abbrev: 'joh' },
  44: { name: 'Acts', abbrev: 'ac' },
  45: { name: 'Romans', abbrev: 'ro' },
  46: { name: '1 Corinthians', abbrev: '1co' },
  47: { name: '2 Corinthians', abbrev: '2co' },
  48: { name: 'Galatians', abbrev: 'ga' },
  49: { name: 'Ephesians', abbrev: 'eph' },
  50: { name: 'Philippians', abbrev: 'php' },
  51: { name: 'Colossians', abbrev: 'col' },
  52: { name: '1 Thessalonians', abbrev: '1th' },
  53: { name: '2 Thessalonians', abbrev: '2th' },
  54: { name: '1 Timothy', abbrev: '1ti' },
  55: { name: '2 Timothy', abbrev: '2ti' },
  56: { name: 'Titus', abbrev: 'tit' },
  57: { name: 'Philemon', abbrev: 'phm' },
  58: { name: 'Hebrews', abbrev: 'heb' },
  59: { name: 'James', abbrev: 'jas' },
  60: { name: '1 Peter', abbrev: '1pe' },
  61: { name: '2 Peter', abbrev: '2pe' },
  62: { name: '1 John', abbrev: '1jo' },
  63: { name: '2 John', abbrev: '2jo' },
  64: { name: '3 John', abbrev: '3jo' },
  65: { name: 'Jude', abbrev: 'jude' },
  66: { name: 'Revelation', abbrev: 're' }
};

// Create reverse mapping for abbreviations to book info
const ABBREV_MAPPING = {};
Object.entries(BOOK_MAPPING).forEach(([key, value]) => {
  ABBREV_MAPPING[value.abbrev] = { bookKey: parseInt(key), name: value.name };
});

function parseReference(refString) {
  // Parse references like "ge 1:1", "pr 8:22-24", "1co 8:6"
  const parts = refString.trim().split(' ');
  if (parts.length < 2) return null;

  const bookAbbrev = parts[0].toLowerCase();
  const chapterVerses = parts[1];

  const bookInfo = ABBREV_MAPPING[bookAbbrev];
  if (!bookInfo) return null;

  // Handle chapter:verse format, including ranges
  const cvParts = chapterVerses.split(':');
  if (cvParts.length !== 2) return null;

  const chapter = parseInt(cvParts[0]);
  const versePart = cvParts[1];

  // Handle verse ranges (e.g., "22-24")
  const verseParts = versePart.split('-');
  const startVerse = parseInt(verseParts[0]);
  const endVerse = verseParts.length > 1 ? parseInt(verseParts[1]) : startVerse;

  return {
    book: bookInfo.name,
    bookKey: bookInfo.bookKey,
    chapter: chapter,
    startVerse: startVerse,
    endVerse: endVerse,
    original: refString.trim()
  };
}

function convertTSKToJSON() {
  const inputPath = path.join(__dirname, '../archive/tsk/tskxref.txt');
  const outputPath = path.join(__dirname, '../public/bibles/extras/tsk.json');

  console.log('Reading TSK data...');
  const data = fs.readFileSync(inputPath, 'utf8');
  const lines = data.trim().split('\n');

  console.log(`Processing ${lines.length} entries...`);

  const tskData = {};
  let processedCount = 0;

  lines.forEach((line, index) => {
    if (line.trim() === '') return;

    const parts = line.split('\t');
    if (parts.length !== 6) {
      console.warn(`Skipping malformed line ${index + 1}: ${line}`);
      return;
    }

    const [bookKey, chapter, verse, sortOrder, word, referenceList] = parts;

    const bookKeyNum = parseInt(bookKey);
    const chapterNum = parseInt(chapter);
    const verseNum = parseInt(verse);
    const sortOrderNum = parseInt(sortOrder);

    const bookInfo = BOOK_MAPPING[bookKeyNum];
    if (!bookInfo) {
      console.warn(`Unknown book key ${bookKeyNum} in line ${index + 1}`);
      return;
    }

    // Create verse key
    const verseKey = `${bookInfo.name} ${chapterNum}:${verseNum}`;

    // Parse references
    const references = referenceList.split(';').map(ref => parseReference(ref)).filter(ref => ref !== null);

    // Create entry
    const entry = {
      word: word,
      sort_order: sortOrderNum,
      references: references
    };

    // Add to data structure
    if (!tskData[verseKey]) {
      tskData[verseKey] = [];
    }

    tskData[verseKey].push(entry);
    processedCount++;

    if (processedCount % 10000 === 0) {
      console.log(`Processed ${processedCount} entries...`);
    }
  });

  console.log(`Total entries processed: ${processedCount}`);
  console.log(`Total verses with TSK data: ${Object.keys(tskData).length}`);

  // Create final JSON structure
  const output = {
    metadata: {
      name: 'Treasury of Scripture Knowledge',
      description: 'Cross-references and topical connections for Bible verses',
      totalEntries: processedCount,
      totalVerses: Object.keys(tskData).length,
      source: 'TSK (Treasury of Scripture Knowledge)',
      generatedAt: new Date().toISOString()
    },
    data: tskData
  };

  // Write output file
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`TSK data converted and saved to: ${outputPath}`);

  // Print some statistics
  console.log('\n=== Conversion Statistics ===');
  console.log(`Input file: ${inputPath}`);
  console.log(`Output file: ${outputPath}`);
  console.log(`File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total cross-references: ${processedCount}`);
  console.log(`Verses with references: ${Object.keys(tskData).length}`);

  // Show some sample data
  console.log('\n=== Sample Data ===');
  const sampleKeys = Object.keys(tskData).slice(0, 3);
  sampleKeys.forEach(key => {
    console.log(`${key}: ${tskData[key].length} reference(s)`);
    tskData[key].slice(0, 2).forEach(entry => {
      console.log(`  - "${entry.word}" (${entry.references.length} references)`);
    });
  });
}

if (require.main === module) {
  convertTSKToJSON();
}

module.exports = { convertTSKToJSON, parseReference };