// Debug script to check storage status
console.log('=== Storage Debug Info ===');

// Check environment
console.log('Environment:', {
  isBrowser: typeof window !== 'undefined',
  isElectron: typeof window !== 'undefined' && !!window.electronAPI,
  hasIndexedDB: typeof indexedDB !== 'undefined'
});

// Check IndexedDB if available
if (typeof indexedDB !== 'undefined') {
  console.log('IndexedDB available');

  // Try to open the database
  const request = indexedDB.open('BibleAppModules', 1);

  request.onsuccess = function() {
    const db = request.result;
    console.log('Database opened successfully');

    // Check for modules store
    if (db.objectStoreNames.contains('modules')) {
      console.log('Modules store exists');

      // List all modules
      const transaction = db.transaction('modules', 'readonly');
      const store = transaction.objectStore('modules');
      const getAll = store.getAllKeys();

      getAll.onsuccess = function() {
        console.log('Stored modules:', getAll.result);
      };

      getAll.onerror = function() {
        console.error('Failed to get module keys');
      };
    } else {
      console.log('Modules store does not exist');
    }
  };

  request.onerror = function() {
    console.error('Failed to open database:', request.error);
  };

  request.onupgradeneeded = function() {
    console.log('Database upgrade needed');
  };
} else {
  console.log('IndexedDB not available');
}

// Check localStorage
console.log('LocalStorage:', {
  firstRunFlag: localStorage.getItem('bible-app-first-run-complete'),
  selectedVersion: localStorage.getItem('selectedBibleVersion')
});