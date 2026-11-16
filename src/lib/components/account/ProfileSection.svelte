<script lang="ts">
  import type { User } from '#lib/auth';
  import FormSection from '#lib/components/ui/FormSection.svelte';
  import Tag from '#lib/components/ui/Tag.svelte';
  import { roleLabel } from '#lib/users/users.types';

  let { user }: { user: User } = $props();
</script>

<FormSection title="Profile" description="Your username and email can't be changed from here.">
  <dl>
    <div>
      <dt>Username</dt>
      <dd class="mono">{user.username}</dd>
    </div>
    <div>
      <dt>Email</dt>
      <dd>{user.email}</dd>
    </div>
    <div>
      <dt>Roles</dt>
      <dd class="roles">
        {#each user.roles as role (role)}
          <Tag text={roleLabel(role)} tone={role === 'ROLE_ADMIN' ? 'lichen' : 'outline'} />
        {/each}
      </dd>
    </div>
  </dl>
</FormSection>

<style>
  dl {
    display: flex;
    flex-direction: column;
  }

  dl > div {
    display: grid;
    grid-template-columns: 7rem minmax(0, 1fr);
    gap: 1rem;
    padding-block: 0.7rem;
    border-bottom: 1px solid var(--color-rule);
  }

  dl > div:first-child {
    padding-top: 0;
  }

  dt {
    font-size: var(--text-sm);
    color: var(--color-moss);
  }

  dd {
    overflow-wrap: anywhere;
  }

  .mono {
    font-family: var(--font-code);
  }

  .roles {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
</style>
