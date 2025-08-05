import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = __DEV__ ? 'http://localhost:5000/api' : 'https://api.meshfund.com/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  kycStatus: string;
  reputationScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  error?: string;
}

class AuthServiceClass {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = await this.getStoredToken();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async login(credentials: LoginRequest): Promise<{ user: User; token: string }> {
    const response: AuthResponse = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success) {
      await this.storeAuth(response.data.user, response.data.token);
      return response.data;
    }

    throw new Error(response.error || 'Login failed');
  }

  async register(userData: RegisterRequest): Promise<{ user: User; token: string }> {
    const response: AuthResponse = await this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success) {
      await this.storeAuth(response.data.user, response.data.token);
      return response.data;
    }

    throw new Error(response.error || 'Registration failed');
  }

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('userData');
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await this.makeRequest('/auth/me');
      
      if (response.success) {
        await this.storeUser(response.data.user);
        return response.data.user;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  async refreshUserData(): Promise<User | null> {
    return this.getCurrentUser();
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    const response = await this.makeRequest('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (response.success) {
      await this.storeUser(response.data.user);
      return response.data.user;
    }

    throw new Error(response.error || 'Profile update failed');
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return !!token;
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('authToken');
    } catch (error) {
      console.error('Failed to get stored token:', error);
      return null;
    }
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await SecureStore.getItemAsync('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get stored user:', error);
      return null;
    }
  }

  private async storeAuth(user: User, token: string): Promise<void> {
    await SecureStore.setItemAsync('authToken', token);
    await SecureStore.setItemAsync('userData', JSON.stringify(user));
  }

  private async storeUser(user: User): Promise<void> {
    await SecureStore.setItemAsync('userData', JSON.stringify(user));
  }
}

export const AuthService = new AuthServiceClass();