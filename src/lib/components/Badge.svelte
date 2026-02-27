<script lang="ts">
    type Color = 'blue' | 'purple' | 'green' | 'yellow' | 'red' | 'gray';
    let { text, color = 'blue' }: { text: string; color?: Color } = $props();
  
    const styles: Record<Color, string> = {
      blue:   'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      green:  'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red:    'bg-red-100 text-red-800',
      gray:   'bg-gray-100 text-gray-800'
    };
  </script>
  
  <span class="px-2 py-1 text-xs rounded font-semibold {styles[color]}">
    {text}
  </span>