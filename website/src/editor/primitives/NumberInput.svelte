<script lang="ts">
  import Field from './Field.svelte';

  let {
    label = '',
    help = '',
    error = '',
    value = $bindable<number | null>(null),
    min = undefined,
    max = undefined,
    step = 1,
    unit = '',
    placeholder = 'unset',
  }: {
    label?: string;
    help?: string;
    error?: string;
    value?: number | null;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    placeholder?: string;
  } = $props();

  function onInput(e: Event) {
    const raw = (e.currentTarget as HTMLInputElement).value;
    value = raw === '' ? null : Number(raw);
  }
</script>

<Field {label} {help} {error}>
  <div class="flex items-stretch overflow-hidden rounded-lg border border-border bg-surface focus-within:border-blurple focus-within:ring-1 focus-within:ring-blurple">
    <input
      type="number"
      value={value ?? ''}
      {min}
      {max}
      {step}
      {placeholder}
      oninput={onInput}
      class="w-full bg-transparent px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none"
    />
    {#if unit}
      <span class="flex items-center border-l border-border px-3 text-xs text-text-secondary">{unit}</span>
    {/if}
  </div>
</Field>
