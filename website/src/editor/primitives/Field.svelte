<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    label = '',
    help = '',
    error = '',
    children,
  }: { label?: string; help?: string; error?: string; children: Snippet } = $props();
</script>

<div class="mb-4">
  {#if label}
    <label class="mb-1 block text-sm font-medium text-text-primary">{label}</label>
  {/if}
  {@render children()}
  {#if help}
    <p class="mt-1 text-xs leading-relaxed text-text-secondary/80">{help}</p>
  {/if}
  {#if error}
    <p class="mt-1 text-xs text-red-400">{error}</p>
  {/if}
</div>
