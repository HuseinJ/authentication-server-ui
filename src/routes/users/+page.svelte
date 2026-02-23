<script lang="ts">
  import { goto } from '$app/navigation';
  import { user, logout } from '$lib/auth';
  import { deleteUser, updateUserRoles, changePassword } from '$lib/users/users.service';
  import { users as usersStore, isLoadingUsers } from '$lib/users/users.store';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import ConfirmInline from '$lib/components/ConfirmInline.svelte';
  import Modal from '$lib/components/Modal.svelte';

  let { data } = $props();

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
  let availableRoles = ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_GUEST', 'ROLE_MODERATOR'];
  let selectedRoles = $state<string[]>([]);
  let isUpdatingRoles = $state(false);

  // Delete
  async function handleDeleteUser(username: string) {
    try {
      deletingUser = username;
      await deleteUser(username);
      showDeleteConfirm = null;
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      deletingUser = null;
    }
  }

  // Password
  function openPasswordModal() {
    passwordForm = { oldPassword: '', newPassword: '', confirmPassword: '' };
    passwordErrors = {};
    showPasswordModal = true;
  }

  function closePasswordModal() {
    passwordForm = { oldPassword: '', newPassword: '', confirmPassword: '' };
    passwordErrors = {};
    showPasswordModal = false;
  }

  function validatePasswordForm(): boolean {
    const errors: Record<string, string> = {};
    if (!passwordForm.oldPassword) errors.oldPassword = 'Current password is required';
    if (!passwordForm.newPassword) errors.newPassword = 'New password is required';
    else if (passwordForm.newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters';
    if (passwordForm.newPassword !== passwordForm.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    if (passwordForm.oldPassword && passwordForm.oldPassword === passwordForm.newPassword)
      errors.newPassword = 'New password must be different from current password';
    passwordErrors = errors;
    return Object.keys(errors).length === 0;
  }

  async function handleChangePassword() {
    if (!validatePasswordForm()) return;
    try {
      isChangingPassword = true;
      await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      closePasswordModal();
    } catch (err) {
      console.error('Failed to change password:', err);
      passwordErrors.general = 'Failed to change password. Please check your current password.';
    } finally {
      isChangingPassword = false;
    }
  }

  // Roles
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
      closeRoleModal();
    } catch (err) {
      console.error('Failed to update roles:', err);
    } finally {
      isUpdatingRoles = false;
    }
  }
</script>

