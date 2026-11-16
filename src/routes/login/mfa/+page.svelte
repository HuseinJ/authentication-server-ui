<script lang="ts">
  /**
   * Second step of the OIDC browser login. The auth server redirects here after
   * the password step when the user has a second factor enrolled:
   *   /login/mfa?flow=oidc&factor.type=totp&factor.reason=missing
   * and back here with `error=true` after a rejected code.
   */
  import { oidcTotpLogin } from "#lib/auth";
  import TotpCodeInput from "#lib/components/TotpCodeInput.svelte";
  import { FACTOR_LABELS } from "#lib/mfa/mfa.types";
  import { page } from "$app/state";

  let code = $state("");
  let submitting = $state(false);

  const factor = $derived(page.url.searchParams.get("factor.type") ?? "totp");
  const hasError = $derived(page.url.searchParams.get("error") === "true");
  const isExpired = $derived(page.url.searchParams.get("factor.reason") === "expired");
  const isSupported = $derived(factor === "totp");

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (submitting || code.length !== 6) return;
    submitting = true;
    oidcTotpLogin(code);
    // the browser follows the server's redirect from the form submission
  }
</script>

<div class="container mx-auto px-6 py-12 sm:py-20">
  <div class="max-w-md mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-3xl sm:text-4xl font-bold mb-2">
        Verify it's <span class="gradient-text">you</span>
      </h1>
      <p class="text-gray-600">
        {isExpired
          ? "Your verification expired. Please confirm again to continue."
          : "Your account is protected with two-factor authentication."}
      </p>
    </div>

    <div class="card p-6 sm:p-8">
      {#if !isSupported}
        <p class="text-sm text-gray-700">
          This sign-in requires <strong>{FACTOR_LABELS[factor] ?? factor}</strong>, which
          this page does not support yet. Return to the application and try again.
        </p>
      {:else}
        <form onsubmit={handleSubmit} class="space-y-5">
          {#if hasError}
            <div class="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
              That code didn't work. Check your authenticator app and try again. After
              several failed attempts, verification is locked for a few minutes.
            </div>
          {/if}

          <p class="text-sm text-gray-600">
            Open your authenticator app and enter the 6-digit code for this account.
          </p>

          <TotpCodeInput bind:value={code} invalid={hasError} autofocus />

          <button
            type="submit"
            disabled={submitting || code.length !== 6}
            class="btn-primary w-full"
          >
            {submitting ? "Verifying…" : "Verify & continue"}
          </button>

          <p class="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
            You're signing in to authorize an external application. Lost access to your
            authenticator? Ask an administrator to reset it.
          </p>
        </form>
      {/if}
    </div>
  </div>
</div>
