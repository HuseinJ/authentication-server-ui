<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import { isAuthenticated, user } from '$lib/auth/auth.store';
  import { logout } from '$lib/auth';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Toaster from '$lib/components/Toaster.svelte';

  let { children } = $props();
  let menuOpen = $state(false);

  function toggleMenu() {
    menuOpen = !menuOpen;
  }
  function closeMenu() {
    menuOpen = false;
  }

  async function handleLogout() {
    await logout();
    closeMenu();
    goto('/login');
  }

  type NavLink = { href: string; label: string; external?: boolean };

  const navLinks: () => NavLink[] = $derived(() =>
    $isAuthenticated
      ? [
          { href: '/users', label: 'Users' },
          { href: '/oidc', label: 'OIDC Clients' }
        ]
      : [
          { href: 'https://www.hjusic.com', label: 'About', external: true },
          { href: 'https://www.hjusic.com/blog', label: 'Blog', external: true }
        ]
  );
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Toaster />

<div class="min-h-screen flex flex-col">
  <header class="sticky top-0 z-40 bg-white/75 backdrop-blur-md border-b border-gray-200/60">
    <nav class="container mx-auto px-6 h-16 flex items-center justify-between">
      <a
        href="/"
        class="text-xl font-bold gradient-text tracking-tight hover:scale-[1.03] transition-transform"
      >
        Auth
      </a>

      <!-- Desktop -->
      <ul class="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
        {#each navLinks() as link}
          <li>
            <a
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              class="hover:text-primary-600 transition-colors {$page.url.pathname === link.href
                ? 'text-primary-600'
                : ''}"
            >
              {link.label}
            </a>
          </li>
        {/each}
      </ul>

      <div class="hidden md:flex items-center gap-3">
        {#if $isAuthenticated}
          <span class="text-sm text-gray-600">
            Hi, <span class="font-semibold text-gray-900">{$user?.username}</span>
          </span>
          <button onclick={handleLogout} class="btn-primary text-sm py-2 px-4">Logout</button>
        {:else}
          <a href="/login" class="btn-primary text-sm py-2 px-4">Sign in</a>
        {/if}
      </div>

      <button
        onclick={toggleMenu}
        class="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg hover:bg-gray-100"
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
      >
        <span
          class="block w-5 h-0.5 bg-gray-800 transition-all duration-300 {menuOpen
            ? 'rotate-45 translate-y-2'
            : ''}"
        ></span>
        <span
          class="block w-5 h-0.5 bg-gray-800 transition-all duration-300 {menuOpen
            ? 'opacity-0'
            : ''}"
        ></span>
        <span
          class="block w-5 h-0.5 bg-gray-800 transition-all duration-300 {menuOpen
            ? '-rotate-45 -translate-y-2'
            : ''}"
        ></span>
      </button>
    </nav>

    {#if menuOpen}
      <div class="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
        <div class="container mx-auto px-6 py-4 space-y-2 text-sm font-medium">
          {#if $isAuthenticated}
            <p class="text-gray-500 text-xs pb-2">
              Signed in as <strong>{$user?.username}</strong>
            </p>
          {/if}
          {#each navLinks() as link}
            <a
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              onclick={closeMenu}
              class="block py-2 text-gray-700 hover:text-primary-600 transition-colors"
            >
              {link.label}
            </a>
          {/each}
          <div class="pt-2 border-t border-gray-100">
            {#if $isAuthenticated}
              <button onclick={handleLogout} class="btn-primary w-full text-sm">Logout</button>
            {:else}
              <a href="/login" onclick={closeMenu} class="btn-primary w-full text-sm"
                >Sign in</a
              >
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </header>

  <main class="flex-1">
    {@render children()}
  </main>

  <footer class="bg-primary-700 text-primary-100 mt-16">
    <div class="container mx-auto px-6 py-10">
      <div class="grid md:grid-cols-3 gap-8 mb-6">
        <div>
          <h3 class="text-xl font-bold text-white mb-2">Auth Server</h3>
          <p class="text-sm text-primary-200">
            Identity & access management for the Husein Jusic ecosystem.
          </p>
        </div>
        <div>
          <h4 class="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Links</h4>
          <ul class="space-y-1.5 text-sm">
            <li>
              <a
                href="https://www.hjusic.com"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-white transition-colors"
              >
                About
              </a>
            </li>
            <li>
              <a
                href="https://www.hjusic.com/blog"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-white transition-colors"
              >
                Blog
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 class="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Connect</h4>
          <ul class="space-y-1.5 text-sm">
            <li>
              <a
                href="https://github.com/HuseinJ"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-white transition-colors"
              >
                GitHub
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div class="border-t border-primary-600 pt-6 text-center text-sm text-primary-200">
        © {new Date().getFullYear()} Husein Jusic. All rights reserved.
      </div>
    </div>
  </footer>
</div>
