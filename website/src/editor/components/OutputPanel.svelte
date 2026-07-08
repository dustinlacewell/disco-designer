<script lang="ts">
  import Tabs from '../primitives/Tabs.svelte';
  import YamlView from './YamlView.svelte';
  import DiscordPreview from './DiscordPreview.svelte';
  import { store, type OutputTab } from '../store.svelte.js';

  const validation = $derived(store.validation);
  const tabs = $derived([
    { id: 'yaml', label: 'YAML' },
    { id: 'preview', label: 'Preview' },
    { id: 'validation', label: 'Validation', badge: validation.errors.length },
  ]);
</script>

<div class="flex h-full flex-col">
  <div class="px-3 pt-2">
    <Tabs {tabs} active={store.outputTab} onchange={(id) => (store.outputTab = id as OutputTab)} />
  </div>
  <div class="min-h-0 flex-1">
    {#if store.outputTab === 'yaml'}
      <YamlView />
    {:else if store.outputTab === 'preview'}
      <DiscordPreview />
    {:else}
      <div class="h-full overflow-y-auto p-4">
        {#if validation.errors.length === 0 && validation.warnings.length === 0}
          <div class="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-3 py-2 text-sm text-green-400">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Valid — this template will apply cleanly.
          </div>
        {/if}

        {#if validation.errors.length}
          <h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-red-400">
            {validation.errors.length} error{validation.errors.length === 1 ? '' : 's'}
          </h4>
          <ul class="mb-4 space-y-1">
            {#each validation.errors as err}
              <li class="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 font-mono text-xs text-red-300">{err}</li>
            {/each}
          </ul>
        {/if}

        {#if validation.warnings.length}
          <h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-400">
            {validation.warnings.length} warning{validation.warnings.length === 1 ? '' : 's'}
          </h4>
          <ul class="space-y-1">
            {#each validation.warnings as warn}
              <li class="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs text-amber-200/90">{warn}</li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}
  </div>
</div>
