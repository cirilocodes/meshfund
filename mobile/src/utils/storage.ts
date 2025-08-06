import * as SecureStore from 'expo-secure-store';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  BIOMETRIC_ENABLED: 'biometricEnabled',
  PUSH_TOKEN: 'pushToken',
  ONBOARDING_COMPLETED: 'onboardingCompleted',
} as const;

class SecureStorage {
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`[SecureStorage] Error storing key "${key}":`, error);
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`[SecureStorage] Error retrieving key "${key}":`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`[SecureStorage] Error removing key "${key}":`, error);
      throw error;
    }
  }

  async setObject<T extends object>(key: string, value: T): Promise<void> {
    try {
      const json = JSON.stringify(value);
      await this.setItem(key, json);
    } catch (error) {
      console.error(`[SecureStorage] Error storing object "${key}":`, error);
      throw error;
    }
  }

  async getObject<T = any>(key: string): Promise<T | null> {
    try {
      const raw = await this.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error(`[SecureStorage] Error parsing object "${key}":`, error);
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      await Promise.all([
        this.removeItem(STORAGE_KEYS.AUTH_TOKEN),
        this.removeItem(STORAGE_KEYS.USER_DATA),
        this.removeItem(STORAGE_KEYS.PUSH_TOKEN),
        this.removeItem(STORAGE_KEYS.BIOMETRIC_ENABLED),
        this.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
      ]);
    } catch (error) {
      console.error('[SecureStorage] Error clearing storage:', error);
      throw error;
    }
  }
}

export const secureStorage = new SecureStorage();
