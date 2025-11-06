import { browser } from '$app/environment';
import { initAuth } from '$lib/auth/auth.init';

export const ssr = false; // Disable SSR if your app is client-side only

export async function load() {
  if (browser) {
    await initAuth();
  }
  
  return {};
}