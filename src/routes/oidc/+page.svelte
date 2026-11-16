<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import ClientRow from '#lib/components/clients/ClientRow.svelte';
  import SecretDialog from '#lib/components/clients/SecretDialog.svelte';
  import PageTitle from '#lib/components/layout/PageTitle.svelte';
  import Button from '#lib/components/ui/Button.svelte';
  import EmptyState from '#lib/components/ui/EmptyState.svelte';
  import Notice from '#lib/components/ui/Notice.svelte';
  import { notifications } from '#lib/notifications/notifications.store';
  import {
    deleteOidcClient,
    loadOidcClients,
    regenerateOidcClientSecret
  } from '#lib/oidc/oidc-clients.service';
  import { isLoadingOidcClients, oidcClients, oidcClientsError } from '#lib/oidc/oidc-clients.store';
  import type { OidcClient } from '#lib/oidc/oidc-clients.types';
  import { errorMessage } from '#lib/validation';

  let issuedSecret = $state<{ clientName: string; secret: string } | null>(null);

  onMount(() => {
    loadOidcClients().catch(() => {});
  });

  async function regenerateSecret(client: OidcClient) {
    try {
      const result = await regenerateOidcClientSecret(client.id);
      issuedSecret = { clientName: client.clientName, secret: result.clientSecret };
    } catch (error) {
      notifications.error(errorMessage(error, 'A new secret couldn\'t be issued.'));
    }
  }

  async function removeClient(client: OidcClient) {
    try {
      await deleteOidcClient(client.id);
      notifications.success(`Deleted ${client.clientName}.`);
    } catch (error) {
      notifications.error(errorMessage(error, `${client.clientName} couldn't be deleted.`));
    }
  }
</script>

<div class="wrap">
  <PageTitle
    title="Clients"
    count={$oidcClients.length}
    lede="Applications that let people sign in with an account from this server. Each one gets its own ID, redirects and secret."
  >
    {#snippet actions()}
      <Button href={resolve('/oidc/create')}>Register client</Button>
    {/snippet}
  </PageTitle>

  {#if $oidcClientsError && $oidcClients.length === 0}
    <Notice tone="error">
      The client list couldn't be loaded: {$oidcClientsError}
      <Button variant="quiet" size="sm" onclick={() => loadOidcClients().catch(() => {})}>Try again</Button>
    </Notice>
  {:else if $isLoadingOidcClients && $oidcClients.length === 0}
    <p class="loading">Loading clients…</p>
  {:else if $oidcClients.length === 0}
    <EmptyState title="No clients yet">
      Register an application to let people sign in to it with their account here.
      {#snippet action()}
        <Button href={resolve('/oidc/create')}>Register client</Button>
      {/snippet}
    </EmptyState>
  {:else}
    <div class="list">
      {#each $oidcClients as client (client.id)}
        <ClientRow {client} onregeneratesecret={regenerateSecret} ondelete={removeClient} />
      {/each}
    </div>
  {/if}
</div>

<SecretDialog issued={issuedSecret} onclose={() => (issuedSecret = null)} />

<style>
  .list {
    border-bottom: 1px solid var(--color-rule);
  }

  .loading {
    font-family: var(--font-text);
    color: var(--color-moss);
  }
</style>
