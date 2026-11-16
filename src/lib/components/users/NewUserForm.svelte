<script lang="ts">
  import type { ResolvedPathname } from '$app/types';
  import Button from '#lib/components/ui/Button.svelte';
  import ChoiceGroup from '#lib/components/ui/ChoiceGroup.svelte';
  import Form from '#lib/components/ui/Form.svelte';
  import FormSection from '#lib/components/ui/FormSection.svelte';
  import TextField from '#lib/components/ui/TextField.svelte';
  import { ROLE_OPTIONS, type NewUser } from '#lib/users/users.types';
  import { MIN_PASSWORD_LENGTH, hasErrors, newPasswordErrors, type FieldErrors } from '#lib/validation';

  type Field = 'username' | 'email' | 'password' | 'confirmation' | 'roles';

  let {
    busy,
    cancelHref,
    onsubmit
  }: {
    busy: boolean;
    cancelHref: ResolvedPathname;
    onsubmit: (user: NewUser) => void;
  } = $props();

  let username = $state('');
  let email = $state('');
  let password = $state('');
  let confirmation = $state('');
  let roles = $state<string[]>(['ROLE_GUEST']);
  let errors = $state<FieldErrors<Field>>({});

  function validate(): FieldErrors<Field> {
    const found: FieldErrors<Field> = newPasswordErrors(password, confirmation);
    if (username.trim().length < 3) found.username = 'Use at least 3 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) found.email = 'Enter an email address like name@example.com.';
    if (roles.length === 0) found.roles = 'Pick at least one role.';
    return found;
  }

  function submit() {
    errors = validate();
    if (hasErrors(errors)) return;
    onsubmit({ username: username.trim(), email: email.trim(), password, roles });
  }
</script>

<Form onsubmit={submit}>
  <FormSection
    title="Identity"
    description="The username is what they type to sign in. Password reset links go to the email address."
  >
    <TextField
      label="Username"
      bind:value={username}
      error={errors.username}
      autocomplete="off"
      autocapitalize="none"
      spellcheck={false}
      mono
    />
    <TextField label="Email" type="email" bind:value={email} error={errors.email} autocomplete="off" />
  </FormSection>

  <FormSection
    title="First password"
    description="Share it with them privately. They can change it from their account page once signed in."
  >
    <TextField
      label="Password"
      type="password"
      bind:value={password}
      error={errors.password}
      hint="At least {MIN_PASSWORD_LENGTH} characters."
      autocomplete="new-password"
    />
    <TextField
      label="Repeat password"
      type="password"
      bind:value={confirmation}
      error={errors.confirmation}
      autocomplete="new-password"
    />
  </FormSection>

  <FormSection title="Roles" description="You can change these later from the user list.">
    <ChoiceGroup legend="Roles" options={ROLE_OPTIONS} bind:selected={roles} error={errors.roles} />
  </FormSection>

  {#snippet actions()}
    <div class="actions">
      <Button type="submit" {busy}>{busy ? 'Creating user…' : 'Create user'}</Button>
      <Button variant="quiet" href={cancelHref}>Cancel</Button>
    </div>
  {/snippet}
</Form>

<style>
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
    width: 100%;
    padding-top: 2rem;
    border-top: 1px solid var(--color-rule);
  }
</style>
