<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { notifications } from '#lib/notifications/notifications.store';
</script>

<div class="toaster" aria-live="polite">
  {#each $notifications as toast (toast.id)}
    <div
      class="toast {toast.kind}"
      role={toast.kind === 'error' ? 'alert' : 'status'}
      in:fly={{ y: 16, duration: 220 }}
      out:fade={{ duration: 150 }}
    >
      <div class="text">
        {#if toast.title}
          <p class="title">{toast.title}</p>
        {/if}
        <p>{toast.message}</p>
      </div>
      <button type="button" onclick={() => notifications.dismiss(toast.id)}>
        <span class="sr-only">Dismiss</span>
        <span aria-hidden="true">×</span>
      </button>
    </div>
  {/each}
</div>

<style>
  .toaster {
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: min(24rem, calc(100% - 2rem));
  }

  .toast {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 0.9rem 1rem 0.9rem 1.1rem;
    border-left: 4px solid var(--color-lichen);
    border-radius: 3px;
    background: var(--color-pine-deep);
    color: var(--color-slip-text);
    box-shadow: 0 10px 30px -12px rgb(12 43 32 / 0.5);
  }

  .error {
    border-left-color: #e88f72;
  }

  .warning {
    border-left-color: #f2c98d;
  }

  .text {
    flex: 1;
    min-width: 0;
    font-size: var(--text-sm);
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .title {
    font-weight: 650;
    color: #fff;
  }

  button {
    font-size: 1.25rem;
    line-height: 1;
    color: color-mix(in srgb, var(--color-slip-text) 70%, transparent);
    cursor: pointer;
  }

  button:hover {
    color: #fff;
  }

  button:focus-visible {
    outline-color: var(--color-lichen);
  }
</style>
