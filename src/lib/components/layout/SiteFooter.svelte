<script lang="ts">
  const profiles = [
    { href: 'https://hjusic.com', label: 'hjusic.com' },
    { href: 'https://hjusic.com/blog', label: 'Writing' },
    { href: 'https://github.com/HuseinJ', label: 'GitHub' }
  ];
</script>

<footer class="footer">
  <div class="wrap inner">
    <ul>
      {#each profiles as profile (profile.href)}
        <li><a href={profile.href}>{profile.label}</a></li>
      {/each}
    </ul>
    <p>© {new Date().getFullYear()} Husein Jusic</p>
  </div>
</footer>

<style>
  .footer {
    margin-top: auto;
    background: var(--color-pine);
    color: var(--color-paper);
  }

  .inner {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 2rem;
    padding-block: clamp(3rem, 7vw, 5rem) 2rem;
  }

  ul {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem clamp(1.5rem, 4vw, 3rem);
  }

  a {
    font-weight: 600;
    text-decoration: none;
    border-bottom: 2px solid transparent;
    transition: border-color 0.15s;
  }

  a:hover {
    border-color: var(--color-lichen);
  }

  a:focus-visible {
    outline-color: var(--color-lichen);
  }

  p {
    font-size: var(--text-sm);
    color: color-mix(in srgb, var(--color-paper) 75%, transparent);
  }
</style>
