<script lang="ts">
  import Button from './Button.svelte';

  let {
    message,
    confirmLabel,
    busy = false,
    onconfirm,
    oncancel
  }: {
    message: string;
    confirmLabel: string;
    busy?: boolean;
    onconfirm: () => void;
    oncancel: () => void;
  } = $props();
</script>

<div class="confirm" role="alertdialog" aria-label={confirmLabel}>
  <p>{message}</p>
  <div class="actions">
    <Button variant="danger" size="sm" {busy} onclick={onconfirm}>{confirmLabel}</Button>
    <Button variant="quiet" size="sm" disabled={busy} onclick={oncancel}>Cancel</Button>
  </div>
</div>

<style>
  .confirm {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem 1.5rem;
    padding: 0.9rem 1.1rem;
    border-left: 4px solid var(--color-rust);
    border-radius: 0 3px 3px 0;
    background: var(--color-rust-wash);
  }

  p {
    max-width: 38rem;
    font-family: var(--font-text);
    color: var(--color-rust-deep);
    line-height: 1.45;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
</style>
