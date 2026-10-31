<script lang="ts">
  import {
    login,
    oidcLogin,
    logout,
    isLoading,
    isAuthenticated,
    user,
    AuthError,
  } from "#lib/auth";
  import { notifications } from "#lib/notifications/notifications.store";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";

  let username = $state("");
  let password = $state("");
  let submitting = $state(false);

  const isOidcFlow = $derived(page.url.searchParams.get("flow") === "oidc");

  // During an OIDC flow an already-signed-in user can either continue as
  // themselves or switch accounts, instead of being bounced away.
  type Choice = "pending" | "continue" | "different";
  let choice = $state<Choice>("pending");

  const canChoose = $derived(isOidcFlow && $isAuthenticated && !!$user);
  const showChooser = $derived(canChoose && choice === "pending");
  const continuingAsCurrent = $derived(canChoose && choice === "continue");

  function continueAsCurrent() {
    username = $user?.username ?? "";
    password = "";
    choice = "continue";
  }

  async function useDifferentAccount() {
    await logout();
    username = "";
    password = "";
    choice = "different";
  }

  function backToChooser() {
    password = "";
    choice = "pending";
  }

  async function handleLogin(e: SubmitEvent) {
    e.preventDefault();
    if (submitting) return;
    submitting = true;
    try {
      if (isOidcFlow) {
        oidcLogin({ username, password });
        // browser performs the redirect from the form submission
      } else {
        await login({ username, password });
        notifications.success(`Welcome back, ${username}`);
        goto("/users");
      }
    } catch (error) {
      const message =
        error instanceof AuthError
          ? error.status === 401 || error.status === 400
            ? "Invalid username or password."
            : error.message
          : "Login failed. Please try again.";
      notifications.error(message, "Sign in failed");
    } finally {
      submitting = false;
    }
  }
</script>

<div class="container mx-auto px-6 py-12 sm:py-20">
  <div class="max-w-md mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-3xl sm:text-4xl font-bold mb-2">
        Welcome <span class="gradient-text">back</span>
      </h1>
      {#if isOidcFlow}
        <p class="text-gray-600">Sign in to your account.</p>
      {:else}
        <p class="text-gray-600">Sign in to manage users and OIDC clients.</p>
      {/if}
    </div>

    <div class="card p-6 sm:p-8">
      {#if isOidcFlow && $isLoading}
        <p class="text-center text-gray-500 text-sm py-4">
          Checking your session…
        </p>
      {:else if showChooser}
        <div class="space-y-5">
          <div class="text-center">
            <p class="text-sm text-gray-600">You're signed in as</p>
            <p class="font-semibold text-gray-900">{$user?.username}</p>
          </div>

          <button
            type="button"
            onclick={continueAsCurrent}
            class="btn-primary w-full"
          >
            Continue as {$user?.username}
          </button>

          <button
            type="button"
            onclick={useDifferentAccount}
            class="btn-secondary w-full"
          >
            Use a different account
          </button>

          <p
            class="text-xs text-gray-500 text-center pt-2 border-t border-gray-100"
          >
            You're signing in to authorize an external application.
          </p>
        </div>
      {:else}
        <form onsubmit={handleLogin} class="space-y-5">
          {#if continuingAsCurrent}
            <div class="flex items-center justify-between">
              <p class="text-sm text-gray-600">
                Signing in as <span class="font-semibold text-gray-900"
                  >{username}</span
                >
              </p>
              <button
                type="button"
                onclick={backToChooser}
                class="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >Change</button
              >
            </div>
          {:else}
            <div>
              <label for="username" class="label">Username</label>
              <input
                id="username"
                type="text"
                autocomplete="username"
                bind:value={username}
                class="field"
                placeholder="your username"
                required
              />
            </div>
          {/if}

          <div>
            <div class="flex items-baseline justify-between">
              <label for="password" class="label">Password</label>
              <a
                href="/start-reset"
                class="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >Forgot password?</a
              >
            </div>
            <input
              id="password"
              type="password"
              autocomplete="current-password"
              bind:value={password}
              class="field"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={$isLoading || submitting}
            class="btn-primary w-full"
          >
            {submitting
              ? "Signing in…"
              : isOidcFlow
                ? "Sign in & continue"
                : "Sign in"}
          </button>

          {#if isOidcFlow}
            <p
              class="text-xs text-gray-500 text-center pt-2 border-t border-gray-100"
            >
              You're signing in to authorize an external application.
            </p>
          {/if}
        </form>
      {/if}
    </div>
  </div>
</div>
