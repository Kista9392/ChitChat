class MemoryStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

class SafeStorage {
  private fallbackStore = new MemoryStorage();

  private isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  getItem(key: string): string | null {
    if (this.isSupported()) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.warn('localStorage.getItem failed, using memory fallback:', e);
      }
    }
    return this.fallbackStore.getItem(key);
  }

  setItem(key: string, value: string): void {
    if (this.isSupported()) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch (e) {
        console.warn('localStorage.setItem failed, using memory fallback:', e);
      }
    }
    this.fallbackStore.setItem(key, value);
  }

  removeItem(key: string): void {
    if (this.isSupported()) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch (e) {
        console.warn('localStorage.removeItem failed, using memory fallback:', e);
      }
    }
    this.fallbackStore.removeItem(key);
  }

  clear(): void {
    if (this.isSupported()) {
      try {
        window.localStorage.clear();
        return;
      } catch (e) {
        console.warn('localStorage.clear failed, using memory fallback:', e);
      }
    }
    this.fallbackStore.clear();
  }
}

export const safeStorage = new SafeStorage();
