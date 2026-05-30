<script lang="ts">
  import { goto } from '$app/navigation';
  import { createUser, updateUserRoles } from '$lib/users/users.service';
  import { isLoadingUsers } from '$lib/users/users.store';
  import { AVAILABLE_ROLES } from '$lib/users/users.types';
  import { notifications } from '$lib/notifications/notifications.store';

  let formData = $state({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    roles: [] as string[]
  });
  let validationErrors = $state<Record<string, string>>({});
  let submitting = $state(false);

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!formData.username.trim()) errors.username = 'Username is required';
    else if (formData.username.length < 3)
      errors.username = 'Username must be at least 3 characters';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = 'Invalid email format';
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 8)
      errors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = 'Passwords do not match';
    if (formData.roles.length === 0) errors.roles = 'Select at least one role';
    validationErrors = errors;
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    submitting = true;
    try {
      await createUser({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      // Backend's POST /api/user ignores roles on create; assign them now.
      if (formData.roles.length > 0) {
        try {
          await updateUserRoles(formData.username, formData.roles);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Could not assign roles.';
          notifications.warning(message, 'User created, role assignment failed');
        }
      }

      notifications.success(`User "${formData.username}" created.`);
      goto('/users');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user.';
      notifications.error(message, 'Create failed');
    } finally {
      submitting = false;
    }
  }

  function toggleRole(role: string) {
    formData.roles = formData.roles.includes(role)
      ? formData.roles.filter((r) => r !== role)
      : [...formData.roles, role];
    if (formData.roles.length > 0) delete validationErrors.roles;
  }
</script>

<div class="container mx-auto px-6 py-10 max-w-2xl">
  <div class="mb-8">
    <a href="/users" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
      ← Back to users
    </a>
    <h1 class="text-3xl sm:text-4xl font-bold mt-2">
      Create a <span class="gradient-text">new user</span>
    </h1>
    <p class="text-gray-600 mt-1">Fill in the details to create a user account.</p>
  </div>

  <form onsubmit={handleSubmit} class="card p-6 sm:p-8 space-y-5">
    <div>
      <label for="username" class="label">Username <span class="text-red-500">*</span></label>
      <input
        id="username"
        type="text"
        bind:value={formData.username}
        class="field {validationErrors.username ? 'field-invalid' : ''}"
        placeholder="alice"
        autocomplete="off"
      />
      {#if validationErrors.username}
        <p class="text-xs text-red-600 mt-1">{validationErrors.username}</p>
      {/if}
    </div>

    <div>
      <label for="email" class="label">Email <span class="text-red-500">*</span></label>
      <input
        id="email"
        type="email"
        bind:value={formData.email}
        class="field {validationErrors.email ? 'field-invalid' : ''}"
        placeholder="alice@example.com"
        autocomplete="off"
      />
      {#if validationErrors.email}
        <p class="text-xs text-red-600 mt-1">{validationErrors.email}</p>
      {/if}
    </div>

    <div class="grid sm:grid-cols-2 gap-4">
      <div>
        <label for="password" class="label">Password <span class="text-red-500">*</span></label>
        <input
          id="password"
          type="password"
          bind:value={formData.password}
          class="field {validationErrors.password ? 'field-invalid' : ''}"
          placeholder="••••••••"
          autocomplete="new-password"
        />
        {#if validationErrors.password}
          <p class="text-xs text-red-600 mt-1">{validationErrors.password}</p>
        {/if}
      </div>

      <div>
        <label for="confirmPassword" class="label">
          Confirm <span class="text-red-500">*</span>
        </label>
        <input
          id="confirmPassword"
          type="password"
          bind:value={formData.confirmPassword}
          class="field {validationErrors.confirmPassword ? 'field-invalid' : ''}"
          placeholder="••••••••"
          autocomplete="new-password"
        />
        {#if validationErrors.confirmPassword}
          <p class="text-xs text-red-600 mt-1">{validationErrors.confirmPassword}</p>
        {/if}
      </div>
    </div>

    <div>
      <p class="label">Roles <span class="text-red-500">*</span></p>
      <div class="grid grid-cols-2 gap-2">
        {#each AVAILABLE_ROLES as role}
          <label
            class="flex items-center cursor-pointer p-3 rounded-lg border transition-colors {formData.roles.includes(
              role
            )
              ? 'bg-primary-50 border-primary-300'
              : 'border-gray-200 hover:bg-gray-50'}"
          >
            <input
              type="checkbox"
              checked={formData.roles.includes(role)}
              onchange={() => toggleRole(role)}
              class="mr-3 h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
            />
            <span class="text-sm font-medium text-gray-700">{role.replace('ROLE_', '')}</span>
          </label>
        {/each}
      </div>
      {#if validationErrors.roles}
        <p class="text-xs text-red-600 mt-1">{validationErrors.roles}</p>
      {/if}
    </div>

    <div class="flex items-center gap-3 pt-3 border-t border-gray-100">
      <button type="submit" disabled={submitting || $isLoadingUsers} class="btn-primary">
        {submitting ? 'Creating…' : 'Create user'}
      </button>
      <button type="button" onclick={() => goto('/users')} disabled={submitting} class="btn-secondary">
        Cancel
      </button>
    </div>
  </form>
</div>
