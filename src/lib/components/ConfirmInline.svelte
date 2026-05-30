<script lang="ts">
  let {
    message,
    confirmLabel = 'Confirm',
    isLoading = false,
    onconfirm,
    oncancel
  }: {
    message: string;
    confirmLabel?: string;
    isLoading?: boolean;
    onconfirm: () => void;
    oncancel: () => void;
  } = $props();
</script>

<div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
  <p class="text-red-800 font-medium mb-3">{message}</p>
  <div class="flex gap-2 flex-wrap">
    <button onclick={onconfirm} disabled={isLoading} class="btn-danger text-sm py-2 px-4">
      {isLoading ? 'Processing…' : confirmLabel}
    </button>
    <button onclick={oncancel} class="btn-secondary text-sm py-2 px-4">Cancel</button>
  </div>
</div>
