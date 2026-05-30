import type { User } from '../auth/auth.types';

export interface UsersState {
  users: User[];
  isLoading: boolean;
  error?: string;
}

export class UsersError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'UsersError';
  }
}

export interface BackendUser {
  username: { value: string };
  email: { value: string };
  roles: Array<{ name: string }>;
  userType?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface UpdateRoleRequest {
  roles: string[];
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface InitiateResetPasswordRequest {
  username: string;
}

export interface CompleteResetPasswordRequest {
  username: string;
  token: string;
  newPassword: string;
}

export const AVAILABLE_ROLES = ['ROLE_ADMIN', 'ROLE_GUEST'] as const;
export type Role = (typeof AVAILABLE_ROLES)[number];
