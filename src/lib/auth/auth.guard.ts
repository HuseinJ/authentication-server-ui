import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export function requireAuth(event: RequestEvent, redirectTo: string = '/login') {
  const authHeader = event.request.headers.get('Authorization');
  const cookieToken = event.cookies.get('accessToken');

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : cookieToken;

  if (!token) {
    throw redirect(302, redirectTo);
  }

  return { accessToken: token };
}

export function requireGuest(event: RequestEvent, redirectTo: string = '/users') {
  const authHeader = event.request.headers.get('Authorization');
  const cookieToken = event.cookies.get('accessToken');

  if (authHeader || cookieToken) {
    throw redirect(302, redirectTo);
  }
}

export function optionalAuth(event: RequestEvent) {
  const authHeader = event.request.headers.get('Authorization');
  const cookieToken = event.cookies.get('accessToken');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : cookieToken;
  return token ? { accessToken: token } : null;
}
