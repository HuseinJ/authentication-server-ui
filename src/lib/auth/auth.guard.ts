// src/lib/auth/guards/auth.guard.ts

import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Check if user is authenticated (for use in +page.server.ts or hooks.server.ts)
 * Server-side: checks cookies or authorization header
 */
export function requireAuth(event: RequestEvent, redirectTo: string = '/login') {
  // Try to get token from Authorization header
  const authHeader = event.request.headers.get('Authorization');
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // Also try to get from cookies (if you're using cookie-based auth)
  if (!token) {
    token = event.cookies.get('accessToken');
  }

  console.log('requireAuth - Token found:', !!token); // Debug log

  if (!token) {
    console.log('requireAuth - No token, redirecting to:', redirectTo); // Debug log
    throw redirect(302, redirectTo);
  }

  // TODO: Optionally decode and validate JWT here
  // For now, just checking if token exists

  return { accessToken: token };
}

/**
 * Check if user is NOT authenticated (for login/register pages)
 */
export function requireGuest(event: RequestEvent, redirectTo: string = '/dashboard') {
  const authHeader = event.request.headers.get('Authorization');
  const cookieToken = event.cookies.get('accessToken');

  if (authHeader || cookieToken) {
    throw redirect(302, redirectTo);
  }
}

/**
 * Client-side auth guard (for use in +page.ts or components)
 */
export function clientRequireAuth(redirectTo: string = '/login'): void {
  if (typeof window === 'undefined') return;

  // Check localStorage on client side
  const stored = localStorage.getItem('auth_tokens');
  
  if (!stored) {
    window.location.href = redirectTo;
    return;
  }

  try {
    const tokens = JSON.parse(stored);
    
    if (!tokens.accessToken) {
      window.location.href = redirectTo;
      return;
    }

    // Check if token is expired
    if (tokens.expiresAt && tokens.expiresAt < Date.now()) {
      window.location.href = redirectTo;
      return;
    }
  } catch {
    window.location.href = redirectTo;
  }
}

/**
 * Role-based access control
 */
export function requireRole(event: RequestEvent, requiredRole: string, redirectTo: string = '/unauthorized') {
  const tokens = requireAuth(event);
  
  // TODO: Decode JWT token and check roles
  // This is a placeholder - implement based on your JWT structure
  
  // Example JWT decode (you'll need to install and use a JWT library):
  // const decoded = decodeJWT(tokens.accessToken);
  // if (!decoded.roles?.includes(requiredRole)) {
  //   throw redirect(302, redirectTo);
  // }

  return tokens;
}

/**
 * Check if user has any of the required roles
 */
export function requireAnyRole(event: RequestEvent, roles: string[], redirectTo: string = '/unauthorized') {
  const tokens = requireAuth(event);
  
  // TODO: Implement role checking
  // const decoded = decodeJWT(tokens.accessToken);
  // const hasRole = roles.some(role => decoded.roles?.includes(role));
  // if (!hasRole) {
  //   throw redirect(302, redirectTo);
  // }

  return tokens;
}

/**
 * Check if user has all required roles
 */
export function requireAllRoles(event: RequestEvent, roles: string[], redirectTo: string = '/unauthorized') {
  const tokens = requireAuth(event);
  
  // TODO: Implement role checking
  // const decoded = decodeJWT(tokens.accessToken);
  // const hasAllRoles = roles.every(role => decoded.roles?.includes(role));
  // if (!hasAllRoles) {
  //   throw redirect(302, redirectTo);
  // }

  return tokens;
}

/**
 * Optional auth - doesn't redirect, just returns auth status
 */
export function optionalAuth(event: RequestEvent) {
  const authHeader = event.request.headers.get('Authorization');
  const cookieToken = event.cookies.get('accessToken');

  const token = authHeader?.substring(7) || cookieToken;

  if (!token) {
    return null;
  }

  return { accessToken: token };
}