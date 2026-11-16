<script lang="ts">
  let {
    text,
    tone = 'outline',
    mono = false
  }: {
    text: string;
    tone?: 'lichen' | 'outline' | 'pine';
    mono?: boolean;
  } = $props();
</script>

<span class="tag {tone}" class:mono>{text}</span>

<style>
  .tag {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    border: 1px solid transparent;
    border-radius: 2px;
    font-size: 0.8rem;
    font-weight: 600;
    line-height: 1.4;
    white-space: nowrap;
  }

  .lichen {
    background: var(--color-lichen);
  }

  .outline {
    border-color: var(--color-rule);
    color: var(--color-moss);
  }

  .pine {
    background: var(--color-pine);
    color: var(--color-paper);
  }

  .mono {
    font-family: var(--font-code);
    font-size: 0.75rem;
    font-weight: 450;
  }
</style>
