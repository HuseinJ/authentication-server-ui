<script lang="ts">
  /**
   * Six-digit input for authenticator app codes. Uses autocomplete="one-time-code"
   * so password managers and mobile keyboards can fill it in.
   */
  let {
    value = $bindable(''),
    id = 'totp-code',
    name,
    label = 'Verification code',
    invalid = false,
    autofocus = false,
    disabled = false
  }: {
    value?: string;
    id?: string;
    name?: string;
    label?: string;
    invalid?: boolean;
    autofocus?: boolean;
    disabled?: boolean;
  } = $props();

  let input: HTMLInputElement | undefined = $state();

  $effect(() => {
    if (autofocus) input?.focus();
  });

  function handleInput(e: Event) {
    // Accept pasted codes like "123 456" and drop anything that is not a digit.
    value = (e.currentTarget as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6);
  }
</script>

<div>
  <label for={id} class="label">{label}</label>
  <input
    bind:this={input}
    {id}
    {name}
    {disabled}
    type="text"
    inputmode="numeric"
    autocomplete="one-time-code"
    pattern="[0-9]{6}"
    maxlength="6"
    required
    value={value}
    oninput={handleInput}
    class="field text-center text-2xl tracking-[0.5em] font-mono {invalid ? 'field-invalid' : ''}"
    placeholder="000000"
  />
</div>
