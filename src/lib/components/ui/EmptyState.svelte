<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    children,
    action
  }: {
    title: string;
    children?: Snippet;
    action?: Snippet;
  } = $props();
</script>

<div class="empty">
  <p class="title">{title}</p>
  {#if children}
    <p class="body">{@render children()}</p>
  {/if}
  {#if action}
    <div class="action">{@render action()}</div>
  {/if}
</div>

<style>
  .empty {
    padding-block: clamp(2.5rem, 6vw, 4rem);
    border-top: 1px solid var(--color-rule);
    border-bottom: 1px solid var(--color-rule);
  }

  .title {
    font-size: var(--text-xl);
    font-weight: 700;
    font-stretch: 110%;
  }

  .body {
    max-width: 34rem;
    margin-top: 0.5rem;
    font-family: var(--font-text);
    font-size: var(--text-md);
    color: var(--color-moss);
  }

  .action {
    margin-top: 1.5rem;
  }
</style>
