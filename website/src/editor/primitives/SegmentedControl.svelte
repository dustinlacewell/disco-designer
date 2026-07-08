<script lang="ts">
  import Field from './Field.svelte';

  interface Seg {
    value: string;
    label: string;
    icon?: string;
  }

  let {
    label = '',
    help = '',
    value = $bindable(''),
    options = [],
    onselect = undefined,
  }: {
    label?: string;
    help?: string;
    value?: string;
    options?: Seg[];
    onselect?: (value: string) => void;
  } = $props();

  function pick(v: string) {
    value = v;
    onselect?.(v);
  }
</script>

<Field {label} {help}>
  <div class="flex flex-wrap gap-1 rounded-lg border border-border bg-surface p-1">
    {#each options as opt (opt.value)}
      <button
        type="button"
        onclick={() => pick(opt.value)}
        class="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {value ===
        opt.value
          ? 'bg-blurple text-white'
          : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary'}"
      >
        {#if opt.icon}<span>{opt.icon}</span>{/if}
        {opt.label}
      </button>
    {/each}
  </div>
</Field>
