<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { isAuthenticated, isLoading } from '#lib/auth';

  $effect(() => {
    if ($isLoading) return;
    goto(resolve($isAuthenticated ? '/users' : '/login'), { replaceState: true });
  });
</script>

<p class="wrap loading">Checking your session…</p>

<style>
  .loading {
    padding-block: 4rem;
    font-family: var(--font-text);
    color: var(--color-moss);
  }
</style>
