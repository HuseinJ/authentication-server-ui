<script lang="ts">
  import Button from '#lib/components/ui/Button.svelte';
  import Dialog from '#lib/components/ui/Dialog.svelte';
  import SecretSlip from '#lib/components/ui/SecretSlip.svelte';

  let {
    issued,
    onclose
  }: {
    issued: { clientName: string; secret: string } | null;
    onclose: () => void;
  } = $props();
</script>

<Dialog open={issued !== null} title="New secret for {issued?.clientName ?? ''}" {onclose}>
  <p class="lede">
    Copy it into the application's configuration now. This is the only time it's shown; if it's lost,
    regenerate it again.
  </p>
  {#if issued}
    <SecretSlip label="Client secret" value={issued.secret} what="secret" />
  {/if}

  {#snippet actions()}
    <Button onclick={onclose}>Done</Button>
  {/snippet}
</Dialog>

<style>
  .lede {
    font-family: var(--font-text);
    line-height: 1.5;
  }
</style>
