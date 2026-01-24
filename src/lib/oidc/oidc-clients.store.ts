import { writable, derived } from 'svelte/store';
import type { OidcClientsState, OidcClient } from './oidc-clients.types';

const initialState: OidcClientsState = {
  clients: [],
  isLoading: false,
  error: undefined
};

function createOidcClientsStore() {
  const { subscribe, set, update } = writable<OidcClientsState>(initialState);

  return {
    subscribe,

    setClients: (clients: OidcClient[]) => {
      update(state => ({
        ...state,
        clients,
        isLoading: false,
        error: undefined
      }));
    },

    addClient: (client: OidcClient) => {
      update(state => ({
        ...state,
        clients: [...state.clients, client],
        error: undefined
      }));
    },

    updateClient: (id: string, updatedClient: Partial<OidcClient>) => {
      update(state => ({
        ...state,
        clients: state.clients.map(client =>
          client.id === id ? { ...client, ...updatedClient } : client
        ),
        error: undefined
      }));
    },

    removeClient: (id: string) => {
      update(state => ({
        ...state,
        clients: state.clients.filter(client => client.id !== id),
        error: undefined
      }));
    },

    setLoading: (isLoading: boolean) => {
      update(state => ({ ...state, isLoading }));
    },

    setError: (error: string | undefined) => {
      update(state => ({
        ...state,
        error,
        isLoading: false
      }));
    },

    clearError: () => {
      update(state => ({ ...state, error: undefined }));
    },

    reset: () => {
      set(initialState);
    }
  };
}

export const oidcClientsStore = createOidcClientsStore();

// Derived stores
export const oidcClients = derived(oidcClientsStore, $store => $store.clients);
export const isLoadingOidcClients = derived(oidcClientsStore, $store => $store.isLoading);
export const oidcClientsError = derived(oidcClientsStore, $store => $store.error);
export const oidcClientCount = derived(oidcClientsStore, $store => $store.clients.length);

export const getOidcClientById = (id: string) =>
  derived(oidcClientsStore, $store =>
    $store.clients.find(client => client.id === id)
  );

export const getOidcClientByClientId = (clientId: string) =>
  derived(oidcClientsStore, $store =>
    $store.clients.find(client => client.clientId === clientId)
  );