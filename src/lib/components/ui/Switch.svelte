<script lang="ts">
  let {
    label,
    description,
    checked = $bindable(false),
    disabled = false
  }: {
    label: string;
    description?: string;
    checked?: boolean;
    disabled?: boolean;
  } = $props();

  const id = $props.id();
</script>

<div class="switch" class:disabled>
  <input
    {id}
    type="checkbox"
    role="switch"
    bind:checked
    {disabled}
    aria-describedby={description ? `${id}-description` : undefined}
  />
  <div class="text">
    <label for={id}>{label}</label>
    {#if description}
      <p id="{id}-description">{description}</p>
    {/if}
  </div>
</div>

<style>
  .switch {
    display: flex;
    align-items: flex-start;
    gap: 0.9rem;
  }

  input {
    appearance: none;
    position: relative;
    flex-shrink: 0;
    width: 2.5rem;
    height: 1.4rem;
    margin-top: 0.05rem;
    border-radius: 999px;
    background: var(--color-rule);
    cursor: pointer;
    transition: background-color 0.15s;
  }

  input::after {
    content: '';
    position: absolute;
    top: 0.2rem;
    left: 0.2rem;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: var(--color-surface);
    transition: transform 0.18s cubic-bezier(0.2, 0.75, 0.15, 1);
  }

  input:checked {
    background: var(--color-pine);
  }

  input:checked::after {
    transform: translateX(1.1rem);
    background: var(--color-lichen);
  }

  input:disabled {
    cursor: not-allowed;
  }

  .disabled {
    opacity: 0.6;
  }

  label {
    font-weight: 620;
    cursor: pointer;
  }

  p {
    margin-top: 0.15rem;
    font-family: var(--font-text);
    color: var(--color-moss);
    line-height: 1.45;
  }
</style>
