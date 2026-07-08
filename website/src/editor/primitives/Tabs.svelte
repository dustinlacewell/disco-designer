<script lang="ts">
  interface Tab {
    id: string;
    label: string;
    badge?: number;
  }

  let {
    tabs = [],
    active = $bindable(''),
    onchange = undefined,
  }: { tabs?: Tab[]; active?: string; onchange?: (id: string) => void } = $props();

  function pick(id: string) {
    active = id;
    onchange?.(id);
  }
</script>

<div class="flex gap-1 border-b border-border">
  {#each tabs as tab (tab.id)}
    <button
      type="button"
      onclick={() => pick(tab.id)}
      class="relative flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors {active ===
      tab.id
        ? 'border-blurple text-text-primary'
        : 'border-transparent text-text-secondary hover:text-text-primary'}"
    >
      {tab.label}
      {#if tab.badge}
        <span class="rounded-full bg-red-500/20 px-1.5 text-xs text-red-400">{tab.badge}</span>
      {/if}
    </button>
  {/each}
</div>
