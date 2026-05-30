<script lang="ts">
  import { fade, scale } from 'svelte/transition';

  let {
    title,
    open = false,
    size = 'md',
    onclose,
    children
  }: {
    title: string;
    open: boolean;
    size?: 'sm' | 'md' | 'lg';
    onclose?: () => void;
    children: any;
  } = $props();

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onclose?.();
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose?.();
  }
</script>

<svelte:window onkeydown={handleKey} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4"
    onclick={handleBackdropClick}
  >
    <div
      transition:scale={{ duration: 200, start: 0.96 }}
      class="bg-white rounded-2xl shadow-2xl border border-gray-100 {sizes[size]} w-full my-8 max-h-[90vh] overflow-y-auto"
    >
      <div class="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <h3 class="text-xl font-bold text-gray-900">{title}</h3>
        {#if onclose}
          <button
            onclick={onclose}
            class="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
            aria-label="Close"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        {/if}
      </div>
      <div class="px-6 py-5">
        {@render children()}
      </div>
    </div>
  </div>
{/if}
