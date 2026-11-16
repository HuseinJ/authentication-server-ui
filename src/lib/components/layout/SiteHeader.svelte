<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { isAuthenticated, logout, user } from '#lib/auth';

  const sections = [
    { href: resolve('/users'), label: 'Users' },
    { href: resolve('/oidc'), label: 'Clients' },
    { href: resolve('/account'), label: 'Account' }
  ];

  function isCurrent(href: string) {
    return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
  }

  async function signOut() {
    await logout();
    await goto(resolve('/login'));
  }
</script>

<header class="wrap header">
  <a class="mark" href={resolve('/')}>hjusic.com <span>auth</span></a>

  {#if $isAuthenticated}
    <nav aria-label="Main">
      {#each sections as section (section.href)}
        <a href={section.href} aria-current={isCurrent(section.href) ? 'page' : undefined}>
          {section.label}
        </a>
      {/each}
    </nav>

    <div class="session">
      <span class="who">{$user?.username}</span>
      <button type="button" onclick={signOut}>Sign out</button>
    </div>
  {:else}
    <nav aria-label="Main">
      <a href="https://hjusic.com">Back to hjusic.com</a>
    </nav>
  {/if}
</header>

<style>
  .header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.75rem 2.5rem;
    padding-block: 1.5rem;
  }

  .mark {
    color: var(--color-pine);
    font-weight: 700;
    font-stretch: 112%;
    text-decoration: none;
  }

  .mark span {
    margin-left: 0.2rem;
    padding: 0.1rem 0.4rem;
    border-radius: 2px;
    background: var(--color-lichen);
    color: var(--color-ink);
    font-size: 0.8rem;
    font-weight: 650;
    font-stretch: 100%;
    vertical-align: 0.1em;
  }

  nav {
    display: flex;
    gap: 1.5rem;
    margin-right: auto;
  }

  nav a,
  .session button {
    padding-block: 0.25rem;
    border-bottom: 2px solid transparent;
    color: var(--color-moss);
    text-decoration: none;
    cursor: pointer;
    transition:
      color 0.15s,
      border-color 0.15s;
  }

  nav a:hover,
  nav a[aria-current='page'],
  .session button:hover {
    color: var(--color-ink);
    border-color: var(--color-lichen);
  }

  nav a[aria-current='page'] {
    font-weight: 620;
  }

  .session {
    display: flex;
    align-items: baseline;
    gap: 1.25rem;
    font-size: var(--text-sm);
  }

  .who {
    font-family: var(--font-code);
    color: var(--color-ink);
  }
</style>
