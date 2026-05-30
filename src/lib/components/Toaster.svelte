<script lang="ts">
  import { notifications, type ToastKind } from '$lib/notifications/notifications.store';
  import { fly, fade } from 'svelte/transition';

  const styles: Record<ToastKind, { bg: string; border: string; icon: string }> = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600'
    },
    info: {
      bg: 'bg-primary-50',
      border: 'border-primary-200',
      icon: 'text-primary-600'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600'
    }
  };
</script>

<div
  class="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] sm:w-96"
  aria-live="polite"
  aria-atomic="true"
>
  {#each $notifications as toast (toast.id)}
    <div
      in:fly={{ x: 320, duration: 250 }}
      out:fade={{ duration: 200 }}
      class="rounded-xl border {styles[toast.kind].bg} {styles[toast.kind].border} shadow-lg backdrop-blur-sm p-4 flex gap-3 items-start"
      role="alert"
    >
      <div class="{styles[toast.kind].icon} shrink-0 mt-0.5">
        {#if toast.kind === 'success'}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        {:else if toast.kind === 'error'}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        {:else if toast.kind === 'warning'}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-3l-7.07-12a2 2 0 00-3.48 0L3.19 16a2 2 0 001.74 3z" />
          </svg>
        {:else}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        {/if}
      </div>

      <div class="flex-1 min-w-0">
        {#if toast.title}
          <p class="text-sm font-semibold text-gray-900">{toast.title}</p>
        {/if}
        <p class="text-sm text-gray-700 break-words">{toast.message}</p>
      </div>

      <button
        type="button"
        onclick={() => notifications.dismiss(toast.id)}
        class="shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
        aria-label="Dismiss"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  {/each}
</div>
