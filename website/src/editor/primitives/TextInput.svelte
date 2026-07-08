<script lang="ts">
  import Field from './Field.svelte';

  let {
    label = '',
    help = '',
    error = '',
    value = $bindable(''),
    placeholder = '',
    maxlength = undefined,
    mono = false,
  }: {
    label?: string;
    help?: string;
    error?: string;
    value?: string;
    placeholder?: string;
    maxlength?: number;
    mono?: boolean;
  } = $props();
</script>

<Field {label} {help} {error}>
  <input
    type="text"
    bind:value
    {placeholder}
    {maxlength}
    class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-blurple focus:outline-none focus:ring-1 focus:ring-blurple {mono
      ? 'font-mono'
      : ''}"
  />
</Field>
