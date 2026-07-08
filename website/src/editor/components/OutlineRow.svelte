<script lang="ts">
  import IconButton from '../primitives/IconButton.svelte';

  let {
    label,
    icon = '',
    color = '',
    selected = false,
    indent = false,
    locked = false,
    canUp = true,
    canDown = true,
    onselect,
    onUp = undefined,
    onDown = undefined,
    onDup = undefined,
    onDelete = undefined,
  }: {
    label: string;
    icon?: string;
    color?: string;
    selected?: boolean;
    indent?: boolean;
    locked?: boolean;
    canUp?: boolean;
    canDown?: boolean;
    onselect: () => void;
    onUp?: () => void;
    onDown?: () => void;
    onDup?: () => void;
    onDelete?: () => void;
  } = $props();

  const showColor = $derived(color && color.toLowerCase() !== '#000000');
</script>

<div
  class="group flex items-center gap-2 rounded-lg py-1.5 pr-1 transition-colors {indent ? 'pl-6' : 'pl-2'} {selected
    ? 'bg-blurple/15 ring-1 ring-blurple/40'
    : 'hover:bg-surface-overlay/50'}"
>
  <button type="button" onclick={onselect} class="flex min-w-0 flex-1 items-center gap-2 text-left">
    {#if showColor}
      <span class="h-3 w-3 flex-shrink-0 rounded-full" style={`background:${color}`}></span>
    {:else if icon}
      <span class="w-4 flex-shrink-0 text-center text-xs text-text-secondary/70">{icon}</span>
    {/if}
    <span class="truncate text-sm {selected ? 'text-text-primary' : 'text-text-secondary'}">{label || '—'}</span>
    {#if locked}
      <svg class="h-3 w-3 flex-shrink-0 text-text-secondary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    {/if}
  </button>

  <div class="flex flex-shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
    {#if onUp}
      <IconButton title="Move up" disabled={!canUp} onclick={onUp}>
        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
        </svg>
      </IconButton>
    {/if}
    {#if onDown}
      <IconButton title="Move down" disabled={!canDown} onclick={onDown}>
        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </IconButton>
    {/if}
    {#if onDup}
      <IconButton title="Duplicate" onclick={onDup}>
        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      </IconButton>
    {/if}
    {#if onDelete}
      <IconButton title="Delete" danger onclick={onDelete}>
        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </IconButton>
    {/if}
  </div>
</div>
