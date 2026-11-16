// Public auth types

export interface User {
  id: string;
  email: string;
  username: string;
  roles: string[];
  userType?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

/**
 * Returned by POST /api/auth/login instead of tokens when the user has a second
 * factor enrolled. Finish the login with {@link MfaLoginRequest}.
 */
export interface MfaChallenge {
  mfaRequired: true;
  mfaToken: string;
  /** Enrolled factors, any one of which completes the login, e.g. ["totp"]. */
  factors: string[];
  /** Seconds until mfaToken expires. */
  expiresIn: number;
}

export interface MfaLoginRequest {
  mfaToken: string;
  code: string;
}

export type LoginResult =
  | { status: 'authenticated'; token: string }
  | { status: 'mfa_required'; challenge: MfaChallenge };

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface TokenData {
  token: string;
  refreshToken: string;
  expiresAt?: number;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: Record<string, string[]>,
    /** Fresh challenge handed out by the backend after a wrong MFA code. */
    public retryMfaToken?: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
