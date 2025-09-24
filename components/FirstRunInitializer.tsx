'use client';

import { useEffect, useState } from 'react';

interface FirstRunStatus {
  isFirstRun: boolean;
  hasRunSetup: boolean;
  defaultModulesInstalled: boolean;
  installedModules: string[];
}

export default function FirstRunInitializer() {
  const [status, setStatus] = useState<FirstRunStatus | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      checkFirstRunStatus();
    }
  }, []);

  const checkFirstRunStatus = async () => {
    try {
      const response = await fetch('/api/modules/first-run');
      const data = await response.json();
      setStatus(data.status);

      // Auto-initialize if it's first run and default modules aren't installed
      if (data.status.isFirstRun && !data.status.defaultModulesInstalled) {
        await initializeSetup();
      }
    } catch (err) {
      console.error('Error checking first-run status:', err);
      setError('Failed to check setup status');
    }
  };

  const initializeSetup = async () => {
    setIsInitializing(true);
    setError(null);

    try {
      const response = await fetch('/api/modules/first-run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'initialize' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize setup');
      }

      setStatus(data.status);
      console.log('First-run setup completed successfully');
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
      const response = await fetch('/api/modules/first-run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reinitialize' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reinitialize setup');
      }

      setStatus(data.status);
      console.log('First-run setup reinitialized successfully');
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