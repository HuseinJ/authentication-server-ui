<script lang="ts">
    import { goto } from '$app/navigation';
    import { createUser } from '$lib/users/users.service';
    import { usersError, isLoadingUsers, usersStore } from '$lib/users/users.store';
    import type { User } from '$lib/auth';
  
    // Form state
    let formData = $state({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      roles: [] as string[]
    });
  
    let validationErrors = $state<Record<string, string>>({});
    let successMessage = $state('');

    usersStore.setLoading(false)
  
    // Available roles
    const availableRoles = ['ROLE_GUEST', 'ROLE_ADMIN'];
  
    function validateForm(): boolean {
      const errors: Record<string, string> = {};
  
      if (!formData.username.trim()) {
        errors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        errors.username = 'Username must be at least 3 characters';
      }
  
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Invalid email format';
      }
  
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
  
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
  
      if (formData.roles.length === 0) {
        errors.roles = 'At least one role must be selected';
      }
  
      validationErrors = errors;
      return Object.keys(errors).length === 0;
    }
  
    async function handleSubmit(event: Event) {
      event.preventDefault();
      successMessage = '';
  
      if (!validateForm()) {
        return;
      }
  
      try {
        const newUser: Partial<User> = {
          username: formData.username,
          email: formData.email,
          roles: formData.roles,
          password: formData.password
        };
  
        await createUser(newUser as User);
        
        successMessage = "user was created"

        setTimeout(() => {
        goto('/users');
        }, 1500);
      } catch (error) {
        console.error('Failed to create user:', error);
      }
    }
  
    function handleCancel() {
      goto('/users');
    }
  
    function toggleRole(role: string) {
      if (formData.roles.includes(role)) {
        formData.roles = formData.roles.filter(r => r !== role);
      } else {
        formData.roles = [...formData.roles, role];
      }
      // Clear role validation error when user selects a role
      if (formData.roles.length > 0) {
        delete validationErrors.roles;
      }
    }
  </script>
  
  <div class="container mx-auto p-6 max-w-2xl">
    <div class="mb-6">
      <h1 class="text-3xl font-bold">Create New User</h1>
      <p class="text-gray-600 mt-2">Fill in the details to create a new user account</p>
    </div>
  
    {#if successMessage}
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        {successMessage}
      </div>
    {/if}
  
    {#if $usersError}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {$usersError}
      </div>
    {/if}
  
    <form onsubmit={handleSubmit} class="bg-white shadow-md rounded px-8 pt-6 pb-8">
      <!-- Username -->
      <div class="mb-4">
        <label for="username" class="block text-gray-700 text-sm font-bold mb-2">
          Username <span class="text-red-500">*</span>
        </label>
        <input
          id="username"
          type="text"
          bind:value={formData.username}
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline {validationErrors.username ? 'border-red-500' : ''}"
          placeholder="Enter username"
        />
        {#if validationErrors.username}
          <p class="text-red-500 text-xs italic mt-1">{validationErrors.username}</p>
        {/if}
      </div>
  
      <!-- Email -->
      <div class="mb-4">
        <label for="email" class="block text-gray-700 text-sm font-bold mb-2">
          Email <span class="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          bind:value={formData.email}
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline {validationErrors.email ? 'border-red-500' : ''}"
          placeholder="Enter email"
        />
        {#if validationErrors.email}
          <p class="text-red-500 text-xs italic mt-1">{validationErrors.email}</p>
        {/if}
      </div>
  
      <!-- Password -->
      <div class="mb-4">
        <label for="password" class="block text-gray-700 text-sm font-bold mb-2">
          Password <span class="text-red-500">*</span>
        </label>
        <input
          id="password"
          type="password"
          bind:value={formData.password}
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline {validationErrors.password ? 'border-red-500' : ''}"
          placeholder="Enter password"
        />
        {#if validationErrors.password}
          <p class="text-red-500 text-xs italic mt-1">{validationErrors.password}</p>
        {/if}
      </div>
  
      <!-- Confirm Password -->
      <div class="mb-4">
        <label for="confirmPassword" class="block text-gray-700 text-sm font-bold mb-2">
          Confirm Password <span class="text-red-500">*</span>
        </label>
        <input
          id="confirmPassword"
          type="password"
          bind:value={formData.confirmPassword}
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline {validationErrors.confirmPassword ? 'border-red-500' : ''}"
          placeholder="Confirm password"
        />
        {#if validationErrors.confirmPassword}
          <p class="text-red-500 text-xs italic mt-1">{validationErrors.confirmPassword}</p>
        {/if}
      </div>
  
      <!-- Roles -->
      <div class="mb-6">
        <label class="block text-gray-700 text-sm font-bold mb-2">
          Roles <span class="text-red-500">*</span>
        </label>
        <div class="space-y-2">
          {#each availableRoles as role}
            <label class="flex items-center">
              <input
                type="checkbox"
                checked={formData.roles.includes(role)}
                onchange={() => toggleRole(role)}
                class="mr-2 h-4 w-4"
              />
              <span class="text-gray-700">{role.replace('ROLE_', '')}</span>
            </label>
          {/each}
        </div>
        {#if validationErrors.roles}
          <p class="text-red-500 text-xs italic mt-1">{validationErrors.roles}</p>
        {/if}
      </div>
  
      <!-- Actions -->
      <div class="flex items-center justify-between gap-4 mt-6">
        <button
          type="submit"
          disabled={$isLoadingUsers}
          style="background-color: #3B82F6;"
          class="text-white font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {$isLoadingUsers ? 'Creating...' : 'Create User'}
        </button>
        <button
          type="button"
          onclick={handleCancel}
          style="background-color: #6B7280;"
          class="text-white font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline hover:opacity-90 transition-opacity"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>