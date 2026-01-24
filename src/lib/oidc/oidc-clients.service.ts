import { authenticatedFetch } from '$lib/auth';
import { oidcClientsStore } from './oidc-clients.store';
import {
  OidcClientsError,
  type OidcClient,
  type BackendOidcClient,
  type CreateOidcClientRequest,
  type UpdateOidcClientRequest,
  type CreateClientResponse,
  type RegenerateSecretResponse
} from './oidc-clients.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

const ENDPOINTS = {
  LIST: `${API_BASE_URL}/api/oidc/clients`,
  GET: (id: string) => `${API_BASE_URL}/api/oidc/clients/${id}`,
  CREATE: `${API_BASE_URL}/api/oidc/clients`,
  UPDATE: (id: string) => `${API_BASE_URL}/api/oidc/clients/${id}`,
  DELETE: (id: string) => `${API_BASE_URL}/api/oidc/clients/${id}`,
  REGENERATE_SECRET: (id: string) => `${API_BASE_URL}/api/oidc/clients/${id}/regenerate-secret`
};

function transformClient(backendClient: BackendOidcClient): OidcClient {
  return {
    id: backendClient.id.value,
    clientId: backendClient.clientId.value,
    clientName: backendClient.clientName.value,
    grantTypes: backendClient.grantTypes.map(gt => gt.value),
    authenticationMethods: backendClient.authenticationMethods.map(am => am.value),
    redirectUris: backendClient.redirectUris.map(uri => uri.value),
    postLogoutRedirectUris: backendClient.postLogoutRedirectUris.map(uri => uri.value),
    scopes: backendClient.scopes.map(scope => scope.value),
    tokenSettings: backendClient.tokenSettings,
    clientSettings: backendClient.clientSettings
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

    throw new OidcClientsError(errorMessage, response.status, errorDetails);
  }

  return response.json();
}

export async function loadOidcClients(): Promise<OidcClient[]> {
  oidcClientsStore.setLoading(true);
  oidcClientsStore.clearError();

  try {
    const response = await authenticatedFetch(ENDPOINTS.LIST, {
      method: 'GET'
    });

    const data: BackendOidcClient[] = await handleResponse(response);
    const clients = data.map(transformClient);

    oidcClientsStore.setClients(clients);
    return clients;
  } catch (error) {
    const errorMessage = error instanceof OidcClientsError
      ? error.message
      : 'Failed to load OIDC clients. Please try again.';

    oidcClientsStore.setError(errorMessage);
    throw error;
  } finally {
    oidcClientsStore.setLoading(false);
  }
}

export async function getOidcClient(id: string): Promise<OidcClient> {
  oidcClientsStore.setLoading(true);
  oidcClientsStore.clearError();

  try {
    const response = await authenticatedFetch(ENDPOINTS.GET(id), {
      method: 'GET'
    });

    const data: BackendOidcClient = await handleResponse(response);
    return transformClient(data);
  } catch (error) {
    const errorMessage = error instanceof OidcClientsError
      ? error.message
      : 'Failed to load OIDC client. Please try again.';

    oidcClientsStore.setError(errorMessage);
    throw error;
  } finally {
    oidcClientsStore.setLoading(false);
  }
}

export interface CreateClientResult {
  client: OidcClient;
  clientSecret: string;
  message: string;
}

export async function createOidcClient(request: CreateOidcClientRequest): Promise<CreateClientResult> {
  oidcClientsStore.setLoading(true);
  oidcClientsStore.clearError();

  try {
    const response = await authenticatedFetch(ENDPOINTS.CREATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    const data: CreateClientResponse = await handleResponse(response);
    const client = transformClient(data.client);

    oidcClientsStore.addClient(client);

    return {
      client,
      clientSecret: data.clientSecret,
      message: data.message
    };
  } catch (error) {
    const errorMessage = error instanceof OidcClientsError
      ? error.message
      : 'Failed to create OIDC client. Please try again.';

    oidcClientsStore.setError(errorMessage);
    throw error;
  } finally {
    oidcClientsStore.setLoading(false);
  }
}

export async function updateOidcClient(id: string, request: UpdateOidcClientRequest): Promise<OidcClient> {
  oidcClientsStore.setLoading(true);
  oidcClientsStore.clearError();

  try {
    const response = await authenticatedFetch(ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    const data: BackendOidcClient = await handleResponse(response);
    const updatedClient = transformClient(data);

    oidcClientsStore.updateClient(id, updatedClient);

    return updatedClient;
  } catch (error) {
    const errorMessage = error instanceof OidcClientsError
      ? error.message
      : 'Failed to update OIDC client. Please try again.';

    oidcClientsStore.setError(errorMessage);
    throw error;
  } finally {
    oidcClientsStore.setLoading(false);
  }
}

export async function deleteOidcClient(id: string): Promise<void> {
  oidcClientsStore.setLoading(true);
  oidcClientsStore.clearError();

  try {
    const response = await authenticatedFetch(ENDPOINTS.DELETE(id), {
      method: 'DELETE'
    });

    await handleResponse(response);
    oidcClientsStore.removeClient(id);
  } catch (error) {
    const errorMessage = error instanceof OidcClientsError
      ? error.message
      : 'Failed to delete OIDC client. Please try again.';

    oidcClientsStore.setError(errorMessage);
    throw error;
  } finally {
    oidcClientsStore.setLoading(false);
  }
}

export interface RegenerateSecretResult {
  client: OidcClient;
  clientSecret: string;
  message: string;
}

export async function regenerateOidcClientSecret(id: string): Promise<RegenerateSecretResult> {
  oidcClientsStore.setLoading(true);
  oidcClientsStore.clearError();

  try {
    const response = await authenticatedFetch(ENDPOINTS.REGENERATE_SECRET(id), {
      method: 'POST'
    });

    const data: RegenerateSecretResponse = await handleResponse(response);
    const client = transformClient(data.client);

    oidcClientsStore.updateClient(id, client);

    return {
      client,
      clientSecret: data.clientSecret,
      message: data.message
    };
  } catch (error) {
    const errorMessage = error instanceof OidcClientsError
      ? error.message
      : 'Failed to regenerate client secret. Please try again.';

    oidcClientsStore.setError(errorMessage);
    throw error;
  } finally {
    oidcClientsStore.setLoading(false);
  }
}