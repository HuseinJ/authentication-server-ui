<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    onsubmit,
    children,
    actions
  }: {
    onsubmit: () => void;
    children: Snippet;
    actions?: Snippet;
  } = $props();

  function submit(event: SubmitEvent) {
    event.preventDefault();
    onsubmit();
  }
</script>

<form onsubmit={submit} novalidate>
  {@render children()}
  {#if actions}
    <div class="actions">{@render actions()}</div>
  {/if}
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem 1.25rem;
    margin-top: 0.5rem;
  }
</style>
