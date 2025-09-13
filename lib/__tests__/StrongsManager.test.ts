import { StrongsManager } from '../StrongsManager';

// Mock fetch
global.fetch = jest.fn();

describe('StrongsManager', () => {
  let manager: StrongsManager;

  const mockDefinitions = [
    {
      id: 1,
      number: 'H1234',
      root_word: 'test',
      transliteration: 'test-trans',
      pronunciation: 'test-pron',
      entry: 'Test definition',
      tvm: 'verb'
    },
    {
      id: 2,
      number: 'G5678',
      root_word: 'greek',
      transliteration: 'greek-trans',
      pronunciation: 'greek-pron',
      entry: 'Greek definition'
    }
  ];

  beforeEach(() => {
    manager = new StrongsManager();
    jest.clearAllMocks();
    // Clear any localStorage (should not be used anymore)
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('loadDefinitions', () => {
    it('should load definitions from JSON file', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDefinitions
      });

      await manager.loadDefinitions();

      expect(fetch).toHaveBeenCalledWith('/bibles/extras/strongs_definitions.json');
      expect(manager.loaded).toBe(true);
    });

    it('should not use localStorage for caching', async () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDefinitions
      });

      await manager.loadDefinitions();

      // Should not try to read from or write to localStorage
      expect(getItemSpy).not.toHaveBeenCalledWith('strongs-definitions');
      expect(setItemSpy).not.toHaveBeenCalledWith('strongs-definitions', expect.any(String));
    });

    it('should only load once when called multiple times', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDefinitions
      });

      await manager.loadDefinitions();
      await manager.loadDefinitions();
      await manager.loadDefinitions();

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(manager.loadDefinitions()).rejects.toThrow('Failed to load Strong\'s definitions: 404');
      expect(manager.loaded).toBe(false);
    });
  });

  describe('lookup', () => {
    beforeEach(async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDefinitions
      });
      await manager.loadDefinitions();
    });

    it('should find Hebrew definition', () => {
      const result = manager.lookup('H1234');
      expect(result).toEqual({
        word: 'test',
        transliteration: 'test-trans',
        pronunciation: 'test-pron',
        definition: 'Test definition',
        tvm: 'verb'
      });
    });

    it('should find Greek definition', () => {
      const result = manager.lookup('G5678');
      expect(result).toEqual({
        word: 'greek',
        transliteration: 'greek-trans',
        pronunciation: 'greek-pron',
        definition: 'Greek definition',
        tvm: undefined
      });
    });

    it('should return null for non-existent definition', () => {
      const result = manager.lookup('H9999');
      expect(result).toBeNull();
    });
  });

  describe('extractStrongsNumbers', () => {
    it('should extract Strong\'s numbers from text', () => {
      const text = 'In the beginning {H7225} God {H430} created {H1254} the heaven {H6064} and the earth {H776}.';
      const numbers = manager.extractStrongsNumbers(text);

      expect(numbers).toEqual(['H7225', 'H430', 'H1254', 'H6064', 'H776']);
    });

    it('should handle Greek numbers', () => {
      const text = 'For God {G2316} so loved {G25} the world {G2889}';
      const numbers = manager.extractStrongsNumbers(text);

      expect(numbers).toEqual(['G2316', 'G25', 'G2889']);
    });

    it('should filter out grammar codes', () => {
      const text = 'The word {H1234} with grammar {H8802} and another {G5678}';
      const numbers = manager.extractStrongsNumbers(text);

      expect(numbers).toEqual(['H1234', 'G5678']);
    });
  });

  describe('clearCache', () => {
    it('should clear in-memory cache', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDefinitions
      });

      await manager.loadDefinitions();
      expect(manager.loaded).toBe(true);

      manager.clearCache();

      expect(manager.loaded).toBe(false);
      expect(manager.lookup('H1234')).toBeNull();
    });

    it('should not interact with localStorage', () => {
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

      manager.clearCache();

      expect(removeItemSpy).not.toHaveBeenCalled();
    });
  });
});