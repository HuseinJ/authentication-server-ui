import { loadUsers } from '$lib/users/users.service';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  const users = await loadUsers();

  return {
    users
  };
};