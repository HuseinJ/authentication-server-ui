import { authenticatedFetch, BASE_URL } from '#lib/auth';
import {
  MfaError,
  type DisableTotpRequest,
  type MfaFactorsResponse,
  type SecondFactor,
  type TotpEnrollment
} from './mfa.types';

const ENDPOINTS = {
  FACTORS: `${BASE_URL}/api/mfa`,
  TOTP: `${BASE_URL}/api/mfa/totp`,
  TOTP_CONFIRM: `${BASE_URL}/api/mfa/totp/confirm`,
  RESET_USER_TOTP: (username: string) =>
    `${BASE_URL}/api/mfa/users/${encodeURIComponent(username)}/totp`
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = response.statusText || `Request failed (${response.status})`;
    try {
      const data = await response.json();
      message = data.error || data.message || message;
    } catch {
      // ignore
    }
    throw new MfaError(message, response.status);
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

/** Second factors the signed-in user has enrolled. */
export async function getEnrolledFactors(): Promise<SecondFactor[]> {
  const response = await authenticatedFetch(ENDPOINTS.FACTORS, { method: 'GET' });
  return (await handleResponse<MfaFactorsResponse>(response)).factors;
}

/**
 * Starts (or restarts) TOTP enrollment. TOTP is not active until
 * {@link confirmTotpEnrollment} succeeds.
 */
export async function startTotpEnrollment(): Promise<TotpEnrollment> {
  const response = await authenticatedFetch(ENDPOINTS.TOTP, { method: 'POST' });
  return handleResponse<TotpEnrollment>(response);
}

export async function confirmTotpEnrollment(code: string): Promise<void> {
  const response = await authenticatedFetch(ENDPOINTS.TOTP_CONFIRM, {
    method: 'POST',
    body: JSON.stringify({ code })
  });
  await handleResponse(response);
}

export async function disableTotp(password: string, code: string): Promise<void> {
  const body: DisableTotpRequest = { password, code };
  const response = await authenticatedFetch(ENDPOINTS.TOTP, {
    method: 'DELETE',
    body: JSON.stringify(body)
  });
  await handleResponse(response);
}

/** Admin only: removes a user's authenticator, e.g. after a lost device. */
export async function resetUserTotp(username: string): Promise<void> {
  const response = await authenticatedFetch(ENDPOINTS.RESET_USER_TOTP(username), {
    method: 'DELETE'
  });
  await handleResponse(response);
}
