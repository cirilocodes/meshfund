import { create } from 'zustand';
import { AuthService, User, LoginRequest, RegisterRequest } from '../services/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, phoneNumber?: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const credentials: LoginRequest = { email, password };
      const response = await AuthService.login(credentials);
      
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Login failed',
        isAuthenticated: false,
        user: null,
      });
      throw error;
    }
  },

  register: async (email: string, password: string, fullName: string, phoneNumber?: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const userData: RegisterRequest = {
        email,
        password,
        fullName,
        phoneNumber,
      };
      
      const response = await AuthService.register(userData);
      
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Registration failed',
        isAuthenticated: false,
        user: null,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      
      await AuthService.logout();
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      
      // Force logout even if API call fails
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  initialize: async () => {
    try {
      set({ isLoading: true });
      
      const isAuth = await AuthService.isAuthenticated();
      
      if (isAuth) {
        // Try to get current user from API
        const user = await AuthService.getCurrentUser();
        
        if (user) {
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          // Token might be invalid, get stored user as fallback
          const storedUser = await AuthService.getStoredUser();
          
          if (storedUser) {
            set({
              user: storedUser,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            // No valid user data, logout
            await get().logout();
          }
        }
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    } catch (error: any) {
      console.error('Auth initialization error:', error);
      
      // Try to use stored user data as fallback
      try {
        const storedUser = await AuthService.getStoredUser();
        const hasToken = await AuthService.getStoredToken();
        
        if (storedUser && hasToken) {
          set({
            user: storedUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (fallbackError) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    }
  },

  refreshUser: async () => {
    try {
      const user = await AuthService.refreshUserData();
      
      if (user) {
        set({ user, error: null });
      }
    } catch (error: any) {
      console.error('Failed to refresh user data:', error);
      
      // If refresh fails due to invalid token, logout
      if (error.message.includes('Session expired') || error.message.includes('401')) {
        await get().logout();
      }
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    try {
      set({ isLoading: true, error: null });
      
      const updatedUser = await AuthService.updateProfile(updates);
      
      set({
        user: updatedUser,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Profile update failed',
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
