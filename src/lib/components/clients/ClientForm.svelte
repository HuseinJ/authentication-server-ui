<script lang="ts">
  import type { ResolvedPathname } from '$app/types';
  import { untrack } from 'svelte';
  import Button from '#lib/components/ui/Button.svelte';
  import ChoiceGroup from '#lib/components/ui/ChoiceGroup.svelte';
  import Form from '#lib/components/ui/Form.svelte';
  import FormSection from '#lib/components/ui/FormSection.svelte';
  import Switch from '#lib/components/ui/Switch.svelte';
  import TextField from '#lib/components/ui/TextField.svelte';
  import UriListField from './UriListField.svelte';
  import { formatDuration } from '#lib/format';
  import {
    AUTH_METHOD_OPTIONS,
    GRANT_TYPE_OPTIONS,
    SCOPE_OPTIONS,
    isPublicClient,
    type CreateOidcClientRequest
  } from '#lib/oidc/oidc-clients.types';
  import { hasErrors, type FieldErrors } from '#lib/validation';

  type Field = 'clientId' | 'clientName' | 'grantTypes' | 'authenticationMethods' | 'redirectUris' | 'scopes';

  let {
    mode,
    initial,
    busy,
    cancelHref,
    onsubmit
  }: {
    mode: 'create' | 'edit';
    initial: CreateOidcClientRequest;
    busy: boolean;
    cancelHref: ResolvedPathname;
    onsubmit: (client: CreateOidcClientRequest) => void;
  } = $props();

  let client = $state<CreateOidcClientRequest>(untrack(() => $state.snapshot(initial)));
  let errors = $state<FieldErrors<Field>>({});

  const isPublic = $derived(isPublicClient(client.authenticationMethods));

  $effect(() => {
    if (isPublic) client.clientSettings.requireProofKey = true;
  });

  function filled(values: string[]) {
    return values.map((value) => value.trim()).filter(Boolean);
  }

  function isAllowedRedirect(uri: string) {
    return uri.startsWith('https://') || uri.startsWith('http://localhost');
  }

  function validate(): FieldErrors<Field> {
    const found: FieldErrors<Field> = {};
    const redirects = filled(client.redirectUris);

    if (mode === 'create' && !/^[a-zA-Z0-9_-]+$/.test(client.clientId)) {
      found.clientId = 'Use letters, numbers, hyphens and underscores only.';
    }
    if (!client.clientName.trim()) found.clientName = 'Give the client a name people will recognise.';
    if (client.grantTypes.length === 0) found.grantTypes = 'Pick at least one grant type.';
    if (client.authenticationMethods.length === 0) found.authenticationMethods = 'Pick at least one method.';
    if (redirects.length === 0) found.redirectUris = 'Add at least one redirect URI.';
    else if (mode === 'create' && !redirects.every(isAllowedRedirect)) {
      found.redirectUris = 'Redirect URIs must use https://. Only http://localhost may use plain http.';
    }
    if (client.scopes.length === 0) found.scopes = 'Pick at least one scope.';
    return found;
  }

  function submit() {
    errors = validate();
    if (hasErrors(errors)) return;
    onsubmit({
      ...$state.snapshot(client),
      clientId: client.clientId.trim(),
      clientName: client.clientName.trim(),
      redirectUris: filled(client.redirectUris),
      postLogoutRedirectUris: filled(client.postLogoutRedirectUris)
    });
  }
</script>

