<script lang="ts">
  import { onMount } from "svelte";
  import { user } from "#lib/auth";
  import PageHeader from "#lib/components/PageHeader.svelte";
  import Badge from "#lib/components/Badge.svelte";
  import TotpCodeInput from "#lib/components/TotpCodeInput.svelte";
  import {
    confirmTotpEnrollment,
    disableTotp,
    getEnrolledFactors,
    startTotpEnrollment,
  } from "#lib/mfa/mfa.service";
  import type { TotpEnrollment } from "#lib/mfa/mfa.types";
  import { notifications } from "#lib/notifications/notifications.store";

  type View = "loading" | "off" | "enrolling" | "on" | "disabling";

  let view = $state<View>("loading");
  let enrollment = $state<TotpEnrollment | null>(null);
  let code = $state("");
  let password = $state("");
  let error = $state<string | null>(null);
  let busy = $state(false);

  // Group the secret in blocks of four so it is easier to type by hand.
  const formattedSecret = $derived(enrollment?.secret.match(/.{1,4}/g)?.join(" ") ?? "");

  onMount(loadStatus);

  async function loadStatus() {
    view = "loading";
    try {
      const factors = await getEnrolledFactors();
      view = factors.includes("totp") ? "on" : "off";
    } catch {
      notifications.error("Could not load your security settings.", "Load failed");
      view = "off";
    }
  }

  function reset() {
    enrollment = null;
    code = "";
    password = "";
    error = null;
  }

  async function beginEnrollment() {
    busy = true;
    reset();
    try {
      enrollment = await startTotpEnrollment();
      view = "enrolling";
    } catch (err) {
      notifications.error(
        err instanceof Error ? err.message : "Could not start setup.",
        "Setup failed",
      );
    } finally {
      busy = false;
    }
  }

  async function confirmEnrollment(e: SubmitEvent) {
    e.preventDefault();
    busy = true;
    error = null;
    try {
      await confirmTotpEnrollment(code);
      reset();
      view = "on";
      notifications.success("Two-factor authentication is now on.");
    } catch (err) {
      error = err instanceof Error ? err.message : "That code didn't work.";
      code = "";
    } finally {
      busy = false;
    }
  }

  async function submitDisable(e: SubmitEvent) {
    e.preventDefault();
    busy = true;
    error = null;
    try {
      await disableTotp(password, code);
      reset();
      view = "off";
      notifications.success("Two-factor authentication is now off.");
    } catch (err) {
      error = err instanceof Error ? err.message : "Could not turn off two-factor authentication.";
      code = "";
    } finally {
      busy = false;
    }
  }

  async function copySecret() {
    if (!enrollment) return;
    try {
      await navigator.clipboard.writeText(enrollment.secret);
      notifications.info("Setup key copied.");
    } catch {
      notifications.warning("Copy failed. Select the key and copy it manually.");
    }
  }

  function cancel() {
    reset();
    loadStatus();
  }
</script>

<div class="container mx-auto px-6 py-10">
  <PageHeader title="Account" subtitle="Manage how you sign in." />

  {#if $user}
    <div class="card p-6 mb-6">
      <p class="font-semibold text-gray-900">{$user.username}</p>
      <p class="text-sm text-gray-600">{$user.email}</p>
    </div>
  {/if}

  <div class="card p-6 sm:p-8 max-w-2xl">
    <div class="flex items-start justify-between gap-4 mb-2">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Two-factor authentication</h2>
        <p class="text-sm text-gray-600 mt-1">
          After your password, you also enter a code from an authenticator app such as
          Aegis, Google Authenticator or 1Password.
        </p>
      </div>
      {#if view === "on" || view === "disabling"}
        <Badge text="On" color="green" />
      {:else if view !== "loading"}
        <Badge text="Off" color="gray" />
      {/if}
    </div>

    <div class="mt-6">
      {#if view === "loading"}
        <p class="text-sm text-gray-500">Loading…</p>
      {:else if view === "off"}
        <button onclick={beginEnrollment} disabled={busy} class="btn-primary">
          {busy ? "Starting…" : "Set up authenticator app"}
        </button>
      {:else if view === "enrolling" && enrollment}
        <ol class="space-y-6">
          <li>
            <p class="font-medium text-gray-900 mb-2">
              1. Add this account to your authenticator app
            </p>
            <p class="text-sm text-gray-600 mb-3">
              On your phone, open the link below. Otherwise choose "enter a setup key" in
              the app and type the key.
            </p>
            <!-- otpauth:// hands off to the authenticator app; not an in-app route. -->
            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
            <a href={enrollment.otpauthUri} class="btn-secondary text-sm mb-3"
              >Open in authenticator app</a
            >
            <div class="flex items-center gap-2 flex-wrap">
              <code
                class="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 font-mono text-sm tracking-wider select-all break-all"
                >{formattedSecret}</code
              >
              <button type="button" onclick={copySecret} class="btn-ghost text-sm"
                >Copy key</button
              >
            </div>
          </li>
          <li>
            <p class="font-medium text-gray-900 mb-2">2. Enter the code the app shows</p>
            <form onsubmit={confirmEnrollment} class="space-y-4 max-w-xs">
              {#if error}
                <div class="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                  {error}
                </div>
              {/if}
              <TotpCodeInput bind:value={code} invalid={!!error} autofocus />
              <div class="flex gap-3">
                <button
                  type="submit"
                  disabled={busy || code.length !== 6}
                  class="btn-primary"
                >
                  {busy ? "Verifying…" : "Turn on"}
                </button>
                <button type="button" onclick={cancel} disabled={busy} class="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </li>
        </ol>
      {:else if view === "on"}
        <p class="text-sm text-gray-700 mb-4">
          Sign-ins to this account need a code from your authenticator app.
        </p>
        <button onclick={() => { reset(); view = "disabling"; }} class="btn-danger text-sm">
          Turn off
        </button>
      {:else if view === "disabling"}
        <form onsubmit={submitDisable} class="space-y-4 max-w-xs">
          <p class="text-sm text-gray-700">
            Confirm with your password and a current code to turn off two-factor
            authentication.
          </p>
          {#if error}
            <div class="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          {/if}
          <div>
            <label for="disable-password" class="label">Password</label>
            <input
              id="disable-password"
              type="password"
              autocomplete="current-password"
              bind:value={password}
              class="field"
              placeholder="••••••••"
              required
            />
          </div>
          <TotpCodeInput id="disable-code" bind:value={code} invalid={!!error} />
          <div class="flex gap-3">
            <button
              type="submit"
              disabled={busy || !password || code.length !== 6}
              class="btn-danger"
            >
              {busy ? "Turning off…" : "Turn off"}
            </button>
            <button type="button" onclick={cancel} disabled={busy} class="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>
</div>
