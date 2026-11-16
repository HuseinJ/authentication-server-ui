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

export function roleLabel(role: string): string {
  const name = role.replace(/^ROLE_/, '').toLowerCase();
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export const ROLE_OPTIONS = AVAILABLE_ROLES.map((role) => ({ value: role, label: roleLabel(role) }));

export interface NewUser {
  username: string;
  email: string;
  password: string;
  roles: string[];
}
