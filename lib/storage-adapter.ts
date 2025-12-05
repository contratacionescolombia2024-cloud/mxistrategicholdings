
// Storage adapter that works across all platforms without SSR issues
import { Platform } from 'react-native';

export interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

// Check if we're in a runtime environment (not SSR/build)
const isRuntime = (): boolean => {
  // Check for window in web environments
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }
  
  // For native, check if we're not in a Node.js build environment
  return typeof global !== 'undefined' && !process.env.EXPO_PUBLIC_STATIC_RENDERING;
};

// Lazy AsyncStorage loader - only loads when actually needed
let asyncStorageInstance: any = null;
const getAsyncStorage = () => {
  if (!asyncStorageInstance && isRuntime()) {
    try {
      asyncStorageInstance = require('@react-native-async-storage/async-storage').default;
    } catch (error) {
      console.error('Failed to load AsyncStorage:', error);
    }
  }
  return asyncStorageInstance;
};

// Mock storage for build/SSR environments
const mockStorage: StorageAdapter = {
  getItem: async () => {
    console.warn('Storage accessed during build/SSR - returning null');
    return null;
  },
  setItem: async () => {
    console.warn('Storage accessed during build/SSR - ignoring');
  },
  removeItem: async () => {
    console.warn('Storage accessed during build/SSR - ignoring');
  },
};

// Web storage implementation
const createWebStorage = (): StorageAdapter => {
  return {
    getItem: async (key: string) => {
      if (!isRuntime()) {
        return null;
      }
      
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      } catch (error) {
        console.error('Error getting item from localStorage:', error);
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      if (!isRuntime()) {
        return;
      }
      
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (error) {
        console.error('Error setting item in localStorage:', error);
      }
    },
    removeItem: async (key: string) => {
      if (!isRuntime()) {
        return;
      }
      
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (error) {
        console.error('Error removing item from localStorage:', error);
      }
    },
  };
};

// Native storage implementation (AsyncStorage) - completely lazy
const createNativeStorage = (): StorageAdapter => {
  return {
    getItem: async (key: string) => {
      if (!isRuntime()) {
        return null;
      }
      
      try {
        const AsyncStorage = getAsyncStorage();
        if (!AsyncStorage) {
          console.warn('AsyncStorage not available');
          return null;
        }
        return await AsyncStorage.getItem(key);
      } catch (error) {
        console.error('Error getting item from AsyncStorage:', error);
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      if (!isRuntime()) {
        return;
      }
      
      try {
        const AsyncStorage = getAsyncStorage();
        if (!AsyncStorage) {
          console.warn('AsyncStorage not available');
          return;
        }
        await AsyncStorage.setItem(key, value);
      } catch (error) {
        console.error('Error setting item in AsyncStorage:', error);
      }
    },
    removeItem: async (key: string) => {
      if (!isRuntime()) {
        return;
      }
      
      try {
        const AsyncStorage = getAsyncStorage();
        if (!AsyncStorage) {
          console.warn('AsyncStorage not available');
          return;
        }
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing item from AsyncStorage:', error);
      }
    },
  };
};

// Factory function to get the appropriate storage adapter
export const getStorageAdapter = (): StorageAdapter => {
  if (!isRuntime()) {
    console.log('Not in runtime environment - using mock storage');
    return mockStorage;
  }

  if (Platform.OS === 'web') {
    return createWebStorage();
  } else {
    return createNativeStorage();
  }
};
