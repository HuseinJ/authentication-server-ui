// src/hooks.server.ts
// This is the PROPER way to handle auth in SvelteKit on the server

import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Get token from cookies (we'll store it there after login)
  const accessToken = event.cookies.get('accessToken');
  
  // Add token to locals so it's available in all server routes
  event.locals.accessToken = accessToken || null;
  event.locals.user = null;

  // If token exists, you can decode it and add user info to locals
  if (accessToken) {
    // TODO: Decode JWT and extract user info
    // For now, just mark as authenticated
    // const decoded = decodeJWT(accessToken);
    // event.locals.user = decoded;
      }

  // Protected routes - redirect to login if not authenticated
  const protectedRoutes = ['/dashboard', '/profile', '/settings'];
  const isProtectedRoute = protectedRoutes.some(route => 
    event.url.pathname.startsWith(route)
  );

  if (isProtectedRoute && !accessToken) {
    throw redirect(302, '/login');
  }

  // Guest-only routes - redirect to dashboard if authenticated
  const guestRoutes = ['/login', '/register'];
  const isGuestRoute = guestRoutes.some(route => 
    event.url.pathname === route
  );

  if (isGuestRoute && accessToken) {
    throw redirect(302, '/dashboard');
  }

  return resolve(event);
};