<div class="container mx-auto p-6">
  <PageHeader title="Users">
    <button onclick={openPasswordModal} class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
      Change Password
    </button>
  </PageHeader>

  <!-- Current user info -->
  {#if $user}
    <div class="bg-white p-6 rounded shadow mb-6">
      <h2 class="text-xl font-semibold mb-4">Welcome!</h2>
      <p><strong>Username:</strong> {$user.username}</p>
      <p><strong>Email:</strong> {$user.email}</p>
      <div class="mt-2 flex gap-2 flex-wrap">
        {#each $user.roles ?? [] as role}
          <Badge text={role} color="purple" />
        {/each}
      </div>
    </div>
  {/if}

  <!-- Users list -->
  <div class="bg-white p-6 rounded shadow">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold">Users ({$usersStore.length})</h2>
      <button
        onclick={() => goto('/users/create')}
        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
      >
        + Create User
      </button>
    </div>

    {#if $isLoadingUsers}
      <p class="text-gray-600">Loading users...</p>
    {:else if $usersStore.length === 0}
      <p class="text-gray-600">No users found.</p>
    {:else}
      <div class="space-y-4">
        {#each $usersStore as userItem}
          <div class="border border-gray-200 rounded p-4 hover:bg-gray-50 transition-colors">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h3 class="font-semibold text-lg">{userItem.username}</h3>
                <p class="text-gray-600">{userItem.email}</p>
                <div class="mt-2 flex gap-1 flex-wrap">
                  {#each userItem.roles ?? [] as role}
                    <Badge text={role} color="blue" />
                  {/each}
                </div>
              </div>

              <div class="flex gap-2 flex-wrap items-center">
                <button
                  onclick={() => openRoleModal(userItem.username, userItem.roles ?? [])}
                  class="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  Edit Roles
                </button>
                <button
                  onclick={() => showDeleteConfirm = userItem.username}
                  disabled={deletingUser === userItem.username}
                  class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {deletingUser === userItem.username ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>

            {#if showDeleteConfirm === userItem.username}
              <ConfirmInline
                message={`Are you sure you want to delete user "${userItem.username}"?`}
                confirmLabel="Yes, Delete"
                isLoading={deletingUser === userItem.username}
                onconfirm={() => handleDeleteUser(userItem.username)}
                oncancel={() => showDeleteConfirm = null}
              />
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Password Modal -->
<Modal title="Change Password" open={showPasswordModal} onclose={closePasswordModal}>
  {#if passwordErrors.general}
    <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      {passwordErrors.general}
    </div>
  {/if}

  <form onsubmit={(e) => { e.preventDefault(); handleChangePassword(); }} class="space-y-4">
    <div>
      <label for="oldPassword" class="block text-gray-700 text-sm font-bold mb-2">
        Current Password <span class="text-red-500">*</span>
      </label>
      <input
        id="oldPassword"
        type="password"
        bind:value={passwordForm.oldPassword}
        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none {passwordErrors.oldPassword ? 'border-red-500' : 'border-gray-300'}"
        placeholder="Enter current password"
      />
      {#if passwordErrors.oldPassword}
        <p class="text-red-500 text-xs italic mt-1">{passwordErrors.oldPassword}</p>
      {/if}
    </div>

    <div>
      <label for="newPassword" class="block text-gray-700 text-sm font-bold mb-2">
        New Password <span class="text-red-500">*</span>
      </label>
      <input
        id="newPassword"
        type="password"
        bind:value={passwordForm.newPassword}
        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none {passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'}"
        placeholder="Enter new password"
      />
      {#if passwordErrors.newPassword}
        <p class="text-red-500 text-xs italic mt-1">{passwordErrors.newPassword}</p>
      {/if}
    </div>

    <div>
      <label for="confirmPassword" class="block text-gray-700 text-sm font-bold mb-2">
        Confirm New Password <span class="text-red-500">*</span>
      </label>
      <input
        id="confirmPassword"
        type="password"
        bind:value={passwordForm.confirmPassword}
        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none {passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}"
        placeholder="Confirm new password"
      />
      {#if passwordErrors.confirmPassword}
        <p class="text-red-500 text-xs italic mt-1">{passwordErrors.confirmPassword}</p>
      {/if}
    </div>

    <div class="flex gap-3 justify-end pt-2">
      <button
        type="button"
        onclick={closePasswordModal}
        disabled={isChangingPassword}
        class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-semibold disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isChangingPassword}
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold disabled:bg-blue-400"
      >
        {isChangingPassword ? 'Changing...' : 'Change Password'}
      </button>
    </div>
  </form>
</Modal>

<!-- Role Modal -->

<Modal title="Edit Roles for {selectedUserForRoles ?? ''}" open={showRoleModal} onclose={closeRoleModal}>
  <div class="mb-6">
    <label class="block text-gray-700 text-sm font-bold mb-3">
      Select Roles <span class="text-red-500">*</span>
    </label>
    <div class="space-y-2">
      {#each availableRoles as role}
        <label class="flex items-center cursor-pointer p-2 hover:bg-gray-50 rounded">
          <input
            type="checkbox"
            checked={selectedRoles.includes(role)}
            onchange={() => selectedRoles = selectedRoles.includes(role)
              ? selectedRoles.filter(r => r !== role)
              : [...selectedRoles, role]}
            class="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <span class="text-gray-700 font-medium">{role.replace('ROLE_', '')}</span>
        </label>
      {/each}
    </div>
    {#if selectedRoles.length === 0}
      <p class="text-red-500 text-xs italic mt-2">Please select at least one role</p>
    {/if}
  </div>

  <div class="flex gap-3 justify-end">
    <button
      type="button"
      onclick={closeRoleModal}
      disabled={isUpdatingRoles}
      class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-semibold disabled:opacity-50"
    >
      Cancel
    </button>
    <button
      type="button"
      onclick={handleUpdateRoles}
      disabled={isUpdatingRoles || selectedRoles.length === 0}
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold disabled:bg-blue-400"
    >
      {isUpdatingRoles ? 'Updating...' : 'Update Roles'}
    </button>
  </div>
</Modal>