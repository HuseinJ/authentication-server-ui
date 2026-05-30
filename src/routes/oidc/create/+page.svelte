<script lang="ts">
  import { goto } from '$app/navigation';
  import { createOidcClient } from '$lib/oidc/oidc-clients.service';
  import { isLoadingOidcClients } from '$lib/oidc/oidc-clients.store';
  import {
    AVAILABLE_AUTH_METHODS,
    AVAILABLE_GRANT_TYPES,
    AVAILABLE_SCOPES,
    defaultClientSettings,
    defaultTokenSettings,
    type CreateOidcClientRequest
  } from '$lib/oidc/oidc-clients.types';
  import { notifications } from '$lib/notifications/notifications.store';

  let formData = $state<CreateOidcClientRequest>({
    clientId: '',
    clientName: '',
    grantTypes: ['authorization_code'],
    authenticationMethods: ['client_secret_basic'],
    redirectUris: [''],
    postLogoutRedirectUris: [''],
    scopes: ['openid'],
    tokenSettings: { ...defaultTokenSettings },
    clientSettings: { ...defaultClientSettings }
  });

  let validationErrors = $state<Record<string, string>>({});
  let createdSecret = $state<string | null>(null);
  let submitting = $state(false);

  // Public client → enforce PKCE in the UI to match backend behavior
  const isPublicClient = $derived(formData.authenticationMethods.includes('none'));
  $effect(() => {
    if (isPublicClient && !formData.clientSettings.requireProofKey) {
      formData.clientSettings.requireProofKey = true;
    }
  });

  function toggleItem(arr: string[], item: string) {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!formData.clientId.trim()) errors.clientId = 'Client ID is required';
    else if (!/^[a-zA-Z0-9-_]+$/.test(formData.clientId))
      errors.clientId = 'Only letters, numbers, hyphens and underscores';
    if (!formData.clientName.trim()) errors.clientName = 'Client name is required';
    if (formData.grantTypes.length === 0) errors.grantTypes = 'Pick at least one grant type';
    if (formData.authenticationMethods.length === 0)
      errors.authenticationMethods = 'Pick at least one auth method';

    const validUris = formData.redirectUris.filter((u) => u.trim());
    if (validUris.length === 0) errors.redirectUris = 'At least one redirect URI required';
    else if (validUris.some((u) => !u.startsWith('https://') && !u.startsWith('http://localhost')))
      errors.redirectUris = 'URIs must use HTTPS (localhost can use HTTP)';
    if (formData.scopes.length === 0) errors.scopes = 'Pick at least one scope';

    validationErrors = errors;
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    submitting = true;
    const clean = (arr: (string | null | undefined)[]) =>
      (arr ?? []).filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
    try {
      const result = await createOidcClient({
        ...formData,
        grantTypes: clean(formData.grantTypes),
        authenticationMethods: clean(formData.authenticationMethods),
        scopes: clean(formData.scopes),
        redirectUris: clean(formData.redirectUris),
        postLogoutRedirectUris: clean(formData.postLogoutRedirectUris)
      });
      createdSecret = result.clientSecret;
      notifications.success(`Client "${formData.clientName}" created.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create client.';
      notifications.error(message, 'Create failed');
    } finally {
      submitting = false;
    }
  }
</script>

<div class="container mx-auto px-6 py-10 max-w-2xl">
  <div class="mb-8">
    <a href="/oidc" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
      ← Back to clients
    </a>
    <h1 class="text-3xl sm:text-4xl font-bold mt-2">
      Register a <span class="gradient-text">new OIDC client</span>
    </h1>
    <p class="text-gray-600 mt-1">An application that will authenticate users via this server.</p>
  </div>

  {#if createdSecret}
    <div class="card p-6 sm:p-8 text-center">
      <div class="w-14 h-14 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center text-green-600">
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 class="text-2xl font-bold mb-1">Client created</h2>
      <p class="text-gray-600 mb-6">Hand this secret to the application — it won't be shown again.</p>

      <div class="rounded-xl bg-yellow-50 border border-yellow-200 p-4 mb-6 text-left">
        <p class="text-sm font-medium text-yellow-900 mb-3">⚠️ Copy this secret now.</p>
        <div class="flex items-center gap-2">
          <code class="flex-1 bg-white px-3 py-2 rounded-lg font-mono text-xs break-all border border-yellow-100">
            {createdSecret}
          </code>
          <button
            onclick={() => {
              navigator.clipboard.writeText(createdSecret!);
              notifications.success('Secret copied to clipboard.');
            }}
            class="btn-primary text-sm py-2 px-3 shrink-0"
          >
            Copy
          </button>
        </div>
      </div>

      <button onclick={() => goto('/oidc')} class="btn-secondary">Back to clients</button>
    </div>
  {:else}
    <form onsubmit={handleSubmit} class="card p-6 sm:p-8 space-y-5">
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label for="clientId" class="label">Client ID <span class="text-red-500">*</span></label>
          <input
            id="clientId"
            type="text"
            bind:value={formData.clientId}
            class="field {validationErrors.clientId ? 'field-invalid' : ''}"
            placeholder="my-client-app"
          />
          {#if validationErrors.clientId}<p class="text-xs text-red-600 mt-1">{validationErrors.clientId}</p>{/if}
        </div>

        <div>
          <label for="clientName" class="label">
            Client name <span class="text-red-500">*</span>
          </label>
          <input
            id="clientName"
            type="text"
            bind:value={formData.clientName}
            class="field {validationErrors.clientName ? 'field-invalid' : ''}"
            placeholder="My Client Application"
          />
          {#if validationErrors.clientName}
            <p class="text-xs text-red-600 mt-1">{validationErrors.clientName}</p>
          {/if}
        </div>
      </div>

      <div>
        <p class="label">Grant types <span class="text-red-500">*</span></p>
        <div class="flex flex-wrap gap-2">
          {#each AVAILABLE_GRANT_TYPES as gt}
            <label
              class="flex items-center cursor-pointer px-3 py-2 rounded-lg border text-sm transition-colors {formData.grantTypes.includes(
                gt
              )
                ? 'bg-primary-50 border-primary-300'
                : 'border-gray-200 hover:bg-gray-50'}"
            >
              <input
                type="checkbox"
                checked={formData.grantTypes.includes(gt)}
                onchange={() => (formData.grantTypes = toggleItem(formData.grantTypes, gt))}
                class="mr-2 h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
              />
              <span>{gt}</span>
            </label>
          {/each}
        </div>
        {#if validationErrors.grantTypes}<p class="text-xs text-red-600 mt-1">{validationErrors.grantTypes}</p>{/if}
      </div>

      <div>
        <p class="label">Authentication methods <span class="text-red-500">*</span></p>
        <div class="flex flex-wrap gap-2">
          {#each AVAILABLE_AUTH_METHODS as method}
            <label
              class="flex items-center cursor-pointer px-3 py-2 rounded-lg border text-sm transition-colors {formData.authenticationMethods.includes(
                method
              )
                ? 'bg-primary-50 border-primary-300'
                : 'border-gray-200 hover:bg-gray-50'}"
            >
              <input
                type="checkbox"
                checked={formData.authenticationMethods.includes(method)}
                onchange={() =>
                  (formData.authenticationMethods = toggleItem(
                    formData.authenticationMethods,
                    method
                  ))}
                class="mr-2 h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
              />
              <span>{method}</span>
            </label>
          {/each}
        </div>
        {#if validationErrors.authenticationMethods}
          <p class="text-xs text-red-600 mt-1">{validationErrors.authenticationMethods}</p>
        {/if}
        {#if isPublicClient}
          <p class="text-xs text-yellow-700 mt-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
            Public clients require PKCE — it has been enabled automatically.
          </p>
        {/if}
      </div>

      <div>
        <p class="label">Redirect URIs <span class="text-red-500">*</span></p>
        {#each formData.redirectUris as _, i}
          <div class="flex gap-2 mb-2">
            <input
              type="text"
              bind:value={formData.redirectUris[i]}
              class="field flex-1"
              placeholder="https://example.com/callback"
            />
            {#if formData.redirectUris.length > 1}
              <button
                type="button"
                onclick={() =>
                  (formData.redirectUris = formData.redirectUris.filter((_, j) => j !== i))}
                class="px-3 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                aria-label="Remove URI"
              >
                ×
              </button>
            {/if}
          </div>
        {/each}
        <button
          type="button"
          onclick={() => (formData.redirectUris = [...formData.redirectUris, ''])}
          class="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          + Add redirect URI
        </button>
        {#if validationErrors.redirectUris}<p class="text-xs text-red-600 mt-1">{validationErrors.redirectUris}</p>{/if}
      </div>

      <div>
        <p class="label">Scopes <span class="text-red-500">*</span></p>
        <div class="flex flex-wrap gap-2">
          {#each AVAILABLE_SCOPES as scope}
            <label
              class="flex items-center cursor-pointer px-3 py-2 rounded-lg border text-sm transition-colors {formData.scopes.includes(
                scope
              )
                ? 'bg-purple-50 border-purple-300'
                : 'border-gray-200 hover:bg-gray-50'}"
            >
              <input
                type="checkbox"
                checked={formData.scopes.includes(scope)}
                onchange={() => (formData.scopes = toggleItem(formData.scopes, scope))}
                class="mr-2 h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <span>{scope}</span>
            </label>
          {/each}
        </div>
        {#if validationErrors.scopes}<p class="text-xs text-red-600 mt-1">{validationErrors.scopes}</p>{/if}
      </div>

      <div class="p-4 bg-gray-50 rounded-xl">
        <h4 class="text-sm font-semibold text-gray-900 mb-3">Client settings</h4>
        <div class="flex flex-wrap gap-4">
          <label class="flex items-center cursor-pointer text-sm text-gray-700">
            <input
              type="checkbox"
              bind:checked={formData.clientSettings.requireProofKey}
              disabled={isPublicClient}
              class="mr-2 h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
            />
            Require PKCE
          </label>
          <label class="flex items-center cursor-pointer text-sm text-gray-700">
            <input
              type="checkbox"
              bind:checked={formData.clientSettings.requireAuthorizationConsent}
              class="mr-2 h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
            />
            Require consent
          </label>
        </div>
      </div>

      <div class="p-4 bg-gray-50 rounded-xl">
        <h4 class="text-sm font-semibold text-gray-900 mb-3">Token settings</h4>
        <div class="grid grid-cols-2 gap-4">
          <label class="block">
            <span class="block text-xs font-semibold text-gray-600 mb-1">Access token TTL (s)</span>
            <input
              type="number"
              bind:value={formData.tokenSettings.accessTokenTimeToLiveSeconds}
              class="field text-sm py-2"
            />
          </label>
          <label class="block">
            <span class="block text-xs font-semibold text-gray-600 mb-1">Refresh token TTL (s)</span>
            <input
              type="number"
              bind:value={formData.tokenSettings.refreshTokenTimeToLiveSeconds}
              class="field text-sm py-2"
            />
          </label>
          <label class="block">
            <span class="block text-xs font-semibold text-gray-600 mb-1">Auth code TTL (s)</span>
            <input
              type="number"
              bind:value={formData.tokenSettings.authorizationCodeTimeToLiveSeconds}
              class="field text-sm py-2"
            />
          </label>
          <div class="flex items-end">
            <label class="flex items-center cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                bind:checked={formData.tokenSettings.reuseRefreshTokens}
                class="mr-2 h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
              />
              Reuse refresh tokens
            </label>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 pt-3 border-t border-gray-100">
        <button
          type="submit"
          disabled={submitting || $isLoadingOidcClients}
          class="btn-primary"
        >
          {submitting ? 'Creating…' : 'Create client'}
        </button>
        <button
          type="button"
          onclick={() => goto('/oidc')}
          disabled={submitting}
          class="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  {/if}
</div>
