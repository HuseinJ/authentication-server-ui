<script lang="ts">
  import Button from '#lib/components/ui/Button.svelte';
  import TextField from '#lib/components/ui/TextField.svelte';

  let {
    legend,
    uris = $bindable(['']),
    hint,
    error
  }: {
    legend: string;
    uris?: string[];
    hint?: string;
    error?: string;
  } = $props();

  function add() {
    uris = [...uris, ''];
  }

  function remove(index: number) {
    uris = uris.length === 1 ? [''] : uris.filter((_, position) => position !== index);
  }
</script>

<fieldset>
  <legend>{legend}</legend>
  {#if hint}
    <p class="hint">{hint}</p>
  {/if}

  <ul>
    {#each uris, index (index)}
      <li>
        <TextField
          label="{legend} {index + 1}"
          hideLabel
          bind:value={uris[index]}
          type="url"
          placeholder="https://app.example.com/callback"
          spellcheck={false}
          mono
        />
        <button type="button" class="remove" onclick={() => remove(index)}>
          <span class="sr-only">Remove {legend.toLowerCase()} {index + 1}</span>
          <span aria-hidden="true">×</span>
        </button>
      </li>
    {/each}
  </ul>

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}

  <div>
    <Button variant="quiet" size="sm" onclick={add}>Add another</Button>
  </div>
</fieldset>

<style>
  fieldset {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  legend {
    margin-bottom: 0.4rem;
    font-size: var(--text-sm);
    font-weight: 620;
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: 0.5rem;
  }

  .remove {
    width: 2.75rem;
    height: 2.9rem;
    border: 1px solid var(--color-rule);
    border-radius: 3px;
    font-size: 1.3rem;
    color: var(--color-moss);
    cursor: pointer;
    transition:
      border-color 0.15s,
      color 0.15s;
  }

  .remove:hover {
    border-color: var(--color-rust);
    color: var(--color-rust);
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
