<script lang="ts">
    import { goto } from '$app/navigation';
    import { createOidcClient } from '$lib/oidc/oidc-clients.service';
    import { isLoadingOidcClients, oidcClientsError } from '$lib/oidc/oidc-clients.store';
    import { defaultTokenSettings, defaultClientSettings } from '$lib/oidc/oidc-clients.types';
    import type { CreateOidcClientRequest } from '$lib/oidc/oidc-clients.types';
  
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
    let successMessage = $state('');
    let createdSecret = $state<string | null>(null);
  
    const availableGrantTypes = ['authorization_code', 'refresh_token', 'client_credentials', 'device_code'];
    const availableAuthMethods = ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt', 'none'];
    const availableScopes = ['openid', 'profile', 'email', 'address', 'phone'];
  
    function toggleItem(arr: string[], item: string) {
      return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
    }
  
    function validateForm(): boolean {
      const errors: Record<string, string> = {};
      if (!formData.clientId.trim()) errors.clientId = 'Client ID is required';
      else if (!/^[a-zA-Z0-9-_]+$/.test(formData.clientId)) errors.clientId = 'Only letters, numbers, hyphens and underscores';
      if (!formData.clientName.trim()) errors.clientName = 'Client name is required';
      if (formData.grantTypes.length === 0) errors.grantTypes = 'At least one grant type is required';
      if (formData.authenticationMethods.length === 0) errors.authenticationMethods = 'At least one auth method is required';
      const validUris = formData.redirectUris.filter(u => u.trim());
      if (validUris.length === 0) errors.redirectUris = 'At least one redirect URI is required';
      else if (validUris.some(u => !u.startsWith('https://') && !u.startsWith('http://localhost')))
        errors.redirectUris = 'URIs must use HTTPS (except localhost)';
      if (formData.scopes.length === 0) errors.scopes = 'At least one scope is required';
      validationErrors = errors;
      return Object.keys(errors).length === 0;
    }
  
    async function handleSubmit(e: Event) {
      e.preventDefault();
      successMessage = '';
      if (!validateForm()) return;
      try {
        const result = await createOidcClient({
          ...formData,
          redirectUris: formData.redirectUris.filter(u => u.trim()),
          postLogoutRedirectUris: formData.postLogoutRedirectUris.filter(u => u.trim())
        });
        createdSecret = result.clientSecret;
      } catch (err) {
        console.error('Failed to create client:', err);
      }
    }
  </script>
  
  <div class="container mx-auto p-6 max-w-2xl">
    <div class="mb-6">
      <h1 class="text-3xl font-bold">Create OIDC Client</h1>
      <p class="text-gray-600 mt-2">Fill in the details to register a new OIDC client</p>
    </div>
  
    <!-- Secret reveal after creation -->
    {#if createdSecret}
      <div class="bg-white shadow-md rounded px-8 pt-6 pb-8 text-center">
        <div class="mb-4 text-green-600">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h2 class="text-2xl font-bold mb-4">Client Created!</h2>
        <div class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-left">
          <p class="text-yellow-800 font-semibold mb-2">⚠️ Copy this secret now — it won't be shown again!</p>
          <div class="flex items-center gap-2">
            <code class="bg-gray-100 px-3 py-2 rounded font-mono text-sm break-all flex-1">{createdSecret}</code>
            <button
              onclick={() => navigator.clipboard.writeText(createdSecret!)}
              class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm shrink-0"
            >Copy</button>
          </div>
        </div>
        <button
          onclick={() => goto('/oidc')}
          class="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 font-semibold"
        >
          Back to Clients
        </button>
      </div>
    {:else}
      {#if $oidcClientsError}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{$oidcClientsError}</div>
      {/if}
  
      <form onsubmit={handleSubmit} class="bg-white shadow-md rounded px-8 pt-6 pb-8 space-y-4">
  
        <!-- Client ID -->
        <div>
          <label for="clientId" class="block text-gray-700 text-sm font-bold mb-2">Client ID <span class="text-red-500">*</span></label>
          <input id="clientId" type="text" bind:value={formData.clientId}
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none {validationErrors.clientId ? 'border-red-500' : 'border-gray-300'}"
            placeholder="my-client-app" />
          {#if validationErrors.clientId}<p class="text-red-500 text-xs italic mt-1">{validationErrors.clientId}</p>{/if}
        </div>
  
        <!-- Client Name -->
        <div>
          <label for="clientName" class="block text-gray-700 text-sm font-bold mb-2">Client Name <span class="text-red-500">*</span></label>
          <input id="clientName" type="text" bind:value={formData.clientName}
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none {validationErrors.clientName ? 'border-red-500' : 'border-gray-300'}"
            placeholder="My Client Application" />
          {#if validationErrors.clientName}<p class="text-red-500 text-xs italic mt-1">{validationErrors.clientName}</p>{/if}
        </div>
  
        <!-- Grant Types -->
        <div>
          <p class="block text-gray-700 text-sm font-bold mb-2">Grant Types <span class="text-red-500">*</span></p>
          <div class="flex flex-wrap gap-2">
            {#each availableGrantTypes as gt}
              <label class="flex items-center cursor-pointer p-2 border rounded hover:bg-gray-50 {formData.grantTypes.includes(gt) ? 'bg-blue-50 border-blue-300' : 'border-gray-300'}">
                <input type="checkbox" checked={formData.grantTypes.includes(gt)} onchange={() => formData.grantTypes = toggleItem(formData.grantTypes, gt)} class="mr-2" />
                <span class="text-sm">{gt}</span>
              </label>
            {/each}
          </div>
          {#if validationErrors.grantTypes}<p class="text-red-500 text-xs italic mt-1">{validationErrors.grantTypes}</p>{/if}
        </div>
  
        <!-- Auth Methods -->
        <div>
          <p class="block text-gray-700 text-sm font-bold mb-2">Authentication Methods <span class="text-red-500">*</span></p>
          <div class="flex flex-wrap gap-2">
            {#each availableAuthMethods as method}
              <label class="flex items-center cursor-pointer p-2 border rounded hover:bg-gray-50 {formData.authenticationMethods.includes(method) ? 'bg-blue-50 border-blue-300' : 'border-gray-300'}">
                <input type="checkbox" checked={formData.authenticationMethods.includes(method)} onchange={() => formData.authenticationMethods = toggleItem(formData.authenticationMethods, method)} class="mr-2" />
                <span class="text-sm">{method}</span>
              </label>
            {/each}
          </div>
          {#if validationErrors.authenticationMethods}<p class="text-red-500 text-xs italic mt-1">{validationErrors.authenticationMethods}</p>{/if}
        </div>
  
        <!-- Redirect URIs -->
        <div>
          <p class="block text-gray-700 text-sm font-bold mb-2">Redirect URIs <span class="text-red-500">*</span></p>
          {#each formData.redirectUris as _, i}
            <div class="flex gap-2 mb-2">
              <input type="text" bind:value={formData.redirectUris[i]}
                class="shadow appearance-none border border-gray-300 rounded flex-1 py-2 px-3 text-gray-700 focus:outline-none"
                placeholder="https://example.com/callback" />
              {#if formData.redirectUris.length > 1}
                <button type="button" onclick={() => formData.redirectUris = formData.redirectUris.filter((_, j) => j !== i)}
                  class="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200">×</button>
              {/if}
            </div>
          {/each}
          <button type="button" onclick={() => formData.redirectUris = [...formData.redirectUris, '']}
            class="text-sm text-blue-600 hover:text-blue-800">+ Add redirect URI</button>
          {#if validationErrors.redirectUris}<p class="text-red-500 text-xs italic mt-1">{validationErrors.redirectUris}</p>{/if}
        </div>
  
        <!-- Scopes -->
        <div>
          <p class="block text-gray-700 text-sm font-bold mb-2">Scopes <span class="text-red-500">*</span></p>
          <div class="flex flex-wrap gap-2">
            {#each availableScopes as scope}
              <label class="flex items-center cursor-pointer p-2 border rounded hover:bg-gray-50 {formData.scopes.includes(scope) ? 'bg-purple-50 border-purple-300' : 'border-gray-300'}">
                <input type="checkbox" checked={formData.scopes.includes(scope)} onchange={() => formData.scopes = toggleItem(formData.scopes, scope)} class="mr-2" />
                <span class="text-sm">{scope}</span>
              </label>
            {/each}
          </div>
          {#if validationErrors.scopes}<p class="text-red-500 text-xs italic mt-1">{validationErrors.scopes}</p>{/if}
        </div>
  
        <!-- Client Settings -->
        <div class="p-4 bg-gray-50 rounded">
          <h4 class="font-semibold mb-3">Client Settings</h4>
          <div class="flex gap-4">
            <label class="flex items-center cursor-pointer">
              <input type="checkbox" bind:checked={formData.clientSettings.requireProofKey} class="mr-2" />
              <span class="text-sm">Require PKCE</span>
            </label>
            <label class="flex items-center cursor-pointer">
              <input type="checkbox" bind:checked={formData.clientSettings.requireAuthorizationConsent} class="mr-2" />
              <span class="text-sm">Require Consent</span>
            </label>
          </div>
        </div>
  
        <!-- Token Settings -->
        <div class="p-4 bg-gray-50 rounded">
          <h4 class="font-semibold mb-3">Token Settings</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-gray-700 text-xs font-bold mb-1">Access Token TTL (s)</label>
              <input type="number" bind:value={formData.tokenSettings.accessTokenTimeToLiveSeconds}
                class="shadow border rounded w-full py-2 px-3 text-gray-700 text-sm" />
            </div>
            <div>
              <label class="block text-gray-700 text-xs font-bold mb-1">Refresh Token TTL (s)</label>
              <input type="number" bind:value={formData.tokenSettings.refreshTokenTimeToLiveSeconds}
                class="shadow border rounded w-full py-2 px-3 text-gray-700 text-sm" />
            </div>
            <div>
              <label class="block text-gray-700 text-xs font-bold mb-1">Auth Code TTL (s)</label>
              <input type="number" bind:value={formData.tokenSettings.authorizationCodeTimeToLiveSeconds}
                class="shadow border rounded w-full py-2 px-3 text-gray-700 text-sm" />
            </div>
            <div class="flex items-center">
              <label class="flex items-center cursor-pointer">
                <input type="checkbox" bind:checked={formData.tokenSettings.reuseRefreshTokens} class="mr-2" />
                <span class="text-sm">Reuse Refresh Tokens</span>
              </label>
            </div>
          </div>
        </div>
  
        <!-- Actions — same layout as create user -->
        <div class="flex items-center justify-between gap-4 mt-6">
          <button type="submit" disabled={$isLoadingOidcClients}
            style="background-color: #3B82F6;"
            class="text-white font-bold py-3 px-6 rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
            {$isLoadingOidcClients ? 'Creating...' : 'Create Client'}
          </button>
          <button type="button" onclick={() => goto('/oidc')}
            style="background-color: #6B7280;"
            class="text-white font-bold py-3 px-6 rounded hover:opacity-90 transition-opacity">
            Cancel
          </button>
        </div>
      </form>
    {/if}
  </div>