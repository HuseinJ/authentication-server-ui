<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  let {
    label,
    value = $bindable(''),
    hint,
    error,
    mono = false,
    hideLabel = false,
    ...rest
  }: Omit<HTMLInputAttributes, 'value'> & {
    label: string;
    value?: string | number;
    hint?: string;
    error?: string;
    mono?: boolean;
    hideLabel?: boolean;
  } = $props();

  const id = $props.id();
  const describedBy = $derived(error ? `${id}-error` : hint ? `${id}-hint` : undefined);
</script>

<div class="field">
  <label for={id} class:sr-only={hideLabel}>{label}</label>
  <input
    {...rest}
    {id}
    bind:value
    class:mono
    aria-invalid={error ? true : undefined}
    aria-describedby={describedBy}
  />
  {#if error}
    <p id="{id}-error" class="error">{error}</p>
  {:else if hint}
    <p id="{id}-hint" class="hint">{hint}</p>
  {/if}
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  label {
    font-size: var(--text-sm);
    font-weight: 620;
  }

  input {
    width: 100%;
    padding: 0.75rem 0.9rem;
    border: 1px solid var(--color-rule);
    border-radius: 3px;
    background: var(--color-surface);
    font-size: var(--text-base);
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
  }

  input::placeholder {
    color: color-mix(in srgb, var(--color-moss) 70%, transparent);
  }

  input:hover:not(:disabled) {
    border-color: var(--color-moss);
  }

  input:focus {
    outline: none;
    border-color: var(--color-pine);
    box-shadow: 0 0 0 1px var(--color-pine);
  }

  input:disabled {
    color: var(--color-moss);
    background: transparent;
  }

  input[aria-invalid='true'] {
    border-color: var(--color-rust);
  }

  input[aria-invalid='true']:focus {
    box-shadow: 0 0 0 1px var(--color-rust);
  }

  .mono {
    font-family: var(--font-code);
    font-size: 0.95rem;
  }

  .hint,
  .error {
    font-size: var(--text-sm);
  }

  .hint {
    color: var(--color-moss);
  }

  .error {
    color: var(--color-rust);
    font-weight: 560;
  }
</style>
