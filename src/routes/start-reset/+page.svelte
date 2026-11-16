<script lang="ts">
  import { resolve } from '$app/paths';
  import AuthLayout from '#lib/components/layout/AuthLayout.svelte';
  import Button from '#lib/components/ui/Button.svelte';
  import Form from '#lib/components/ui/Form.svelte';
  import Notice from '#lib/components/ui/Notice.svelte';
  import TextField from '#lib/components/ui/TextField.svelte';
  import { initiatePasswordReset } from '#lib/users/users.service';

  let username = $state('');
  let busy = $state(false);
  let sent = $state(false);
  let error = $state<string>();

  async function sendLink() {
    if (!username.trim()) {
      error = 'Enter your username so we know which account to reset.';
      return;
    }
    busy = true;
    error = undefined;
    try {
      await initiatePasswordReset(username.trim());
      sent = true;
    } catch {
      error = 'The reset link couldn\'t be sent. Try again in a moment.';
    } finally {
      busy = false;
    }
  }

  function startOver() {
    sent = false;
    username = '';
  }
</script>

<AuthLayout
  title={sent ? 'Check mail' : 'Reset'}
  lede={sent
    ? 'If that account exists, a reset link is on its way to the email address on file. It can take a few minutes, and sometimes lands in spam.'
    : 'Forgot your password? Enter your username and we\'ll email you a link to choose a new one.'}
>
  {#if sent}
    <div class="sent">
      <Button href={resolve('/login')}>Back to sign in</Button>
      <Button variant="quiet" onclick={startOver}>Use a different username</Button>
    </div>
  {:else}
    {#if error}
      <Notice tone="error">{error}</Notice>
    {/if}
    <Form onsubmit={sendLink}>
      <TextField
        label="Username"
        bind:value={username}
        autocomplete="username"
        autocapitalize="none"
        spellcheck={false}
        required
      />
      {#snippet actions()}
        <Button type="submit" {busy}>{busy ? 'Sending link…' : 'Send reset link'}</Button>
        <a class="text-link" href={resolve('/login')}>Back to sign in</a>
      {/snippet}
    </Form>
  {/if}
</AuthLayout>

<style>
  .sent {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
  }
</style>
