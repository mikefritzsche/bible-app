const DB_NAME = 'BibleAppDB';
const DB_VERSION = 1;
const CACHE_STORE = 'bibleCache';

let db = null;

async function openDB() {
  if (db) return db;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(CACHE_STORE)) {
        database.createObjectStore(CACHE_STORE, { keyPath: 'id' });
      }
    };
  });
}

export async function storeBibleCache(id, data) {
  try {
    const database = await openDB();
    const transaction = database.transaction([CACHE_STORE], 'readwrite');
    const store = transaction.objectStore(CACHE_STORE);
    
    const cacheData = {
      id,
      data,
      timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(cacheData);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error storing Bible cache:', error);
    return false;
  }
}

export async function getBibleCache(id) {
  try {
    const database = await openDB();
    const transaction = database.transaction([CACHE_STORE], 'readonly');
    const store = transaction.objectStore(CACHE_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
          if (result.timestamp > oneWeekAgo) {
            resolve(result.data);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting Bible cache:', error);
    return null;
  }
}

export async function hasBibleCache(id) {
  const cache = await getBibleCache(id);
  return cache !== null;
}