<script lang="ts">
    import { isAuthenticated, isLoading } from '$lib/auth/auth.store';
    import { goto } from '$app/navigation';
  
    $effect(() => {
      if (!$isLoading) {
        goto($isAuthenticated ? '/users' : '/login', { replaceState: true });
      }
    });
  </script>