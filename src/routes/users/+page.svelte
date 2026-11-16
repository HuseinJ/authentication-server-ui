<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { user as currentUser, type User } from '#lib/auth';
  import PageTitle from '#lib/components/layout/PageTitle.svelte';
  import Button from '#lib/components/ui/Button.svelte';
  import EmptyState from '#lib/components/ui/EmptyState.svelte';
  import Notice from '#lib/components/ui/Notice.svelte';
  import RolesDialog from '#lib/components/users/RolesDialog.svelte';
  import UserRow from '#lib/components/users/UserRow.svelte';
  import { resetUserTotp } from '#lib/mfa/mfa.service';
  import { MfaError } from '#lib/mfa/mfa.types';
  import { notifications } from '#lib/notifications/notifications.store';
  import { deleteUser, loadUsers, updateUserRoles } from '#lib/users/users.service';
  import { isLoadingUsers, users, usersError } from '#lib/users/users.store';
  import { errorMessage } from '#lib/validation';

  let editingRolesOf = $state<User | null>(null);

  onMount(() => {
    loadUsers().catch(() => {});
  });

  async function saveRoles(username: string, roles: string[]) {
    await updateUserRoles(username, roles);
    notifications.success(`Saved roles for ${username}.`);
  }

  async function resetTwoFactor(username: string) {
    try {
      await resetUserTotp(username);
      notifications.success(`Reset two-factor for ${username}.`);
    } catch (error) {
      const message =
        error instanceof MfaError && error.status === 404
          ? `${username} hasn't set up an authenticator app, so there's nothing to reset.`
          : errorMessage(error, 'Two-factor couldn\'t be reset.');
      notifications.error(message);
    }
  }

  async function removeUser(username: string) {
    try {
      await deleteUser(username);
      notifications.success(`Deleted ${username}.`);
    } catch (error) {
      notifications.error(errorMessage(error, `${username} couldn't be deleted.`));
    }
  }
</script>

<div class="wrap">
  <PageTitle
    title="Users"
    count={$users.length}
    lede="Everyone who can sign in through this server. Change what they're allowed to do, or help them back in after a lost phone."
  >
    {#snippet actions()}
      <Button href={resolve('/users/create')}>Add user</Button>
    {/snippet}
  </PageTitle>

  {#if $usersError && $users.length === 0}
    <Notice tone="error">
      The user list couldn't be loaded: {$usersError}
      <Button variant="quiet" size="sm" onclick={() => loadUsers().catch(() => {})}>Try again</Button>
    </Notice>
  {:else if $isLoadingUsers && $users.length === 0}
    <p class="loading">Loading users…</p>
  {:else if $users.length === 0}
    <EmptyState title="No users yet">
      Add the first account so someone can sign in.
      {#snippet action()}
        <Button href={resolve('/users/create')}>Add user</Button>
      {/snippet}
    </EmptyState>
  {:else}
    <div class="list">
      {#each $users as user (user.username)}
        <UserRow
          {user}
          isSelf={user.username === $currentUser?.username}
          oneditroles={(selected) => (editingRolesOf = selected)}
          onresettwofactor={resetTwoFactor}
          ondelete={removeUser}
        />
      {/each}
    </div>
  {/if}
</div>

<RolesDialog
  username={editingRolesOf?.username ?? null}
  currentRoles={editingRolesOf?.roles ?? []}
  onsave={saveRoles}
  onclose={() => (editingRolesOf = null)}
/>

<style>
  .list {
    border-bottom: 1px solid var(--color-rule);
  }

  .loading {
    font-family: var(--font-text);
    color: var(--color-moss);
  }
</style>
