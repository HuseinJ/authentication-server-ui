// src/lib/auth/auth.store.ts

import { writable, derived } from 'svelte/store';
import type { AuthState, User, TokenData } from './auth.types';

const STORAGE_KEY = 'auth_tokens';

// Backend user response type (matching your API)
interface BackendUser {
  username: { value: string };
  email: { value: string };
  roles: Array<{ name: string }>;
  userType: string;
  user_TYPE: string;
}

// Helper functions for token storage
function saveTokens(tokens: TokenData): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  }
}

function loadTokens(): TokenData | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
  }
  return null;
}

function clearTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Transform backend user format to frontend User type
 */
function transformUser(backendUser: BackendUser): User {
  return {
    id: backendUser.username.value,
    username: backendUser.username.value,
    email: backendUser.email.value,
    roles: backendUser.roles.map(role => role.name)
  };
}

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Create the store
function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,
    
    // Set user and mark as authenticated
    setUser: (user: User) => {
      update(state => ({
        ...state,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }));
    },

    // Set authentication tokens
    setTokens: (tokens: TokenData) => {
      saveTokens(tokens);
    },

    // Get stored tokens
    getTokens: (): TokenData | null => {
      return loadTokens();
    },

    // Set loading state
    setLoading: (isLoading: boolean) => {
      update(state => ({ ...state, isLoading }));
    },

    // Set error
    setError: (error: string | null) => {
      update(state => ({ 
        ...state, 
        error,
        isLoading: false 
      }));
    },

    // Clear error
    clearError: () => {
      update(state => ({ ...state, error: null }));
    },

    // Logout - clear everything
    logout: () => {
      clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    },

    // Initialize - check for existing session
    initialize: async () => {
      const tokens = loadTokens();
      
      if (!tokens || !tokens.token) {
        update(state => ({ ...state, isLoading: false }));
        return false;
      }

      // Check if token is expired
      if (tokens.expiresIn && tokens.expiresIn < Date.now()) {
        clearTokens();
        update(state => ({ ...state, isLoading: false }));
        return false;
      }

      // Token exists and is valid
      update(state => ({ ...state, isLoading: false }));
      return true;
    },

    // Reset store to initial state
    reset: () => {
      clearTokens();
      set(initialState);
    }
  };
}

// Export the store
export const authStore = createAuthStore();

// Derived stores for convenience
export const user = derived(authStore, $auth => $auth.user);
export const isAuthenticated = derived(authStore, $auth => $auth.isAuthenticated);
export const isLoading = derived(authStore, $auth => $auth.isLoading);
export const authError = derived(authStore, $auth => $auth.error);

// Export the transform function for use in auth.service.ts
export { transformUser };