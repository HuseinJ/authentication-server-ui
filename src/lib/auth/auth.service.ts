import { authStore, transformUser } from './auth.store';
import type {
  LoginRequest,
  AuthResponse,
  User,
  TokenData,
  MfaChallenge,
  LoginResult
} from './auth.types';
import { AuthError } from './auth.types';

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const ENDPOINTS = {
  LOGIN: `${BASE_URL}/api/auth/login`,
  LOGIN_TOTP: `${BASE_URL}/api/auth/login/mfa/totp`,
  ME: `${BASE_URL}/api/user/me`,
  OIDC_LOGIN: `${BASE_URL}/oauth2/login`,
  OIDC_LOGIN_TOTP: `${BASE_URL}/oauth2/login/mfa/totp`
};

function saveTokensToCookies(tokens: TokenData): void {
  if (typeof document === 'undefined') return;
  const maxAge = tokens.expiresAt
    ? Math.max(0, Math.floor((tokens.expiresAt - Date.now()) / 1000))
    : 60 * 60;
  document.cookie = `accessToken=${tokens.token}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearCookies(): void {
  if (typeof document === 'undefined') return;
  document.cookie = 'accessToken=; path=/; max-age=0';
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const tokens = authStore.getTokens();
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (tokens?.token) headers.set('Authorization', `Bearer ${tokens.token}`);
  return fetch(url, { ...options, headers });
}

async function parseError(response: Response): Promise<AuthError> {
  let message = response.statusText || 'Request failed';
  let retryMfaToken: string | undefined;
  try {
    const data = await response.json();
    message = data.error || data.message || message;
    retryMfaToken = data.mfaToken;
  } catch {
    // ignore
  }
  return new AuthError(message, response.status, undefined, retryMfaToken);
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw await parseError(response);
  return response.json() as Promise<T>;
}

async function storeSession(data: AuthResponse): Promise<string> {
  const tokenData: TokenData = {
    token: data.token,
    refreshToken: data.refreshToken,
    expiresAt: data.expiresIn ? Date.now() + data.expiresIn : undefined
  };

  authStore.setTokens(tokenData);
  saveTokensToCookies(tokenData);

  await getCurrentUser();
  return data.token;
}

function isMfaChallenge(data: AuthResponse | MfaChallenge): data is MfaChallenge {
  return (data as MfaChallenge).mfaRequired === true;
}

/**
 * Password login. Users with a second factor enrolled get an MFA challenge
 * instead of a session; complete it with {@link completeTotpLogin}.
 */
export async function login(credentials: LoginRequest): Promise<LoginResult> {
  authStore.setLoading(true);
  authStore.clearError();

  try {
    const response = await fetch(ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    const data = await handleResponse<AuthResponse | MfaChallenge>(response);
    if (isMfaChallenge(data)) {
      authStore.setLoading(false);
      return { status: 'mfa_required', challenge: data };
    }
    return { status: 'authenticated', token: await storeSession(data) };
  } catch (error) {
    const message = error instanceof AuthError ? error.message : 'Login failed. Please try again.';
    authStore.setError(message);
    throw error;
  }
}

/**
 * Second login step: exchanges the challenge from {@link login} plus a code from
 * the authenticator app for a session. On a wrong code the thrown AuthError
 * carries `retryMfaToken`, a fresh challenge for the next attempt.
 */
export async function completeTotpLogin(mfaToken: string, code: string): Promise<string> {
  authStore.setLoading(true);
  authStore.clearError();

  try {
    const response = await fetch(ENDPOINTS.LOGIN_TOTP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mfaToken, code })
    });
    return await storeSession(await handleResponse<AuthResponse>(response));
  } catch (error) {
    const message =
      error instanceof AuthError ? error.message : 'Verification failed. Please try again.';
    authStore.setError(message);
    throw error;
  }
}

export function oidcLogin(credentials: LoginRequest): void {
  submitForm(ENDPOINTS.OIDC_LOGIN, { ...credentials });
}

/**
 * Second step of the OIDC browser login. The backend session already holds the
 * password step; on success it resumes the authorization request, on failure it
 * redirects back to /login/mfa with `error=true`.
 */
export function oidcTotpLogin(code: string): void {
  submitForm(ENDPOINTS.OIDC_LOGIN_TOTP, { code });
}

function submitForm(action: string, fields: Record<string, string>): void {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;

  for (const [name, value] of Object.entries(fields)) {
    const field = document.createElement('input');
    field.type = 'hidden';
    field.name = name;
    field.value = value;
    form.appendChild(field);
  }

  document.body.appendChild(form);
  form.submit();
}

export async function logout(): Promise<void> {
  authStore.logout();
  clearCookies();
}

export async function getCurrentUser(): Promise<User> {
  authStore.setLoading(true);
  try {
    const response = await fetchWithAuth(ENDPOINTS.ME);
    if (response.status === 401) {
      authStore.logout();
      clearCookies();
      throw new AuthError('Session expired', 401);
    }
    const backendUser = await handleResponse<Parameters<typeof transformUser>[0]>(response);
    const user = transformUser(backendUser);
    authStore.setUser(user);
    return user;
  } finally {
    authStore.setLoading(false);
  }
}

export async function initializeAuth(): Promise<boolean> {
  const hasTokens = await authStore.initialize();
  if (!hasTokens) return false;
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}

export function hasRole(role: string): boolean {
  let userValue: User | null = null;
  authStore.subscribe((s) => (userValue = s.user))();
  return (userValue as User | null)?.roles?.includes(role) ?? false;
}

export function hasAnyRole(roles: string[]): boolean {
  return roles.some((r) => hasRole(r));
}
