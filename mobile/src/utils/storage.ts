import * as SecureStore from 'expo-secure-store';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  PUSH_TOKEN: 'push_token',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;

class SecureStorage {
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  }

  async setObject(key: string, value: object): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await this.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error storing object ${key}:`, error);
      throw error;
    }
  }

  async getObject<T = any>(key: string): Promise<T | null> {
    try {
      const jsonValue = await this.getItem(key);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error retrieving object ${key}:`, error);
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      // Clear all auth-related data
      await this.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await this.removeItem(STORAGE_KEYS.USER_DATA);
      await this.removeItem(STORAGE_KEYS.PUSH_TOKEN);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }
}

export const secureStorage = new SecureStorage();