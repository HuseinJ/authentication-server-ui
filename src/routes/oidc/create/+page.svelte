<script lang="ts">
  import { resolve } from '$app/paths';
  import ClientForm from '#lib/components/clients/ClientForm.svelte';
  import PageTitle from '#lib/components/layout/PageTitle.svelte';
  import Button from '#lib/components/ui/Button.svelte';
  import Notice from '#lib/components/ui/Notice.svelte';
  import SecretSlip from '#lib/components/ui/SecretSlip.svelte';
  import { createOidcClient } from '#lib/oidc/oidc-clients.service';
  import {
    defaultClientSettings,
    defaultTokenSettings,
    isPublicClient,
    type CreateOidcClientRequest
  } from '#lib/oidc/oidc-clients.types';
  import { errorMessage } from '#lib/validation';

  const blankClient: CreateOidcClientRequest = {
    clientId: '',
    clientName: '',
    grantTypes: ['authorization_code', 'refresh_token'],
    authenticationMethods: ['client_secret_basic'],
    redirectUris: [''],
    postLogoutRedirectUris: [''],
    scopes: ['openid', 'profile', 'email'],
    tokenSettings: { ...defaultTokenSettings },
    clientSettings: { ...defaultClientSettings }
  };

  let busy = $state(false);
  let failure = $state<string>();
  let registered = $state<{ clientId: string; clientName: string; secret: string | null } | null>(null);

  async function register(client: CreateOidcClientRequest) {
    busy = true;
    failure = undefined;
    try {
      const result = await createOidcClient(client);
      registered = {
        clientId: result.client.clientId,
        clientName: result.client.clientName,
        secret: isPublicClient(client.authenticationMethods) ? null : result.clientSecret
      };
      window.scrollTo({ top: 0 });
    } catch (error) {
      failure = errorMessage(error, 'The client couldn\'t be registered.');
    } finally {
      busy = false;
    }
  }
</script>

<div class="wrap">
  {#if registered}
    <PageTitle
      title="Registered"
      back={{ href: resolve('/oidc'), label: 'All clients' }}
      lede={registered.secret
        ? `${registered.clientName} can now send people here to sign in. Copy its secret into the application's configuration now: this is the only time it's shown.`
        : `${registered.clientName} can now send people here to sign in. It's a public client, so it doesn't need a secret.`}
    />

    <div class="result">
      <SecretSlip label="Client ID" value={registered.clientId} what="client ID" grouped={false} />
      {#if registered.secret}
        <SecretSlip label="Client secret" value={registered.secret} what="secret" />
      {/if}
      <div>
        <Button href={resolve('/oidc')}>Back to clients</Button>
      </div>
    </div>
  {:else}
    <PageTitle
      title="New client"
      back={{ href: resolve('/oidc'), label: 'All clients' }}
      lede="Register an application so people can sign in to it with their account here. The defaults suit a typical web app."
    />

    {#if failure}
      <div class="failure">
        <Notice tone="error">{failure}</Notice>
      </div>
    {/if}

    <ClientForm mode="create" initial={blankClient} {busy} cancelHref={resolve('/oidc')} onsubmit={register} />
  {/if}
</div>

<style>
  .result {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    max-width: 44rem;
  }

  .failure {
    margin-bottom: 1.5rem;
  }
</style>
