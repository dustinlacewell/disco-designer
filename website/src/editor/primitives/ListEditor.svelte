<script lang="ts" generics="T extends { _id: string }">
  import { flip } from 'svelte/animate';
  import type { Snippet } from 'svelte';
  import IconButton from './IconButton.svelte';

  let {
    items = $bindable([] as T[]),
    item,
    create,
    clone,
    addLabel = 'Add',
    emptyLabel = 'Nothing here yet.',
    reorderable = true,
  }: {
    items?: T[];
    item: Snippet<[T, number]>;
    create: () => T;
    clone?: (value: T) => T;
    addLabel?: string;
    emptyLabel?: string;
    reorderable?: boolean;
  } = $props();

  let dragIndex = $state<number | null>(null);
  let overIndex = $state<number | null>(null);
  let dragEnabled = $state(false);

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
  }

  function reorder() {
    if (dragIndex === null || overIndex === null || dragIndex === overIndex) return;
    const [moved] = items.splice(dragIndex, 1);
    items.splice(overIndex, 0, moved);
  }

  function duplicate(i: number) {
    if (!clone) return;
    items.splice(i + 1, 0, clone(items[i]));
  }
</script>

<div class="flex flex-col gap-2">
  {#if items.length === 0}
    <p class="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-text-secondary">
      {emptyLabel}
    </p>
  {/if}

  <ul class="flex flex-col gap-2">
    {#each items as entry, i (entry._id)}
      <li
        animate:flip={{ duration: 180 }}
        draggable={dragEnabled}
        ondragstart={() => (dragIndex = i)}
        ondragover={(e) => {
          e.preventDefault();
          overIndex = i;
        }}
        ondrop={reorder}
        ondragend={() => {
          dragIndex = null;
          overIndex = null;
          dragEnabled = false;
        }}
        class="rounded-xl border bg-surface-raised/60 transition-colors {overIndex === i && dragIndex !== null
          ? 'border-blurple'
          : 'border-border'}"
      >
        <div class="flex items-start gap-2 p-3">
          {#if reorderable}
            <button
              type="button"
              onpointerdown={() => (dragEnabled = true)}
              onpointerup={() => (dragEnabled = false)}
              title="Drag to reorder"
              aria-label="Drag to reorder"
              class="mt-1 cursor-grab text-text-secondary/50 hover:text-text-secondary active:cursor-grabbing"
            >
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 4a1 1 0 100 2 1 1 0 000-2zM9 11a1 1 0 100 2 1 1 0 000-2zM9 18a1 1 0 100 2 1 1 0 000-2zM15 4a1 1 0 100 2 1 1 0 000-2zM15 11a1 1 0 100 2 1 1 0 000-2zM15 18a1 1 0 100 2 1 1 0 000-2z" />
              </svg>
            </button>
          {/if}

          <div class="min-w-0 flex-1">
            {@render item(entry, i)}
          </div>

          <div class="flex flex-shrink-0 items-center">
            {#if reorderable}
              <IconButton title="Move up" disabled={i === 0} onclick={() => move(i, -1)}>
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </IconButton>
              <IconButton title="Move down" disabled={i === items.length - 1} onclick={() => move(i, 1)}>
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </IconButton>
            {/if}
            {#if clone}
              <IconButton title="Duplicate" onclick={() => duplicate(i)}>
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              </IconButton>
            {/if}
            <IconButton title="Remove" danger onclick={() => items.splice(i, 1)}>
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </IconButton>
          </div>
        </div>
      </li>
    {/each}
  </ul>

  <button
    type="button"
    onclick={() => items.push(create())}
    class="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-sm text-text-secondary transition-colors hover:border-blurple/50 hover:text-text-primary"
  >
    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>
    {addLabel}
  </button>
</div>