<Form onsubmit={submit}>
  <FormSection
    title="Identity"
    description="The client ID is what the application sends when it asks people to sign in. It can't be changed later."
  >
    <TextField
      label="Client ID"
      bind:value={client.clientId}
      error={errors.clientId}
      disabled={mode === 'edit'}
      placeholder="photo-gallery"
      autocomplete="off"
      spellcheck={false}
      mono
    />
    <TextField
      label="Name"
      bind:value={client.clientName}
      error={errors.clientName}
      placeholder="Photo gallery"
      autocomplete="off"
    />
  </FormSection>

  <FormSection
    title="How it signs in"
    description="Most web apps need authorization code and refresh token. Apps that run in the browser or on a phone can't keep a secret, so they are public clients."
  >
    <ChoiceGroup
      legend="Grant types"
      options={GRANT_TYPE_OPTIONS}
      bind:selected={client.grantTypes}
      error={errors.grantTypes}
    />
    {#if mode === 'create'}
      <ChoiceGroup
        legend="How the client proves its identity"
        options={AUTH_METHOD_OPTIONS}
        bind:selected={client.authenticationMethods}
        error={errors.authenticationMethods}
      />
    {/if}
  </FormSection>

  <FormSection
    title="Redirects"
    description="Where people are sent after signing in or out. Only these exact addresses are accepted."
  >
    <UriListField legend="Redirect URI" bind:uris={client.redirectUris} error={errors.redirectUris} />
    <UriListField
      legend="Sign-out redirect URI"
      bind:uris={client.postLogoutRedirectUris}
      hint="Optional. Leave empty if the application doesn't sign people out here."
    />
  </FormSection>

  <FormSection title="Scopes" description="The information the application can ask for about the person signing in.">
    <ChoiceGroup
      legend="Allowed scopes"
      options={SCOPE_OPTIONS}
      bind:selected={client.scopes}
      error={errors.scopes}
      mono
    />
  </FormSection>

  <FormSection title="Safeguards">
    <Switch
      label="Require PKCE"
      description={isPublic
        ? 'Always on for public clients, because they have no secret to protect the sign-in.'
        : 'Protects the sign-in code from being intercepted. Leave on unless the application can\'t support it.'}
      bind:checked={client.clientSettings.requireProofKey}
      disabled={isPublic}
    />
    <Switch
      label="Ask for consent"
      description="People see which information the application wants and approve it on first sign-in."
      bind:checked={client.clientSettings.requireAuthorizationConsent}
    />
    <Switch
      label="Reuse refresh tokens"
      description="Off means every refresh issues a new refresh token, which makes stolen tokens easier to spot."
      bind:checked={client.tokenSettings.reuseRefreshTokens}
    />
  </FormSection>

  <FormSection title="Token lifetimes" description="In seconds. Shorter lifetimes limit the damage of a leaked token.">
    <div class="lifetimes">
      <TextField
        label="Access token"
        type="number"
        min="60"
        bind:value={client.tokenSettings.accessTokenTimeToLiveSeconds}
        hint={formatDuration(client.tokenSettings.accessTokenTimeToLiveSeconds)}
        mono
      />
      <TextField
        label="Refresh token"
        type="number"
        min="60"
        bind:value={client.tokenSettings.refreshTokenTimeToLiveSeconds}
        hint={formatDuration(client.tokenSettings.refreshTokenTimeToLiveSeconds)}
        mono
      />
      <TextField
        label="Authorization code"
        type="number"
        min="30"
        bind:value={client.tokenSettings.authorizationCodeTimeToLiveSeconds}
        hint={formatDuration(client.tokenSettings.authorizationCodeTimeToLiveSeconds)}
        mono
      />
    </div>
  </FormSection>

  {#snippet actions()}
    <div class="actions">
      {#if mode === 'create'}
        <Button type="submit" {busy}>{busy ? 'Registering client…' : 'Register client'}</Button>
      {:else}
        <Button type="submit" {busy}>{busy ? 'Saving…' : 'Save changes'}</Button>
      {/if}
      <Button variant="quiet" href={cancelHref}>Cancel</Button>
      {#if hasErrors(errors)}
        <p class="summary" role="alert">Some fields need attention. They're marked above.</p>
      {/if}
    </div>
  {/snippet}
</Form>

<style>
  .lifetimes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
    gap: 1rem;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
    width: 100%;
    padding-top: 2rem;
    border-top: 1px solid var(--color-rule);
  }

  .summary {
    font-size: var(--text-sm);
    font-weight: 560;
    color: var(--color-rust);
  }
</style>
