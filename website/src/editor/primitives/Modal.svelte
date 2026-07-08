<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    open = $bindable(false),
    title = '',
    children,
    footer,
  }: { open?: boolean; title?: string; children: Snippet; footer?: Snippet } = $props();

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') open = false;
  }
</script>

<svelte:window onkeydown={onKey} />

{#if open}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <button
      type="button"
      aria-label="Close"
      onclick={() => (open = false)}
      class="absolute inset-0 bg-black/60 backdrop-blur-sm"
    ></button>
    <div
      class="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-2xl"
    >
      <div class="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 class="text-sm font-semibold text-text-primary">{title}</h3>
        <button
          type="button"
          onclick={() => (open = false)}
          class="text-text-secondary transition-colors hover:text-text-primary"
          aria-label="Close"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-5">
        {@render children()}
      </div>
      {#if footer}
        <div class="flex justify-end gap-2 border-t border-border px-5 py-3">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}
