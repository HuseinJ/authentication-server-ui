import { browser } from '$app/environment';
import { initializeAuth } from './auth.service';

export async function initAuth() {
  if (!browser) return;
  await initializeAuth();
}
