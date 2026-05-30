import { authStore } from './auth.store';
import { BASE_URL } from './auth.service';

interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
}

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

  // On 401 we have no refresh endpoint on the backend, so just log out.
  if (response.status === 401 && !skipAuth) {
    authStore.logout();
    if (typeof document !== 'undefined') {
      document.cookie = 'accessToken=; path=/; max-age=0';
    }
  }

  return response;
}

export function createAuthInterceptor(): () => void {
  const originalFetch = window.fetch;
  const authOnlyEndpoints = ['/api/auth/login'];

  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const isApiCall = url.startsWith(BASE_URL);
    const shouldSkipAuth = authOnlyEndpoints.some((e) => url.includes(e));

    if (!isApiCall || shouldSkipAuth) {
      return originalFetch(input, init);
    }

    return authenticatedFetch(url, init as RequestConfig);
  };

  return () => {
    window.fetch = originalFetch;
  };
}
