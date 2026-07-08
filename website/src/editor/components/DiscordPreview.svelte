<script lang="ts">
  import { store } from '../store.svelte.js';
  import { CHANNEL_TYPE_BY_VALUE, EVERYONE } from '@disco/domain/descriptor';

  const doc = $derived(store.doc);
  const coloredRoles = $derived(doc.roles.filter((r) => r.name !== EVERYONE));
</script>

<div class="h-full overflow-y-auto p-4">
  <div class="rounded-2xl border border-border bg-[#2b2d31] p-4">
    <div class="mb-3 flex items-center gap-2 border-b border-[#1e1f22] pb-3">
      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blurple text-xs font-bold text-white">S</div>
      <span class="text-sm font-semibold text-white">Your Server</span>
    </div>

    {#if coloredRoles.length}
      <div class="mb-3 flex flex-wrap gap-1.5 px-2">
        {#each coloredRoles as role (role._id)}
          {@const c = role.color && role.color.toLowerCase() !== '#000000' ? role.color : '#99aab5'}
          <span class="rounded-full border px-2 py-0.5 text-xs" style={`color:${c}; border-color:${c}66`}>{role.name}</span>
        {/each}
      </div>
    {/if}

    {#each doc.categories as cat (cat._id)}
      <div class="discord-category">{cat.name}</div>
      {#each cat.channels as ch (ch._id)}
        <div class="discord-channel">
          <span class="discord-channel-icon">{CHANNEL_TYPE_BY_VALUE[ch.type].icon}</span>
          <span>{ch.name}</span>
          {#if ch.type === 'forum' && ch.available_tags.length}
            <span class="ml-auto flex gap-1">
              {#each ch.available_tags.slice(0, 3) as tag (tag._id)}
                <span class="rounded bg-[#5865f2]/20 px-1.5 py-0.5 text-[0.6rem] text-blurple-light">{tag.name}</span>
              {/each}
            </span>
          {/if}
        </div>
      {/each}
    {/each}

    {#if doc.uncategorized.length}
      {#each doc.uncategorized as ch (ch._id)}
        <div class="discord-channel">
          <span class="discord-channel-icon">{CHANNEL_TYPE_BY_VALUE[ch.type].icon}</span>
          <span>{ch.name}</span>
        </div>
      {/each}
    {/if}

    {#if doc.emoji.length}
      <div class="discord-category">Emoji</div>
      <div class="flex flex-wrap gap-1.5 px-2 py-1">
        {#each doc.emoji as e (e._id)}
          <span class="rounded bg-[#1e1f22] px-2 py-0.5 font-mono text-xs text-text-secondary">:{e.name}:</span>
        {/each}
      </div>
    {/if}

    {#if !doc.categories.length && !doc.uncategorized.length && !coloredRoles.length && !doc.emoji.length}
      <p class="px-2 py-6 text-center text-xs text-text-secondary">Add roles and channels to see them here.</p>
    {/if}
  </div>
</div>
