<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    description,
    aside,
    children
  }: {
    title: string;
    description?: string;
    aside?: Snippet;
    children: Snippet;
  } = $props();
</script>

<section class="section">
  <header>
    <h2>{title}</h2>
    {#if description}
      <p>{description}</p>
    {/if}
    {#if aside}
      <div class="aside">{@render aside()}</div>
    {/if}
  </header>
  <div class="content">
    {@render children()}
  </div>
</section>

<style>
  .section {
    display: grid;
    grid-template-columns: minmax(0, 18rem) minmax(0, 1fr);
    gap: 1.25rem clamp(2rem, 6vw, 5rem);
    padding-block: clamp(2rem, 4vw, 2.75rem);
    border-top: 1px solid var(--color-rule);
  }

  h2 {
    font-size: var(--text-lg);
    font-weight: 700;
    font-stretch: 110%;
    line-height: 1.2;
  }

  p {
    margin-top: 0.5rem;
    font-family: var(--font-text);
    color: var(--color-moss);
    line-height: 1.5;
  }

  .aside {
    margin-top: 0.9rem;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 38rem;
  }

  @media (width <= 52rem) {
    .section {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
