// src/lib/auth/auth.init.ts

import { browser } from '$app/environment';
import { createAuthInterceptor } from './auth.interceptors';
import { initializeAuth } from './auth.service';

let cleanupInterceptor: (() => void) | null = null;

export async function initAuth() {
  if (!browser) return;

  // Set up the fetch interceptor
  if (!cleanupInterceptor) {
    cleanupInterceptor = createAuthInterceptor();
  }

  // Load tokens and user data
  await initializeAuth();
}