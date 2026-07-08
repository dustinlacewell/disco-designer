<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    onclick,
    disabled = false,
    danger = false,
    children,
  }: {
    title: string;
    onclick: (e: MouseEvent) => void;
    disabled?: boolean;
    danger?: boolean;
    children: Snippet;
  } = $props();
</script>

<button
  type="button"
  {title}
  aria-label={title}
  {disabled}
  onclick={(e) => {
    e.stopPropagation();
    onclick(e);
  }}
  class="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-overlay disabled:cursor-not-allowed disabled:opacity-30 {danger
    ? 'hover:text-red-400'
    : 'hover:text-text-primary'}"
>
  {@render children()}
</button>
