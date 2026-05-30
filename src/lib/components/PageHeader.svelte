<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    subtitle,
    children
  }: { title: string; subtitle?: string; children?: Snippet } = $props();
</script>

<div class="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
  <div>
    <h1 class="text-3xl sm:text-4xl font-bold text-gray-900">
      <span class="gradient-text">{title}</span>
    </h1>
    {#if subtitle}
      <p class="text-gray-600 mt-2">{subtitle}</p>
    {/if}
  </div>
  {#if children}
    <div class="flex gap-3 flex-wrap">
      {@render children()}
    </div>
  {/if}
</div>
