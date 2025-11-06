// src/lib/users/users.store.ts

import { writable, derived } from 'svelte/store';
import type { UsersState } from './users.types';
import type { User } from '../auth/auth.types';

const initialState: UsersState = {
  users: [],
  isLoading: true,
  error: undefined
};

function createUsersStore() {
  const { subscribe, set, update } = writable<UsersState>(initialState);

  return {
    subscribe,

    setUsers: (users: User[]) => {
      update(state => ({
        ...state,
        users,
        isLoading: false,
        error: undefined
      }));
    },

    addUser: (user: User) => {
      update(state => ({
        ...state,
        users: [...state.users, user],
        error: undefined
      }));
    },

    updateUser: (username: string, updatedUser: Partial<User>) => {
      update(state => ({
        ...state,
        users: state.users.map(user =>
          user.username === username ? { ...user, ...updatedUser } : user
        ),
        error: undefined
      }));
    },

    removeUser: (username: string) => {
      update(state => ({
        ...state,
        users: state.users.filter(user => user.username !== username),
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

export const usersStore = createUsersStore();

export const users = derived(usersStore, $store => $store.users);
export const isLoadingUsers = derived(usersStore, $store => $store.isLoading);
export const usersError = derived(usersStore, $store => $store.error);
export const userCount = derived(usersStore, $store => $store.users.length);

export const getUserByUsername = (username: string) => 
  derived(usersStore, $store => 
    $store.users.find(user => user.username === username)
  );