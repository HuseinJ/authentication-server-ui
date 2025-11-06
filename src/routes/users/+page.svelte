<script lang="ts">
  import { user, logout } from '$lib/auth';
  import { goto } from '$app/navigation';
  import { deleteUser, updateUserRoles, changePassword } from '$lib/users/users.service';
  import { users as usersStore, isLoadingUsers } from '$lib/users/users.store';
  
  let { data } = $props();
  let deletingUser = $state<string | null>(null);
  let showDeleteConfirm = $state<string | null>(null);
  
  // Password change modal state
  let showPasswordModal = $state(false);
  let passwordForm = $state({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  let passwordErrors = $state<Record<string, string>>({});
  let isChangingPassword = $state(false);

  // Role management modal state
  let showRoleModal = $state(false);
  let selectedUserForRoles = $state<string | null>(null);
  let availableRoles = ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_GUEST', 'ROLE_MODERATOR'];
  let selectedRoles = $state<string[]>([]);
  let isUpdatingRoles = $state(false);

  async function handleLogout() {
    await logout();
    goto('/login');
  }

  function handleCreateUser() {
    goto('/users/create');
  }

  function confirmDelete(username: string) {
    showDeleteConfirm = username;
  }

  function cancelDelete() {
    showDeleteConfirm = null;
  }

  async function handleDeleteUser(username: string) {
    try {
      deletingUser = username;
      await deleteUser(username);
      
      showDeleteConfirm = null;
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      deletingUser = null;
    }
  }

  // Password change functions
  function openPasswordModal() {
    showPasswordModal = true;
    passwordForm = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    passwordErrors = {};
  }

  function closePasswordModal() {
    showPasswordModal = false;
    passwordForm = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    passwordErrors = {};
  }

  function validatePasswordForm(): boolean {
    const errors: Record<string, string> = {};

    if (!passwordForm.oldPassword) {
      errors.oldPassword = 'Current password is required';
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (passwordForm.oldPassword === passwordForm.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    passwordErrors = errors;
    return Object.keys(errors).length === 0;
  }

  async function handleChangePassword() {
    if (!validatePasswordForm()) {
      return;
    }

    try {
      isChangingPassword = true;
      await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      closePasswordModal();
    } catch (error) {
      console.error('Failed to change password:', error);
      passwordErrors.general = 'Failed to change password. Please check your current password and try again.';
    } finally {
      isChangingPassword = false;
    }
  }

  // Role management functions
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

  function toggleRole(role: string) {
    if (selectedRoles.includes(role)) {
      selectedRoles = selectedRoles.filter(r => r !== role);
    } else {
      selectedRoles = [...selectedRoles, role];
    }
  }

  async function handleUpdateRoles() {
    if (!selectedUserForRoles || selectedRoles.length === 0) {
      return;
    }

    try {
      isUpdatingRoles = true;
      await updateUserRoles(selectedUserForRoles, selectedRoles);
      
      closeRoleModal();
    } catch (error) {
      console.error('Failed to update roles:', error);
    } finally {
      isUpdatingRoles = false;
    }
  }
</script>

<div class="container mx-auto p-6">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Dashboard</h1>
    <div class="flex gap-3">
      <button 
        on:click={openPasswordModal}
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Change Password
      </button>
      <button 
        on:click={handleLogout}
        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  </div>

  {#if $user}
    <div class="bg-white p-6 rounded shadow mb-6">
      <h2 class="text-xl font-semibold mb-4">Welcome!</h2>
      <p><strong>Username:</strong> {$user.username}</p>
      <p><strong>Email:</strong> {$user.email}</p>
      <div class="mt-2 flex gap-2 flex-wrap">
        {#if $user.roles}
          {#each $user.roles as role}
            <span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded font-semibold">
              {role}
            </span>
          {/each}
        {/if}
      </div>
    </div>
  {/if}

  <!-- Users List -->
  <div class="bg-white p-6 rounded shadow">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold">Users ({$usersStore.length})</h2>
      <button
        on:click={handleCreateUser}
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
              </div>
              
              <!-- Roles and Actions -->
              <div class="flex gap-2 flex-wrap items-center">
                {#if userItem.roles}
                  {#each userItem.roles as role}
                    <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {role}
                    </span>
                  {/each}
                {/if}
                
                <!-- Edit Roles Button -->
                <button
                  on:click={() => openRoleModal(userItem.username, userItem.roles || [])}
                  class="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  title="Edit roles"
                >
                  Edit Roles
                </button>
                
                <!-- Delete Button -->
                <button
                  on:click={() => confirmDelete(userItem.username)}
                  disabled={deletingUser === userItem.username}
                  class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  title="Delete user"
                >
                  {#if deletingUser === userItem.username}
                    Deleting...
                  {:else}
                    Delete
                  {/if}
                </button>
              </div>
            </div>

            <!-- Delete Confirmation Modal (inline) -->
            {#if showDeleteConfirm === userItem.username}
              <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <p class="text-red-800 font-semibold mb-3">
                  Are you sure you want to delete user "{userItem.username}"?
                </p>
                <div class="flex gap-3">
                  <button
                    on:click={() => handleDeleteUser(userItem.username)}
                    class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
                  >
                    Yes, Delete
                  </button>
                  <button
                    on:click={cancelDelete}
                    class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Password Change Modal -->
{#if showPasswordModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
      <h3 class="text-2xl font-bold text-gray-900 mb-4">Change Password</h3>
      
      {#if passwordErrors.general}
        <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {passwordErrors.general}
        </div>
      {/if}

      <form on:submit|preventDefault={handleChangePassword}>
        <!-- Current Password -->
        <div class="mb-4">
          <label for="oldPassword" class="block text-gray-700 text-sm font-bold mb-2">
            Current Password <span class="text-red-500">*</span>
          </label>
          <input
            id="oldPassword"
            type="password"
            bind:value={passwordForm.oldPassword}
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 {passwordErrors.oldPassword ? 'border-red-500' : 'border-gray-300'}"
            placeholder="Enter current password"
          />
          {#if passwordErrors.oldPassword}
            <p class="text-red-500 text-xs italic mt-1">{passwordErrors.oldPassword}</p>
          {/if}
        </div>

        <!-- New Password -->
        <div class="mb-4">
          <label for="newPassword" class="block text-gray-700 text-sm font-bold mb-2">
            New Password <span class="text-red-500">*</span>
          </label>
          <input
            id="newPassword"
            type="password"
            bind:value={passwordForm.newPassword}
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 {passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'}"
            placeholder="Enter new password"
          />
          {#if passwordErrors.newPassword}
            <p class="text-red-500 text-xs italic mt-1">{passwordErrors.newPassword}</p>
          {/if}
        </div>

        <!-- Confirm Password -->
        <div class="mb-6">
          <label for="confirmPassword" class="block text-gray-700 text-sm font-bold mb-2">
            Confirm New Password <span class="text-red-500">*</span>
          </label>
          <input
            id="confirmPassword"
            type="password"
            bind:value={passwordForm.confirmPassword}
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 {passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}"
            placeholder="Confirm new password"
          />
          {#if passwordErrors.confirmPassword}
            <p class="text-red-500 text-xs italic mt-1">{passwordErrors.confirmPassword}</p>
          {/if}
        </div>

        <!-- Actions -->
        <div class="flex gap-3 justify-end">
          <button
            type="button"
            on:click={closePasswordModal}
            disabled={isChangingPassword}
            class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isChangingPassword}
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {#if isChangingPassword}
              Changing...
            {:else}
              Change Password
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Role Management Modal -->
{#if showRoleModal && selectedUserForRoles}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
      <h3 class="text-2xl font-bold text-gray-900 mb-4">
        Edit Roles for {selectedUserForRoles}
      </h3>
      
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
                on:change={() => toggleRole(role)}
                class="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="text-gray-700 font-medium">{role.replace('ROLE_', '')}</span>
            </label>
          {/each}
        </div>
        {#if selectedRoles.length === 0}
          <p class="text-red-500 text-xs italic mt-2">Please select at least one role</p>
        {/if}
      </div>

      <!-- Actions -->
      <div class="flex gap-3 justify-end">
        <button
          type="button"
          on:click={closeRoleModal}
          disabled={isUpdatingRoles}
          class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          on:click={handleUpdateRoles}
          disabled={isUpdatingRoles || selectedRoles.length === 0}
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {#if isUpdatingRoles}
            Updating...
          {:else}
            Update Roles
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}