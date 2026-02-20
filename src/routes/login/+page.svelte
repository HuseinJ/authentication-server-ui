<script lang="ts">
    import { login, oidcLogin, authError, isLoading } from '$lib/auth';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

  
    let username = '';
    let password = '';

    const isOidcFlow = $page.url.searchParams.get('flow') === 'oidc';
  
    async function handleLogin() {
    try {
      if (isOidcFlow) {
        await oidcLogin({ username, password });
        // no goto needed — Spring redirects the browser automatically
      } else {
        await login({ username, password });
        goto('/users');
      }
    } catch (error) {
      console.error('Login failed');
    }
  }
  </script>

<div class="container mx-auto max-w-md p-6">
    <h1 class="text-3xl font-bold mb-6">Login</h1>
    
    <form on:submit|preventDefault={handleLogin} class="space-y-4">
      <div>
        <label class="block mb-2">Email</label>
        <input 
          type="text" 
          bind:value={username} 
          class="w-full px-4 py-2 border rounded"
          required 
        />
      </div>
      
      <div>
        <label class="block mb-2">Password</label>
        <input 
          type="password" 
          bind:value={password} 
          class="w-full px-4 py-2 border rounded"
          required 
        />
      </div>
      
      {#if $authError}
        <p class="text-red-600">{$authError}</p>
      {/if}
      
      <button 
        type="submit" 
        disabled={$isLoading}
        class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {$isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
    <div class="text-center mt-4">
      <a href="/start-reset" class="text-blue-600 hover:underline">
        Forgot Password
      </a>
    </div>
  </div>