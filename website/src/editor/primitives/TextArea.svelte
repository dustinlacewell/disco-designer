<script lang="ts">
  import Field from './Field.svelte';

  let {
    label = '',
    help = '',
    error = '',
    value = $bindable(''),
    placeholder = '',
    maxlength = undefined,
    rows = 3,
  }: {
    label?: string;
    help?: string;
    error?: string;
    value?: string;
    placeholder?: string;
    maxlength?: number;
    rows?: number;
  } = $props();
</script>

<Field {label} {help} {error}>
  <textarea
    bind:value
    {placeholder}
    {maxlength}
    {rows}
    class="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-blurple focus:outline-none focus:ring-1 focus:ring-blurple"
  ></textarea>
</Field>
