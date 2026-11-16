<script lang="ts">
  import { page } from '$app/state';
  import { oidcTotpLogin } from '#lib/auth';
  import AuthLayout from '#lib/components/layout/AuthLayout.svelte';
  import TotpForm from '#lib/components/auth/TotpForm.svelte';
  import Notice from '#lib/components/ui/Notice.svelte';
  import { FACTOR_LABELS } from '#lib/mfa/mfa.types';

  let busy = $state(false);

  const factor = $derived(page.url.searchParams.get('factor.type') ?? 'totp');
  const isSupported = $derived(factor === 'totp');
  const isExpired = $derived(page.url.searchParams.get('factor.reason') === 'expired');
  const rejected = $derived(page.url.searchParams.get('error') === 'true');

  const lede = $derived(
    isExpired
      ? 'Your last check expired. Enter a fresh code from your authenticator app to continue.'
      : 'Your account uses two-factor authentication. Enter the 6-digit code from your authenticator app to continue.'
  );

  function verify(code: string) {
    busy = true;
    oidcTotpLogin(code);
  }
</script>

<AuthLayout title="Verify" {lede}>
  {#if !isSupported}
    <Notice tone="error">
      This sign-in asks for {FACTOR_LABELS[factor] ?? factor}, which this page can't handle yet. Go
      back to the application and start the sign-in again.
    </Notice>
  {:else}
    <TotpForm
      {busy}
      error={rejected
        ? 'That code didn\'t match. After several wrong codes, verification locks for a few minutes.'
        : undefined}
      submitLabel="Verify and continue"
      onsubmit={verify}
    />
    <p class="help">Lost your phone? Ask an administrator to reset your two-factor authentication.</p>
  {/if}
</AuthLayout>

<style>
  .help {
    padding-top: 1rem;
    border-top: 1px solid var(--color-rule);
    font-family: var(--font-text);
    color: var(--color-moss);
  }
</style>
