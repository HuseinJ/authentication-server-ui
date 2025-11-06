import type {User} from '../auth/auth.types'

export interface UsersState {
    users: User[]
    isLoading: boolean
    error?: string
}

export class UsersError extends Error {
    constructor(
      message: string,
      public status: number,
      public errors?: Record<string, string[]>
    ) {
      super(message);
      this.name = 'UsersError';
    }
}

// Backend user response type
export interface BackendUser {
  username: { value: string };
  email: { value: string };
  roles: Array<{ name: string }>;
  userType: string;
  user_TYPE: string;
}

// Request types
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