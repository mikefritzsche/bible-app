import { IModule, ModuleType, ModuleCategory, ModuleFeature, ModuleManifest } from './types/IModule';
import FileSystemStorage from './storage/FileSystemStorage';

export class ModuleRegistry {
  private static instance: ModuleRegistry;
  private manifest: ModuleManifest | null = null;
  private fileSystemStorage: FileSystemStorage;

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
      size: '8.5 MB',
      description: 'King James Version with Strong\'s Hebrew/Greek lexicon tags',
      source: {
        type: 'static'
      },
      format: {
        type: 'static-json'
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
    }
  };

  private constructor() {
    // Private constructor for singleton pattern
    this.fileSystemStorage = new FileSystemStorage();
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
    if (this.fileSystemStorage.isAvailable()) {
      try {
        const result = await this.fileSystemStorage.loadModuleData('bible-module-manifest');
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
    if (this.fileSystemStorage.isAvailable()) {
      try {
        await this.fileSystemStorage.saveModuleData('bible-module-manifest', this.manifest);
      } catch (error) {
        console.warn('Failed to save manifest to filesystem storage:', error);
      }
    }

    return this.manifest;
  }

  async updateManifest(manifest: ModuleManifest): Promise<void> {
    this.manifest = manifest;

    // Persist to filesystem storage
    if (this.fileSystemStorage.isAvailable()) {
      try {
        await this.fileSystemStorage.saveModuleData('bible-module-manifest', manifest);
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

export default ModuleRegistry.getInstance();