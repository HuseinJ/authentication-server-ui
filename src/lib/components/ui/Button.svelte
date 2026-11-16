<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import type { ResolvedPathname } from '$app/types';

  type Variant = 'primary' | 'secondary' | 'quiet' | 'danger';
  type Size = 'md' | 'sm';

  let {
    variant = 'primary',
    size = 'md',
    href,
    externalHref,
    busy = false,
    disabled = false,
    type = 'button',
    children,
    ...rest
  }: HTMLButtonAttributes & {
    variant?: Variant;
    size?: Size;
    href?: ResolvedPathname;
    externalHref?: string;
    busy?: boolean;
    children: Snippet;
  } = $props();
</script>

{#if href}
  <a class="button {variant} {size}" {href}>{@render children()}</a>
{:else if externalHref}
  <a class="button {variant} {size}" href={externalHref} rel="external">{@render children()}</a>
{:else}
  <button
    {...rest}
    {type}
    class="button {variant} {size}"
    disabled={disabled || busy}
    aria-busy={busy}
  >
    {@render children()}
  </button>
{/if}

<style>
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border: 1px solid transparent;
    border-radius: 3px;
    font-family: var(--font-display);
    font-weight: 650;
    line-height: 1.1;
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    transition:
      background-color 0.15s,
      border-color 0.15s,
      color 0.15s;
  }

  .md {
    padding: 0.85rem 1.4rem;
    font-size: var(--text-base);
  }

  .sm {
    padding: 0.5rem 0.85rem;
    font-size: var(--text-sm);
  }

  .primary {
    background: var(--color-pine);
    color: var(--color-paper);
  }

  .primary:hover:not(:disabled) {
    background: var(--color-pine-deep);
  }

  .secondary {
    border-color: var(--color-rule);
    color: var(--color-ink);
  }

  .secondary:hover:not(:disabled) {
    border-color: var(--color-ink);
  }

  .quiet {
    padding-inline: 0.25rem;
    color: var(--color-pine);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.2em;
    text-decoration-color: color-mix(in srgb, currentColor 40%, transparent);
  }

  .quiet:hover:not(:disabled) {
    text-decoration-color: currentColor;
    text-decoration-thickness: 2px;
  }

  .danger {
    background: var(--color-rust);
    color: #fff;
  }

  .danger:hover:not(:disabled) {
    background: var(--color-rust-deep);
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button[aria-busy='true'] {
    cursor: progress;
  }
</style>
