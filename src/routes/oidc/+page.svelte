<script lang="ts">
  import { goto } from '$app/navigation';
  import { logout } from '$lib/auth';
  import {
    deleteOidcClient,
    updateOidcClient,
    regenerateOidcClientSecret,
    loadOidcClients,
    type RegenerateSecretResult
  } from '$lib/oidc/oidc-clients.service';
  import { oidcClients, isLoadingOidcClients, oidcClientsError } from '$lib/oidc/oidc-clients.store';
  import {
    defaultTokenSettings,
    defaultClientSettings,
    type OidcClient,
    type UpdateOidcClientRequest
  } from '$lib/oidc/oidc-clients.types';
  import { onMount } from 'svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import ConfirmInline from '$lib/components/ConfirmInline.svelte';

  onMount(() => loadOidcClients());

  // Delete state
  let deletingClient = $state<string | null>(null);
  let showDeleteConfirm = $state<string | null>(null);

  // Edit modal state
  let showEditModal = $state(false);
  let editingClient = $state<OidcClient | null>(null);
  let editForm = $state<UpdateOidcClientRequest>({
    clientName: '',
    grantTypes: [],
    redirectUris: [],
    postLogoutRedirectUris: [],
    scopes: [],
    tokenSettings: { ...defaultTokenSettings },
    clientSettings: { ...defaultClientSettings }
  });
  let editErrors = $state<Record<string, string>>({});
  let isUpdating = $state(false);

  // Regenerate state
  let showRegenerateConfirm = $state<string | null>(null);
  let isRegenerating = $state(false);
  let regeneratedSecret = $state<{ clientId: string; secret: string } | null>(null);

  const availableGrantTypes = ['authorization_code', 'refresh_token', 'client_credentials', 'device_code'];
  const availableScopes = ['openid', 'profile', 'email', 'address', 'phone'];

  function toggleItem(arr: string[], item: string) {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
  }

  // Delete
  async function handleDeleteClient(id: string) {
    try {
      deletingClient = id;
      await deleteOidcClient(id);
      showDeleteConfirm = null;
    } catch (err) {
      console.error('Failed to delete client:', err);
    } finally {
      deletingClient = null;
    }
  }

  // Edit
  function openEditModal(client: OidcClient) {
    editingClient = client;
    editForm = {
      clientName: client.clientName,
      grantTypes: [...client.grantTypes],
      redirectUris: [...client.redirectUris],
      postLogoutRedirectUris: [...client.postLogoutRedirectUris],
      scopes: [...client.scopes],
      tokenSettings: { ...client.tokenSettings },
      clientSettings: { ...client.clientSettings }
    };
    editErrors = {};
    showEditModal = true;
  }

  function validateEditForm(): boolean {
    const errors: Record<string, string> = {};
    if (!editForm.clientName.trim()) errors.clientName = 'Client name is required';
    if (editForm.grantTypes.length === 0) errors.grantTypes = 'At least one grant type is required';
    if (editForm.redirectUris.filter(u => u.trim()).length === 0) errors.redirectUris = 'At least one redirect URI is required';
    if (editForm.scopes.length === 0) errors.scopes = 'At least one scope is required';
    editErrors = errors;
    return Object.keys(errors).length === 0;
  }

  async function handleUpdateClient() {
    if (!editingClient || !validateEditForm()) return;
    try {
      isUpdating = true;
      await updateOidcClient(editingClient.id, {
        ...editForm,
        redirectUris: editForm.redirectUris.filter(u => u.trim()),
        postLogoutRedirectUris: editForm.postLogoutRedirectUris.filter(u => u.trim())
      });
      showEditModal = false;
      editingClient = null;
    } catch (err) {
      console.error('Failed to update client:', err);
      editErrors.general = 'Failed to update client. Please try again.';
    } finally {
      isUpdating = false;
    }
  }

  // Regenerate
  async function handleRegenerateSecret(id: string) {
    try {
      isRegenerating = true;
      const result: RegenerateSecretResult = await regenerateOidcClientSecret(id);
      regeneratedSecret = { clientId: result.client.clientId, secret: result.clientSecret };
      showRegenerateConfirm = null;
    } catch (err) {
      console.error('Failed to regenerate secret:', err);
    } finally {
      isRegenerating = false;
    }
  }
</script>

