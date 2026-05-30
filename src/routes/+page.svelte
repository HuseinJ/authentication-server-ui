<script lang="ts">
  import { isAuthenticated, isLoading } from '$lib/auth/auth.store';
  import { goto } from '$app/navigation';

  $effect(() => {
    if (!$isLoading) {
      goto($isAuthenticated ? '/users' : '/login', { replaceState: true });
    }
  });
</script>

<div class="min-h-[60vh] flex items-center justify-center">
  <div class="text-center">
    <div class="inline-block w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
    <p class="mt-4 text-gray-500 text-sm">Loading…</p>
  </div>
</div>
