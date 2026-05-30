<script lang="ts">
  type Color = 'blue' | 'purple' | 'green' | 'yellow' | 'red' | 'gray';
  let { text, color = 'blue' }: { text: string; color?: Color } = $props();

  const styles: Record<Color, string> = {
    blue: 'bg-primary-50 text-primary-700 ring-primary-200',
    purple: 'bg-purple-50 text-purple-700 ring-purple-200',
    green: 'bg-green-50 text-green-700 ring-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    gray: 'bg-gray-100 text-gray-700 ring-gray-200'
  };
</script>

<span
  class="inline-flex items-center px-2.5 py-0.5 text-xs rounded-full font-medium ring-1 ring-inset {styles[color]}"
>
  {text}
</span>
