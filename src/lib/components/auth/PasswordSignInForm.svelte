<script lang="ts">
  import { resolve } from '$app/paths';
  import Button from '#lib/components/ui/Button.svelte';
  import Form from '#lib/components/ui/Form.svelte';
  import TextField from '#lib/components/ui/TextField.svelte';

  let {
    fixedUsername,
    busy,
    submitLabel,
    onsubmit,
    onchangeaccount
  }: {
    fixedUsername?: string;
    busy: boolean;
    submitLabel: string;
    onsubmit: (credentials: { username: string; password: string }) => void;
    onchangeaccount?: () => void;
  } = $props();

  let username = $state('');
  let password = $state('');
  let errors = $state<{ username?: string; password?: string }>({});

  function submit() {
    if (busy) return;
    const name = (fixedUsername ?? username).trim();
    errors = {
      username: name ? undefined : 'Enter your username.',
      password: password ? undefined : 'Enter your password.'
    };
    if (errors.username || errors.password) return;
    onsubmit({ username: name, password });
  }
</script>

<Form onsubmit={submit}>
  {#if fixedUsername}
    <p class="as">
      Signing in as <strong>{fixedUsername}</strong>
      {#if onchangeaccount}
        <Button variant="quiet" size="sm" onclick={onchangeaccount}>Change</Button>
      {/if}
    </p>
  {:else}
    <TextField
      label="Username"
      bind:value={username}
      error={errors.username}
      autocomplete="username"
      autocapitalize="none"
      spellcheck={false}
      required
    />
  {/if}

  <TextField
    label="Password"
    type="password"
    bind:value={password}
    error={errors.password}
    autocomplete="current-password"
    required
  />

  {#snippet actions()}
    <Button type="submit" {busy}>{busy ? 'Signing in…' : submitLabel}</Button>
    <a class="text-link" href={resolve('/start-reset')}>Forgot your password?</a>
  {/snippet}
</Form>

<style>
  .as {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.25rem 0.75rem;
    font-family: var(--font-text);
  }

  strong {
    font-family: var(--font-code);
    font-weight: 600;
  }
</style>
