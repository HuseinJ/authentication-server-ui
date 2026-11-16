<script lang="ts">
  let {
    value = $bindable(''),
    name,
    label = 'Code from your authenticator app',
    error,
    autofocus = false,
    disabled = false
  }: {
    value?: string;
    name?: string;
    label?: string;
    error?: string;
    autofocus?: boolean;
    disabled?: boolean;
  } = $props();

  const id = $props.id();
  let input: HTMLInputElement | undefined = $state();

  $effect(() => {
    if (autofocus) input?.focus();
  });

  function keepDigits(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    value = target.value.replace(/\D/g, '').slice(0, 6);
    target.value = value;
  }
</script>

<div class="code">
  <label for={id}>{label}</label>
  <input
    bind:this={input}
    {id}
    {name}
    {disabled}
    {value}
    oninput={keepDigits}
    type="text"
    inputmode="numeric"
    autocomplete="one-time-code"
    pattern={'[0-9]{6}'}
    maxlength="6"
    placeholder="000000"
    required
    aria-invalid={error ? true : undefined}
    aria-describedby={error ? `${id}-error` : undefined}
  />
  {#if error}
    <p id="{id}-error" class="error">{error}</p>
  {/if}
</div>

<style>
  .code {
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
    max-width: 16rem;
    padding: 0.6rem 0.9rem;
    border: 1px solid var(--color-rule);
    border-bottom: 3px solid var(--color-ink);
    border-radius: 3px 3px 0 0;
    background: var(--color-surface);
    font-family: var(--font-code);
    font-size: 1.9rem;
    letter-spacing: 0.4em;
    font-variant-numeric: tabular-nums;
  }

  input::placeholder {
    color: var(--color-rule);
  }

  input:focus {
    outline: none;
    border-bottom-color: var(--color-pine);
    background: color-mix(in srgb, var(--color-lichen) 22%, var(--color-surface));
  }

  input[aria-invalid='true'] {
    border-bottom-color: var(--color-rust);
  }

  .error {
    font-size: var(--text-sm);
    font-weight: 560;
    color: var(--color-rust);
  }
</style>
