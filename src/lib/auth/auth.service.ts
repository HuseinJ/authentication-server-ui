// src/lib/auth/auth.service.ts
import type { BackendUser } from '$lib/users/users.types';
import { authStore, transformUser } from './auth.store';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenResponse,
  User,
  TokenData
} from './auth.types';
import { AuthError } from './auth.types';

// Configuration - you'll replace these with your actual Spring backend URLs
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  REFRESH: `${API_BASE_URL}/auth/refresh`,
  ME: `${API_BASE_URL}/api/user/me`
};


/**
 * Save tokens to both localStorage and cookies
 */
function saveTokensToCookies(tokens: TokenData): void {
    if (typeof document === 'undefined') return;
  
    const maxAge = tokens.expiresIn 
      ? Math.floor((tokens.expiresIn - Date.now()) / 1000)
      : 60 * 60 * 24 * 7; // 7 days default
  
    // Save access token to cookie for server-side access
    document.cookie = `accessToken=${tokens.token}; path=/; max-age=${maxAge}; SameSite=Lax`;
    
    // Save refresh token to cookie
    document.cookie = `refreshToken=${tokens.refreshToken}; path=/; max-age=${maxAge * 2}; SameSite=Lax`;
  }
  
  /**
   * Clear cookies
   */
  function clearCookies(): void {
    if (typeof document === 'undefined') return;
    
    document.cookie = 'accessToken=; path=/; max-age=0';
    document.cookie = 'refreshToken=; path=/; max-age=0';
  }
  
  /**
   * Make an authenticated API request
   */
  async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const tokens = authStore.getTokens();
    
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    
    if (tokens?.token) {
      headers.set('Authorization', `Bearer ${tokens.token}`);
    }
  
    const response = await fetch(url, {
      ...options,
      headers
    });
  
    return response;
  }
  
  /**
   * Handle API errors
   */
  async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = 'An error occurred';
      let errorDetails;
  
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorDetails = errorData.errors;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
  
      throw new AuthError(errorMessage, response.status, errorDetails);
    }
  
    return response.json();
  }
  
  /**
   * Login user
   */
  export async function login(credentials: LoginRequest): Promise<string> {
    authStore.setLoading(true);
    authStore.clearError();
  
    try {
      const response = await fetch(ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });
  
      const data = await handleResponse<AuthResponse>(response);
  
      // Store tokens
      const tokenData: TokenData = {
        token: data.token,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn ? Date.now() + data.expiresIn * 1000 : undefined
      };
      
      // Save to localStorage
      authStore.setTokens(tokenData);
      
      // ALSO save to cookies for server-side access
      saveTokensToCookies(tokenData);
  
      return data.token;
    } catch (error) {
      const errorMessage = error instanceof AuthError 
        ? error.message 
        : 'Login failed. Please try again.';
      authStore.setError(errorMessage);
      throw error;
    }
  }
  
  /**
   * Register new user
   */
  export async function register(userData: RegisterRequest): Promise<string> {
    authStore.setLoading(true);
    authStore.clearError();
  
    try {
      const response = await fetch(ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
  
      const data = await handleResponse<AuthResponse>(response);
  
      // Store tokens
      const tokenData: TokenData = {
        token: data.token,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn ? Date.now() + data.expiresIn * 1000 : undefined
      };
      
      authStore.setTokens(tokenData);
      saveTokensToCookies(tokenData);
  
      return data.token
    } catch (error) {
      const errorMessage = error instanceof AuthError 
        ? error.message 
        : 'Registration failed. Please try again.';
      authStore.setError(errorMessage);
      throw error;
    }
  }
  
  /**
   * Logout user
   */
  export async function logout(): Promise<void> {
    try {
      const tokens = authStore.getTokens();
      
      if (tokens?.token) {
        await fetch(ENDPOINTS.LOGOUT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authStore.logout();
      clearCookies();
    }
  }
  
  /**
   * Refresh access token
   */
  export async function refreshToken(): Promise<string> {
    const tokens = authStore.getTokens();
  
    if (!tokens?.refreshToken) {
      throw new AuthError('No refresh token available', 401);
    }
  
    try {
      const response = await fetch(ENDPOINTS.REFRESH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: tokens.refreshToken })
      });
  
      const data = await handleResponse<RefreshTokenResponse>(response);
  
      // Update tokens
      const newTokenData: TokenData = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresIn ? Date.now() + data.expiresIn * 1000 : undefined
      };
      
      authStore.setTokens(newTokenData);
      saveTokensToCookies(newTokenData);
  
      return data.accessToken;
    } catch (error) {
      authStore.logout();
      clearCookies();
      throw error;
    }
  }
  
  /**
   * Get current user from backend
   */
  export async function getCurrentUser(): Promise<User> {
    authStore.setLoading(true);
  
    try {
      const response = await fetchWithAuth(ENDPOINTS.ME);
      const backendUser = await handleResponse<BackendUser>(response);
      
      // Transform the backend user to frontend format
      const user = transformUser(backendUser);
      
      authStore.setUser(user);
      return user;
    } catch (error) {
      if (error instanceof AuthError && error.status === 401) {
        try {
          await refreshToken();
          const response = await fetchWithAuth(ENDPOINTS.ME);
          const backendUser = await handleResponse<BackendUser>(response);
          
          // Transform here too
          const user = transformUser(backendUser);
          
          authStore.setUser(user);
          return user;
        } catch {
          authStore.logout();
          clearCookies();
          throw error;
        }
      }
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  }
  
  export async function initializeAuth(): Promise<boolean> {
    const hasTokens = await authStore.initialize();
  
    if (!hasTokens) {
      return false;
    }
  
    try {
      await getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Check if user has specific role
   */
  export function hasRole(role: string): boolean {
    // TODO: Implement based on your JWT structure
    return false;
  }
  
  /**
   * Check if user has any of the specified roles
   */
  export function hasAnyRole(roles: string[]): boolean {
    return roles.some(role => hasRole(role));
  }