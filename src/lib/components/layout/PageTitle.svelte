<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ResolvedPathname } from '$app/types';

  let {
    title,
    lede,
    count,
    back,
    actions
  }: {
    title: string;
    lede?: string;
    count?: number;
    back?: { href: ResolvedPathname; label: string };
    actions?: Snippet;
  } = $props();
</script>

<header class="page-title">
  {#if back}
    <a class="back" href={back.href}>← {back.label}</a>
  {/if}

  <h1>
    {title}{#if count !== undefined}<span class="count" aria-label="{count} total">{count}</span>{/if}
  </h1>

  {#if lede || actions}
    <div class="intro">
      {#if lede}
        <p class="lede">{lede}</p>
      {/if}
      {#if actions}
        <div class="actions">{@render actions()}</div>
      {/if}
    </div>
  {/if}
</header>

<style>
  .page-title {
    padding-block: clamp(1rem, 4vw, 3rem) clamp(2rem, 5vw, 3.5rem);
  }

  .back {
    display: inline-block;
    margin-bottom: 1.25rem;
    color: var(--color-moss);
    font-size: var(--text-sm);
    font-weight: 600;
    text-decoration: none;
  }

  .back:hover {
    color: var(--color-ink);
  }

  h1 {
    display: flex;
    align-items: flex-start;
    gap: 0.2em;
    color: var(--color-pine);
    font-size: clamp(3rem, 11vw, 8.5rem);
    font-weight: 850;
    font-stretch: 125%;
    letter-spacing: -0.035em;
    line-height: 0.84;
    overflow-wrap: anywhere;
    animation: widen 1.1s cubic-bezier(0.2, 0.75, 0.15, 1) 0.1s both;
  }

  .count {
    margin-top: 0.12em;
    padding: 0.15rem 0.5rem;
    border-radius: 2px;
    background: var(--color-lichen);
    color: var(--color-ink);
    font-size: clamp(0.9rem, 1.6vw, 1.15rem);
    font-weight: 650;
    font-stretch: 100%;
    letter-spacing: 0;
    line-height: 1.3;
    font-variant-numeric: tabular-nums;
  }

  .intro {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem 3rem;
    margin-top: clamp(1.5rem, 3vw, 2.25rem);
  }

  .lede {
    max-width: 36rem;
    font-family: var(--font-text);
    font-size: clamp(var(--text-md), 1.8vw, var(--text-lg));
    line-height: 1.45;
    text-wrap: pretty;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  @keyframes widen {
    from {
      letter-spacing: 0;
      font-stretch: 62%;
    }
  }
</style>
