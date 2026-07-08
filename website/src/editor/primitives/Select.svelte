<script lang="ts">
  import Field from './Field.svelte';

  type Val = string | number | null;
  interface Opt {
    value: string | number;
    label: string;
    help?: string;
  }

  let {
    label = '',
    help = '',
    error = '',
    value = $bindable<Val>(''),
    options = [],
    allowEmpty = false,
    emptyLabel = '— none —',
    emptyValue = '' as Val,
  }: {
    label?: string;
    help?: string;
    error?: string;
    value?: Val;
    options?: Opt[];
    allowEmpty?: boolean;
    emptyLabel?: string;
    emptyValue?: Val;
  } = $props();

  const selectedHelp = $derived(options.find((o) => String(o.value) === String(value))?.help ?? '');

  function onChange(e: Event) {
    const raw = (e.currentTarget as HTMLSelectElement).value;
    if (raw === '') {
      value = emptyValue;
      return;
    }
    const opt = options.find((o) => String(o.value) === raw);
    value = opt ? opt.value : emptyValue;
  }
</script>

<Field {label} help={help || selectedHelp} {error}>
  <div class="relative">
    <select
      onchange={onChange}
      class="w-full appearance-none rounded-lg border border-border bg-surface px-3 py-2 pr-9 text-sm text-text-primary focus:border-blurple focus:outline-none focus:ring-1 focus:ring-blurple"
    >
      {#if allowEmpty}
        <option value="" selected={value === emptyValue || value === '' || value == null}>{emptyLabel}</option>
      {/if}
      {#each options as o (o.value)}
        <option value={String(o.value)} selected={String(o.value) === String(value)}>{o.label}</option>
      {/each}
    </select>
    <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </span>
  </div>
</Field>
