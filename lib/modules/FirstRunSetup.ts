import ModuleManager from './ModuleManager';

export class FirstRunSetup {
  private static instance: FirstRunSetup;
  private moduleManager = ModuleManager();
  private hasRunSetup = false;

  private constructor() {}

  static getInstance(): FirstRunSetup {
    if (!FirstRunSetup.instance) {
      FirstRunSetup.instance = new FirstRunSetup();
    }
    return FirstRunSetup.instance;
  }

  async initialize(): Promise<void> {
    if (this.hasRunSetup) {
      return;
    }

    try {
      const isFirstRun = await this.checkIsFirstRun();

      if (isFirstRun) {
        console.log('First run detected - setting up default modules...');
        await this.setupDefaultModules();
        await this.markFirstRunComplete();
      } else {
        console.log('Returning user - skipping first-run setup');
      }

      this.hasRunSetup = true;
    } catch (error) {
      console.error('Error during first-run setup:', error);
      throw error;
    }
  }

  private async checkIsFirstRun(): Promise<boolean> {
    try {
      // Check if we have a flag in localStorage (only on client side)
      let hasRunBefore = false;
      if (typeof window !== 'undefined') {
        try {
          hasRunBefore = localStorage.getItem('bible-app-first-run-complete') === 'true';
        } catch (storageError) {
          console.warn('localStorage access failed:', storageError);
        }
      }

      if (hasRunBefore) {
        return false;
      }

      // Also check if KJV modules are already installed
      const kjvInstalled = await this.moduleManager.isModuleInstalled('kjv');
      const kjvStrongsInstalled = await this.moduleManager.isModuleInstalled('kjv-strongs');

      return !kjvInstalled || !kjvStrongsInstalled;
    } catch (error) {
      console.error('Error checking first run status:', error);
      return true; // Assume first run if there's an error
    }
  }

  private async setupDefaultModules(): Promise<void> {
    const defaultModules = [
      { id: 'kjv', name: 'King James Version' },
      { id: 'kjv-strongs', name: 'KJV with Strong\'s Numbers' }
    ];

    for (const module of defaultModules) {
      try {
        console.log(`Installing default module: ${module.name} (${module.id})`);

        const isInstalled = await this.moduleManager.isModuleInstalled(module.id);
        if (!isInstalled) {
          await this.moduleManager.downloadModule(module.id);
          console.log(`Successfully installed ${module.name}`);
        } else {
          console.log(`${module.name} already installed`);
        }
      } catch (error) {
        console.error(`Failed to install ${module.name}:`, error);
        // Continue with other modules even if one fails
      }
    }
  }

  private async markFirstRunComplete(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('bible-app-first-run-complete', 'true');
        } catch (storageError) {
          console.warn('localStorage access failed:', storageError);
        }
      }
      console.log('First-run setup marked as complete');
    } catch (error) {
      console.error('Error marking first run complete:', error);
    }
  }

  async forceReinitialize(): Promise<void> {
    console.log('Forcing reinitialization of first-run setup...');

    // Clear the first-run flag
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('bible-app-first-run-complete');
      } catch (storageError) {
        console.warn('localStorage access failed:', storageError);
      }
    }

    // Reset the setup state
    this.hasRunSetup = false;

    // Run setup again
    await this.initialize();
  }

  async getSetupStatus(): Promise<{
    isFirstRun: boolean;
    hasRunSetup: boolean;
    defaultModulesInstalled: boolean;
    installedModules: string[];
  }> {
    try {
      const isFirstRun = await this.checkIsFirstRun();
      const kjvInstalled = await this.moduleManager.isModuleInstalled('kjv');
      const kjvStrongsInstalled = await this.moduleManager.isModuleInstalled('kjv-strongs');
      const installedModules = await this.moduleManager.getInstalledModules();

      return {
        isFirstRun,
        hasRunSetup: this.hasRunSetup,
        defaultModulesInstalled: kjvInstalled && kjvStrongsInstalled,
        installedModules
      };
    } catch (error) {
      console.error('Error getting setup status:', error);
      return {
        isFirstRun: true,
        hasRunSetup: false,
        defaultModulesInstalled: false,
        installedModules: []
      };
    }
  }
}

export default FirstRunSetup.getInstance();