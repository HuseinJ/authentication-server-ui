<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    open,
    title,
    onclose,
    children,
    actions
  }: {
    open: boolean;
    title: string;
    onclose: () => void;
    children: Snippet;
    actions?: Snippet;
  } = $props();

  let dialog: HTMLDialogElement | undefined = $state();
  const titleId = $props.id();

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  });
</script>

<dialog bind:this={dialog} aria-labelledby={titleId} {onclose}>
  <h2 id={titleId}>{title}</h2>
  <div class="body">
    {@render children()}
  </div>
  {#if actions}
    <div class="actions">
      {@render actions()}
    </div>
  {/if}
</dialog>

<style>
  dialog {
    width: min(32rem, calc(100% - 2rem));
    max-height: calc(100vh - 4rem);
    margin: auto;
    padding: clamp(1.5rem, 4vw, 2.25rem);
    border-top: 6px solid var(--color-pine);
    border-radius: 3px;
    background: var(--color-paper);
    color: var(--color-ink);
    overflow-y: auto;
  }

  dialog[open] {
    animation: rise 0.22s cubic-bezier(0.2, 0.75, 0.15, 1);
  }

  dialog::backdrop {
    background: color-mix(in srgb, var(--color-pine-deep) 55%, transparent);
  }

  h2 {
    font-size: var(--text-xl);
    font-weight: 750;
    font-stretch: 112%;
    line-height: 1.15;
    color: var(--color-pine);
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    margin-top: 1.25rem;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.75rem;
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(0.75rem);
    }
  }
</style>
