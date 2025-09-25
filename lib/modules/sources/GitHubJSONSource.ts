import { IModule, ModuleDownloadProgress } from '../types/IModule';

export class GitHubJSONSource {
  private readonly BIBLE_BOOKS = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
    'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
    'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
    'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel',
    'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
    'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
    '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
    'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
    '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
    'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
    'Jude', 'Revelation'
  ];

  // Map book names to GitHub filename format
  private getGitHubFilename(bookName: string): string {
    const mappings: Record<string, string> = {
      '1 Samuel': '1Samuel',
      '2 Samuel': '2Samuel',
      '1 Kings': '1Kings',
      '2 Kings': '2Kings',
      '1 Chronicles': '1Chronicles',
      '2 Chronicles': '2Chronicles',
      'Song of Solomon': 'SongofSolomon',
      '1 Corinthians': '1Corinthians',
      '2 Corinthians': '2Corinthians',
      '1 Thessalonians': '1Thessalonians',
      '2 Thessalonians': '2Thessalonians',
      '1 Timothy': '1Timothy',
      '2 Timothy': '2Timothy',
      '1 Peter': '1Peter',
      '2 Peter': '2Peter',
      '1 John': '1John',
      '2 John': '2John',
      '3 John': '3John'
    };

    return mappings[bookName] || bookName;
  }

  async downloadModule(
    module: IModule,
    progress: ModuleDownloadProgress,
    progressCallback?: (progress: ModuleDownloadProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<any> {
    console.log(`Downloading ${module.name} from GitHub...`);

    if (module.source.type !== 'github') {
      throw new Error('Invalid source type for GitHubJSONSource');
    }

    try {
      let result: any;
      // For KJV from aruljohn/Bible-kjv
      if (module.id === 'kjv') {
        console.log(`Starting KJV download from aruljohn/Bible-kjv...`);
        result = await this.downloadKJVFromArulJohn(module, progress, progressCallback, abortSignal);
        console.log(`KJV download completed. Result keys:`, result ? Object.keys(result) : 'null');
      }
      // For KJV with Strong's from kaiserlik/kjv
      else if (module.id === 'kjv-strongs') {
        console.log(`Starting KJV-Strongs download from kaiserlik/kjv...`);
        result = await this.downloadKJVStrongsFromKaiserlik(module, progress, progressCallback, abortSignal);
        console.log(`KJV-Strongs download completed. Result keys:`, result ? Object.keys(result) : 'null');
        if (result && result.books) {
          console.log(`KJV-Strongs books count:`, Object.keys(result.books).length);
          console.log(`KJV-Strongs first few books:`, Object.keys(result.books).slice(0, 5));
        }
      }
      // Generic GitHub JSON download
      else {
        result = await this.downloadGenericGitHubModule(module, progress, progressCallback, abortSignal);
      }

      console.log(`✅ ${module.name} downloaded successfully`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to download ${module.name}:`, error);
      throw error;
    }
  }

  private async downloadKJVFromArulJohn(
    module: IModule,
    progress: ModuleDownloadProgress,
    progressCallback?: (progress: ModuleDownloadProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<any> {
    const baseUrl = module.source.url;
    let completed = 0;
    const total = this.BIBLE_BOOKS.length;

    progress.totalBytes = total * 50000; // Estimate 50KB per book
    this.notifyProgress(progress, progressCallback);

    const bibleData: any = {
      metadata: {
        name: module.name,
        description: module.description,
        source: baseUrl,
        downloadedAt: new Date().toISOString()
      },
      verses: [] // Use flat verse array format
    };

    // Try to download from GitHub, but fall back to local static file if it fails
    try {
      for (const book of this.BIBLE_BOOKS) {
        // Check for abort signal
        if (abortSignal?.aborted) {
          throw new Error('Download aborted');
        }

        const githubName = this.getGitHubFilename(book);
        const url = `${baseUrl}${githubName}.json`;

        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status} for ${book}`);
          }

          const data = await response.json();

          // Convert book data to flat verse array format
          if (data.chapters) {
            Object.entries(data.chapters).forEach(([chapterNum, chapterData]: [string, any]) => {
              if (chapterData.verses) {
                Object.entries(chapterData.verses).forEach(([verseNum, verseData]: [string, any]) => {
                  bibleData.verses.push({
                    book_name: book,
                    chapter: parseInt(chapterNum),
                    verse: parseInt(verseNum),
                    text: verseData.text || verseData
                  });
                });
              }
            });
          }

          completed++;
          progress.bytesDownloaded = Math.floor((completed / total) * progress.totalBytes);
          progress.progress = Math.floor((completed / total) * 100);
          progress.currentFile = book;

          this.notifyProgress(progress, progressCallback);

        } catch (error) {
          console.error(`Failed to download ${book}:`, error);
          // Continue with other books
        }
      }

      console.log(`KJV download completed: ${completed}/${total} books`);
      if (bibleData.verses.length === 0) {
        throw new Error('No verses were downloaded');
      }

      return bibleData;
    } catch (error) {
      console.error('GitHub download failed, loading fallback data:', error);

      // Fallback: load from local static file
      try {
        const fallbackResponse = await fetch('/bibles/json/kjv.json');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          console.log('✅ Loaded fallback KJV data with', fallbackData.verses?.length || 0, 'verses');
          return fallbackData;
        }
      } catch (fallbackError) {
        console.error('Fallback loading also failed:', fallbackError);
      }

      throw error;
    }
  }

  private async downloadKJVStrongsFromKaiserlik(
    module: IModule,
    progress: ModuleDownloadProgress,
    progressCallback?: (progress: ModuleDownloadProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<any> {
    const baseUrl = module.source.url;
    const bookFiles = [
      'Gen.json', 'Exo.json', 'Lev.json', 'Num.json', 'Deu.json',
      'Jos.json', 'Jdg.json', 'Rut.json', '1Sa.json', '2Sa.json',
      '1Ki.json', '2Ki.json', '1Ch.json', '2Ch.json', 'Ezr.json',
      'Neh.json', 'Est.json', 'Job.json', 'Psa.json', 'Pro.json',
      'Ecc.json', 'Sng.json', 'Isa.json', 'Jer.json', 'Lam.json',
      'Ezk.json', 'Dan.json', 'Hos.json', 'Jol.json', 'Amo.json',
      'Oba.json', 'Jon.json', 'Mic.json', 'Nam.json', 'Hab.json',
      'Zep.json', 'Hag.json', 'Zec.json', 'Mal.json',
      'Mat.json', 'Mrk.json', 'Luk.json', 'Jhn.json', 'Act.json',
      'Rom.json', '1Co.json', '2Co.json', 'Gal.json', 'Eph.json',
      'Php.json', 'Col.json', '1Th.json', '2Th.json', '1Ti.json',
      '2Ti.json', 'Tit.json', 'Phm.json', 'Heb.json', 'Jas.json',
      '1Pe.json', '2Pe.json', '1Jn.json', '2Jn.json', '3Jn.json',
      'Jud.json', 'Rev.json'
    ];

    let downloaded = 0;
    const total = bookFiles.length;
    progress.totalBytes = total * 100000; // Estimate 100KB per book for Strong's data
    this.notifyProgress(progress, progressCallback);

    const bibleData: any = {
      metadata: {
        name: module.name,
        description: module.description,
        features: module.features,
        downloadedAt: new Date().toISOString()
      },
      verses: [] // Use flat verse array format
    };

    // Try to download from GitHub, but fall back to local static file if it fails
    try {
      for (const bookFile of bookFiles) {
        if (abortSignal?.aborted) {
          throw new Error('Download aborted');
        }

        try {
          const url = `${baseUrl}${bookFile}`;
          const response = await fetch(url);

          if (response.ok) {
            const data = await response.json();

            // Map abbreviated book names to full names
            const abbrToFullName: Record<string, string> = {
              'Gen': 'Genesis', 'Exo': 'Exodus', 'Lev': 'Leviticus', 'Num': 'Numbers', 'Deu': 'Deuteronomy',
              'Jos': 'Joshua', 'Jdg': 'Judges', 'Rut': 'Ruth', '1Sa': '1 Samuel', '2Sa': '2 Samuel',
              '1Ki': '1 Kings', '2Ki': '2 Kings', '1Ch': '1 Chronicles', '2Ch': '2 Chronicles', 'Ezr': 'Ezra',
              'Neh': 'Nehemiah', 'Est': 'Esther', 'Job': 'Job', 'Psa': 'Psalms', 'Pro': 'Proverbs',
              'Ecc': 'Ecclesiastes', 'Sng': 'Song of Solomon', 'Isa': 'Isaiah', 'Jer': 'Jeremiah', 'Lam': 'Lamentations',
              'Ezk': 'Ezekiel', 'Dan': 'Daniel', 'Hos': 'Hosea', 'Jol': 'Joel', 'Amo': 'Amos',
              'Oba': 'Obadiah', 'Jon': 'Jonah', 'Mic': 'Micah', 'Nam': 'Nahum', 'Hab': 'Habakkuk',
              'Zep': 'Zephaniah', 'Hag': 'Haggai', 'Zec': 'Zechariah', 'Mal': 'Malachi',
              'Mat': 'Matthew', 'Mrk': 'Mark', 'Luk': 'Luke', 'Jhn': 'John', 'Act': 'Acts',
              'Rom': 'Romans', '1Co': '1 Corinthians', '2Co': '2 Corinthians', 'Gal': 'Galatians', 'Eph': 'Ephesians',
              'Php': 'Philippians', 'Col': 'Colossians', '1Th': '1 Thessalonians', '2Th': '2 Thessalonians', '1Ti': '1 Timothy',
              '2Ti': '2 Timothy', 'Tit': 'Titus', 'Phm': 'Philemon', 'Heb': 'Hebrews', 'Jas': 'James',
              '1Pe': '1 Peter', '2Pe': '2 Peter', '1Jn': '1 John', '2Jn': '2 John', '3Jn': '3 John',
              'Jud': 'Jude', 'Rev': 'Revelation'
            };

            const bookAbbr = bookFile.replace('.json', '');
            const bookName = abbrToFullName[bookAbbr] || bookAbbr;

            // Convert to flat verse array format
            if (data[bookName] && data[bookName].chapters) {
              Object.entries(data[bookName].chapters).forEach(([chapterNum, chapterData]: [string, any]) => {
                if (chapterData.verses) {
                  Object.entries(chapterData.verses).forEach(([verseNum, verseData]: [string, any]) => {
                    bibleData.verses.push({
                      book_name: bookName,
                      chapter: parseInt(chapterNum),
                      verse: parseInt(verseNum),
                      text: verseData.text || verseData
                    });
                  });
                }
              });
            }

            downloaded++;
          }
        } catch (error) {
          console.error(`Error downloading ${bookFile}:`, error instanceof Error ? error.message : error);
          // Continue downloading other books
        }

        progress.bytesDownloaded = Math.floor((downloaded / total) * progress.totalBytes);
        progress.progress = Math.floor((downloaded / total) * 100);
        progress.currentFile = bookFile;

        this.notifyProgress(progress, progressCallback);
      }

      console.log(`KJV Strong's download completed: ${downloaded}/${total} books`);
      if (bibleData.verses.length === 0) {
        throw new Error('No verses were downloaded');
      }

      return bibleData;
    } catch (error) {
      console.error('GitHub download failed, loading fallback data:', error);

      // Fallback: load from local static file
      try {
        const fallbackResponse = await fetch('/bibles/json/kjv_strongs.json');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          console.log('✅ Loaded fallback KJV-Strongs data with', fallbackData.verses?.length || 0, 'verses');
          return fallbackData;
        }
      } catch (fallbackError) {
        console.error('Fallback loading also failed:', fallbackError);
      }

      throw error;
    }
  }

  private async downloadGenericGitHubModule(
    module: IModule,
    progress: ModuleDownloadProgress,
    progressCallback?: (progress: ModuleDownloadProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<any> {
    // For other GitHub modules, we'll implement a simple placeholder
    progress.progress = 100;
    progress.bytesDownloaded = progress.totalBytes;
    this.notifyProgress(progress, progressCallback);

    console.log(`Generic GitHub download for ${module.name} (placeholder implementation)`);
    return { placeholder: true, module: module.id };
  }

  private notifyProgress(progress: ModuleDownloadProgress, callback?: (progress: ModuleDownloadProgress) => void): void {
    if (callback) {
      callback(progress);
    }
  }

  // Method to get module data (for when module is already downloaded)
  async getModuleData(module: IModule, book?: string, chapter?: number, term?: string): Promise<any> {
    // In a real implementation, this would load from local storage
    // For now, return placeholder data
    return {
      module: module.id,
      data: 'Module data would be loaded from local storage',
      book,
      chapter,
      term
    };
  }
}

export default GitHubJSONSource;