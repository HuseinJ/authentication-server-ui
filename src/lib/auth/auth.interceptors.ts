import { authStore } from './auth.store';

interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Wrapper around native fetch that injects the Bearer token and logs the user
 * out on 401. All service files use this directly — there is intentionally no
 * `window.fetch` override (wrapping fetch and then calling fetch inside the
 * wrapper recurses forever).
 */
export async function authenticatedFetch(
  url: string,
  config: RequestConfig = {}
): Promise<Response> {
  const { skipAuth = false, ...fetchConfig } = config;

  const headers = new Headers(fetchConfig.headers);
  if (!headers.has('Content-Type') && !(fetchConfig.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (!skipAuth) {
    const tokens = authStore.getTokens();
    if (tokens?.token) headers.set('Authorization', `Bearer ${tokens.token}`);
  }

  const response = await fetch(url, { ...fetchConfig, headers });

  if (response.status === 401 && !skipAuth) {
    authStore.logout();
    if (typeof document !== 'undefined') {
      document.cookie = 'accessToken=; path=/; max-age=0';
    }
  }

  return response;
}
