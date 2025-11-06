// src/lib/auth/auth.types.ts

export interface User {
    id: string;
    email: string;
    username: string;
    roles?: string[];
    firstName?: string;
    lastName?: string;
    password?: string;
  }
  
  export interface LoginRequest {
    username: string;
    password: string;
  }
  
  export interface RegisterRequest {
    email: string;
    password: string;
    username: string;
    firstName?: string;
    lastName?: string;
  }
  
  export interface AuthResponse {
    token: string;
    refreshToken: string;
    expiresIn?: number; // seconds until token expires
  }
  
  export interface RefreshTokenRequest {
    refreshToken: string;
  }
  
  export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn?: number;
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
    expiresIn?: number;
  }
  
  // API Error types
  export interface ApiError {
    message: string;
    status: number;
    errors?: Record<string, string[]>;
  }
  
  export class AuthError extends Error {
    constructor(
      message: string,
      public status: number,
      public errors?: Record<string, string[]>
    ) {
      super(message);
      this.name = 'AuthError';
    }
  }