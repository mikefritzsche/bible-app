'use client';

import React, { useEffect, useState } from 'react';
import getModuleManager from '@/lib/modules/ModuleManager';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('FirstRunInitializer ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Return null to render nothing instead of crashing the app
      return null;
    }

    return this.props.children;
  }
}

interface FirstRunStatus {
  isFirstRun: boolean;
  hasRunSetup: boolean;
  defaultModulesInstalled: boolean;
  installedModules: string[];
}

function FirstRunInitializerInternal() {
  const [status, setStatus] = useState<FirstRunStatus | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moduleManager, setModuleManager] = useState<any>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      try {
        const manager = getModuleManager();
        setModuleManager(manager);
        checkFirstRunStatus(manager);
      } catch (err) {
        console.error('Failed to initialize ModuleManager:', err);
        setError('Failed to initialize module system');
      }
    }
  }, []);

  const checkFirstRunStatus = async (manager: any) => {
    try {
      // Check if we have a flag in localStorage
      const hasRunBefore = localStorage.getItem('bible-app-first-run-complete') === 'true';

      // Check if KJV modules are already installed
      if (!manager) {
        throw new Error('ModuleManager is not available');
      }
      const kjvInstalled = await manager.isModuleInstalled('kjv');
      const kjvStrongsInstalled = await manager.isModuleInstalled('kjv-strongs');
      const installedModules = await manager.getInstalledModules();

      const isFirstRun = !hasRunBefore || (!kjvInstalled && !kjvStrongsInstalled);
      const defaultModulesInstalled = kjvInstalled && kjvStrongsInstalled;

      const currentStatus: FirstRunStatus = {
        isFirstRun,
        hasRunSetup: hasRunBefore,
        defaultModulesInstalled,
        installedModules
      };

      setStatus(currentStatus);
      console.log('First-run status:', currentStatus);

      // Auto-initialize if it's first run and default modules aren't installed
      if (isFirstRun && !defaultModulesInstalled) {
        await initializeSetup(manager);
      }
    } catch (err) {
      console.error('Error checking first-run status:', err);
      setError('Failed to check setup status');
    }
  };

  const initializeSetup = async (manager: any) => {
    setIsInitializing(true);
    setError(null);

    try {
      console.log('Starting first-run setup...');

      const defaultModules = [
        { id: 'kjv', name: 'King James Version' },
        { id: 'kjv-strongs', name: 'KJV with Strong\'s Numbers' }
      ];

      for (const module of defaultModules) {
        try {
          console.log(`Installing default module: ${module.name} (${module.id})`);

          if (!manager) {
            throw new Error('ModuleManager is not available');
          }
          const isInstalled = await manager.isModuleInstalled(module.id);
          if (!isInstalled) {
            await manager.downloadModule(module.id);
            console.log(`Successfully installed ${module.name}`);
          } else {
            console.log(`${module.name} already installed`);
          }
        } catch (error) {
          console.error(`Failed to install ${module.name}:`, error);
          // Continue with other modules even if one fails
        }
      }

      // Mark first run as complete
      localStorage.setItem('bible-app-first-run-complete', 'true');
      console.log('First-run setup completed successfully');

      // Update status
      await checkFirstRunStatus(manager);
    } catch (err) {
      console.error('Error initializing first-run setup:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize setup');
    } finally {
      setIsInitializing(false);
    }
  };

  const reinitializeSetup = async () => {
    setIsInitializing(true);
    setError(null);

    try {
      console.log('Reinitializing first-run setup...');

      // Clear the first-run flag
      localStorage.removeItem('bible-app-first-run-complete');

      // Reset and re-run setup
      if (moduleManager) {
        await initializeSetup(moduleManager);
      }
    } catch (err) {
      console.error('Error reinitializing first-run setup:', err);
      setError(err instanceof Error ? err.message : 'Failed to reinitialize setup');
    } finally {
      setIsInitializing(false);
    }
  };

  // This component doesn't render anything visible
  // It just handles the background initialization
  return null;
}

// Wrap the component in an error boundary to prevent app crashes
export default function FirstRunInitializerWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <FirstRunInitializerInternal />
    </ErrorBoundary>
  );
}