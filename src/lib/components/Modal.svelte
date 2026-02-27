<script lang="ts">
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
  
    const sizes = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl'
    };
  
    function handleBackdropClick(e: MouseEvent) {
      if (e.target === e.currentTarget) onclose?.();
    }
  </script>
  
  {#if open}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4"
      onclick={handleBackdropClick}
    >
      <div class="bg-white rounded-lg shadow-xl p-6 {sizes[size]} w-full my-8 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-2xl font-bold text-gray-900">{title}</h3>
          {#if onclose}
            <button onclick={onclose} class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          {/if}
        </div>
        {@render children()}
      </div>
    </div>
  {/if}