<div class="container mx-auto p-6">
  <PageHeader title="OIDC Clients">
  </PageHeader>

  {#if $oidcClientsError}
    <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{$oidcClientsError}</div>
  {/if}

  <div class="bg-white p-6 rounded shadow">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold">Clients ({$oidcClients.length})</h2>
      <button
        onclick={() => goto('/oidc/create')}
        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
      >
        + Create Client
      </button>
    </div>

    {#if $isLoadingOidcClients}
      <p class="text-gray-600">Loading clients...</p>
    {:else if $oidcClients.length === 0}
      <p class="text-gray-600">No OIDC clients found.</p>
    {:else}
      <div class="space-y-4">
        {#each $oidcClients as client}
          <div class="border border-gray-200 rounded p-4 hover:bg-gray-50 transition-colors">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h3 class="font-semibold text-lg">{client.clientName}</h3>
                <p class="text-gray-600 text-sm font-mono">{client.clientId}</p>

                <div class="mt-2 flex gap-1 flex-wrap">
                  {#each client.grantTypes as gt}
                    <Badge text={gt} color="blue" />
                  {/each}
                </div>
                <div class="mt-1 flex gap-1 flex-wrap">
                  {#each client.scopes as scope}
                    <Badge text={scope} color="purple" />
                  {/each}
                </div>
                <div class="mt-2 text-sm text-gray-500">
                  <span class="font-medium">Redirect URIs:</span>
                  {#each client.redirectUris as uri}
                    <span class="ml-1 font-mono text-xs">{uri}</span>
                  {/each}
                </div>
              </div>

              <!-- Actions — same pattern as users page -->
              <div class="flex gap-2 flex-wrap items-center">
                <button
                  onclick={() => openEditModal(client)}
                  class="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onclick={() => showRegenerateConfirm = client.id}
                  class="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
                >
                  Regen Secret
                </button>
                <button
                  onclick={() => showDeleteConfirm = client.id}
                  disabled={deletingClient === client.id}
                  class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {deletingClient === client.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>

            <!-- Delete confirmation — same component as users page -->
            {#if showDeleteConfirm === client.id}
              <ConfirmInline
                message={`Are you sure you want to delete "${client.clientName}"?`}
                confirmLabel="Yes, Delete"
                isLoading={deletingClient === client.id}
                onconfirm={() => handleDeleteClient(client.id)}
                oncancel={() => showDeleteConfirm = null}
              />
            {/if}

            <!-- Regenerate confirmation -->
            {#if showRegenerateConfirm === client.id}
              <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p class="text-yellow-800 font-semibold mb-3">
                  Regenerate secret for "{client.clientName}"? The old secret will stop working immediately.
                </p>
                <div class="flex gap-3">
                  <button
                    onclick={() => handleRegenerateSecret(client.id)}
                    disabled={isRegenerating}
                    class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 font-semibold disabled:opacity-50"
                  >
                    {isRegenerating ? 'Regenerating...' : 'Yes, Regenerate'}
                  </button>
                  <button
                    onclick={() => showRegenerateConfirm = null}
                    class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Edit Modal -->
{#if showEditModal && editingClient}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
    <div class="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
      <h3 class="text-2xl font-bold text-gray-900 mb-4">Edit: {editingClient.clientId}</h3>

      {#if editErrors.general}
        <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{editErrors.general}</div>
      {/if}

      <form onsubmit={(e) => { e.preventDefault(); handleUpdateClient(); }} class="space-y-4">

        <div>
          <label for="editClientName" class="block text-gray-700 text-sm font-bold mb-2">Client Name <span class="text-red-500">*</span></label>
          <input id="editClientName" type="text" bind:value={editForm.clientName}
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none {editErrors.clientName ? 'border-red-500' : 'border-gray-300'}" />
          {#if editErrors.clientName}<p class="text-red-500 text-xs italic mt-1">{editErrors.clientName}</p>{/if}
        </div>

        <div>
          <p class="block text-gray-700 text-sm font-bold mb-2">Grant Types <span class="text-red-500">*</span></p>
          <div class="flex flex-wrap gap-2">
            {#each availableGrantTypes as gt}
              <label class="flex items-center cursor-pointer p-2 border rounded hover:bg-gray-50 {editForm.grantTypes.includes(gt) ? 'bg-blue-50 border-blue-300' : 'border-gray-300'}">
                <input type="checkbox" checked={editForm.grantTypes.includes(gt)} onchange={() => editForm.grantTypes = toggleItem(editForm.grantTypes, gt)} class="mr-2" />
                <span class="text-sm">{gt}</span>
              </label>
            {/each}
          </div>
          {#if editErrors.grantTypes}<p class="text-red-500 text-xs italic mt-1">{editErrors.grantTypes}</p>{/if}
        </div>

        <div>
          <p class="block text-gray-700 text-sm font-bold mb-2">Redirect URIs <span class="text-red-500">*</span></p>
          {#each editForm.redirectUris as _, i}
            <div class="flex gap-2 mb-2">
              <input type="text" bind:value={editForm.redirectUris[i]}
                class="shadow appearance-none border border-gray-300 rounded flex-1 py-2 px-3 text-gray-700 focus:outline-none" />
              {#if editForm.redirectUris.length > 1}
                <button type="button" onclick={() => editForm.redirectUris = editForm.redirectUris.filter((_, j) => j !== i)}
                  class="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200">×</button>
              {/if}
            </div>
          {/each}
          <button type="button" onclick={() => editForm.redirectUris = [...editForm.redirectUris, '']}
            class="text-sm text-blue-600 hover:text-blue-800">+ Add redirect URI</button>
          {#if editErrors.redirectUris}<p class="text-red-500 text-xs italic mt-1">{editErrors.redirectUris}</p>{/if}
        </div>

        <div>
          <p class="block text-gray-700 text-sm font-bold mb-2">Scopes <span class="text-red-500">*</span></p>
          <div class="flex flex-wrap gap-2">
            {#each availableScopes as scope}
              <label class="flex items-center cursor-pointer p-2 border rounded hover:bg-gray-50 {editForm.scopes.includes(scope) ? 'bg-purple-50 border-purple-300' : 'border-gray-300'}">
                <input type="checkbox" checked={editForm.scopes.includes(scope)} onchange={() => editForm.scopes = toggleItem(editForm.scopes, scope)} class="mr-2" />
                <span class="text-sm">{scope}</span>
              </label>
            {/each}
          </div>
          {#if editErrors.scopes}<p class="text-red-500 text-xs italic mt-1">{editErrors.scopes}</p>{/if}
        </div>

        <div class="p-4 bg-gray-50 rounded">
          <h4 class="font-semibold mb-3">Client Settings</h4>
          <div class="flex gap-4">
            <label class="flex items-center cursor-pointer">
              <input type="checkbox" bind:checked={editForm.clientSettings.requireProofKey} class="mr-2" />
              <span class="text-sm">Require PKCE</span>
            </label>
            <label class="flex items-center cursor-pointer">
              <input type="checkbox" bind:checked={editForm.clientSettings.requireAuthorizationConsent} class="mr-2" />
              <span class="text-sm">Require Consent</span>
            </label>
          </div>
        </div>

        <div class="p-4 bg-gray-50 rounded">
          <h4 class="font-semibold mb-3">Token Settings</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-gray-700 text-xs font-bold mb-1">Access Token TTL (s)</label>
              <input type="number" bind:value={editForm.tokenSettings.accessTokenTimeToLiveSeconds} class="shadow border rounded w-full py-2 px-3 text-gray-700 text-sm" />
            </div>
            <div>
              <label class="block text-gray-700 text-xs font-bold mb-1">Refresh Token TTL (s)</label>
              <input type="number" bind:value={editForm.tokenSettings.refreshTokenTimeToLiveSeconds} class="shadow border rounded w-full py-2 px-3 text-gray-700 text-sm" />
            </div>
            <div>
              <label class="block text-gray-700 text-xs font-bold mb-1">Auth Code TTL (s)</label>
              <input type="number" bind:value={editForm.tokenSettings.authorizationCodeTimeToLiveSeconds} class="shadow border rounded w-full py-2 px-3 text-gray-700 text-sm" />
            </div>
            <div class="flex items-center">
              <label class="flex items-center cursor-pointer">
                <input type="checkbox" bind:checked={editForm.tokenSettings.reuseRefreshTokens} class="mr-2" />
                <span class="text-sm">Reuse Refresh Tokens</span>
              </label>
            </div>
          </div>
        </div>

        <div class="flex gap-3 justify-end pt-2">
          <button type="button" onclick={() => showEditModal = false} disabled={isUpdating}
            class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-semibold disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={isUpdating}
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold disabled:bg-blue-400">
            {isUpdating ? 'Updating...' : 'Update Client'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Regenerated Secret Modal -->
{#if regeneratedSecret}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 text-center">
      <div class="mb-4 text-green-600">
        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h3 class="text-2xl font-bold text-gray-900 mb-2">Secret Regenerated!</h3>
      <p class="text-gray-600 mb-4">Client: <span class="font-mono">{regeneratedSecret.clientId}</span></p>
      <div class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-left">
        <p class="text-yellow-800 font-semibold mb-2">⚠️ Save this secret now — it won't be shown again!</p>
        <div class="flex items-center gap-2">
          <code class="bg-gray-100 px-3 py-2 rounded font-mono text-sm break-all flex-1">{regeneratedSecret.secret}</code>
          <button onclick={() => navigator.clipboard.writeText(regeneratedSecret!.secret)}
            class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm shrink-0">Copy</button>
        </div>
      </div>
      <button onclick={() => regeneratedSecret = null}
        class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-semibold">Close</button>
    </div>
  </div>
{/if}