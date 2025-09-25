import { IModule, ModuleType, ModuleCategory, ModuleFeature, ModuleManifest } from './types/IModule';
import HybridStorage from './storage/HybridStorage';

export class ModuleRegistry {
  private static instance: ModuleRegistry;
  private manifest: ModuleManifest | null = null;
  private hybridStorage: HybridStorage;

  // Available modules catalog
  private readonly AVAILABLE_MODULES: Record<string, IModule> = {
    // === BIBLE TRANSLATIONS ===
    kjv: {
      id: 'kjv',
      name: 'King James Version',
      type: ModuleType.BIBLE,
      category: ModuleCategory.BIBLE,
      language: 'en',
      size: '4.2 MB',
      description: 'The King James Version (1611/1769)',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      isDefault: true,
      installed: false
    },

    'kjv-strongs': {
      id: 'kjv-strongs',
      name: 'KJV with Strong\'s Numbers',
      type: ModuleType.BIBLE,
      category: ModuleCategory.BIBLE,
      language: 'en',
      size: '11.0 MB',
      description: 'King James Version with Strong\'s Hebrew/Greek lexicon tags',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/kaiserlik/kjv/master/'
      },
      format: {
        type: 'kjv-strongs-json'
      },
      features: [ModuleFeature.STRONGS, ModuleFeature.MORPHOLOGY],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    'kjva-strongs': {
      id: 'kjva-strongs',
      name: 'KJV Apocrypha with Strong\'s',
      type: ModuleType.BIBLE,
      category: ModuleCategory.BIBLE,
      language: 'en',
      size: '10.0 MB',
      description: 'KJV (1769) with Strong\'s Numbers, Morphology, and Apocrypha',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'scrollmapper-strongs'
      },
      features: [ModuleFeature.STRONGS, ModuleFeature.MORPHOLOGY],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    asv: {
      id: 'asv',
      name: 'American Standard Version',
      type: ModuleType.BIBLE,
      category: ModuleCategory.BIBLE,
      language: 'en',
      size: '4.0 MB',
      description: 'American Standard Version (1901)',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    'asv-strongs': {
      id: 'asv-strongs',
      name: 'ASV with Strong\'s Numbers',
      type: ModuleType.BIBLE,
      category: ModuleCategory.BIBLE,
      language: 'en',
      size: '8.0 MB',
      description: 'American Standard Version (1901) with Strong\'s concordance',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'scrollmapper-strongs'
      },
      features: [ModuleFeature.STRONGS, ModuleFeature.MORPHOLOGY],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    'berean-study': {
      id: 'berean-study',
      name: 'Berean Study Bible',
      type: ModuleType.BIBLE,
      category: ModuleCategory.BIBLE,
      language: 'en',
      size: '7.5 MB',
      description: 'Modern translation with extensive study notes',
      source: {
        type: 'api',
        url: 'https://bereanbible.com/'
      },
      format: {
        type: 'berean-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Copyright - Berean Bible',
      publicDomain: false,
      installed: false
    },

    'berean-interlinear': {
      id: 'berean-interlinear',
      name: 'Berean Interlinear Bible',
      type: ModuleType.BIBLE,
      category: ModuleCategory.BIBLE,
      language: 'en',
      size: '12.0 MB',
      description: 'Greek/Hebrew interlinear with Strong\'s numbers and parsing',
      source: {
        type: 'api',
        url: 'https://interlinearbible.com/'
      },
      format: {
        type: 'berean-interlinear'
      },
      features: [ModuleFeature.STRONGS, ModuleFeature.MORPHOLOGY, ModuleFeature.INTERLINEAR],
      license: 'Copyright - Berean Bible',
      publicDomain: false,
      installed: false
    },

    bbe: {
      id: 'bbe',
      name: 'Bible in Basic English',
      type: ModuleType.BIBLE,
      category: ModuleCategory.BIBLE,
      language: 'en',
      size: '3.8 MB',
      description: 'Simple English using 850 basic words',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    darby: {
      id: 'darby',
      name: 'Darby Translation',
      type: ModuleType.BIBLE,
      category: ModuleCategory.BIBLE,
      language: 'en',
      size: '4.0 MB',
      description: 'John Nelson Darby Translation (1890)',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    ylt: {
      id: 'ylt',
      name: 'Young\'s Literal Translation',
      type: ModuleType.BIBLE,
      category: ModuleCategory.BIBLE,
      language: 'en',
      size: '4.0 MB',
      description: 'Young\'s Literal Translation (1898)',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    web: {
      id: 'web',
      name: 'World English Bible',
      type: ModuleType.BIBLE,
      category: ModuleCategory.BIBLE,
      language: 'en',
      size: '1.3 MB',
      description: 'Modern English translation in public domain',
      source: {
        type: 'api',
        url: 'https://bible-api.com/'
      },
      format: {
        type: 'bible-api'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    geneva: {
      id: 'geneva',
      name: 'Geneva Bible',
      type: ModuleType.BIBLE,
      category: ModuleCategory.BIBLE,
      language: 'en',
      size: '4.3 MB',
      description: 'Geneva Bible (1599) - Reformation era translation',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/public-domain-bibles/english/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    douay: {
      id: 'douay',
      name: 'Douay-Rheims',
      type: ModuleType.BIBLE,
      category: ModuleCategory.BIBLE,
      language: 'en',
      size: '4.2 MB',
      description: 'Catholic Bible translation (1899)',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    webster: {
      id: 'webster',
      name: 'Webster Bible',
      type: ModuleType.BIBLE,
      category: ModuleCategory.BIBLE,
      language: 'en',
      size: '4.0 MB',
      description: 'Noah Webster\'s Bible (1833)',
      source: {
        type: 'api',
        url: 'https://bible-api.com/'
      },
      format: {
        type: 'bible-api'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    bishops: {
      id: 'bishops',
      name: 'Bishop\'s Bible',
      type: ModuleType.BIBLE,
      category: ModuleCategory.BIBLE,
      language: 'en',
      size: '4.2 MB',
      description: 'Bishop\'s Bible (1568) - Pre-KJV English translation',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/public-domain-bibles/english/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    tyndale: {
      id: 'tyndale',
      name: 'Tyndale Bible',
      type: ModuleType.BIBLE,
      category: ModuleCategory.BIBLE,
      language: 'en',
      size: '3.8 MB',
      description: 'William Tyndale\'s New Testament (1526)',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/public-domain-bibles/english/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    coverdale: {
      id: 'coverdale',
      name: 'Coverdale Bible',
      type: ModuleType.BIBLE,
      category: ModuleCategory.BIBLE,
      language: 'en',
      size: '4.0 MB',
      description: 'Miles Coverdale Bible (1535) - First complete printed English Bible',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/public-domain-bibles/english/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    matthews: {
      id: 'matthews',
      name: 'Matthew\'s Bible',
      type: ModuleType.BIBLE,
      category: ModuleCategory.BIBLE,
      language: 'en',
      size: '4.1 MB',
      description: 'Matthew\'s Bible (1537)',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/public-domain-bibles/english/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    great: {
      id: 'great',
      name: 'Great Bible',
      type: ModuleType.BIBLE,
      category: ModuleCategory.BIBLE,
      language: 'en',
      size: '4.2 MB',
      description: 'Great Bible (1539) - First authorized English Bible',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/public-domain-bibles/english/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    wycliffe: {
      id: 'wycliffe',
      name: 'Wycliffe Bible',
      type: ModuleType.BIBLE,
      category: ModuleCategory.BIBLE,
      language: 'en',
      size: '4.0 MB',
      description: 'John Wycliffe Bible (1382) - First English Bible translation',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/public-domain-bibles/english/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    // === DICTIONARIES ===
    'strongs-hebrew': {
      id: 'strongs-hebrew',
      name: 'Strong\'s Hebrew Dictionary',
      type: ModuleType.DICTIONARY,
      category: ModuleCategory.REFERENCE,
      language: 'en',
      size: '2.5 MB',
      description: 'Hebrew dictionary with definitions and transliterations',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/morningstarkitchen/strongs/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    'strongs-greek': {
      id: 'strongs-greek',
      name: 'Strong\'s Greek Dictionary',
      type: ModuleType.DICTIONARY,
      category: ModuleCategory.REFERENCE,
      language: 'en',
      size: '3.0 MB',
      description: 'Greek dictionary with definitions and transliterations',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/morningstarkitchen/strongs/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    eastons: {
      id: 'eastons',
      name: 'Easton\'s Bible Dictionary',
      type: ModuleType.DICTIONARY,
      category: ModuleCategory.REFERENCE,
      language: 'en',
      size: '2.5 MB',
      description: 'M.G. Easton\'s Bible Dictionary (1897) - 4,000+ entries',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    smiths: {
      id: 'smiths',
      name: 'Smith\'s Bible Dictionary',
      type: ModuleType.DICTIONARY,
      category: ModuleCategory.REFERENCE,
      language: 'en',
      size: '3.0 MB',
      description: 'William Smith\'s Bible Dictionary - Comprehensive biblical reference',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    hitchcocks: {
      id: 'hitchcocks',
      name: 'Hitchcock\'s Bible Names',
      type: ModuleType.DICTIONARY,
      category: ModuleCategory.REFERENCE,
      language: 'en',
      size: '500 KB',
      description: 'Dictionary of Bible names and their meanings',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    websters: {
      id: 'websters',
      name: 'Webster\'s 1828 Dictionary',
      type: ModuleType.DICTIONARY,
      category: ModuleCategory.REFERENCE,
      language: 'en',
      size: '5.0 MB',
      description: 'Noah Webster\'s 1828 American Dictionary - Bible-era definitions',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    // === COMMENTARIES ===
    'matthew-henry': {
      id: 'matthew-henry',
      name: 'Matthew Henry\'s Commentary',
      type: ModuleType.COMMENTARY,
      category: ModuleCategory.COMMENTARY,
      language: 'en',
      size: '20.0 MB',
      description: 'Matthew Henry\'s Complete Commentary on the Whole Bible',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    'geneva-notes': {
      id: 'geneva-notes',
      name: 'Geneva Bible Notes',
      type: ModuleType.COMMENTARY,
      category: ModuleCategory.COMMENTARY,
      language: 'en',
      size: '5.0 MB',
      description: 'Original study notes from the Geneva Bible (1599)',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    barnes: {
      id: 'barnes',
      name: 'Barnes\' Notes',
      type: ModuleType.COMMENTARY,
      category: ModuleCategory.COMMENTARY,
      language: 'en',
      size: '12.0 MB',
      description: 'Albert Barnes\' Notes on the Bible',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    clarke: {
      id: 'clarke',
      name: 'Clarke\'s Commentary',
      type: ModuleType.COMMENTARY,
      category: ModuleCategory.COMMENTARY,
      language: 'en',
      size: '15.0 MB',
      description: 'Adam Clarke\'s Bible Commentary',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    gill: {
      id: 'gill',
      name: 'Gill\'s Exposition',
      type: ModuleType.COMMENTARY,
      category: ModuleCategory.COMMENTARY,
      language: 'en',
      size: '18.0 MB',
      description: 'John Gill\'s Exposition of the Bible',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    jfb: {
      id: 'jfb',
      name: 'Jamieson-Fausset-Brown',
      type: ModuleType.COMMENTARY,
      category: ModuleCategory.COMMENTARY,
      language: 'en',
      size: '10.0 MB',
      description: 'Jamieson, Fausset, and Brown Commentary',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    poole: {
      id: 'poole',
      name: 'Matthew Poole\'s Commentary',
      type: ModuleType.COMMENTARY,
      category: ModuleCategory.COMMENTARY,
      language: 'en',
      size: '12.0 MB',
      description: 'Matthew Poole\'s English Annotations',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    wesley: {
      id: 'wesley',
      name: 'Wesley\'s Notes',
      type: ModuleType.COMMENTARY,
      category: ModuleCategory.COMMENTARY,
      language: 'en',
      size: '8.0 MB',
      description: 'John Wesley\'s Explanatory Notes',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    scofield: {
      id: 'scofield',
      name: 'Scofield Reference Notes',
      type: ModuleType.COMMENTARY,
      category: ModuleCategory.COMMENTARY,
      language: 'en',
      size: '6.0 MB',
      description: 'C.I. Scofield Reference Notes (1917)',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    // === TOPICAL BIBLES ===
    naves: {
      id: 'naves',
      name: 'Nave\'s Topical Bible',
      type: ModuleType.TOPICAL,
      category: ModuleCategory.REFERENCE,
      language: 'en',
      size: '5.0 MB',
      description: 'Orville J. Nave\'s topical index with 20,000+ topics',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    torreys: {
      id: 'torreys',
      name: 'Torrey\'s Topical Textbook',
      type: ModuleType.TOPICAL,
      category: ModuleCategory.REFERENCE,
      language: 'en',
      size: '2.0 MB',
      description: 'R.A. Torrey\'s topical textbook',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    thompsons: {
      id: 'thompsons',
      name: 'Thompson Chain References',
      type: ModuleType.TOPICAL,
      category: ModuleCategory.REFERENCE,
      language: 'en',
      size: '3.5 MB',
      description: 'Thompson Chain-Reference topical study system',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    // === CROSS REFERENCES ===
    tsk: {
      id: 'tsk',
      name: 'Treasury of Scripture Knowledge',
      type: ModuleType.CROSS_REFERENCE,
      category: ModuleCategory.REFERENCE,
      language: 'en',
      size: '15.0 MB',
      description: '800,000+ cross references between Bible verses',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH, ModuleFeature.CROSS_REFS],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    },

    openbible: {
      id: 'openbible',
      name: 'OpenBible Cross References',
      type: ModuleType.CROSS_REFERENCE,
      category: ModuleCategory.REFERENCE,
      language: 'en',
      size: '8.0 MB',
      description: '340,000+ cross references from OpenBible.info',
      source: {
        type: 'github',
        url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/'
      },
      format: {
        type: 'github-json'
      },
      features: [ModuleFeature.SEARCH, ModuleFeature.CROSS_REFS],
      license: 'Public Domain',
      publicDomain: true,
      installed: false
    }
  };

  private constructor() {
    // Private constructor for singleton pattern
    this.hybridStorage = new HybridStorage();
  }

  public static getInstance(): ModuleRegistry {
    if (!ModuleRegistry.instance) {
      ModuleRegistry.instance = new ModuleRegistry();
    }
    return ModuleRegistry.instance;
  }

  async getAvailableModules(): Promise<Record<string, IModule>> {
    return this.AVAILABLE_MODULES;
  }

  async getAvailableModulesByCategory(category: ModuleCategory): Promise<Record<string, IModule>> {
    const modules: Record<string, IModule> = {};

    for (const [key, module] of Object.entries(this.AVAILABLE_MODULES)) {
      if (module.category === category) {
        modules[key] = module;
      }
    }

    return modules;
  }

  async getAvailableModulesByType(type: ModuleType): Promise<Record<string, IModule>> {
    const modules: Record<string, IModule> = {};

    for (const [key, module] of Object.entries(this.AVAILABLE_MODULES)) {
      if (module.type === type) {
        modules[key] = module;
      }
    }

    return modules;
  }

  async getModule(moduleId: string): Promise<IModule | null> {
    return this.AVAILABLE_MODULES[moduleId] || null;
  }

  async getDefaultModules(): Promise<string[]> {
    return Object.keys(this.AVAILABLE_MODULES)
      .filter(id => this.AVAILABLE_MODULES[id].isDefault);
  }

  async getModulesWithFeatures(features: ModuleFeature[]): Promise<Record<string, IModule>> {
    const modules: Record<string, IModule> = {};

    for (const [key, module] of Object.entries(this.AVAILABLE_MODULES)) {
      if (features.every(feature => module.features.includes(feature))) {
        modules[key] = module;
      }
    }

    return modules;
  }

  async searchModules(query: string): Promise<Record<string, IModule>> {
    const lowercaseQuery = query.toLowerCase();
    const modules: Record<string, IModule> = {};

    for (const [key, module] of Object.entries(this.AVAILABLE_MODULES)) {
      if (
        module.name.toLowerCase().includes(lowercaseQuery) ||
        module.description.toLowerCase().includes(lowercaseQuery) ||
        module.id.toLowerCase().includes(lowercaseQuery)
      ) {
        modules[key] = module;
      }
    }

    return modules;
  }

  // Manifest management
  async getManifest(): Promise<ModuleManifest> {
    if (this.manifest) {
      return this.manifest;
    }

    // Try to load manifest from filesystem storage
    if (this.hybridStorage.isAvailable()) {
      try {
        const result = await this.hybridStorage.loadModuleData('bible-module-manifest');
        if (result) {
          const parsed = result;
          // Ensure all default modules are included
          const defaultModules = await this.getDefaultModules();
          const installed = [...new Set([...parsed.installed, ...defaultModules])];
          this.manifest = {
            ...parsed,
            installed,
            lastUpdated: new Date(parsed.lastUpdated),
          };
          return this.manifest!;
        }
      } catch (error) {
        console.warn('Failed to load manifest from filesystem storage:', error);
      }
    }

    // Return default manifest if none exists
    this.manifest = {
      installed: await this.getDefaultModules(),
      available: this.AVAILABLE_MODULES,
      lastUpdated: new Date(),
      version: '1.0.0'
    };

    // Save default manifest to filesystem storage
    if (this.hybridStorage.isAvailable()) {
      try {
        await this.hybridStorage.saveModuleData('bible-module-manifest', this.manifest);
      } catch (error) {
        console.warn('Failed to save manifest to filesystem storage:', error);
      }
    }

    return this.manifest;
  }

  async updateManifest(manifest: ModuleManifest): Promise<void> {
    this.manifest = manifest;

    // Persist to filesystem storage
    if (this.hybridStorage.isAvailable()) {
      try {
        await this.hybridStorage.saveModuleData('bible-module-manifest', manifest);
      } catch (error) {
        console.warn('Failed to save manifest to filesystem storage:', error);
      }
    }
  }

  async addInstalledModule(moduleId: string): Promise<void> {
    const manifest = await this.getManifest();

    if (!manifest.installed.includes(moduleId)) {
      manifest.installed.push(moduleId);
      manifest.lastUpdated = new Date();
      await this.updateManifest(manifest);
    }
  }

  async removeInstalledModule(moduleId: string): Promise<void> {
    const manifest = await this.getManifest();

    manifest.installed = manifest.installed.filter(id => id !== moduleId);
    manifest.lastUpdated = new Date();
    await this.updateManifest(manifest);
  }

  async isModuleInstalled(moduleId: string): Promise<boolean> {
    const manifest = await this.getManifest();
    return manifest.installed.includes(moduleId);
  }

  async getInstalledModules(): Promise<string[]> {
    const manifest = await this.getManifest();
    return manifest.installed;
  }
}

// Lazy initialization - will be created when first accessed
let registryInstance: ModuleRegistry | null = null;

export default function getModuleRegistry(): ModuleRegistry {
  if (!registryInstance) {
    registryInstance = ModuleRegistry.getInstance();
  }
  return registryInstance;
}