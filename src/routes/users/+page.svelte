<script lang="ts">
  import { goto } from '$app/navigation';
  import { user } from '$lib/auth';
  import {
    deleteUser,
    updateUserRoles,
    changePassword,
    loadUsers
  } from '$lib/users/users.service';
  import { users as usersStore, isLoadingUsers } from '$lib/users/users.store';
  import { AVAILABLE_ROLES } from '$lib/users/users.types';
  import { notifications } from '$lib/notifications/notifications.store';
  import { onMount } from 'svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import ConfirmInline from '$lib/components/ConfirmInline.svelte';
  import Modal from '$lib/components/Modal.svelte';

  onMount(() => {
    loadUsers().catch(() => {
      notifications.error('Could not load the user list.', 'Load failed');
    });
  });

  // Delete state
  let deletingUser = $state<string | null>(null);
  let showDeleteConfirm = $state<string | null>(null);

  // Password modal state
  let showPasswordModal = $state(false);
  let passwordForm = $state({ oldPassword: '', newPassword: '', confirmPassword: '' });
  let passwordErrors = $state<Record<string, string>>({});
  let isChangingPassword = $state(false);

  // Role modal state
  let showRoleModal = $state(false);
  let selectedUserForRoles = $state<string | null>(null);
  let selectedRoles = $state<string[]>([]);
  let isUpdatingRoles = $state(false);

  async function handleDeleteUser(username: string) {
    try {
      deletingUser = username;
      await deleteUser(username);
      showDeleteConfirm = null;
      notifications.success(`User "${username}" deleted.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user.';
      notifications.error(message, 'Delete failed');
    } finally {
      deletingUser = null;
    }
  }

  function openPasswordModal() {
    passwordForm = { oldPassword: '', newPassword: '', confirmPassword: '' };
    passwordErrors = {};
    showPasswordModal = true;
  }

  function closePasswordModal() {
    showPasswordModal = false;
    passwordErrors = {};
  }

  function validatePasswordForm(): boolean {
    const errors: Record<string, string> = {};
    if (!passwordForm.oldPassword) errors.oldPassword = 'Current password is required';
    if (!passwordForm.newPassword) errors.newPassword = 'New password is required';
    else if (passwordForm.newPassword.length < 8)
      errors.newPassword = 'Password must be at least 8 characters';
    if (passwordForm.newPassword !== passwordForm.confirmPassword)
      errors.confirmPassword = 'Passwords do not match';
    if (passwordForm.oldPassword && passwordForm.oldPassword === passwordForm.newPassword)
      errors.newPassword = 'New password must be different from current password';
    passwordErrors = errors;
    return Object.keys(errors).length === 0;
  }

  async function handleChangePassword(e: SubmitEvent) {
    e.preventDefault();
    if (!validatePasswordForm()) return;
    try {
      isChangingPassword = true;
      await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      closePasswordModal();
      notifications.success('Password changed successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change password.';
      passwordErrors = { ...passwordErrors, general: message };
    } finally {
      isChangingPassword = false;
    }
  }

  function openRoleModal(username: string, currentRoles: string[]) {
    selectedUserForRoles = username;
    selectedRoles = [...currentRoles];
    showRoleModal = true;
  }

  function closeRoleModal() {
    showRoleModal = false;
    selectedUserForRoles = null;
    selectedRoles = [];
  }

  async function handleUpdateRoles() {
    if (!selectedUserForRoles || selectedRoles.length === 0) return;
    try {
      isUpdatingRoles = true;
      await updateUserRoles(selectedUserForRoles, selectedRoles);
      notifications.success(`Roles updated for ${selectedUserForRoles}.`);
      closeRoleModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update roles.';
      notifications.error(message, 'Update failed');
    } finally {
      isUpdatingRoles = false;
    }
  }
</script>

<div class="container mx-auto px-6 py-10">
  <PageHeader title="Users" subtitle="Manage user accounts and roles.">
    <button onclick={openPasswordModal} class="btn-secondary">Change my password</button>
    <button onclick={() => goto('/users/create')} class="btn-primary">+ New user</button>
  </PageHeader>

  {#if $user}
    <div class="card p-6 mb-6">
      <div class="flex items-center gap-4">
        <div
          class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white font-bold text-lg flex items-center justify-center shrink-0"
        >
          {$user.username.charAt(0).toUpperCase()}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-900">{$user.username}</p>
          <p class="text-sm text-gray-600 truncate">{$user.email}</p>
        </div>
        <div class="hidden sm:flex gap-1.5 flex-wrap">
          {#each $user.roles ?? [] as role}
            <Badge text={role.replace('ROLE_', '')} color="purple" />
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <div class="card p-6">
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-xl font-bold text-gray-900">All users ({$usersStore.length})</h2>
    </div>

    {#if $isLoadingUsers && $usersStore.length === 0}
      <div class="py-12 text-center text-gray-500 text-sm">Loading users…</div>
    {:else if $usersStore.length === 0}
      <div class="py-12 text-center text-gray-500 text-sm">No users yet.</div>
    {:else}
      <div class="space-y-3">
        {#each $usersStore as userItem}
          <div class="border border-gray-100 rounded-xl p-4 hover:bg-gray-50/70 transition-colors">
            <div class="flex justify-between items-start gap-4 flex-wrap">
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900">{userItem.username}</h3>
                <p class="text-gray-600 text-sm truncate">{userItem.email}</p>
                <div class="mt-2 flex gap-1.5 flex-wrap">
                  {#if userItem.roles?.length}
                    {#each userItem.roles as role}
                      <Badge text={role.replace('ROLE_', '')} color="blue" />
                    {/each}
                  {:else}
                    <span class="text-xs text-gray-400 italic">no roles</span>
                  {/if}
                </div>
              </div>

              <div class="flex gap-2 items-center">
                <button
                  onclick={() => openRoleModal(userItem.username, userItem.roles ?? [])}
                  class="btn-secondary text-sm py-1.5 px-3"
                >
                  Edit roles
                </button>
                <button
                  onclick={() => (showDeleteConfirm = userItem.username)}
                  disabled={deletingUser === userItem.username}
                  class="btn-danger text-sm py-1.5 px-3"
                >
                  {deletingUser === userItem.username ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>

            {#if showDeleteConfirm === userItem.username}
              <ConfirmInline
                message={`Delete user "${userItem.username}"? This cannot be undone.`}
                confirmLabel="Yes, delete"
                isLoading={deletingUser === userItem.username}
                onconfirm={() => handleDeleteUser(userItem.username)}
                oncancel={() => (showDeleteConfirm = null)}
              />
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Password modal -->
<Modal title="Change my password" open={showPasswordModal} onclose={closePasswordModal}>
  {#if passwordErrors.general}
    <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
      {passwordErrors.general}
    </div>
  {/if}

  <form onsubmit={handleChangePassword} class="space-y-4">
    <div>
      <label for="oldPassword" class="label">
        Current password <span class="text-red-500">*</span>
      </label>
      <input
        id="oldPassword"
        type="password"
        autocomplete="current-password"
        bind:value={passwordForm.oldPassword}
        class="field {passwordErrors.oldPassword ? 'field-invalid' : ''}"
        placeholder="••••••••"
      />
      {#if passwordErrors.oldPassword}
        <p class="text-xs text-red-600 mt-1">{passwordErrors.oldPassword}</p>
      {/if}
    </div>

    <div>
      <label for="newPassword" class="label">
        New password <span class="text-red-500">*</span>
      </label>
      <input
        id="newPassword"
        type="password"
        autocomplete="new-password"
        bind:value={passwordForm.newPassword}
        class="field {passwordErrors.newPassword ? 'field-invalid' : ''}"
        placeholder="••••••••"
      />
      {#if passwordErrors.newPassword}
        <p class="text-xs text-red-600 mt-1">{passwordErrors.newPassword}</p>
      {/if}
    </div>

    <div>
      <label for="confirmPassword" class="label">
        Confirm new password <span class="text-red-500">*</span>
      </label>
      <input
        id="confirmPassword"
        type="password"
        autocomplete="new-password"
        bind:value={passwordForm.confirmPassword}
        class="field {passwordErrors.confirmPassword ? 'field-invalid' : ''}"
        placeholder="••••••••"
      />
      {#if passwordErrors.confirmPassword}
        <p class="text-xs text-red-600 mt-1">{passwordErrors.confirmPassword}</p>
      {/if}
    </div>

    <div class="flex gap-3 justify-end pt-2 border-t border-gray-100">
      <button
        type="button"
        onclick={closePasswordModal}
        disabled={isChangingPassword}
        class="btn-secondary"
      >
        Cancel
      </button>
      <button type="submit" disabled={isChangingPassword} class="btn-primary">
        {isChangingPassword ? 'Saving…' : 'Change password'}
      </button>
    </div>
  </form>
</Modal>

<!-- Role modal -->
<Modal
  title="Edit roles for {selectedUserForRoles ?? ''}"
  open={showRoleModal}
  onclose={closeRoleModal}
>
  <div class="mb-6">
    <p class="label">Select roles <span class="text-red-500">*</span></p>
    <div class="space-y-2">
      {#each AVAILABLE_ROLES as role}
        <label
          class="flex items-center cursor-pointer p-3 rounded-lg border transition-colors {selectedRoles.includes(
            role
          )
            ? 'bg-primary-50 border-primary-300'
            : 'border-gray-200 hover:bg-gray-50'}"
        >
          <input
            type="checkbox"
            checked={selectedRoles.includes(role)}
            onchange={() =>
              (selectedRoles = selectedRoles.includes(role)
                ? selectedRoles.filter((r) => r !== role)
                : [...selectedRoles, role])}
            class="mr-3 h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
          />
          <span class="text-sm font-medium text-gray-700">{role.replace('ROLE_', '')}</span>
        </label>
      {/each}
    </div>
    {#if selectedRoles.length === 0}
      <p class="text-xs text-red-600 mt-2">Please select at least one role.</p>
    {/if}
  </div>

  <div class="flex gap-3 justify-end pt-2 border-t border-gray-100">
    <button type="button" onclick={closeRoleModal} disabled={isUpdatingRoles} class="btn-secondary">
      Cancel
    </button>
    <button
      type="button"
      onclick={handleUpdateRoles}
      disabled={isUpdatingRoles || selectedRoles.length === 0}
      class="btn-primary"
    >
      {isUpdatingRoles ? 'Saving…' : 'Update roles'}
    </button>
  </div>
</Modal>
