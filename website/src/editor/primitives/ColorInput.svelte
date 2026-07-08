<script lang="ts">
  import Field from './Field.svelte';
  import { HEX_COLOR_PATTERN } from '@disco/domain/descriptor';

  let {
    label = '',
    help = '',
    value = $bindable('#000000'),
  }: { label?: string; help?: string; value?: string } = $props();

  const isNone = $derived(value.toLowerCase() === '#000000');
  const valid = $derived(HEX_COLOR_PATTERN.test(value));

  function onHex(e: Event) {
    let v = (e.currentTarget as HTMLInputElement).value.trim();
    if (v && !v.startsWith('#')) v = `#${v}`;
    value = v;
  }
</script>

<Field {label} {help}>
  <div class="flex items-center gap-2">
    <input
      type="color"
      value={valid ? value : '#000000'}
      oninput={(e) => (value = (e.currentTarget as HTMLInputElement).value)}
      class="h-9 w-10 cursor-pointer rounded-lg border border-border bg-surface p-1"
      aria-label="Color picker"
    />
    <input
      type="text"
      value={value}
      oninput={onHex}
      spellcheck="false"
      maxlength="7"
      class="w-28 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm uppercase text-text-primary focus:border-blurple focus:outline-none focus:ring-1 focus:ring-blurple {valid
        ? ''
        : 'border-red-500/60'}"
    />
    <button
      type="button"
      onclick={() => (value = '#000000')}
      class="rounded-lg border border-border px-3 py-2 text-xs text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
      title="Set to no color (Discord default)"
    >
      No color
    </button>
    {#if isNone}
      <span class="text-xs text-text-secondary/70">= inherits next colored role</span>
    {/if}
  </div>
</Field>
