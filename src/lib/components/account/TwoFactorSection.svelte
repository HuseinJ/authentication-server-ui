<script lang="ts">
  import { onMount } from 'svelte';
  import TotpForm from '#lib/components/auth/TotpForm.svelte';
  import Button from '#lib/components/ui/Button.svelte';
  import Form from '#lib/components/ui/Form.svelte';
  import FormSection from '#lib/components/ui/FormSection.svelte';
  import Notice from '#lib/components/ui/Notice.svelte';
  import SecretSlip from '#lib/components/ui/SecretSlip.svelte';
  import Tag from '#lib/components/ui/Tag.svelte';
  import TextField from '#lib/components/ui/TextField.svelte';
  import TotpCodeInput from '#lib/components/ui/TotpCodeInput.svelte';
  import {
    confirmTotpEnrollment,
    disableTotp,
    getEnrolledFactors,
    startTotpEnrollment
  } from '#lib/mfa/mfa.service';
  import type { TotpEnrollment } from '#lib/mfa/mfa.types';
  import { notifications } from '#lib/notifications/notifications.store';
  import { errorMessage } from '#lib/validation';

  type Step = 'loading' | 'unavailable' | 'off' | 'setting-up' | 'on' | 'turning-off';

  let step = $state<Step>('loading');
  let enrollment = $state<TotpEnrollment | null>(null);
  let busy = $state(false);
  let codeError = $state<string>();
  let password = $state('');
  let disableCode = $state('');

  const isOn = $derived(step === 'on' || step === 'turning-off');

  onMount(refresh);

  async function refresh() {
    step = 'loading';
    try {
      const factors = await getEnrolledFactors();
      step = factors.includes('totp') ? 'on' : 'off';
    } catch {
      step = 'unavailable';
    }
  }

  function resetForms() {
    enrollment = null;
    codeError = undefined;
    password = '';
    disableCode = '';
  }

  async function startSetup() {
    busy = true;
    resetForms();
    try {
      enrollment = await startTotpEnrollment();
      step = 'setting-up';
    } catch (error) {
      notifications.error(errorMessage(error, 'Setup couldn\'t start. Try again in a moment.'));
    } finally {
      busy = false;
    }
  }

  async function finishSetup(code: string) {
    busy = true;
    codeError = undefined;
    try {
      await confirmTotpEnrollment(code);
      resetForms();
      step = 'on';
      notifications.success('Turned on two-factor authentication.');
    } catch (error) {
      codeError = errorMessage(error, 'That code didn\'t match. Use the one your app shows right now.');
    } finally {
      busy = false;
    }
  }

  async function turnOff() {
    if (!password || disableCode.length !== 6) {
      codeError = 'Enter your password and a current code to confirm.';
      return;
    }
    busy = true;
    codeError = undefined;
    try {
      await disableTotp(password, disableCode);
      resetForms();
      step = 'off';
      notifications.success('Turned off two-factor authentication.');
    } catch (error) {
      codeError = errorMessage(error, 'Two-factor couldn\'t be turned off. Check your password and code.');
      disableCode = '';
    } finally {
      busy = false;
    }
  }

  function cancel() {
    step = isOn ? 'on' : 'off';
    resetForms();
  }
</script>

<FormSection
  title="Two-factor authentication"
  description="After your password, you also enter a 6-digit code from an authenticator app such as Aegis, 1Password or Google Authenticator."
>
  {#snippet aside()}
    {#if step !== 'loading' && step !== 'unavailable'}
      <Tag text={isOn ? 'On' : 'Off'} tone={isOn ? 'lichen' : 'outline'} />
    {/if}
  {/snippet}

  {#if step === 'loading'}
    <p class="muted">Checking your two-factor settings…</p>
  {:else if step === 'unavailable'}
    <Notice tone="error">
      Your two-factor settings couldn't be loaded.
      <Button variant="quiet" size="sm" onclick={refresh}>Try again</Button>
    </Notice>
  {:else if step === 'off'}
    <p class="body">
      Turn it on so that a stolen password alone isn't enough to get into your account.
    </p>
    <div>
      <Button onclick={startSetup} {busy}>{busy ? 'Starting setup…' : 'Set up authenticator app'}</Button>
    </div>
  {:else if step === 'setting-up' && enrollment}
    <ol class="steps">
      <li>
        <h3>Add this account to your authenticator app</h3>
        <p class="body">
          On a phone, open the link to add it directly. Otherwise choose "enter a setup key" in the
          app and type or paste the key below.
        </p>
        <div>
          <Button variant="secondary" size="sm" externalHref={enrollment.otpauthUri}>Open in authenticator app</Button>
        </div>
        <SecretSlip label="Setup key" value={enrollment.secret} what="setup key" />
      </li>
      <li>
        <h3>Enter the code your app shows</h3>
        <TotpForm {busy} error={codeError} submitLabel="Turn on two-factor" onsubmit={finishSetup} />
        <div>
          <Button variant="quiet" size="sm" onclick={cancel} disabled={busy}>Cancel setup</Button>
        </div>
      </li>
    </ol>
  {:else if step === 'on'}
    <p class="body">Every sign-in to your account asks for a code from your authenticator app.</p>
    <div>
      <Button variant="secondary" onclick={() => (step = 'turning-off')}>Turn off two-factor</Button>
    </div>
  {:else if step === 'turning-off'}
    <p class="body">Confirm it's you with your password and a current code.</p>
    {#if codeError}
      <Notice tone="error">{codeError}</Notice>
    {/if}
    <Form onsubmit={turnOff}>
      <TextField label="Password" type="password" bind:value={password} autocomplete="current-password" />
      <TotpCodeInput bind:value={disableCode} />
      {#snippet actions()}
        <Button type="submit" variant="danger" {busy}>{busy ? 'Turning off…' : 'Turn off two-factor'}</Button>
        <Button variant="quiet" onclick={cancel} disabled={busy}>Keep it on</Button>
      {/snippet}
    </Form>
  {/if}
</FormSection>

<style>
  .muted,
  .body {
    font-family: var(--font-text);
    line-height: 1.5;
  }

  .muted {
    color: var(--color-moss);
  }

  .steps {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    counter-reset: step;
  }

  .steps li {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    padding-left: 2.75rem;
    position: relative;
    counter-increment: step;
  }

  .steps li::before {
    content: counter(step);
    position: absolute;
    left: 0;
    top: -0.1rem;
    width: 1.8rem;
    height: 1.8rem;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--color-pine);
    color: var(--color-lichen);
    font-weight: 700;
    font-size: var(--text-sm);
  }

  h3 {
    font-size: var(--text-md);
    font-weight: 680;
  }
</style>
