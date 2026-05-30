import { authenticatedFetch, BASE_URL, type User } from '$lib/auth';
import { usersStore } from './users.store';
import {
  UsersError,
  type BackendUser,
  type ChangePasswordRequest,
  type CompleteResetPasswordRequest,
  type CreateUserRequest,
  type InitiateResetPasswordRequest,
  type UpdateRoleRequest
} from './users.types';

const ENDPOINTS = {
  LIST: `${BASE_URL}/api/user`,
  CREATE: `${BASE_URL}/api/user`,
  ME: `${BASE_URL}/api/user/me`,
  GET_BY_USERNAME: (username: string) =>
    `${BASE_URL}/api/user/${encodeURIComponent(username)}`,
  DELETE: (username: string) =>
    `${BASE_URL}/api/user/${encodeURIComponent(username)}`,
  UPDATE_ROLES: (username: string) =>
    `${BASE_URL}/api/user/roles/${encodeURIComponent(username)}`,
  CHANGE_PASSWORD: `${BASE_URL}/api/user/password`,
  INITIATE_PASSWORD_RESET: `${BASE_URL}/api/user/password-reset/initiate`,
  COMPLETE_PASSWORD_RESET: `${BASE_URL}/api/user/password-reset/complete`
};

function transformUser(backendUser: BackendUser): User {
  return {
    id: backendUser.username.value,
    username: backendUser.username.value,
    email: backendUser.email.value,
    roles: backendUser.roles.map((r) => r.name),
    userType: backendUser.userType
  };
}

async function parseError(response: Response): Promise<UsersError> {
  let message = response.statusText || `Request failed (${response.status})`;
  try {
    const data = await response.json();
    message = data.error || data.message || message;
  } catch {
    // ignore
  }
  return new UsersError(message, response.status);
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw await parseError(response);
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

function describeError(error: unknown, fallback: string): string {
  return error instanceof UsersError ? error.message : fallback;
}

export async function loadUsers(): Promise<User[]> {
  usersStore.setLoading(true);
  usersStore.clearError();
  try {
    const response = await authenticatedFetch(ENDPOINTS.LIST, { method: 'GET' });
    const data = await handleResponse<BackendUser[]>(response);
    const users = data.map(transformUser);
    usersStore.setUsers(users);
    return users;
  } catch (error) {
    usersStore.setError(describeError(error, 'Failed to load users.'));
    throw error;
  } finally {
    usersStore.setLoading(false);
  }
}

export async function getUserByUsername(username: string): Promise<User> {
  usersStore.setLoading(true);
  usersStore.clearError();
  try {
    const response = await authenticatedFetch(ENDPOINTS.GET_BY_USERNAME(username), {
      method: 'GET'
    });
    const data = await handleResponse<BackendUser>(response);
    return transformUser(data);
  } catch (error) {
    usersStore.setError(describeError(error, 'Failed to load user.'));
    throw error;
  } finally {
    usersStore.setLoading(false);
  }
}

export async function createUser(request: CreateUserRequest): Promise<User> {
  usersStore.setLoading(true);
  usersStore.clearError();
  try {
    const response = await authenticatedFetch(ENDPOINTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(request)
    });
    const data = await handleResponse<BackendUser>(response);
    const user = transformUser(data);
    usersStore.addUser(user);
    return user;
  } catch (error) {
    usersStore.setError(describeError(error, 'Failed to create user.'));
    throw error;
  } finally {
    usersStore.setLoading(false);
  }
}

export async function updateUserRoles(username: string, roles: string[]): Promise<User> {
  usersStore.setLoading(true);
  usersStore.clearError();
  try {
    const body: UpdateRoleRequest = { roles };
    const response = await authenticatedFetch(ENDPOINTS.UPDATE_ROLES(username), {
      method: 'POST',
      body: JSON.stringify(body)
    });
    const data = await handleResponse<BackendUser>(response);
    const updated = transformUser(data);
    usersStore.updateUser(username, updated);
    return updated;
  } catch (error) {
    usersStore.setError(describeError(error, 'Failed to update roles.'));
    throw error;
  } finally {
    usersStore.setLoading(false);
  }
}

export async function deleteUser(username: string): Promise<void> {
  usersStore.setLoading(true);
  usersStore.clearError();
  try {
    const response = await authenticatedFetch(ENDPOINTS.DELETE(username), {
      method: 'DELETE'
    });
    await handleResponse(response);
    usersStore.removeUser(username);
  } catch (error) {
    usersStore.setError(describeError(error, 'Failed to delete user.'));
    throw error;
  } finally {
    usersStore.setLoading(false);
  }
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  usersStore.setLoading(true);
  usersStore.clearError();
  try {
    const body: ChangePasswordRequest = { oldPassword, newPassword };
    const response = await authenticatedFetch(ENDPOINTS.CHANGE_PASSWORD, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    await handleResponse(response);
  } catch (error) {
    usersStore.setError(describeError(error, 'Failed to change password.'));
    throw error;
  } finally {
    usersStore.setLoading(false);
  }
}

export async function initiatePasswordReset(username: string): Promise<void> {
  usersStore.setLoading(true);
  usersStore.clearError();
  try {
    const body: InitiateResetPasswordRequest = { username };
    const response = await authenticatedFetch(ENDPOINTS.INITIATE_PASSWORD_RESET, {
      method: 'POST',
      body: JSON.stringify(body),
      skipAuth: true
    });
    await handleResponse(response);
  } catch (error) {
    usersStore.setError(describeError(error, 'Failed to start password reset.'));
    throw error;
  } finally {
    usersStore.setLoading(false);
  }
}

export async function completePasswordReset(
  username: string,
  token: string,
  newPassword: string
): Promise<void> {
  usersStore.setLoading(true);
  usersStore.clearError();
  try {
    const body: CompleteResetPasswordRequest = { username, token, newPassword };
    const response = await authenticatedFetch(ENDPOINTS.COMPLETE_PASSWORD_RESET, {
      method: 'POST',
      body: JSON.stringify(body),
      skipAuth: true
    });
    await handleResponse(response);
  } catch (error) {
    usersStore.setError(describeError(error, 'Failed to reset password.'));
    throw error;
  } finally {
    usersStore.setLoading(false);
  }
}
