<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from '#lib/components/ui/Button.svelte';
  import Form from '#lib/components/ui/Form.svelte';
  import TotpCodeInput from '#lib/components/ui/TotpCodeInput.svelte';

  let {
    busy,
    error,
    submitLabel = 'Verify',
    onsubmit,
    oncancel,
    children
  }: {
    busy: boolean;
    error?: string;
    submitLabel?: string;
    onsubmit: (code: string) => void;
    oncancel?: () => void;
    children?: Snippet;
  } = $props();

  let code = $state('');

  $effect(() => {
    if (error) code = '';
  });

  function submit() {
    if (code.length !== 6 || busy) return;
    onsubmit(code);
  }
</script>

<Form onsubmit={submit}>
  {@render children?.()}

  <TotpCodeInput bind:value={code} {error} autofocus />

  {#snippet actions()}
    <Button type="submit" {busy} disabled={code.length !== 6}>
      {busy ? 'Checking code…' : submitLabel}
    </Button>
    {#if oncancel}
      <Button variant="quiet" onclick={oncancel} disabled={busy}>Back to password</Button>
    {/if}
  {/snippet}
</Form>
