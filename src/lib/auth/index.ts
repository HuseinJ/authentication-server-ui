// src/lib/auth/index.ts
// Public API - Export everything that should be accessible from outside

// Types
export type {
    User,
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    RefreshTokenResponse,
    AuthState,
    TokenData,
    ApiError
  } from './auth.types';
  
  export { AuthError } from './auth.types';
  
  // Store
  export {
    authStore,
    user,
    isAuthenticated,
    isLoading,
    authError
  } from './auth.store';
  
  // Service functions
  export {
    login,
    register,
    logout,
    refreshToken,
    getCurrentUser,
    initializeAuth,
    hasRole,
    hasAnyRole
  } from './auth.service';
  
  // Interceptor
  export {
    authenticatedFetch,
    createAuthInterceptor,
    requestQueue
  } from './auth.interceptors';
  
  // Guards
  export {
    requireAuth,
    requireGuest,
    requireRole,
    requireAnyRole,
    requireAllRoles,
    optionalAuth,
    clientRequireAuth
  } from './auth.guard';