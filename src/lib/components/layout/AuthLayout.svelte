<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    lede,
    children
  }: {
    title: string;
    lede: string;
    children: Snippet;
  } = $props();
</script>

<section class="wrap auth">
  <h1>{title}</h1>
  <p class="lede">{lede}</p>
  <div class="panel">
    {@render children()}
  </div>
</section>

<style>
  .auth {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 26rem);
    grid-template-areas:
      'title title'
      'lede panel';
    gap: clamp(2rem, 4vw, 3rem) clamp(2rem, 6vw, 6rem);
    padding-block: clamp(1.5rem, 5vw, 4rem) clamp(4rem, 9vw, 7rem);
  }

  h1 {
    grid-area: title;
    color: var(--color-pine);
    font-size: clamp(3.25rem, 14vw, 11rem);
    font-weight: 850;
    font-stretch: 125%;
    letter-spacing: -0.035em;
    line-height: 0.84;
    padding-bottom: 0.1em;
    animation: widen 1.1s cubic-bezier(0.2, 0.75, 0.15, 1) 0.1s both;
  }

  .lede {
    grid-area: lede;
    max-width: 30rem;
    font-family: var(--font-text);
    font-size: clamp(var(--text-lg), 2.2vw, 1.75rem);
    line-height: 1.45;
    text-wrap: pretty;
  }

  .panel {
    grid-area: panel;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  @media (width <= 52rem) {
    .auth {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        'title'
        'lede'
        'panel';
    }
  }

  @keyframes widen {
    from {
      letter-spacing: 0;
      font-stretch: 62%;
    }
  }
</style>
