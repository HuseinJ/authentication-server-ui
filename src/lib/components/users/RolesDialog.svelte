<script lang="ts">
  import Button from '#lib/components/ui/Button.svelte';
  import ChoiceGroup from '#lib/components/ui/ChoiceGroup.svelte';
  import Dialog from '#lib/components/ui/Dialog.svelte';
  import Notice from '#lib/components/ui/Notice.svelte';
  import { ROLE_OPTIONS } from '#lib/users/users.types';
  import { errorMessage } from '#lib/validation';

  let {
    username,
    currentRoles,
    onsave,
    onclose
  }: {
    username: string | null;
    currentRoles: string[];
    onsave: (username: string, roles: string[]) => Promise<void>;
    onclose: () => void;
  } = $props();

  let roles = $state<string[]>([]);
  let busy = $state(false);
  let failure = $state<string>();

  $effect(() => {
    if (username) {
      roles = [...currentRoles];
      failure = undefined;
    }
  });

  async function save() {
    if (!username || roles.length === 0) return;
    busy = true;
    failure = undefined;
    try {
      await onsave(username, roles);
      onclose();
    } catch (error) {
      failure = errorMessage(error, 'The roles couldn\'t be saved.');
    } finally {
      busy = false;
    }
  }
</script>

<Dialog open={username !== null} title="Roles for {username ?? ''}" {onclose}>
  <ChoiceGroup
    legend="What can this user do?"
    options={ROLE_OPTIONS}
    bind:selected={roles}
    error={roles.length === 0 ? 'Pick at least one role.' : undefined}
  />
  {#if failure}
    <Notice tone="error">{failure}</Notice>
  {/if}

  {#snippet actions()}
    <Button variant="quiet" onclick={onclose} disabled={busy}>Cancel</Button>
    <Button onclick={save} {busy} disabled={roles.length === 0}>
      {busy ? 'Saving…' : 'Save roles'}
    </Button>
  {/snippet}
</Dialog>
