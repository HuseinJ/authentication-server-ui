import { redirect, type Handle } from '@sveltejs/kit';

const PROTECTED_PREFIXES = ['/users', '/oidc'];

export const handle: Handle = async ({ event, resolve }) => {
  const accessToken = event.cookies.get('accessToken') ?? null;
  event.locals.accessToken = accessToken;

  const path = event.url.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

  if (isProtected && !accessToken) {
    throw redirect(302, '/login');
  }

  // Keep an already-authenticated user on /login during an OIDC flow so they
  // can choose to continue as the current user or sign in as someone else.
  // Bouncing to /users here would discard the flow and break the OIDC login.
  const isOidcFlow = event.url.searchParams.get('flow') === 'oidc';
  if (path === '/login' && accessToken && !isOidcFlow) {
    throw redirect(302, '/users');
  }

  return resolve(event);
};
