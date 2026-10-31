import { browser } from '$app/env';
import { initializeAuth } from './auth.service';

export async function initAuth() {
  if (!browser) return;
  await initializeAuth();
}
