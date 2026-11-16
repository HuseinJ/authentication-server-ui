<script lang="ts">
  import Button from '#lib/components/ui/Button.svelte';

  let {
    username,
    oncontinue,
    onswitch
  }: {
    username: string;
    oncontinue: () => void;
    onswitch: () => void;
  } = $props();
</script>

<div class="chooser">
  <p class="current">
    You're signed in as <strong>{username}</strong>.
  </p>
  <div class="actions">
    <Button onclick={oncontinue}>Continue as {username}</Button>
    <Button variant="secondary" onclick={onswitch}>Use a different account</Button>
  </div>
</div>

<style>
  .chooser {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .current {
    font-family: var(--font-text);
    font-size: var(--text-md);
  }

  strong {
    font-family: var(--font-code);
    font-weight: 600;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
</style>
