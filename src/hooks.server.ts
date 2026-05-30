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

  if (path === '/login' && accessToken) {
    throw redirect(302, '/users');
  }

  return resolve(event);
};
