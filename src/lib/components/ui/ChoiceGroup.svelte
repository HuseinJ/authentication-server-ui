<script lang="ts">
  type Option = { value: string; label: string };

  let {
    legend,
    options,
    selected = $bindable([]),
    hint,
    error,
    mono = false
  }: {
    legend: string;
    options: readonly Option[];
    selected?: string[];
    hint?: string;
    error?: string;
    mono?: boolean;
  } = $props();

  function toggle(value: string) {
    selected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
  }
</script>

<fieldset>
  <legend>{legend}</legend>
  <div class="choices">
    {#each options as option (option.value)}
      <label class="choice" class:mono>
        <input
          type="checkbox"
          checked={selected.includes(option.value)}
          onchange={() => toggle(option.value)}
        />
        <span>{option.label}</span>
      </label>
    {/each}
  </div>
  {#if error}
    <p class="error" role="alert">{error}</p>
  {:else if hint}
    <p class="hint">{hint}</p>
  {/if}
</fieldset>

<style>
  fieldset {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  legend {
    margin-bottom: 0.6rem;
    font-size: var(--text-sm);
    font-weight: 620;
  }

  .choices {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .choice {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.8rem;
    border: 1px solid var(--color-rule);
    border-radius: 2px;
    font-size: var(--text-sm);
    font-weight: 560;
    cursor: pointer;
    transition:
      background-color 0.15s,
      border-color 0.15s;
  }

  .choice:hover {
    border-color: var(--color-moss);
  }

  .choice:has(input:checked) {
    background: var(--color-lichen);
    border-color: var(--color-lichen);
  }

  .choice:has(input:focus-visible) {
    outline: 2px solid var(--color-pine);
    outline-offset: 2px;
  }

  .choice.mono {
    font-family: var(--font-code);
    font-size: 0.8rem;
    font-weight: 450;
  }

  input {
    width: 0.9rem;
    height: 0.9rem;
    accent-color: var(--color-pine);
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
