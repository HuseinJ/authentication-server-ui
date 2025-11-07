<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { isLodingUsers } from '$lib/users/users.store';
    import { completePasswordReset } from '$lib/users/users.service';
    
    let token = '';
    let username = ''
    let newPassword = '';
    let confirmPassword = '';
    let error = '';
    let success = false;
    let passwordsMatch = true;
  
    onMount(() => {
      // Get token from URL parameter
      token = $page.url.searchParams.get('token') || '';
      username = $page.url.searchParams.get('username') || '';
      
      if (!token || !username) {
        error = 'Invalid or missing reset token or username ';
      }
    });
    // Check if passwords match
    $: passwordsMatch = newPassword === confirmPassword || confirmPassword === '';
    async function handleResetComplete() {

        try {
        await completePasswordReset(username, token, newPassword)
        goto('/login');
      } catch (error) {
        console.error('Login failed');
        error = 'Something went wrong';
      }
    }
  </script>
  
  <div class="container mx-auto max-w-md p-6">
    <h1 class="text-3xl font-bold mb-6">Reset Your Password</h1>
    
    {#if success}
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        <p class="font-bold">Success!</p>
        <p>Your password has been reset. Redirecting to login...</p>
      </div>
    {:else}
      <form on:submit|preventDefault={handleResetComplete} class="space-y-4">
        <div>
          <label class="block mb-2 font-medium">New Password</label>
          <input 
            type="password" 
            bind:value={newPassword} 
            class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter new password"
            required 
            minlength="8"
            disabled={$isLodingUsers || !token}
          />
          <p class="text-sm text-gray-600 mt-1">Must be at least 8 characters</p>
        </div>
        
        <div>
          <label class="block mb-2 font-medium">Confirm Password</label>
          <input 
            type="password" 
            bind:value={confirmPassword} 
            class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500
                   {!passwordsMatch ? 'border-red-500' : ''}"
            placeholder="Confirm new password"
            required 
            minlength="8"
            disabled={$isLodingUsers || !token}
          />
          {#if !passwordsMatch}
            <p class="text-sm text-red-600 mt-1">Passwords do not match</p>
          {/if}
        </div>
        
        {#if error}
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        {/if}
        
        <button 
          type="submit" 
          disabled={$isLodingUsers || !token || !passwordsMatch}
          class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {#if $isLodingUsers}
            Resetting Password...
          {:else}
            Reset Password
          {/if}
        </button>
  
        <div class="text-center mt-4">
          <a href="/login" class="text-blue-600 hover:underline">
            Back to Login
          </a>
        </div>
      </form>
    {/if}
  </div>