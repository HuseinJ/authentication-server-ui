<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    tone = 'info',
    children
  }: {
    tone?: 'info' | 'error';
    children: Snippet;
  } = $props();
</script>

<div class="notice {tone}" role={tone === 'error' ? 'alert' : 'status'}>
  {@render children()}
</div>

<style>
  .notice {
    padding: 0.8rem 1rem;
    border-left: 4px solid var(--color-lichen);
    border-radius: 0 3px 3px 0;
    background: var(--color-surface);
    font-family: var(--font-text);
    line-height: 1.5;
  }

  .error {
    border-color: var(--color-rust);
    background: var(--color-rust-wash);
    color: var(--color-rust-deep);
  }
</style>
