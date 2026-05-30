// Public auth API

export type {
  User,
  LoginRequest,
  AuthResponse,
  AuthState,
  TokenData
} from './auth.types';

export { AuthError } from './auth.types';

export {
  authStore,
  user,
  isAuthenticated,
  isLoading,
  authError,
  transformUser
} from './auth.store';

export {
  BASE_URL,
  login,
  oidcLogin,
  logout,
  getCurrentUser,
  initializeAuth,
  hasRole,
  hasAnyRole
} from './auth.service';

export { authenticatedFetch, createAuthInterceptor } from './auth.interceptors';

export { requireAuth, requireGuest, optionalAuth } from './auth.guard';
