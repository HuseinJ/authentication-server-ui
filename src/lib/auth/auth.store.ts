import { writable, derived } from 'svelte/store';
import type { AuthState, User, TokenData } from './auth.types';

const STORAGE_KEY = 'auth_tokens';

interface BackendUser {
  username: { value: string };
  email: { value: string };
  roles: Array<{ name: string }>;
  userType?: string;
}

function saveTokens(tokens: TokenData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

function loadTokens(): TokenData | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as TokenData;
  } catch {
    return null;
  }
}

function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function transformUser(backendUser: BackendUser): User {
  return {
    id: backendUser.username.value,
    username: backendUser.username.value,
    email: backendUser.email.value,
    roles: backendUser.roles.map((r) => r.name),
    userType: backendUser.userType
  };
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,

    setUser: (user: User) =>
      update((state) => ({
        ...state,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      })),

    setTokens: (tokens: TokenData) => saveTokens(tokens),
    getTokens: (): TokenData | null => loadTokens(),
    setLoading: (isLoading: boolean) => update((state) => ({ ...state, isLoading })),
    setError: (error: string | null) =>
      update((state) => ({ ...state, error, isLoading: false })),
    clearError: () => update((state) => ({ ...state, error: null })),

    logout: () => {
      clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    },

    initialize: async (): Promise<boolean> => {
      const tokens = loadTokens();
      if (!tokens?.token) {
        update((state) => ({ ...state, isLoading: false }));
        return false;
      }
      if (tokens.expiresAt && tokens.expiresAt < Date.now()) {
        clearTokens();
        update((state) => ({ ...state, isLoading: false }));
        return false;
      }
      return true;
    },

    reset: () => {
      clearTokens();
      set(initialState);
    }
  };
}

export const authStore = createAuthStore();

export const user = derived(authStore, ($auth) => $auth.user);
export const isAuthenticated = derived(authStore, ($auth) => $auth.isAuthenticated);
export const isLoading = derived(authStore, ($auth) => $auth.isLoading);
export const authError = derived(authStore, ($auth) => $auth.error);
