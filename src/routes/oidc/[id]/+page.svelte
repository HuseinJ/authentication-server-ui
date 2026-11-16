<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import ClientForm from '#lib/components/clients/ClientForm.svelte';
  import PageTitle from '#lib/components/layout/PageTitle.svelte';
  import Notice from '#lib/components/ui/Notice.svelte';
  import { notifications } from '#lib/notifications/notifications.store';
  import { getOidcClient, updateOidcClient } from '#lib/oidc/oidc-clients.service';
  import type { CreateOidcClientRequest, OidcClient } from '#lib/oidc/oidc-clients.types';
  import { errorMessage } from '#lib/validation';

  let client = $state<OidcClient | null>(null);
  let loadFailure = $state<string>();
  let saveFailure = $state<string>();
  let busy = $state(false);

  const clientId = $derived(page.params.id ?? '');

  $effect(() => {
    const id = clientId;
    client = null;
    loadFailure = undefined;
    getOidcClient(id)
      .then((loaded) => (client = loaded))
      .catch((error) => (loadFailure = errorMessage(error, 'This client couldn\'t be loaded.')));
  });

  function toFormValues(loaded: OidcClient): CreateOidcClientRequest {
    return {
      clientId: loaded.clientId,
      clientName: loaded.clientName,
      grantTypes: [...loaded.grantTypes],
      authenticationMethods: [...loaded.authenticationMethods],
      redirectUris: loaded.redirectUris.length ? [...loaded.redirectUris] : [''],
      postLogoutRedirectUris: loaded.postLogoutRedirectUris.length ? [...loaded.postLogoutRedirectUris] : [''],
      scopes: [...loaded.scopes],
      tokenSettings: { ...loaded.tokenSettings },
      clientSettings: { ...loaded.clientSettings }
    };
  }

  async function save(values: CreateOidcClientRequest) {
    if (!client) return;
    busy = true;
    saveFailure = undefined;
    try {
      await updateOidcClient(client.id, {
        clientName: values.clientName,
        grantTypes: values.grantTypes,
        redirectUris: values.redirectUris,
        postLogoutRedirectUris: values.postLogoutRedirectUris,
        scopes: values.scopes,
        tokenSettings: values.tokenSettings,
        clientSettings: values.clientSettings
      });
      notifications.success(`Saved changes to ${values.clientName}.`);
      await goto(resolve('/oidc'));
    } catch (error) {
      saveFailure = errorMessage(error, 'Your changes couldn\'t be saved.');
    } finally {
      busy = false;
    }
  }
</script>

<div class="wrap">
  <PageTitle
    title={client?.clientName ?? 'Client'}
    back={{ href: resolve('/oidc'), label: 'All clients' }}
    lede="Change how this application signs people in. Changes apply to the next sign-in."
  />

  {#if loadFailure}
    <Notice tone="error">{loadFailure}</Notice>
  {:else if !client}
    <p class="loading">Loading client…</p>
  {:else}
    {#if saveFailure}
      <div class="failure">
        <Notice tone="error">{saveFailure}</Notice>
      </div>
    {/if}
    {#key client.id}
      <ClientForm mode="edit" initial={toFormValues(client)} {busy} cancelHref={resolve('/oidc')} onsubmit={save} />
    {/key}
  {/if}
</div>

<style>
  .loading {
    font-family: var(--font-text);
    color: var(--color-moss);
  }

  .failure {
    margin-bottom: 1.5rem;
  }
</style>
