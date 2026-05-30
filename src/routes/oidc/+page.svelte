<script lang="ts">
  import { goto } from '$app/navigation';
  import {
    deleteOidcClient,
    updateOidcClient,
    regenerateOidcClientSecret,
    loadOidcClients,
    type RegenerateSecretResult
  } from '$lib/oidc/oidc-clients.service';
  import { oidcClients, isLoadingOidcClients } from '$lib/oidc/oidc-clients.store';
  import {
    AVAILABLE_GRANT_TYPES,
    AVAILABLE_SCOPES,
    defaultClientSettings,
    defaultTokenSettings,
    type OidcClient,
    type UpdateOidcClientRequest
  } from '$lib/oidc/oidc-clients.types';
  import { notifications } from '$lib/notifications/notifications.store';
  import { onMount } from 'svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import ConfirmInline from '$lib/components/ConfirmInline.svelte';
  import Modal from '$lib/components/Modal.svelte';

  onMount(() => {
    loadOidcClients().catch(() => {
      notifications.error('Could not load OIDC clients.', 'Load failed');
    });
  });

  let deletingClient = $state<string | null>(null);
  let showDeleteConfirm = $state<string | null>(null);

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

  let showRegenerateConfirm = $state<string | null>(null);
  let isRegenerating = $state(false);
  let regeneratedSecret = $state<{ clientId: string; secret: string } | null>(null);

  function toggleItem(arr: string[], item: string) {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  }

  async function handleDeleteClient(id: string, name: string) {
    try {
      deletingClient = id;
      await deleteOidcClient(id);
      showDeleteConfirm = null;
      notifications.success(`Client "${name}" deleted.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete client.';
      notifications.error(message, 'Delete failed');
    } finally {
      deletingClient = null;
    }
  }

  function openEditModal(client: OidcClient) {
    editingClient = client;
    editForm = {
      clientName: client.clientName,
      grantTypes: [...client.grantTypes],
      redirectUris: client.redirectUris.length ? [...client.redirectUris] : [''],
      postLogoutRedirectUris: client.postLogoutRedirectUris.length
        ? [...client.postLogoutRedirectUris]
        : [''],
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
    if (editForm.grantTypes.length === 0) errors.grantTypes = 'Pick at least one grant type';
    if (editForm.redirectUris.filter((u) => u.trim()).length === 0)
      errors.redirectUris = 'At least one redirect URI is required';
    if (editForm.scopes.length === 0) errors.scopes = 'Pick at least one scope';
    editErrors = errors;
    return Object.keys(errors).length === 0;
  }

  async function handleUpdateClient(e: SubmitEvent) {
    e.preventDefault();
    if (!editingClient || !validateEditForm()) return;
    const clean = (arr: (string | null | undefined)[]) =>
      (arr ?? []).filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
    try {
      isUpdating = true;
      await updateOidcClient(editingClient.id, {
        ...editForm,
        grantTypes: clean(editForm.grantTypes),
        scopes: clean(editForm.scopes),
        redirectUris: clean(editForm.redirectUris),
        postLogoutRedirectUris: clean(editForm.postLogoutRedirectUris)
      });
      notifications.success(`Client "${editForm.clientName}" updated.`);
      showEditModal = false;
      editingClient = null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed.';
      editErrors = { ...editErrors, general: message };
    } finally {
      isUpdating = false;
    }
  }

  async function handleRegenerateSecret(id: string) {
    try {
      isRegenerating = true;
      const result: RegenerateSecretResult = await regenerateOidcClientSecret(id);
      regeneratedSecret = { clientId: result.client.clientId, secret: result.clientSecret };
      showRegenerateConfirm = null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to regenerate secret.';
      notifications.error(message, 'Regenerate failed');
    } finally {
      isRegenerating = false;
    }
  }
</script>

<div class="container mx-auto px-6 py-10">
  <PageHeader title="OIDC Clients" subtitle="Register applications that authenticate via this server.">
    <button onclick={() => goto('/oidc/create')} class="btn-primary">+ New client</button>
  </PageHeader>

  <div class="card p-6">
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-xl font-bold text-gray-900">All clients ({$oidcClients.length})</h2>
    </div>

    {#if $isLoadingOidcClients && $oidcClients.length === 0}
      <div class="py-12 text-center text-gray-500 text-sm">Loading clients…</div>
    {:else if $oidcClients.length === 0}
      <div class="py-12 text-center text-gray-500 text-sm">No OIDC clients yet.</div>
    {:else}
      <div class="space-y-3">
        {#each $oidcClients as client}
          <div class="border border-gray-100 rounded-xl p-4 hover:bg-gray-50/70 transition-colors">
            <div class="flex justify-between items-start gap-4 flex-wrap">
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900">{client.clientName}</h3>
                <p class="text-gray-600 text-sm font-mono truncate">{client.clientId}</p>

                <div class="mt-2 flex gap-1.5 flex-wrap">
                  {#each client.grantTypes as gt}
                    <Badge text={gt} color="blue" />
                  {/each}
                </div>
                <div class="mt-1 flex gap-1.5 flex-wrap">
                  {#each client.scopes as scope}
                    <Badge text={scope} color="purple" />
                  {/each}
                  {#if client.clientSettings.requireProofKey}
                    <Badge text="PKCE" color="green" />
                  {/if}
                </div>
                {#if client.redirectUris.length}
                  <p class="mt-2 text-xs text-gray-500">
                    <span class="font-medium">Redirect URIs:</span>
                    <span class="font-mono ml-1">{client.redirectUris.join(', ')}</span>
                  </p>
                {/if}
              </div>

              <div class="flex gap-2 items-center">
                <button onclick={() => openEditModal(client)} class="btn-secondary text-sm py-1.5 px-3">
                  Edit
                </button>
                <button
                  onclick={() => (showRegenerateConfirm = client.id)}
                  class="text-sm py-1.5 px-3 rounded-lg bg-yellow-100 text-yellow-800 hover:bg-yellow-200 font-semibold transition-colors"
                >
                  Regenerate secret
                </button>
                <button
                  onclick={() => (showDeleteConfirm = client.id)}
                  disabled={deletingClient === client.id}
                  class="btn-danger text-sm py-1.5 px-3"
                >
                  {deletingClient === client.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>

            {#if showDeleteConfirm === client.id}
              <ConfirmInline
                message={`Delete "${client.clientName}"? Applications using it will stop working.`}
                confirmLabel="Yes, delete"
                isLoading={deletingClient === client.id}
                onconfirm={() => handleDeleteClient(client.id, client.clientName)}
                oncancel={() => (showDeleteConfirm = null)}
              />
            {/if}

            {#if showRegenerateConfirm === client.id}
              <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p class="text-yellow-800 font-medium mb-3">
                  Regenerate secret for "{client.clientName}"? The old secret stops working immediately.
                </p>
                <div class="flex gap-2 flex-wrap">
                  <button
                    onclick={() => handleRegenerateSecret(client.id)}
                    disabled={isRegenerating}
                    class="px-4 py-2 rounded-lg bg-yellow-600 text-white font-semibold hover:bg-yellow-700 disabled:opacity-50 text-sm transition-colors"
                  >
                    {isRegenerating ? 'Regenerating…' : 'Yes, regenerate'}
                  </button>
                  <button
                    onclick={() => (showRegenerateConfirm = null)}
                    class="btn-secondary text-sm py-2 px-4"
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
{#if editingClient}
  <Modal title={`Edit: ${editingClient.clientId}`} open={showEditModal} size="lg" onclose={() => (showEditModal = false)}>
    {#if editErrors.general}
      <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
        {editErrors.general}
      </div>
    {/if}

    <form onsubmit={handleUpdateClient} class="space-y-5">
      <div>
        <label for="editClientName" class="label">Client name <span class="text-red-500">*</span></label>
        <input
          id="editClientName"
          type="text"
          bind:value={editForm.clientName}
          class="field {editErrors.clientName ? 'field-invalid' : ''}"
        />
        {#if editErrors.clientName}<p class="text-xs text-red-600 mt-1">{editErrors.clientName}</p>{/if}
      </div>

      <div>
        <p class="label">Grant types <span class="text-red-500">*</span></p>
        <div class="flex flex-wrap gap-2">
          {#each AVAILABLE_GRANT_TYPES as gt}
            <label
              class="flex items-center cursor-pointer px-3 py-2 rounded-lg border text-sm transition-colors {editForm.grantTypes.includes(
                gt
              )
                ? 'bg-primary-50 border-primary-300'
                : 'border-gray-200 hover:bg-gray-50'}"
            >
              <input
                type="checkbox"
                checked={editForm.grantTypes.includes(gt)}
                onchange={() => (editForm.grantTypes = toggleItem(editForm.grantTypes, gt))}
                class="mr-2 h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
              />
              <span>{gt}</span>
            </label>
          {/each}
        </div>
        {#if editErrors.grantTypes}<p class="text-xs text-red-600 mt-1">{editErrors.grantTypes}</p>{/if}
      </div>

      <div>
        <p class="label">Redirect URIs <span class="text-red-500">*</span></p>
        {#each editForm.redirectUris as _, i}
          <div class="flex gap-2 mb-2">
            <input
              type="text"
              bind:value={editForm.redirectUris[i]}
              class="field flex-1"
              placeholder="https://example.com/callback"
            />
            {#if editForm.redirectUris.length > 1}
              <button
                type="button"
                onclick={() =>
                  (editForm.redirectUris = editForm.redirectUris.filter((_, j) => j !== i))}
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
          onclick={() => (editForm.redirectUris = [...editForm.redirectUris, ''])}
          class="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          + Add redirect URI
        </button>
        {#if editErrors.redirectUris}<p class="text-xs text-red-600 mt-1">{editErrors.redirectUris}</p>{/if}
      </div>

      <div>
        <p class="label">Scopes <span class="text-red-500">*</span></p>
        <div class="flex flex-wrap gap-2">
          {#each AVAILABLE_SCOPES as scope}
            <label
              class="flex items-center cursor-pointer px-3 py-2 rounded-lg border text-sm transition-colors {editForm.scopes.includes(
                scope
              )
                ? 'bg-purple-50 border-purple-300'
                : 'border-gray-200 hover:bg-gray-50'}"
            >
              <input
                type="checkbox"
                checked={editForm.scopes.includes(scope)}
                onchange={() => (editForm.scopes = toggleItem(editForm.scopes, scope))}
                class="mr-2 h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <span>{scope}</span>
            </label>
          {/each}
        </div>
        {#if editErrors.scopes}<p class="text-xs text-red-600 mt-1">{editErrors.scopes}</p>{/if}
      </div>

      <div class="p-4 bg-gray-50 rounded-xl">
        <h4 class="text-sm font-semibold text-gray-900 mb-3">Client settings</h4>
        <div class="flex flex-wrap gap-4">
          <label class="flex items-center cursor-pointer text-sm text-gray-700">
            <input
              type="checkbox"
              bind:checked={editForm.clientSettings.requireProofKey}
              class="mr-2 h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
            />
            Require PKCE
          </label>
          <label class="flex items-center cursor-pointer text-sm text-gray-700">
            <input
              type="checkbox"
              bind:checked={editForm.clientSettings.requireAuthorizationConsent}
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
              bind:value={editForm.tokenSettings.accessTokenTimeToLiveSeconds}
              class="field text-sm py-2"
            />
          </label>
          <label class="block">
            <span class="block text-xs font-semibold text-gray-600 mb-1">Refresh token TTL (s)</span>
            <input
              type="number"
              bind:value={editForm.tokenSettings.refreshTokenTimeToLiveSeconds}
              class="field text-sm py-2"
            />
          </label>
          <label class="block">
            <span class="block text-xs font-semibold text-gray-600 mb-1">Auth code TTL (s)</span>
            <input
              type="number"
              bind:value={editForm.tokenSettings.authorizationCodeTimeToLiveSeconds}
              class="field text-sm py-2"
            />
          </label>
          <div class="flex items-end">
            <label class="flex items-center cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                bind:checked={editForm.tokenSettings.reuseRefreshTokens}
                class="mr-2 h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
              />
              Reuse refresh tokens
            </label>
          </div>
        </div>
      </div>

      <div class="flex gap-3 justify-end pt-3 border-t border-gray-100">
        <button
          type="button"
          onclick={() => (showEditModal = false)}
          disabled={isUpdating}
          class="btn-secondary"
        >
          Cancel
        </button>
        <button type="submit" disabled={isUpdating} class="btn-primary">
          {isUpdating ? 'Saving…' : 'Update client'}
        </button>
      </div>
    </form>
  </Modal>
{/if}

<!-- Regenerated secret reveal -->
{#if regeneratedSecret}
  <Modal
    title="Secret regenerated"
    open={regeneratedSecret !== null}
    size="md"
    onclose={() => (regeneratedSecret = null)}
  >
    <div class="text-center">
      <div class="w-14 h-14 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center text-green-600">
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p class="text-gray-700 mb-4">
        Client <span class="font-mono font-semibold">{regeneratedSecret.clientId}</span>
      </p>
    </div>

    <div class="rounded-xl bg-yellow-50 border border-yellow-200 p-4 mb-5">
      <p class="text-sm font-medium text-yellow-900 mb-3">
        ⚠️ Copy this secret now — it won't be shown again.
      </p>
      <div class="flex items-center gap-2">
        <code class="flex-1 bg-white px-3 py-2 rounded-lg font-mono text-xs break-all border border-yellow-100">
          {regeneratedSecret.secret}
        </code>
        <button
          onclick={() => {
            navigator.clipboard.writeText(regeneratedSecret!.secret);
            notifications.success('Secret copied to clipboard.');
          }}
          class="btn-primary text-sm py-2 px-3 shrink-0"
        >
          Copy
        </button>
      </div>
    </div>

    <div class="flex justify-end">
      <button onclick={() => (regeneratedSecret = null)} class="btn-secondary">Close</button>
    </div>
  </Modal>
{/if}
