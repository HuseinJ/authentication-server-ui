<script lang="ts">
  import { user } from '#lib/auth';
  import PasswordSection from '#lib/components/account/PasswordSection.svelte';
  import ProfileSection from '#lib/components/account/ProfileSection.svelte';
  import TwoFactorSection from '#lib/components/account/TwoFactorSection.svelte';
  import PageTitle from '#lib/components/layout/PageTitle.svelte';
</script>

<div class="wrap">
  <PageTitle
    title="Account"
    lede="Your own sign-in: the password you use and the second step that protects it."
  />

  {#if $user}
    <ProfileSection user={$user} />
  {/if}
  <PasswordSection />
  <TwoFactorSection />
</div>
