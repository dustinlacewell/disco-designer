<script lang="ts">
  import OutlineRow from './OutlineRow.svelte';
  import { store } from '../store.svelte.js';
  import { CHANNEL_TYPE_BY_VALUE, EVERYONE } from '@disco/domain/descriptor';

  const doc = $derived(store.doc);
</script>

{#snippet sectionHeader(title: string, count: number)}
  <div class="flex items-center justify-between px-2 pb-1 pt-3">
    <span class="text-xs font-semibold uppercase tracking-wider text-text-secondary/70">{title}</span>
    <span class="text-xs text-text-secondary/50">{count}</span>
  </div>
{/snippet}

{#snippet addButton(label: string, onclick: () => void)}
  <button
    type="button"
    {onclick}
    class="mt-1 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-overlay/50 hover:text-text-primary"
  >
    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>
    {label}
  </button>
{/snippet}

<div class="flex h-full flex-col overflow-y-auto p-2">
  <!-- Server root -->
  <button
    type="button"
    onclick={() => store.select({ kind: 'server' })}
    class="mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors {store.isSelected(
      'server',
    )
      ? 'bg-blurple/15 ring-1 ring-blurple/40'
      : 'hover:bg-surface-overlay/50'}"
  >
    <svg class="h-4 w-4 text-blurple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
    <span class="text-sm font-medium text-text-primary">Server template</span>
  </button>

  <!-- Roles -->
  {@render sectionHeader('Roles', doc.roles.length)}
  {#if doc.roles.length}
    <p class="px-2 pb-1 text-[0.65rem] leading-snug text-text-secondary/50">Top = highest in the hierarchy.</p>
  {/if}
  {#each doc.roles as role, i (role._id)}
    {@const isEveryone = role.name === EVERYONE}
    <OutlineRow
      label={role.name}
      color={role.color}
      icon="@"
      locked={isEveryone}
      selected={store.isSelected('role', role._id)}
      canUp={i > 0}
      canDown={i < doc.roles.length - 1}
      onselect={() => store.select({ kind: 'role', id: role._id })}
      onUp={isEveryone ? undefined : () => store.moveRole(role._id, -1)}
      onDown={isEveryone ? undefined : () => store.moveRole(role._id, 1)}
      onDup={isEveryone ? undefined : () => store.duplicateRole(role._id)}
      onDelete={isEveryone ? undefined : () => store.removeRole(role._id)}
    />
  {/each}
  <div class="flex gap-1">
    {@render addButton('Add role', () => store.addRole())}
    {#if !store.hasEveryone}
      {@render addButton('Add @everyone', () => store.addEveryone())}
    {/if}
  </div>

  <!-- Categories & channels -->
  {@render sectionHeader('Categories', doc.categories.length)}
  {#each doc.categories as cat, ci (cat._id)}
    <OutlineRow
      label={cat.name}
      icon="▸"
      selected={store.isSelected('category', cat._id)}
      canUp={ci > 0}
      canDown={ci < doc.categories.length - 1}
      onselect={() => store.select({ kind: 'category', id: cat._id })}
      onUp={() => store.moveCategory(cat._id, -1)}
      onDown={() => store.moveCategory(cat._id, 1)}
      onDup={() => store.duplicateCategory(cat._id)}
      onDelete={() => store.removeCategory(cat._id)}
    />
    {#each cat.channels as ch, chi (ch._id)}
      <OutlineRow
        label={ch.name}
        icon={CHANNEL_TYPE_BY_VALUE[ch.type].icon}
        indent
        selected={store.isSelected('channel', ch._id)}
        canUp={chi > 0}
        canDown={chi < cat.channels.length - 1}
        onselect={() => store.select({ kind: 'channel', id: ch._id })}
        onUp={() => store.moveChannel(ch._id, -1)}
        onDown={() => store.moveChannel(ch._id, 1)}
        onDup={() => store.duplicateChannel(ch._id)}
        onDelete={() => store.removeChannel(ch._id)}
      />
    {/each}
    <div class="pl-5">
      {@render addButton('Add channel', () => store.addChannel({ kind: 'category', id: cat._id }))}
    </div>
  {/each}
  {@render addButton('Add category', () => store.addCategory())}

  <!-- Uncategorized -->
  {@render sectionHeader('Uncategorized channels', doc.uncategorized.length)}
  {#each doc.uncategorized as ch, i (ch._id)}
    <OutlineRow
      label={ch.name}
      icon={CHANNEL_TYPE_BY_VALUE[ch.type].icon}
      selected={store.isSelected('channel', ch._id)}
      canUp={i > 0}
      canDown={i < doc.uncategorized.length - 1}
      onselect={() => store.select({ kind: 'channel', id: ch._id })}
      onUp={() => store.moveChannel(ch._id, -1)}
      onDown={() => store.moveChannel(ch._id, 1)}
      onDup={() => store.duplicateChannel(ch._id)}
      onDelete={() => store.removeChannel(ch._id)}
    />
  {/each}
  {@render addButton('Add channel', () => store.addChannel({ kind: 'uncategorized' }))}

  <!-- Emoji -->
  {@render sectionHeader('Emoji', doc.emoji.length)}
  {#each doc.emoji as e, i (e._id)}
    <OutlineRow
      label={e.name}
      icon="😀"
      selected={store.isSelected('emoji', e._id)}
      canUp={i > 0}
      canDown={i < doc.emoji.length - 1}
      onselect={() => store.select({ kind: 'emoji', id: e._id })}
      onUp={() => store.moveEmoji(e._id, -1)}
      onDown={() => store.moveEmoji(e._id, 1)}
      onDup={() => store.duplicateEmoji(e._id)}
      onDelete={() => store.removeEmoji(e._id)}
    />
  {/each}
  {@render addButton('Add emoji', () => store.addEmoji())}
</div>
