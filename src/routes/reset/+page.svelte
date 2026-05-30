<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { completePasswordReset } from '$lib/users/users.service';
  import { notifications } from '$lib/notifications/notifications.store';

  let newPassword = $state('');
  let confirmPassword = $state('');
  let submitting = $state(false);

  const token = $derived($page.url.searchParams.get('token') ?? '');
  const usernameParam = $derived($page.url.searchParams.get('username') ?? '');
  const passwordsMatch = $derived(
    newPassword.length === 0 || confirmPassword.length === 0 || newPassword === confirmPassword
  );
  const linkValid = $derived(!!token && !!usernameParam);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!linkValid) {
      notifications.error('Reset link is missing the token or username.', 'Invalid link');
      return;
    }
    if (newPassword.length < 8) {
      notifications.warning('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      notifications.warning('Passwords do not match.');
      return;
    }

    submitting = true;
    try {
      await completePasswordReset(usernameParam, token, newPassword);
      notifications.success('Password reset successfully. You can now sign in.');
      goto('/login');
    } catch {
      notifications.error(
        'This reset link is invalid or has expired. Request a new one.',
        'Reset failed'
      );
    } finally {
      submitting = false;
    }
  }
</script>

<div class="container mx-auto px-6 py-12 sm:py-20">
  <div class="max-w-md mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-3xl sm:text-4xl font-bold mb-2">
        Choose a <span class="gradient-text">new password</span>
      </h1>
      <p class="text-gray-600">Use at least 8 characters.</p>
    </div>

    <div class="card p-6 sm:p-8">
      {#if !linkValid}
        <div class="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800 mb-5">
          This reset link is missing required information. Please request a new one.
        </div>
        <a href="/start-reset" class="btn-primary w-full">Request a new link</a>
      {:else}
        <form onsubmit={handleSubmit} class="space-y-5">
          <div>
            <label for="newPassword" class="label">New password</label>
            <input
              id="newPassword"
              type="password"
              autocomplete="new-password"
              bind:value={newPassword}
              class="field"
              placeholder="••••••••"
              minlength="8"
              required
              disabled={submitting}
            />
            <p class="text-xs text-gray-500 mt-1">Minimum 8 characters.</p>
          </div>

          <div>
            <label for="confirmPassword" class="label">Confirm new password</label>
            <input
              id="confirmPassword"
              type="password"
              autocomplete="new-password"
              bind:value={confirmPassword}
              class="field {!passwordsMatch ? 'field-invalid' : ''}"
              placeholder="••••••••"
              minlength="8"
              required
              disabled={submitting}
            />
            {#if !passwordsMatch}
              <p class="text-xs text-red-600 mt-1">Passwords do not match.</p>
            {/if}
          </div>

          <button
            type="submit"
            disabled={submitting || !passwordsMatch}
            class="btn-primary w-full"
          >
            {submitting ? 'Resetting…' : 'Reset password'}
          </button>

          <div class="text-center text-sm">
            <a href="/login" class="text-primary-600 hover:text-primary-700 font-medium"
              >Back to login</a
            >
          </div>
        </form>
      {/if}
    </div>
  </div>
</div>
