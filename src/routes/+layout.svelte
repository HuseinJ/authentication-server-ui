<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { isAuthenticated, user, authStore } from '$lib/auth/auth.store';
	import { goto } from '$app/navigation';
  
	let { children } = $props();
	let menuOpen = $state(false);
  
	function toggleMenu() { menuOpen = !menuOpen; }
	function closeMenu() { menuOpen = false; }
  
	function handleLogout() {
	  authStore.logout();
	  goto('/login');
	  closeMenu();
	}
  </script>
  
  <svelte:head>
	<link rel="icon" href={favicon} />
  </svelte:head>
  
  <header class="bg-white border-b border-gray-200 shadow-sm">
	<nav class="container mx-auto px-6 h-16 flex items-center justify-between">
  
	  <!-- Logo -->
	  <a href="/" class="text-xl font-bold text-gray-900 tracking-tight">Auth</a>
  
	  <!-- Desktop Nav -->
	  <ul class="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
		{#if !$isAuthenticated}
		  <li><a href="https://www.hjusic.com" class="hover:text-gray-900 transition-colors" target="_blank" rel="noopener noreferrer">About</a></li>
		  <li><a href="https://www.hjusic.com/blog" class="hover:text-gray-900 transition-colors" target="_blank" rel="noopener noreferrer">Blog</a></li>
		{:else}
		  <li><a href="/users" class="hover:text-gray-900 transition-colors">Users</a></li>
		  <li><a href="/oidc" class="hover:text-gray-900 transition-colors">OIDC</a></li>
		{/if}
	  </ul>
  
	  <!-- Desktop Auth -->
	  <div class="hidden md:flex items-center gap-3">
		{#if $isAuthenticated}
		  <span class="text-sm text-gray-600">Hey, {$user?.username}</span>
		  <button
			onclick={handleLogout}
			class="bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
		  >
			Logout
		  </button>
		{:else}
		  <a href="/login" class="bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
			Sign In
		  </a>
		{/if}
	  </div>
  
	  <!-- Hamburger (mobile only) -->
	  <button
		onclick={toggleMenu}
		class="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
		aria-label="Toggle menu"
	  >
		<span class="block w-6 h-0.5 bg-gray-800 transition-all duration-300 {menuOpen ? 'rotate-45 translate-y-2' : ''}"></span>
		<span class="block w-6 h-0.5 bg-gray-800 transition-all duration-300 {menuOpen ? 'opacity-0' : ''}"></span>
		<span class="block w-6 h-0.5 bg-gray-800 transition-all duration-300 {menuOpen ? '-rotate-45 -translate-y-2' : ''}"></span>
	  </button>
  
	</nav>
  
	<!-- Mobile Menu -->
	{#if menuOpen}
	  <div class="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-3 text-sm font-medium text-gray-700">
		{#if !$isAuthenticated}
		  <a href="https://www.hjusic.com" onclick={closeMenu} class="block py-2 hover:text-gray-900 transition-colors" target="_blank" rel="noopener noreferrer">About</a>
		  <a href="https://www.hjusic.com/blog" onclick={closeMenu} class="block py-2 hover:text-gray-900 transition-colors" target="_blank" rel="noopener noreferrer">Blog</a>
		  <div class="pt-2 border-t border-gray-100">
			<a href="/login" onclick={closeMenu} class="block w-full text-center bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors">
			  Sign In
			</a>
		  </div>
		{:else}
		  <p class="text-gray-500 text-xs pb-1">Signed in as <strong>{$user?.username}</strong></p>
		  <a href="/users" onclick={closeMenu} class="block py-2 hover:text-gray-900 transition-colors">Users</a>
		  <a href="/oidc" onclick={closeMenu} class="block py-2 hover:text-gray-900 transition-colors">OIDC</a>
		  <div class="pt-2 border-t border-gray-100">
			<button
			  onclick={handleLogout}
			  class="w-full text-center bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors"
			>
			  Logout
			</button>
		  </div>
		{/if}
	  </div>
	{/if}
  </header>
  
  <main>
	{@render children()}
  </main>
  
  <footer>
	<!-- your footer here -->
  </footer>