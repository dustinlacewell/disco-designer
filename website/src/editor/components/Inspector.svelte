<script lang="ts">
  import RoleForm from './RoleForm.svelte';
  import CategoryForm from './CategoryForm.svelte';
  import ChannelForm from './ChannelForm.svelte';
  import EmojiForm from './EmojiForm.svelte';
  import { store } from '../store.svelte.js';

  const sel = $derived(store.selection);
  const doc = $derived(store.doc);

  const totalChannels = $derived(doc.uncategorized.length + doc.categories.reduce((n, c) => n + c.channels.length, 0));

  const role = $derived(sel.kind === 'role' ? store.role(sel.id) : undefined);
  const category = $derived(sel.kind === 'category' ? store.category(sel.id) : undefined);
  const channel = $derived(sel.kind === 'channel' ? store.channel(sel.id) : undefined);
  const emoji = $derived(sel.kind === 'emoji' ? store.emojiNode(sel.id) : undefined);
</script>

<div class="h-full overflow-y-auto p-5">
  {#if sel.kind === 'server'}
    <div>
      <h2 class="text-lg font-semibold text-text-primary">Server template</h2>
      <p class="mt-1 text-sm text-text-secondary">
        Everything the Disco Designer sync engine supports, editable here. Pick anything in the outline to edit it,
        or add something new.
      </p>
      <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-xl border border-border bg-surface-raised/60 p-3 text-center">
          <div class="text-2xl font-bold text-text-primary">{doc.roles.length}</div>
          <div class="text-xs text-text-secondary">Roles</div>
        </div>
        <div class="rounded-xl border border-border bg-surface-raised/60 p-3 text-center">
          <div class="text-2xl font-bold text-text-primary">{doc.categories.length}</div>
          <div class="text-xs text-text-secondary">Categories</div>
        </div>
        <div class="rounded-xl border border-border bg-surface-raised/60 p-3 text-center">
          <div class="text-2xl font-bold text-text-primary">{totalChannels}</div>
          <div class="text-xs text-text-secondary">Channels</div>
        </div>
        <div class="rounded-xl border border-border bg-surface-raised/60 p-3 text-center">
          <div class="text-2xl font-bold text-text-primary">{doc.emoji.length}</div>
          <div class="text-xs text-text-secondary">Emoji</div>
        </div>
      </div>
      <div class="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onclick={() => store.addRole()}
          class="rounded-lg bg-surface-raised px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
        >
          + Role
        </button>
        <button
          type="button"
          onclick={() => store.addCategory()}
          class="rounded-lg bg-surface-raised px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
        >
          + Category
        </button>
        <button
          type="button"
          onclick={() => store.addChannel({ kind: 'uncategorized' })}
          class="rounded-lg bg-surface-raised px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
        >
          + Channel
        </button>
        <button
          type="button"
          onclick={() => store.addEmoji()}
          class="rounded-lg bg-surface-raised px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
        >
          + Emoji
        </button>
      </div>
    </div>
  {:else if role}
    <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">Role</h2>
    <RoleForm {role} />
  {:else if category}
    <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">Category</h2>
    <CategoryForm {category} />
  {:else if channel}
    <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">Channel</h2>
    <ChannelForm {channel} />
  {:else if emoji}
    <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">Emoji</h2>
    <EmojiForm {emoji} />
  {:else}
    <p class="text-sm text-text-secondary">Nothing selected.</p>
  {/if}
</div>
