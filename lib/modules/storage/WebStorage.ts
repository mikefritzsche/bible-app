export class WebStorage {
  private readonly DB_NAME = 'BibleAppModules';
  private readonly STORE_NAME = 'modules';
  private db: IDBDatabase | null = null;

  constructor() {
    // Lazy initialization - database will be initialized when first needed
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('WebStorage is only available in browser environment'));
        return;
      }

      const request = indexedDB.open(this.DB_NAME, 1);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    if (!this.db) {
      throw new Error('Database not available');
    }
    return this.db;
  }

  async saveModuleData(moduleId: string, data: any): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('WebStorage is only available in browser environment');
    }

    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(data, moduleId);

      request.onerror = () => {
        reject(new Error(`Failed to save module data for ${moduleId}`));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async loadModuleData(moduleId: string): Promise<any> {
    if (typeof window === 'undefined') {
      throw new Error('WebStorage is only available in browser environment');
    }

    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(moduleId);

      request.onerror = () => {
        reject(new Error(`Failed to load module data for ${moduleId}`));
      };

      request.onsuccess = () => {
        const result = request.result;
        if (result === undefined) {
          reject(new Error(`Module ${moduleId} not found in storage`));
        } else {
          resolve(result);
        }
      };
    });
  }

  async deleteModuleData(moduleId: string): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('WebStorage is only available in browser environment');
    }

    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(moduleId);

      request.onerror = () => {
        reject(new Error(`Failed to delete module data for ${moduleId}`));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async listInstalledModules(): Promise<string[]> {
    if (typeof window === 'undefined') {
      throw new Error('WebStorage is only available in browser environment');
    }

    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAllKeys();

      request.onerror = () => {
        reject(new Error('Failed to list installed modules'));
      };

      request.onsuccess = () => {
        resolve(request.result as string[]);
      };
    });
  }

  async getModulesDirectory(): Promise<string> {
    // Return a placeholder for web environment
    return 'IndexedDB Storage';
  }

  isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
  }
}

export default WebStorage;