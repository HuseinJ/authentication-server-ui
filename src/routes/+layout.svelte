<script lang="ts">
  import '../app.css';
  import favicon from '#lib/assets/favicon.svg';
  import SiteHeader from '#lib/components/layout/SiteHeader.svelte';
  import SiteFooter from '#lib/components/layout/SiteFooter.svelte';
  import Toaster from '#lib/components/ui/Toaster.svelte';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <meta name="theme-color" content="#12402f" />
  <title>Sign-in admin · hjusic.com</title>
</svelte:head>

<a class="skip" href="#content">Skip to content</a>
<SiteHeader />
<main id="content">
  {@render children()}
</main>
<SiteFooter />
<Toaster />

<style>
  .skip {
    position: absolute;
    left: 1rem;
    top: -4rem;
    z-index: 200;
    padding: 0.6rem 1rem;
    border-radius: 3px;
    background: var(--color-pine);
    color: var(--color-paper);
    font-weight: 650;
  }

  .skip:focus {
    top: 1rem;
  }

  main {
    padding-bottom: clamp(4rem, 9vw, 7rem);
  }
</style>
