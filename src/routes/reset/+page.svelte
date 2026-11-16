<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import AuthLayout from '#lib/components/layout/AuthLayout.svelte';
  import Button from '#lib/components/ui/Button.svelte';
  import Form from '#lib/components/ui/Form.svelte';
  import Notice from '#lib/components/ui/Notice.svelte';
  import TextField from '#lib/components/ui/TextField.svelte';
  import { notifications } from '#lib/notifications/notifications.store';
  import { completePasswordReset } from '#lib/users/users.service';
  import { MIN_PASSWORD_LENGTH, hasErrors, newPasswordErrors, type FieldErrors } from '#lib/validation';

  let password = $state('');
  let confirmation = $state('');
  let errors = $state<FieldErrors<'password' | 'confirmation'>>({});
  let failure = $state<string>();
  let busy = $state(false);

  const token = $derived(page.url.searchParams.get('token') ?? '');
  const username = $derived(page.url.searchParams.get('username') ?? '');
  const linkIsComplete = $derived(token !== '' && username !== '');

  async function savePassword() {
    errors = newPasswordErrors(password, confirmation);
    if (hasErrors(errors)) return;

    busy = true;
    failure = undefined;
    try {
      await completePasswordReset(username, token, password);
      notifications.success('Saved your new password. Sign in with it now.');
      await goto(resolve('/login'));
    } catch {
      failure = 'This reset link has expired or was already used. Request a new one.';
    } finally {
      busy = false;
    }
  }
</script>

<AuthLayout
  title="New password"
  lede={linkIsComplete
    ? `Choose a new password for ${username}. Use at least ${MIN_PASSWORD_LENGTH} characters.`
    : 'This link is missing part of its address, so it can\'t be used. Request a new reset link.'}
>
  {#if !linkIsComplete}
    <Button href={resolve('/start-reset')}>Request a new link</Button>
  {:else}
    {#if failure}
      <Notice tone="error">
        {failure} <a class="text-link" href={resolve('/start-reset')}>Request a new link</a>
      </Notice>
    {/if}
    <Form onsubmit={savePassword}>
      <TextField
        label="New password"
        type="password"
        bind:value={password}
        autocomplete="new-password"
        error={errors.password}
        hint="At least {MIN_PASSWORD_LENGTH} characters."
        required
      />
      <TextField
        label="Repeat new password"
        type="password"
        bind:value={confirmation}
        autocomplete="new-password"
        error={errors.confirmation}
        required
      />
      {#snippet actions()}
        <Button type="submit" {busy}>{busy ? 'Saving…' : 'Save new password'}</Button>
        <a class="text-link" href={resolve('/login')}>Back to sign in</a>
      {/snippet}
    </Form>
  {/if}
</AuthLayout>
