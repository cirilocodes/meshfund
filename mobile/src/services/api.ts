import { STORAGE_KEYS, secureStorage } from '../utils/storage';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api'
  : 'https://api.meshfund.com/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getAuthToken(): Promise<string | null> {
    return await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  private async getHeaders(includeAuth: boolean = true): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = await this.getHeaders(includeAuth);
      
      const config: RequestInit = {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      };

      console.log(`API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error: any) {
      console.error('API Error:', error);
      
      if (error.message.includes('Network request failed')) {
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      
      if (error.message.includes('401') || error.message.includes('403')) {
        // Token expired or invalid - clear auth data
        await secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        throw new Error('Session expired. Please log in again.');
      }
      
      throw error;
    }
  }

  async get<T = any>(endpoint: string, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }, includeAuth);
  }

  async post<T = any>(
    endpoint: string,
    data?: any,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth
    );
  }

  async put<T = any>(
    endpoint: string,
    data?: any,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth
    );
  }

  async patch<T = any>(
    endpoint: string,
    data?: any,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth
    );
  }

  async delete<T = any>(endpoint: string, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' }, includeAuth);
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Convenience function for making API requests
export const apiRequest = <T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: any,
  includeAuth: boolean = true
): Promise<ApiResponse<T>> => {
  switch (method) {
    case 'GET':
      return apiClient.get<T>(endpoint, includeAuth);
    case 'POST':
      return apiClient.post<T>(endpoint, data, includeAuth);
    case 'PUT':
      return apiClient.put<T>(endpoint, data, includeAuth);
    case 'PATCH':
      return apiClient.patch<T>(endpoint, data, includeAuth);
    case 'DELETE':
      return apiClient.delete<T>(endpoint, includeAuth);
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
};
