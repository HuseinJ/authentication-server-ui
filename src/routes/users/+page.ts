// Client-side data loading happens in +page.svelte (onMount) because the
// auth token lives in localStorage; hooks.server.ts already redirects
// unauthenticated visitors via the accessToken cookie.
export const load = () => ({});
