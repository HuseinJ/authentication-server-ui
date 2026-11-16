<script lang="ts">
  import Button from '#lib/components/ui/Button.svelte';
  import Form from '#lib/components/ui/Form.svelte';
  import FormSection from '#lib/components/ui/FormSection.svelte';
  import Notice from '#lib/components/ui/Notice.svelte';
  import TextField from '#lib/components/ui/TextField.svelte';
  import { notifications } from '#lib/notifications/notifications.store';
  import { changePassword } from '#lib/users/users.service';
  import {
    MIN_PASSWORD_LENGTH,
    errorMessage,
    hasErrors,
    newPasswordErrors,
    type FieldErrors
  } from '#lib/validation';

  type Field = 'current' | 'password' | 'confirmation';

  let current = $state('');
  let password = $state('');
  let confirmation = $state('');
  let errors = $state<FieldErrors<Field>>({});
  let failure = $state<string>();
  let busy = $state(false);

  function validate(): FieldErrors<Field> {
    const found: FieldErrors<Field> = newPasswordErrors(password, confirmation);
    if (!current) found.current = 'Enter the password you use now.';
    else if (current === password) found.password = 'Choose a password that differs from the current one.';
    return found;
  }

  async function save() {
    errors = validate();
    if (hasErrors(errors)) return;

    busy = true;
    failure = undefined;
    try {
      await changePassword(current, password);
      current = password = confirmation = '';
      notifications.success('Changed your password.');
    } catch (error) {
      failure = errorMessage(error, 'Your password couldn\'t be changed.');
    } finally {
      busy = false;
    }
  }
</script>

<FormSection
  title="Password"
  description="Changing it doesn't sign you out here, but you'll need the new one next time."
>
  {#if failure}
    <Notice tone="error">{failure}</Notice>
  {/if}
  <Form onsubmit={save}>
    <TextField
      label="Current password"
      type="password"
      bind:value={current}
      error={errors.current}
      autocomplete="current-password"
    />
    <TextField
      label="New password"
      type="password"
      bind:value={password}
      error={errors.password}
      hint="At least {MIN_PASSWORD_LENGTH} characters."
      autocomplete="new-password"
    />
    <TextField
      label="Repeat new password"
      type="password"
      bind:value={confirmation}
      error={errors.confirmation}
      autocomplete="new-password"
    />
    {#snippet actions()}
      <Button type="submit" {busy}>{busy ? 'Changing password…' : 'Change password'}</Button>
    {/snippet}
  </Form>
</FormSection>
