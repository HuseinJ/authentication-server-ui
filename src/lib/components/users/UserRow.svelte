<script lang="ts">
  import type { User } from '#lib/auth';
  import Button from '#lib/components/ui/Button.svelte';
  import InlineConfirm from '#lib/components/ui/InlineConfirm.svelte';
  import Tag from '#lib/components/ui/Tag.svelte';
  import { roleLabel } from '#lib/users/users.types';

  type PendingAction = 'reset-two-factor' | 'delete';

  let {
    user,
    isSelf,
    oneditroles,
    onresettwofactor,
    ondelete
  }: {
    user: User;
    isSelf: boolean;
    oneditroles: (user: User) => void;
    onresettwofactor: (username: string) => Promise<void>;
    ondelete: (username: string) => Promise<void>;
  } = $props();

  let pending = $state<PendingAction | null>(null);
  let busy = $state(false);

  async function run(action: (username: string) => Promise<void>) {
    busy = true;
    try {
      await action(user.username);
      pending = null;
    } finally {
      busy = false;
    }
  }
</script>

<article class="row">
  <div class="roles">
    {#each user.roles as role (role)}
      <Tag text={roleLabel(role)} tone={role === 'ROLE_ADMIN' ? 'lichen' : 'outline'} />
    {:else}
      <span class="no-role">No role</span>
    {/each}
  </div>

  <div class="identity">
    <h3>
      {user.username}
      {#if isSelf}<Tag text="You" tone="pine" />{/if}
    </h3>
    <p>{user.email}</p>
  </div>

  <div class="actions">
    <Button variant="secondary" size="sm" onclick={() => oneditroles(user)}>Edit roles</Button>
    <Button variant="secondary" size="sm" onclick={() => (pending = 'reset-two-factor')}>
      Reset two-factor
    </Button>
    {#if !isSelf}
      <Button variant="quiet" size="sm" onclick={() => (pending = 'delete')}>Delete</Button>
    {/if}
  </div>

  {#if pending === 'reset-two-factor'}
    <div class="confirm">
      <InlineConfirm
        message="Remove {user.username}'s authenticator app? They'll sign in with only a password until they set up a new one."
        confirmLabel="Reset two-factor"
        {busy}
        onconfirm={() => run(onresettwofactor)}
        oncancel={() => (pending = null)}
      />
    </div>
  {:else if pending === 'delete'}
    <div class="confirm">
      <InlineConfirm
        message="Delete {user.username}? They lose access to every application that signs in through this server. This can't be undone."
        confirmLabel="Delete user"
        {busy}
        onconfirm={() => run(ondelete)}
        oncancel={() => (pending = null)}
      />
    </div>
  {/if}
</article>

<style>
  .row {
    display: grid;
    grid-template-columns: 8.5rem minmax(0, 1fr) auto;
    grid-template-areas:
      'roles identity actions'
      'confirm confirm confirm';
    align-items: start;
    gap: 0.5rem clamp(1.25rem, 3vw, 2.5rem);
    padding-block: 1.5rem;
    border-top: 1px solid var(--color-rule);
  }

  .roles {
    grid-area: roles;
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    padding-top: 0.2rem;
  }

  .no-role {
    font-size: var(--text-sm);
    color: var(--color-moss);
  }

  .identity {
    grid-area: identity;
    min-width: 0;
  }

  h3 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;
    font-size: var(--text-xl);
    font-weight: 680;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }

  .identity p {
    margin-top: 0.2rem;
    font-family: var(--font-text);
    color: color-mix(in srgb, var(--color-ink) 82%, var(--color-paper));
    overflow-wrap: anywhere;
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
    margin-top: 1rem;
  }

  @media (width <= 52rem) {
    .row {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        'roles'
        'identity'
        'actions'
        'confirm';
    }

    .actions {
      justify-content: flex-start;
      margin-top: 0.75rem;
    }
  }
</style>
