import { authenticatedFetch, type User } from "$lib/auth";
import { usersStore } from "./users.store";
import { UsersError, type ChangePasswordRequest, type CompleteResetPasswordRequest, type InitiateResetPasswordRequest, type UpdateRoleRequest } from "./users.types";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

const ENDPOINTS = {
    LOAD: `${API_BASE_URL}/api/user`,
    CREATE: `${API_BASE_URL}/api/user`,
    GET_BY_USERNAME: (username: string) => `${API_BASE_URL}/api/user/${username}`,
    DELETE: (username: string) => `${API_BASE_URL}/api/user/${username}`,
    UPDATE_ROLES: (username: string) => `${API_BASE_URL}/api/user/roles/${username}`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/user/password`,
    INITIATE_PASSWORD_RESET: `${API_BASE_URL}/api/user/password-reset/initiate`,
    COMPLETE_PASSWORD_RESET: `${API_BASE_URL}/api/user/password-reset/complete`,
};

interface BackendUser {
    username: { value: string };
    email: { value: string };
    roles: Array<{ name: string }>;
    userType: string;
    user_TYPE: string;
}

function transformUser(backendUser: BackendUser): User {
    return {
        id: backendUser.username.value, // or generate/use a proper ID if available
        username: backendUser.username.value,
        email: backendUser.email.value,
        roles: backendUser.roles.map(role => role.name)
    };
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        let errorDetails;

        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
            errorDetails = errorData.errors;
        } catch {
            errorMessage = response.statusText || errorMessage;
        }

        throw new UsersError(errorMessage, response.status, errorDetails);
    }

    return response.json();
}

export async function getUserByUsername(username: string): Promise<User> {
    usersStore.setLoading(true);
    usersStore.clearError();

    try {
        const response = await authenticatedFetch(ENDPOINTS.GET_BY_USERNAME(username), {
            method: 'GET',
        });

        const data: BackendUser = await handleResponse(response);
        const user = transformUser(data);

        return user;
    } catch (error) {
        const errorMessage = error instanceof UsersError
            ? error.message
            : 'Failed to load user. Please try again.';

        usersStore.setError(errorMessage);
        throw error;
    } finally {
        usersStore.setLoading(false);
    }
}


export async function loadUsers(): Promise<User[]> {
    usersStore.setLoading(true)
    usersStore.clearError();
    let data = null

    try {
        const response = await fetch(ENDPOINTS.LOAD, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })

        // Parse JSON response
        const data: BackendUser[] = await response.json();
        
        console.log("Raw backend users:", data);

        // Transform backend format to frontend format
        const users = data.map(transformUser);
        
        console.log("Transformed users:", users);

        // Update the store
        usersStore.setUsers(users);

        return users;
    } catch (error) {
        const errorMessage = error instanceof UsersError
        ? error.message
        : 'create users failed. Try again'

        usersStore.setError(errorMessage)
        throw error;
    } finally {
        usersStore.setLoading(false)
    }
}


export async function createUser(user: User): Promise<User> {
    usersStore.setLoading(true)
    usersStore.clearError();

    try {
        const response = await authenticatedFetch(ENDPOINTS.CREATE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        })

        const data = response.body;

        console.log(user, data)
    } catch (error) {
        const errorMessage = error instanceof UsersError
        ? error.message
        : 'create users failed. Try again'

        usersStore.setError(errorMessage)
        throw error;
    } finally {
        usersStore.setLoading(false)
    }

    return user;
}

export async function updateUserRoles(username: string, roles: string[]): Promise<User> {
    usersStore.setLoading(true);
    usersStore.clearError();

    try {
        const requestBody: UpdateRoleRequest = {
            roles
        };

        const response = await authenticatedFetch(ENDPOINTS.UPDATE_ROLES(username), {
            method: 'POST',
            body: JSON.stringify(requestBody)
        });

        const data: BackendUser = await handleResponse(response);
        const updatedUser = transformUser(data);

        // Update in store
        usersStore.updateUser(username, updatedUser);

        return updatedUser;
    } catch (error) {
        const errorMessage = error instanceof UsersError
            ? error.message
            : 'Failed to update user roles. Please try again.';

        usersStore.setError(errorMessage);
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
            method: 'DELETE',
        });

        await handleResponse(response);

        // Remove from store
        usersStore.removeUser(username);
    } catch (error) {
        const errorMessage = error instanceof UsersError
            ? error.message
            : 'Failed to delete user. Please try again.';

        usersStore.setError(errorMessage);
        throw error;
    } finally {
        usersStore.setLoading(false);
    }
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
    usersStore.setLoading(true);
    usersStore.clearError();

    try {
        const requestBody: ChangePasswordRequest = {
            oldPassword,
            newPassword
        };

        const response = await authenticatedFetch(ENDPOINTS.CHANGE_PASSWORD, {
            method: 'PUT',
            body: JSON.stringify(requestBody)
        });

        await handleResponse(response);
    } catch (error) {
        const errorMessage = error instanceof UsersError
            ? error.message
            : 'Failed to change password. Please try again.';

        usersStore.setError(errorMessage);
        throw error;
    } finally {
        usersStore.setLoading(false);
    }
}

export async function initiatePasswordReset(username: string): Promise<void> {
    usersStore.setLoading(true);
    usersStore.clearError();

    try {
        const requestBody: InitiateResetPasswordRequest = {
            username
        };

        const response = await authenticatedFetch(ENDPOINTS.INITIATE_PASSWORD_RESET, {
            method: 'POST',
            body: JSON.stringify(requestBody)
        });

        await handleResponse(response);
    } catch (error) {
        const errorMessage = error instanceof UsersError
            ? error.message
            : 'Failed to initiate password reset. Please try again.';

        usersStore.setError(errorMessage);
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
        const requestBody: CompleteResetPasswordRequest = {
            username,
            token,
            newPassword
        };

        const response = await authenticatedFetch(ENDPOINTS.COMPLETE_PASSWORD_RESET, {
            method: 'POST',
            body: JSON.stringify(requestBody)
        });

        await handleResponse(response);
    } catch (error) {
        const errorMessage = error instanceof UsersError
            ? error.message
            : 'Failed to reset password. Please try again.';

        usersStore.setError(errorMessage);
        throw error;
    } finally {
        usersStore.setLoading(false);
    }
}