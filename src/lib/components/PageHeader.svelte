<script lang="ts">
    import type { Snippet } from 'svelte';
  
    let { title, children }: { title: string; children?: Snippet } = $props();
  </script>
  
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">{title}</h1>
    {#if children}
      <div class="flex gap-3">
        {@render children()}
      </div>
    {/if}
  </div>