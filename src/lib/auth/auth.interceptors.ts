// src/lib/auth/auth.interceptor.ts

import { authStore } from './auth.store';
import { refreshToken } from './auth.service';

interface RequestConfig extends RequestInit {
  skipAuthRefresh?: boolean;
}

/**
 * Enhanced fetch with automatic token injection and refresh
 */
export async function authenticatedFetch(
  url: string,
  config: RequestConfig = {},
  fetchFn: typeof fetch = fetch
): Promise<Response> {
  const { skipAuthRefresh = false, ...fetchConfig } = config;

  const tokens = authStore.getTokens();

  const headers = new Headers(fetchConfig.headers);
  
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (tokens?.token) {
    headers.set('Authorization', `Bearer ${tokens.token}`);
  }

  console.log("Headers:");
  headers.forEach((value, key) => {
    console.log(`${key}: ${value}`);
  });

  // Use the passed fetchFn instead of global fetch
  let response = await fetchFn(url, {
    ...fetchConfig,
    headers
  });

  // Handle 401 - token expired, try to refresh
  if (response.status === 401 && !skipAuthRefresh && tokens?.refreshToken) {
    try {
      // Refresh the token
      await refreshToken();
      
      // Retry the request with new token
      const newTokens = authStore.getTokens();
      if (newTokens?.token) {
        headers.set('Authorization', `Bearer ${newTokens.token}`);
        response = await fetchFn(url, {
          ...fetchConfig,
          headers
        });
      }
    } catch (refreshError) {
      // Refresh failed, logout user
      authStore.logout();
      throw new Error('Session expired. Please login again.');
    }
  }

  // Response doesn't have an 'error' property
  // Check response.ok instead (it's false for status >= 400)
  if (!response.ok) {
    // Try to parse error message from response
    let errorMessage = `Request failed with status ${response.status}`;
    let errorDetails;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
      errorDetails = errorData.errors;
    } catch {
      // If response isn't JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    // Create a custom error with the response attached
    const error = new Error(errorMessage) as Error & { 
      status: number; 
      details?: any;
      response: Response;
    };
    error.status = response.status;
    error.details = errorDetails;
    error.response = response;

    throw error;
  }

  return response;
}

export function createAuthInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const authEndpoints = ['/api/auth/login', '/auth/register', '/auth/refresh'];
    const shouldSkipAuth = authEndpoints.some(endpoint => url.includes(endpoint));
    
    if (shouldSkipAuth) {
      return originalFetch(input, init);
    }

    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    const isApiCall = url.includes(apiBaseUrl);

    if (!isApiCall) {
      return originalFetch(input, init);
    }

    return authenticatedFetch(url, init as RequestConfig, originalFetch);
  };

  // Return cleanup function
  return () => {
    window.fetch = originalFetch;
  };
}

/**
 * Request queue for handling multiple requests during token refresh
 */
class RequestQueue {
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  async onAccessTokenRefreshed(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  notifyRefreshSubscribers(token: string) {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  async handleRefresh(refreshFn: () => Promise<string>): Promise<string> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      
      try {
        const token = await refreshFn();
        this.notifyRefreshSubscribers(token);
        return token;
      } finally {
        this.isRefreshing = false;
      }
    }

    return new Promise((resolve) => {
      this.onAccessTokenRefreshed((token: string) => {
        resolve(token);
      });
    });
  }
}

export const requestQueue = new RequestQueue();