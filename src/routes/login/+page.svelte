<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import {
    AuthError,
    completeTotpLogin,
    isAuthenticated,
    isLoading,
    login,
    logout,
    oidcLogin,
    user,
    type MfaChallenge
  } from '#lib/auth';
  import AuthLayout from '#lib/components/layout/AuthLayout.svelte';
  import AccountChooser from '#lib/components/auth/AccountChooser.svelte';
  import PasswordSignInForm from '#lib/components/auth/PasswordSignInForm.svelte';
  import TotpForm from '#lib/components/auth/TotpForm.svelte';
  import Notice from '#lib/components/ui/Notice.svelte';
  import { notifications } from '#lib/notifications/notifications.store';

  type AccountChoice = 'undecided' | 'current' | 'other';

  let busy = $state(false);
  let signInError = $state<string>();
  let challenge = $state<MfaChallenge | null>(null);
  let codeError = $state<string>();
  let accountChoice = $state<AccountChoice>('undecided');

  const isOidcFlow = $derived(page.url.searchParams.get('flow') === 'oidc');
  const hasSession = $derived(isOidcFlow && $isAuthenticated && !!$user);
  const showChooser = $derived(hasSession && accountChoice === 'undecided');
  const fixedUsername = $derived(hasSession && accountChoice === 'current' ? $user?.username : undefined);

  const title = $derived(challenge ? 'Verify' : 'Sign in');
  const lede = $derived(
    challenge
      ? 'Your account uses two-factor authentication. Enter the 6-digit code from your authenticator app.'
      : isOidcFlow
        ? 'An application wants to confirm who you are. Sign in to continue there.'
        : 'Manage users, the applications that sign in through this server, and your own account.'
  );

  async function switchAccount() {
    await logout();
    accountChoice = 'other';
  }

  function describeSignInError(error: unknown) {
    if (error instanceof AuthError && (error.status === 400 || error.status === 401)) {
      return 'That username and password don\'t match. Check both and try again.';
    }
    return error instanceof AuthError ? error.message : 'Sign-in failed. Try again in a moment.';
  }

  async function signIn(credentials: { username: string; password: string }) {
    signInError = undefined;

    if (isOidcFlow) {
      busy = true;
      oidcLogin(credentials);
      return;
    }

    busy = true;
    try {
      const result = await login(credentials);
      if (result.status === 'mfa_required') {
        challenge = result.challenge;
        codeError = undefined;
        return;
      }
      await finish(credentials.username);
    } catch (error) {
      signInError = describeSignInError(error);
    } finally {
      busy = false;
    }
  }

  async function verifyCode(code: string) {
    const current = challenge;
    if (!current) return;

    busy = true;
    codeError = undefined;
    try {
      await completeTotpLogin(current.mfaToken, code);
      challenge = null;
      await finish($user?.username ?? '');
    } catch (error) {
      if (error instanceof AuthError && error.retryMfaToken) {
        challenge = { ...current, mfaToken: error.retryMfaToken };
        codeError = 'That code didn\'t match. Codes change every 30 seconds, so use the one showing now.';
      } else {
        challenge = null;
        signInError =
          error instanceof AuthError && error.status === 429
            ? 'Too many wrong codes. Wait a few minutes, then sign in again.'
            : 'Your sign-in expired. Enter your password again.';
      }
    } finally {
      busy = false;
    }
  }

  async function finish(username: string) {
    notifications.success(`Signed in as ${username}.`);
    await goto(resolve('/users'));
  }
</script>

<AuthLayout {title} {lede}>
  {#if isOidcFlow && $isLoading}
    <p class="muted">Checking your session…</p>
  {:else if challenge}
    <TotpForm {busy} error={codeError} onsubmit={verifyCode} oncancel={() => (challenge = null)} />
  {:else if showChooser && $user}
    <AccountChooser
      username={$user.username}
      oncontinue={() => (accountChoice = 'current')}
      onswitch={switchAccount}
    />
  {:else}
    {#if signInError}
      <Notice tone="error">{signInError}</Notice>
    {/if}
    <PasswordSignInForm
      {busy}
      {fixedUsername}
      submitLabel={isOidcFlow ? 'Sign in and continue' : 'Sign in'}
      onsubmit={signIn}
      onchangeaccount={hasSession ? () => (accountChoice = 'undecided') : undefined}
    />
  {/if}
</AuthLayout>

<style>
  .muted {
    font-family: var(--font-text);
    color: var(--color-moss);
  }
</style>
