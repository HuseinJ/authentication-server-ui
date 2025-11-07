<script lang="ts">
    import { goto } from '$app/navigation';
    import { isLoadingUsers } from '$lib/users/users.store';
    import { initiatePasswordReset } from '$lib/users/users.service';
    
    let username = '';
    let error = '';
    let success = false;
  
    async function handleResetRequest() {
      error = '';
      
      if (!username.trim()) {
        error = 'Please enter your username or email';
        return;
      }
  
      try {
        await initiatePasswordReset(username);
        success = true;
      } catch (err) {
        console.error('Password reset request failed:', err);
        error = 'Something went wrong. Please try again.';
      }
    }
  </script>
  
  <div class="container mx-auto max-w-md p-6">
    <h1 class="text-3xl font-bold mb-6">Reset Password</h1>
    
    {#if success}
      <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
        <p class="font-bold mb-2">Check Your Email</p>
        <p class="mb-2">If an account exists with this username, you will receive an email with instructions to reset your password.</p>
        <p class="text-sm">Please check your inbox and spam folder.</p>
      </div>
      
      <div class="space-y-3">
        <button 
          on:click={() => success = false}
          class="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition-colors"
        >
          Request Another Reset
        </button>
        
        <div class="text-center">
          <a href="/login" class="text-blue-600 hover:underline">
            Back to Login
          </a>
        </div>
      </div>
    {:else}
      <p class="text-gray-600 mb-6">
        Enter your username or email address and we'll send you instructions to reset your password.
      </p>
      
      <form on:submit|preventDefault={handleResetRequest} class="space-y-4">
        <div>
          <label class="block mb-2 font-medium">Username or Email</label>
          <input 
            type="text" 
            bind:value={username} 
            class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your username or email"
            required 
            disabled={$isLoadingUsers}
          />
        </div>
        
        {#if error}
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        {/if}
        
        <button 
          type="submit" 
          disabled={$isLoadingUsers}
          class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {#if $isLoadingUsers}
            Sending...
          {:else}
            Send Reset Link
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