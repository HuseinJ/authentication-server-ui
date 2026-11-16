<script lang="ts">
  import { copyToClipboard } from '#lib/clipboard';

  let {
    label,
    value,
    what = 'secret',
    grouped = true
  }: {
    label: string;
    value: string;
    what?: string;
    grouped?: boolean;
  } = $props();

  const groups = $derived(grouped ? (value.match(/.{1,4}/g) ?? []) : [value]);
  let copied = $state(false);

  async function copy() {
    copied = await copyToClipboard(value, what);
    if (copied) setTimeout(() => (copied = false), 2000);
  }
</script>

<figure class="slip">
  <figcaption>{label}</figcaption>
  <code aria-label={value}>
    {#each groups as group, index (index)}<span>{group}</span>{/each}
  </code>
  <button type="button" onclick={copy}>{copied ? 'Copied' : `Copy ${what}`}</button>
</figure>

<style>
  .slip {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'label button'
      'value value';
    gap: 0.9rem 1rem;
    padding: 1.25rem 1.5rem 1.5rem;
    border-radius: 4px;
    background: var(--color-pine-deep);
    color: var(--color-slip-text);
  }

  figcaption {
    grid-area: label;
    align-self: center;
    color: var(--color-lichen);
    font-size: var(--text-sm);
    font-weight: 650;
    font-stretch: 112%;
  }

  code {
    grid-area: value;
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.9rem;
    font-family: var(--font-code);
    font-size: clamp(1rem, 2.4vw, 1.3rem);
    line-height: 1.5;
    user-select: all;
  }

  button {
    grid-area: button;
    padding: 0.35rem 0.75rem;
    border: 1px solid color-mix(in srgb, var(--color-lichen) 45%, transparent);
    border-radius: 3px;
    color: var(--color-lichen);
    font-size: var(--text-sm);
    font-weight: 620;
    cursor: pointer;
    transition:
      background-color 0.15s,
      color 0.15s;
  }

  button:hover {
    background: var(--color-lichen);
    color: var(--color-pine-deep);
  }

  button:focus-visible {
    outline-color: var(--color-lichen);
  }
</style>
