<script lang="ts">
  import { resolve } from '$app/paths';
  import Button from '#lib/components/ui/Button.svelte';
  import InlineConfirm from '#lib/components/ui/InlineConfirm.svelte';
  import Tag from '#lib/components/ui/Tag.svelte';
  import { grantTypeLabel, isPublicClient, type OidcClient } from '#lib/oidc/oidc-clients.types';

  type PendingAction = 'regenerate-secret' | 'delete';

  let {
    client,
    onregeneratesecret,
    ondelete
  }: {
    client: OidcClient;
    onregeneratesecret: (client: OidcClient) => Promise<void>;
    ondelete: (client: OidcClient) => Promise<void>;
  } = $props();

  let pending = $state<PendingAction | null>(null);
  let busy = $state(false);

  const isPublic = $derived(isPublicClient(client.authenticationMethods));
  const [firstRedirect, ...otherRedirects] = $derived(client.redirectUris);

  async function run(action: (client: OidcClient) => Promise<void>) {
    busy = true;
    try {
      await action(client);
      pending = null;
    } finally {
      busy = false;
    }
  }
</script>

<article class="row">
  <div class="identity">
    <h3>
      <a href={resolve('/oidc/[id]', { id: client.id })}>{client.clientName}</a>
    </h3>
    <p class="client-id">{client.clientId}</p>
  </div>

  <dl class="facts">
    <div>
      <dt>Signs in with</dt>
      <dd>{client.grantTypes.map(grantTypeLabel).join(', ') || 'Nothing yet'}</dd>
    </div>
    <div>
      <dt>Scopes</dt>
      <dd class="tags">
        {#each client.scopes as scope (scope)}
          <Tag text={scope} mono />
        {/each}
      </dd>
    </div>
    {#if firstRedirect}
      <div>
        <dt>Redirects to</dt>
        <dd class="uri">
          {firstRedirect}
          {#if otherRedirects.length}<span class="more">and {otherRedirects.length} more</span>{/if}
        </dd>
      </div>
    {/if}
    <div class="safeguards">
      {#if isPublic}<Tag text="Public" tone="outline" />{/if}
      {#if client.clientSettings.requireProofKey}<Tag text="PKCE" tone="lichen" />{/if}
      {#if client.clientSettings.requireAuthorizationConsent}<Tag text="Consent" tone="lichen" />{/if}
    </div>
  </dl>

  <div class="actions">
    <Button variant="secondary" size="sm" href={resolve('/oidc/[id]', { id: client.id })}>Edit</Button>
    {#if !isPublic}
      <Button variant="secondary" size="sm" onclick={() => (pending = 'regenerate-secret')}>
        Regenerate secret
      </Button>
    {/if}
    <Button variant="quiet" size="sm" onclick={() => (pending = 'delete')}>Delete</Button>
  </div>

  {#if pending === 'regenerate-secret'}
    <div class="confirm">
      <InlineConfirm
        message="Regenerate the secret for {client.clientName}? The current secret stops working right away, so the application can't sign anyone in until you give it the new one."
        confirmLabel="Regenerate secret"
        {busy}
        onconfirm={() => run(onregeneratesecret)}
        oncancel={() => (pending = null)}
      />
    </div>
  {:else if pending === 'delete'}
    <div class="confirm">
      <InlineConfirm
        message="Delete {client.clientName}? Nobody will be able to sign in to it through this server. This can't be undone."
        confirmLabel="Delete client"
        {busy}
        onconfirm={() => run(ondelete)}
        oncancel={() => (pending = null)}
      />
    </div>
  {/if}
</article>

<style>
  .row {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 16rem) minmax(0, 1fr) auto;
    grid-template-areas:
      'identity facts actions'
      'confirm confirm confirm';
    align-items: start;
    gap: 0.75rem clamp(1.25rem, 3vw, 2.5rem);
    padding-block: 1.75rem;
    border-top: 1px solid var(--color-rule);
  }

  .identity {
    grid-area: identity;
    min-width: 0;
  }

  h3 {
    font-size: var(--text-xl);
    font-weight: 680;
    line-height: 1.2;
    text-wrap: balance;
  }

  h3 a {
    text-decoration: none;
    background-image: linear-gradient(var(--color-lichen), var(--color-lichen));
    background-position: 0 88%;
    background-repeat: no-repeat;
    background-size: 0% 0.35em;
    transition: background-size 0.25s ease-out;
  }

  .row:hover h3 a,
  h3 a:focus-visible {
    background-size: 100% 0.35em;
  }

  .client-id {
    margin-top: 0.3rem;
    font-family: var(--font-code);
    font-size: 0.85rem;
    color: var(--color-moss);
    overflow-wrap: anywhere;
  }

  .facts {
    grid-area: facts;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    min-width: 0;
    font-size: var(--text-sm);
  }

  .facts > div {
    display: grid;
    grid-template-columns: 7.5rem minmax(0, 1fr);
    gap: 0.75rem;
  }

  dt {
    color: var(--color-moss);
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .uri {
    font-family: var(--font-code);
    font-size: 0.8rem;
    overflow-wrap: anywhere;
  }

  .more {
    margin-left: 0.4rem;
    font-family: var(--font-display);
    color: var(--color-moss);
  }

  .facts > .safeguards {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    padding-left: 8.25rem;
  }

  .safeguards:empty {
    display: none;
  }

  .actions {
    grid-area: actions;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .confirm {
    grid-area: confirm;
    margin-top: 0.5rem;
  }

  @media (width <= 64rem) {
    .row {
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas:
        'identity actions'
        'facts facts'
        'confirm confirm';
    }
  }

  @media (width <= 40rem) {
    .row {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        'identity'
        'facts'
        'actions'
        'confirm';
    }

    .actions {
      justify-content: flex-start;
    }

    .facts > div {
      grid-template-columns: minmax(0, 1fr);
      gap: 0.2rem;
    }

    .facts > .safeguards {
      padding-left: 0;
    }
  }
</style>
