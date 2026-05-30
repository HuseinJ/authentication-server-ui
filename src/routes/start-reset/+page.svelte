<script lang="ts">
  import { isLoadingUsers } from '$lib/users/users.store';
  import { initiatePasswordReset } from '$lib/users/users.service';
  import { notifications } from '$lib/notifications/notifications.store';

  let username = $state('');
  let success = $state(false);
  let submitting = $state(false);

  async function handleResetRequest(e: SubmitEvent) {
    e.preventDefault();
    if (!username.trim()) {
      notifications.warning('Please enter your username.');
      return;
    }
    submitting = true;
    try {
      await initiatePasswordReset(username);
      success = true;
    } catch {
      // Backend deliberately returns success regardless to prevent enumeration;
      // any thrown error here is a real network/server problem.
      notifications.error(
        'Something went wrong sending the reset email. Please try again.',
        'Reset request failed'
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
        Reset your <span class="gradient-text">password</span>
      </h1>
      <p class="text-gray-600">We'll send you instructions if your account exists.</p>
    </div>

    {#if success}
      <div class="card p-6 sm:p-8 text-center">
        <div class="w-14 h-14 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">Check your inbox</h2>
        <p class="text-gray-600 text-sm mb-6">
          If an account exists with that username, we've sent reset instructions. Check your spam folder too.
        </p>
        <div class="flex gap-3 justify-center">
          <button type="button" onclick={() => (success = false)} class="btn-secondary text-sm">
            Try another username
          </button>
          <a href="/login" class="btn-primary text-sm">Back to login</a>
        </div>
      </div>
    {:else}
      <div class="card p-6 sm:p-8">
        <form onsubmit={handleResetRequest} class="space-y-5">
          <div>
            <label for="username" class="label">Username or email</label>
            <input
              id="username"
              type="text"
              bind:value={username}
              class="field"
              placeholder="your username"
              required
              disabled={$isLoadingUsers || submitting}
            />
          </div>

          <button
            type="submit"
            disabled={$isLoadingUsers || submitting}
            class="btn-primary w-full"
          >
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>

          <div class="text-center text-sm">
            <a href="/login" class="text-primary-600 hover:text-primary-700 font-medium">
              Back to login
            </a>
          </div>
        </form>
      </div>
    {/if}
  </div>
</div>
