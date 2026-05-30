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
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
