<script lang="ts">
    import { user, logout } from '$lib/auth';
    import { goto } from '$app/navigation';
    import {
      loadOidcClients,
      deleteOidcClient,
      createOidcClient,
      updateOidcClient,
      regenerateOidcClientSecret,
      type CreateClientResult,
      type RegenerateSecretResult
    } from '$lib/oidc/oidc-clients.service';
    import {
      oidcClients,
      isLoadingOidcClients,
      oidcClientsError
    } from '$lib/oidc/oidc-clients.store';
    import {
      defaultTokenSettings,
      defaultClientSettings,
      type OidcClient,
      type CreateOidcClientRequest,
      type UpdateOidcClientRequest
    } from '$lib/oidc/oidc-clients.types';
    import { onMount } from 'svelte';
  
    // Load clients on mount
    onMount(() => {
      loadOidcClients();
    });
  
    // Delete state
    let deletingClient = $state<string | null>(null);
    let showDeleteConfirm = $state<string | null>(null);
  
    // Create modal state
    let showCreateModal = $state(false);
    let createForm = $state<CreateOidcClientRequest>({
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
    let createErrors = $state<Record<string, string>>({});
    let isCreating = $state(false);
    let createdSecret = $state<string | null>(null);
  
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
  
    // Regenerate secret state
    let showRegenerateConfirm = $state<string | null>(null);
    let isRegenerating = $state(false);
    let regeneratedSecret = $state<{ clientId: string; secret: string } | null>(null);
  
    // Available options
    const availableGrantTypes = [
      'authorization_code',
      'refresh_token',
      'client_credentials',
      'device_code'
    ];
    const availableAuthMethods = [
      'client_secret_basic',
      'client_secret_post',
      'client_secret_jwt',
      'private_key_jwt',
      'none'
    ];
    const availableScopes = ['openid', 'profile', 'email', 'address', 'phone'];
  
    async function handleLogout() {
      await logout();
      goto('/login');
    }
  
    // Delete functions
    function confirmDelete(id: string) {
      showDeleteConfirm = id;
    }
  
    function cancelDelete() {
      showDeleteConfirm = null;
    }
  
    async function handleDeleteClient(id: string) {
      try {
        deletingClient = id;
        await deleteOidcClient(id);
        showDeleteConfirm = null;
      } catch (error) {
        console.error('Failed to delete client:', error);
      } finally {
        deletingClient = null;
      }
    }
  
    // Create functions
    function openCreateModal() {
      showCreateModal = true;
      createForm = {
        clientId: '',
        clientName: '',
        grantTypes: ['authorization_code'],
        authenticationMethods: ['client_secret_basic'],
        redirectUris: [''],
        postLogoutRedirectUris: [''],
        scopes: ['openid'],
        tokenSettings: { ...defaultTokenSettings },
        clientSettings: { ...defaultClientSettings }
      };
      createErrors = {};
      createdSecret = null;
    }
  
    function closeCreateModal() {
      showCreateModal = false;
      createdSecret = null;
    }
  
    function addRedirectUri() {
      createForm.redirectUris = [...createForm.redirectUris, ''];
    }
  
    function removeRedirectUri(index: number) {
      createForm.redirectUris = createForm.redirectUris.filter((_, i) => i !== index);
    }
  
    function addPostLogoutUri() {
      createForm.postLogoutRedirectUris = [...createForm.postLogoutRedirectUris, ''];
    }
  
    function removePostLogoutUri(index: number) {
      createForm.postLogoutRedirectUris = createForm.postLogoutRedirectUris.filter((_, i) => i !== index);
    }
  
    function toggleCreateGrantType(grantType: string) {
      if (createForm.grantTypes.includes(grantType)) {
        createForm.grantTypes = createForm.grantTypes.filter(gt => gt !== grantType);
      } else {
        createForm.grantTypes = [...createForm.grantTypes, grantType];
      }
    }
  
    function toggleCreateAuthMethod(method: string) {
      if (createForm.authenticationMethods.includes(method)) {
        createForm.authenticationMethods = createForm.authenticationMethods.filter(m => m !== method);
      } else {
        createForm.authenticationMethods = [...createForm.authenticationMethods, method];
      }
    }
  
    function toggleCreateScope(scope: string) {
      if (createForm.scopes.includes(scope)) {
        createForm.scopes = createForm.scopes.filter(s => s !== scope);
      } else {
        createForm.scopes = [...createForm.scopes, scope];
      }
    }
  
    function validateCreateForm(): boolean {
      const errors: Record<string, string> = {};
  
      if (!createForm.clientId.trim()) {
        errors.clientId = 'Client ID is required';
      } else if (!/^[a-zA-Z0-9-_]+$/.test(createForm.clientId)) {
        errors.clientId = 'Client ID can only contain letters, numbers, hyphens, and underscores';
      }
  
      if (!createForm.clientName.trim()) {
        errors.clientName = 'Client name is required';
      }
  
      if (createForm.grantTypes.length === 0) {
        errors.grantTypes = 'At least one grant type is required';
      }
  
      if (createForm.authenticationMethods.length === 0) {
        errors.authenticationMethods = 'At least one authentication method is required';
      }
  
      const validRedirectUris = createForm.redirectUris.filter(uri => uri.trim());
      if (validRedirectUris.length === 0) {
        errors.redirectUris = 'At least one redirect URI is required';
      } else {
        for (const uri of validRedirectUris) {
          if (!uri.startsWith('https://') && !uri.startsWith('http://localhost')) {
            errors.redirectUris = 'Redirect URIs must use HTTPS (except localhost)';
            break;
          }
        }
      }
  
      if (createForm.scopes.length === 0) {
        errors.scopes = 'At least one scope is required';
      }
  
      createErrors = errors;
      return Object.keys(errors).length === 0;
    }
  
    async function handleCreateClient() {
      if (!validateCreateForm()) {
        return;
      }
  
      try {
        isCreating = true;
        const request: CreateOidcClientRequest = {
          ...createForm,
          redirectUris: createForm.redirectUris.filter(uri => uri.trim()),
          postLogoutRedirectUris: createForm.postLogoutRedirectUris.filter(uri => uri.trim())
        };
        
        const result: CreateClientResult = await createOidcClient(request);
        createdSecret = result.clientSecret;
      } catch (error) {
        console.error('Failed to create client:', error);
        createErrors.general = 'Failed to create client. Please try again.';
      } finally {
        isCreating = false;
      }
    }
  
    // Edit functions
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
  
    function closeEditModal() {
      showEditModal = false;
      editingClient = null;
    }
  
    function addEditRedirectUri() {
      editForm.redirectUris = [...editForm.redirectUris, ''];
    }
  
    function removeEditRedirectUri(index: number) {
      editForm.redirectUris = editForm.redirectUris.filter((_, i) => i !== index);
    }
  
    function addEditPostLogoutUri() {
      editForm.postLogoutRedirectUris = [...editForm.postLogoutRedirectUris, ''];
    }
  
    function removeEditPostLogoutUri(index: number) {
      editForm.postLogoutRedirectUris = editForm.postLogoutRedirectUris.filter((_, i) => i !== index);
    }
  
    function toggleEditGrantType(grantType: string) {
      if (editForm.grantTypes.includes(grantType)) {
        editForm.grantTypes = editForm.grantTypes.filter(gt => gt !== grantType);
      } else {
        editForm.grantTypes = [...editForm.grantTypes, grantType];
      }
    }
  
    function toggleEditScope(scope: string) {
      if (editForm.scopes.includes(scope)) {
        editForm.scopes = editForm.scopes.filter(s => s !== scope);
      } else {
        editForm.scopes = [...editForm.scopes, scope];
      }
    }
  
    function validateEditForm(): boolean {
      const errors: Record<string, string> = {};
  
      if (!editForm.clientName.trim()) {
        errors.clientName = 'Client name is required';
      }
  
      if (editForm.grantTypes.length === 0) {
        errors.grantTypes = 'At least one grant type is required';
      }
  
      const validRedirectUris = editForm.redirectUris.filter(uri => uri.trim());
      if (validRedirectUris.length === 0) {
        errors.redirectUris = 'At least one redirect URI is required';
      }
  
      if (editForm.scopes.length === 0) {
        errors.scopes = 'At least one scope is required';
      }
  
      editErrors = errors;
      return Object.keys(errors).length === 0;
    }
  
    async function handleUpdateClient() {
      if (!editingClient || !validateEditForm()) {
        return;
      }
  
      try {
        isUpdating = true;
        const request: UpdateOidcClientRequest = {
          ...editForm,
          redirectUris: editForm.redirectUris.filter(uri => uri.trim()),
          postLogoutRedirectUris: editForm.postLogoutRedirectUris.filter(uri => uri.trim())
        };
        
        await updateOidcClient(editingClient.id, request);
        closeEditModal();
      } catch (error) {
        console.error('Failed to update client:', error);
        editErrors.general = 'Failed to update client. Please try again.';
      } finally {
        isUpdating = false;
      }
    }
  
    // Regenerate secret functions
    function confirmRegenerate(id: string) {
      showRegenerateConfirm = id;
    }
  
    function cancelRegenerate() {
      showRegenerateConfirm = null;
    }
  
    async function handleRegenerateSecret(id: string) {
      try {
        isRegenerating = true;
        const result: RegenerateSecretResult = await regenerateOidcClientSecret(id);
        regeneratedSecret = {
          clientId: result.client.clientId,
          secret: result.clientSecret
        };
        showRegenerateConfirm = null;
      } catch (error) {
        console.error('Failed to regenerate secret:', error);
      } finally {
        isRegenerating = false;
      }
    }
  
    function closeRegeneratedSecretModal() {
      regeneratedSecret = null;
    }
  
    function copyToClipboard(text: string) {
      navigator.clipboard.writeText(text);
    }
  </script>
  
  <div class="container mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">OIDC Clients Management</h1>
      <div class="flex gap-3">
        <button
          onclick={() => goto('/dashboard')}
          class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Back to Dashboard
        </button>
        <button
          onclick={handleLogout}
          class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  
    {#if $oidcClientsError}
      <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
        {$oidcClientsError}
      </div>
    {/if}
  
    <!-- Clients List -->
    <div class="bg-white p-6 rounded shadow">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">Clients ({$oidcClients.length})</h2>
        <button
          onclick={openCreateModal}
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
                  
                  <!-- Grant Types -->
                  <div class="mt-2 flex gap-1 flex-wrap">
                    {#each client.grantTypes as grantType}
                      <span class="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                        {grantType}
                      </span>
                    {/each}
                  </div>
  
                  <!-- Scopes -->
                  <div class="mt-1 flex gap-1 flex-wrap">
                    {#each client.scopes as scope}
                      <span class="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">
                        {scope}
                      </span>
                    {/each}
                  </div>
  
                  <!-- Redirect URIs -->
                  <div class="mt-2 text-sm text-gray-500">
                    <span class="font-medium">Redirect URIs:</span>
                    {#each client.redirectUris as uri}
                      <span class="ml-1 font-mono text-xs">{uri}</span>
                    {/each}
                  </div>
                </div>
  
                <!-- Actions -->
                <div class="flex gap-2 flex-wrap items-center">
                  <button
                    onclick={() => openEditModal(client)}
                    class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onclick={() => confirmRegenerate(client.id)}
                    class="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                  >
                    Regenerate Secret
                  </button>
                  <button
                    onclick={() => confirmDelete(client.id)}
                    disabled={deletingClient === client.id}
                    class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {#if deletingClient === client.id}
                      Deleting...
                    {:else}
                      Delete
                    {/if}
                  </button>
                </div>
              </div>
  
              <!-- Delete Confirmation -->
              {#if showDeleteConfirm === client.id}
                <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                  <p class="text-red-800 font-semibold mb-3">
                    Are you sure you want to delete client "{client.clientName}"?
                  </p>
                  <div class="flex gap-3">
                    <button
                      onclick={() => handleDeleteClient(client.id)}
                      class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onclick={cancelDelete}
                      class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              {/if}
  
              <!-- Regenerate Secret Confirmation -->
              {#if showRegenerateConfirm === client.id}
                <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p class="text-yellow-800 font-semibold mb-3">
                    Are you sure you want to regenerate the secret for "{client.clientName}"? The old secret will stop working immediately.
                  </p>
                  <div class="flex gap-3">
                    <button
                      onclick={() => handleRegenerateSecret(client.id)}
                      disabled={isRegenerating}
                      class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 font-semibold disabled:bg-yellow-400"
                    >
                      {#if isRegenerating}
                        Regenerating...
                      {:else}
                        Yes, Regenerate
                      {/if}
                    </button>
                    <button
                      onclick={cancelRegenerate}
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
  
  <!-- Create Client Modal -->
  {#if showCreateModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
        {#if createdSecret}
          <!-- Success: Show secret -->
          <div class="text-center">
            <div class="mb-4 text-green-600">
              <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Client Created Successfully!</h3>
            <div class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p class="text-yellow-800 font-semibold mb-2">⚠️ Save this secret now - it won't be shown again!</p>
              <div class="flex items-center gap-2 justify-center">
                <code class="bg-gray-100 px-3 py-2 rounded font-mono text-sm break-all">{createdSecret}</code>
                <button
                  onclick={() => copyToClipboard(createdSecret!)}
                  class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
            <button
              onclick={closeCreateModal}
              class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-semibold"
            >
              Close
            </button>
          </div>
        {:else}
          <!-- Create Form -->
          <h3 class="text-2xl font-bold text-gray-900 mb-4">Create OIDC Client</h3>
  
          {#if createErrors.general}
            <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {createErrors.general}
            </div>
          {/if}
  
          <form onsubmit={(e) => { e.preventDefault(); handleCreateClient(); }}>
            <!-- Client ID -->
            <div class="mb-4">
              <label for="clientId" class="block text-gray-700 text-sm font-bold mb-2">
                Client ID <span class="text-red-500">*</span>
              </label>
              <input
                id="clientId"
                type="text"
                bind:value={createForm.clientId}
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 {createErrors.clientId ? 'border-red-500' : 'border-gray-300'}"
                placeholder="my-client-app"
              />
              {#if createErrors.clientId}
                <p class="text-red-500 text-xs italic mt-1">{createErrors.clientId}</p>
              {/if}
            </div>
  
            <!-- Client Name -->
            <div class="mb-4">
              <label for="clientName" class="block text-gray-700 text-sm font-bold mb-2">
                Client Name <span class="text-red-500">*</span>
              </label>
              <input
                id="clientName"
                type="text"
                bind:value={createForm.clientName}
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 {createErrors.clientName ? 'border-red-500' : 'border-gray-300'}"
                placeholder="My Client Application"
              />
              {#if createErrors.clientName}
                <p class="text-red-500 text-xs italic mt-1">{createErrors.clientName}</p>
              {/if}
            </div>
  
            <!-- Grant Types -->
            <div class="mb-4">
              <p class="block text-gray-700 text-sm font-bold mb-2">
                Grant Types <span class="text-red-500">*</span>
              </p>
              <div class="flex flex-wrap gap-2">
                {#each availableGrantTypes as grantType}
                  <label class="flex items-center cursor-pointer p-2 border rounded hover:bg-gray-50 {createForm.grantTypes.includes(grantType) ? 'bg-blue-50 border-blue-300' : 'border-gray-300'}">
                    <input
                      type="checkbox"
                      checked={createForm.grantTypes.includes(grantType)}
                      onchange={() => toggleCreateGrantType(grantType)}
                      class="mr-2"
                    />
                    <span class="text-sm">{grantType}</span>
                  </label>
                {/each}
              </div>
              {#if createErrors.grantTypes}
                <p class="text-red-500 text-xs italic mt-1">{createErrors.grantTypes}</p>
              {/if}
            </div>
  
            <!-- Authentication Methods -->
            <div class="mb-4">
              <p class="block text-gray-700 text-sm font-bold mb-2">
                Authentication Methods <span class="text-red-500">*</span>
              </p>
              <div class="flex flex-wrap gap-2">
                {#each availableAuthMethods as method}
                  <label class="flex items-center cursor-pointer p-2 border rounded hover:bg-gray-50 {createForm.authenticationMethods.includes(method) ? 'bg-blue-50 border-blue-300' : 'border-gray-300'}">
                    <input
                      type="checkbox"
                      checked={createForm.authenticationMethods.includes(method)}
                      onchange={() => toggleCreateAuthMethod(method)}
                      class="mr-2"
                    />
                    <span class="text-sm">{method}</span>
                  </label>
                {/each}
              </div>
              {#if createErrors.authenticationMethods}
                <p class="text-red-500 text-xs italic mt-1">{createErrors.authenticationMethods}</p>
              {/if}
            </div>
  
            <!-- Redirect URIs -->
            <div class="mb-4">
              <p class="block text-gray-700 text-sm font-bold mb-2">
                Redirect URIs <span class="text-red-500">*</span>
              </p>
              {#each createForm.redirectUris as uri, index}
                <div class="flex gap-2 mb-2">
                  <input
                    type="text"
                    bind:value={createForm.redirectUris[index]}
                    class="shadow appearance-none border rounded flex-1 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 border-gray-300"
                    placeholder="https://example.com/callback"
                  />
                  {#if createForm.redirectUris.length > 1}
                    <button
                      type="button"
                      onclick={() => removeRedirectUri(index)}
                      class="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                    >
                      ×
                    </button>
                  {/if}
                </div>
              {/each}
              <button
                type="button"
                onclick={addRedirectUri}
                class="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add another redirect URI
              </button>
              {#if createErrors.redirectUris}
                <p class="text-red-500 text-xs italic mt-1">{createErrors.redirectUris}</p>
              {/if}
            </div>
  
            <!-- Post Logout Redirect URIs -->
            <div class="mb-4">
              <p class="block text-gray-700 text-sm font-bold mb-2">
                Post Logout Redirect URIs
              </p>
              {#each createForm.postLogoutRedirectUris as uri, index}
                <div class="flex gap-2 mb-2">
                  <input
                    type="text"
                    bind:value={createForm.postLogoutRedirectUris[index]}
                    class="shadow appearance-none border rounded flex-1 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 border-gray-300"
                    placeholder="https://example.com/logout"
                  />
                  {#if createForm.postLogoutRedirectUris.length > 1}
                    <button
                      type="button"
                      onclick={() => removePostLogoutUri(index)}
                      class="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                    >
                      ×
                    </button>
                  {/if}
                </div>
              {/each}
              <button
                type="button"
                onclick={addPostLogoutUri}
                class="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add another post logout URI
              </button>
            </div>
  
            <!-- Scopes -->
            <div class="mb-4">
              <p class="block text-gray-700 text-sm font-bold mb-2">
                Scopes <span class="text-red-500">*</span>
              </p>
              <div class="flex flex-wrap gap-2">
                {#each availableScopes as scope}
                  <label class="flex items-center cursor-pointer p-2 border rounded hover:bg-gray-50 {createForm.scopes.includes(scope) ? 'bg-purple-50 border-purple-300' : 'border-gray-300'}">
                    <input
                      type="checkbox"
                      checked={createForm.scopes.includes(scope)}
                      onchange={() => toggleCreateScope(scope)}
                      class="mr-2"
                    />
                    <span class="text-sm">{scope}</span>
                  </label>
                {/each}
              </div>
              {#if createErrors.scopes}
                <p class="text-red-500 text-xs italic mt-1">{createErrors.scopes}</p>
              {/if}
            </div>
  
            <!-- Client Settings -->
            <div class="mb-4 p-4 bg-gray-50 rounded">
              <h4 class="font-semibold mb-3">Client Settings</h4>
              <div class="flex flex-wrap gap-4">
                <label class="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    bind:checked={createForm.clientSettings.requireProofKey}
                    class="mr-2"
                  />
                  <span class="text-sm">Require PKCE</span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    bind:checked={createForm.clientSettings.requireAuthorizationConsent}
                    class="mr-2"
                  />
                  <span class="text-sm">Require Consent</span>
                </label>
              </div>
            </div>
  
            <!-- Token Settings -->
            <div class="mb-6 p-4 bg-gray-50 rounded">
              <h4 class="font-semibold mb-3">Token Settings</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="block text-gray-700 text-xs font-bold mb-1">
                    Access Token TTL (seconds)
                  </p>
                  <input
                    type="number"
                    bind:value={createForm.tokenSettings.accessTokenTimeToLiveSeconds}
                    class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-sm"
                  />
                </div>
                <div>
                  <p class="block text-gray-700 text-xs font-bold mb-1">
                    Refresh Token TTL (seconds)
                  </p>
                  <input
                    type="number"
                    bind:value={createForm.tokenSettings.refreshTokenTimeToLiveSeconds}
                    class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-sm"
                  />
                </div>
                <div>
                  <p class="block text-gray-700 text-xs font-bold mb-1">
                    Auth Code TTL (seconds)
                  </p>
                  <input
                    type="number"
                    bind:value={createForm.tokenSettings.authorizationCodeTimeToLiveSeconds}
                    class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-sm"
                  />
                </div>
                <div class="flex items-center">
                  <label class="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      bind:checked={createForm.tokenSettings.reuseRefreshTokens}
                      class="mr-2"
                    />
                    <span class="text-sm">Reuse Refresh Tokens</span>
                  </label>
                </div>
              </div>
            </div>
  
            <!-- Actions -->
            <div class="flex gap-3 justify-end">
              <button
                type="button"
                onclick={closeCreateModal}
                disabled={isCreating}
                class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold disabled:bg-green-400"
              >
                {#if isCreating}
                  Creating...
                {:else}
                  Create Client
                {/if}
              </button>
            </div>
          </form>
        {/if}
      </div>
    </div>
  {/if}
  
  <!-- Edit Client Modal -->
  {#if showEditModal && editingClient}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
        <h3 class="text-2xl font-bold text-gray-900 mb-4">Edit Client: {editingClient.clientId}</h3>
  
        {#if editErrors.general}
          <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {editErrors.general}
          </div>
        {/if}
  
        <form onsubmit={(e) => { e.preventDefault(); handleUpdateClient(); }}>
          <!-- Client Name -->
          <div class="mb-4">
            <label for="editClientName" class="block text-gray-700 text-sm font-bold mb-2">
              Client Name <span class="text-red-500">*</span>
            </label>
            <input
              id="editClientName"
              type="text"
              bind:value={editForm.clientName}
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 {editErrors.clientName ? 'border-red-500' : 'border-gray-300'}"
            />
            {#if editErrors.clientName}
              <p class="text-red-500 text-xs italic mt-1">{editErrors.clientName}</p>
            {/if}
          </div>
  
          <!-- Grant Types -->
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">
              Grant Types <span class="text-red-500">*</span>
            </label>
            <div class="flex flex-wrap gap-2">
              {#each availableGrantTypes as grantType}
                <label class="flex items-center cursor-pointer p-2 border rounded hover:bg-gray-50 {editForm.grantTypes.includes(grantType) ? 'bg-blue-50 border-blue-300' : 'border-gray-300'}">
                  <input
                    type="checkbox"
                    checked={editForm.grantTypes.includes(grantType)}
                    onchange={() => toggleEditGrantType(grantType)}
                    class="mr-2"
                  />
                  <span class="text-sm">{grantType}</span>
                </label>
              {/each}
            </div>
            {#if editErrors.grantTypes}
              <p class="text-red-500 text-xs italic mt-1">{editErrors.grantTypes}</p>
            {/if}
          </div>
  
          <!-- Redirect URIs -->
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">
              Redirect URIs <span class="text-red-500">*</span>
            </label>
            {#each editForm.redirectUris as uri, index}
              <div class="flex gap-2 mb-2">
                <input
                  type="text"
                  bind:value={editForm.redirectUris[index]}
                  class="shadow appearance-none border rounded flex-1 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 border-gray-300"
                />
                {#if editForm.redirectUris.length > 1}
                  <button
                    type="button"
                    onclick={() => removeEditRedirectUri(index)}
                    class="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    ×
                  </button>
                {/if}
              </div>
            {/each}
            <button
              type="button"
              onclick={addEditRedirectUri}
              class="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add another redirect URI
            </button>
            {#if editErrors.redirectUris}
              <p class="text-red-500 text-xs italic mt-1">{editErrors.redirectUris}</p>
            {/if}
          </div>
  
          <!-- Post Logout Redirect URIs -->
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">
              Post Logout Redirect URIs
            </label>
            {#each editForm.postLogoutRedirectUris as uri, index}
              <div class="flex gap-2 mb-2">
                <input
                  type="text"
                  bind:value={editForm.postLogoutRedirectUris[index]}
                  class="shadow appearance-none border rounded flex-1 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:border-blue-500 border-gray-300"
                />
                {#if editForm.postLogoutRedirectUris.length > 1}
                  <button
                    type="button"
                    onclick={() => removeEditPostLogoutUri(index)}
                    class="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    ×
                  </button>
                {/if}
              </div>
            {/each}
            <button
              type="button"
              onclick={addEditPostLogoutUri}
              class="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add another post logout URI
            </button>
          </div>
  
          <!-- Scopes -->
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">
              Scopes <span class="text-red-500">*</span>
            </label>
            <div class="flex flex-wrap gap-2">
              {#each availableScopes as scope}
                <label class="flex items-center cursor-pointer p-2 border rounded hover:bg-gray-50 {editForm.scopes.includes(scope) ? 'bg-purple-50 border-purple-300' : 'border-gray-300'}">
                  <input
                    type="checkbox"
                    checked={editForm.scopes.includes(scope)}
                    onchange={() => toggleEditScope(scope)}
                    class="mr-2"
                  />
                  <span class="text-sm">{scope}</span>
                </label>
              {/each}
            </div>
            {#if editErrors.scopes}
              <p class="text-red-500 text-xs italic mt-1">{editErrors.scopes}</p>
            {/if}
          </div>
  
          <!-- Client Settings -->
          <div class="mb-4 p-4 bg-gray-50 rounded">
            <h4 class="font-semibold mb-3">Client Settings</h4>
            <div class="flex flex-wrap gap-4">
              <label class="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  bind:checked={editForm.clientSettings.requireProofKey}
                  class="mr-2"
                />
                <span class="text-sm">Require PKCE</span>
              </label>
              <label class="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  bind:checked={editForm.clientSettings.requireAuthorizationConsent}
                  class="mr-2"
                />
                <span class="text-sm">Require Consent</span>
              </label>
            </div>
          </div>
  
          <!-- Token Settings -->
          <div class="mb-6 p-4 bg-gray-50 rounded">
            <h4 class="font-semibold mb-3">Token Settings</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-gray-700 text-xs font-bold mb-1">
                  Access Token TTL (seconds)
                </label>
                <input
                  type="number"
                  bind:value={editForm.tokenSettings.accessTokenTimeToLiveSeconds}
                  class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-sm"
                />
              </div>
              <div>
                <label class="block text-gray-700 text-xs font-bold mb-1">
                  Refresh Token TTL (seconds)
                </label>
                <input
                  type="number"
                  bind:value={editForm.tokenSettings.refreshTokenTimeToLiveSeconds}
                  class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-sm"
                />
              </div>
              <div>
                <label class="block text-gray-700 text-xs font-bold mb-1">
                  Auth Code TTL (seconds)
                </label>
                <input
                  type="number"
                  bind:value={editForm.tokenSettings.authorizationCodeTimeToLiveSeconds}
                  class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 text-sm"
                />
              </div>
              <div class="flex items-center">
                <label class="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    bind:checked={editForm.tokenSettings.reuseRefreshTokens}
                    class="mr-2"
                  />
                  <span class="text-sm">Reuse Refresh Tokens</span>
                </label>
              </div>
            </div>
          </div>
  
          <!-- Actions -->
          <div class="flex gap-3 justify-end">
            <button
              type="button"
              onclick={closeEditModal}
              disabled={isUpdating}
              class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold disabled:bg-blue-400"
            >
              {#if isUpdating}
                Updating...
              {:else}
                Update Client
              {/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
  
  <!-- Regenerated Secret Modal -->
  {#if regeneratedSecret}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div class="text-center">
          <div class="mb-4 text-green-600">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-gray-900 mb-4">Secret Regenerated!</h3>
          <p class="text-gray-600 mb-2">Client: <span class="font-mono">{regeneratedSecret.clientId}</span></p>
          <div class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p class="text-yellow-800 font-semibold mb-2">⚠️ Save this secret now - it won't be shown again!</p>
            <div class="flex items-center gap-2 justify-center">
              <code class="bg-gray-100 px-3 py-2 rounded font-mono text-sm break-all">{regeneratedSecret.secret}</code>
              <button
                onclick={() => copyToClipboard(regeneratedSecret!.secret)}
                class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Copy
              </button>
            </div>
          </div>
          <button
            onclick={closeRegeneratedSecretModal}
            class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  {/if}