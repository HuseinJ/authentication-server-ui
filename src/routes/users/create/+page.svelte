<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import PageTitle from '#lib/components/layout/PageTitle.svelte';
  import NewUserForm from '#lib/components/users/NewUserForm.svelte';
  import Notice from '#lib/components/ui/Notice.svelte';
  import { notifications } from '#lib/notifications/notifications.store';
  import { createUser, updateUserRoles } from '#lib/users/users.service';
  import type { NewUser } from '#lib/users/users.types';
  import { errorMessage } from '#lib/validation';

  let busy = $state(false);
  let failure = $state<string>();

  async function create(user: NewUser) {
    busy = true;
    failure = undefined;
    try {
      await createUser({ username: user.username, email: user.email, password: user.password });
    } catch (error) {
      failure = errorMessage(error, 'The user couldn\'t be created.');
      busy = false;
      return;
    }

    try {
      await updateUserRoles(user.username, user.roles);
      notifications.success(`Created ${user.username}.`);
    } catch (error) {
      notifications.warning(
        errorMessage(error, 'Set their roles from the user list.'),
        `Created ${user.username}, but the roles weren't saved`
      );
    }

    busy = false;
    await goto(resolve('/users'));
  }
</script>

<div class="wrap">
  <PageTitle
    title="New user"
    back={{ href: resolve('/users'), label: 'All users' }}
    lede="Create an account for someone who should be able to sign in to your applications."
  />

  {#if failure}
    <div class="failure">
      <Notice tone="error">{failure}</Notice>
    </div>
  {/if}

  <NewUserForm {busy} cancelHref={resolve('/users')} onsubmit={create} />
</div>

<style>
  .failure {
    margin-bottom: 1.5rem;
  }
</style>
