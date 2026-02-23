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
  
  <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded">
    <p class="text-red-800 font-semibold mb-3">{message}</p>
    <div class="flex gap-3">
      <button
        onclick={onconfirm}
        disabled={isLoading}
        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : confirmLabel}
      </button>
      <button
        onclick={oncancel}
        class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-semibold"
      >
        Cancel
      </button>
    </div>
  </div>