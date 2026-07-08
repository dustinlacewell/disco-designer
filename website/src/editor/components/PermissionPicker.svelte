<script lang="ts">
  import { PERMISSION_GROUPS, permissionsInGroup, type PermissionInfo } from '@disco/domain/permissions';

  let { value = $bindable<string[]>([]) }: { value?: string[] } = $props();

  let query = $state('');

  const selected = $derived(new Set(value));

  function matches(p: PermissionInfo): boolean {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      p.label.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }

  function toggle(name: string) {
    if (selected.has(name)) value = value.filter((n) => n !== name);
    else value = [...value, name];
  }

  function setGroup(names: string[], on: boolean) {
    const set = new Set(value);
    for (const n of names) {
      if (on) set.add(n);
      else set.delete(n);
    }
    value = [...set];
  }

  const groups = $derived(
    PERMISSION_GROUPS.map((g) => {
      const perms = permissionsInGroup(g).filter(matches);
      const all = permissionsInGroup(g);
      const on = all.filter((p) => selected.has(p.name)).length;
      return { name: g, perms, total: all.length, on, allNames: all.map((p) => p.name) };
    }).filter((g) => g.perms.length > 0),
  );
</script>

<div class="rounded-xl border border-border bg-surface/50">
  <div class="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
    <div class="relative flex-1">
      <svg
        class="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary/60"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
      </svg>
      <input
        bind:value={query}
        placeholder="Search permissions…"
        class="w-full rounded-lg border border-border bg-surface py-1.5 pl-8 pr-3 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-blurple focus:outline-none"
      />
    </div>
    <span class="whitespace-nowrap text-xs text-text-secondary">{value.length} selected</span>
  </div>

  <div class="max-h-[26rem] overflow-y-auto p-2">
    {#each groups as group (group.name)}
      <div class="mb-3 last:mb-0">
        <div class="mb-1 flex items-center justify-between px-1">
          <span class="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            {group.name}
            <span class="ml-1 font-normal text-text-secondary/60">{group.on}/{group.total}</span>
          </span>
          <div class="flex gap-1">
            <button
              type="button"
              onclick={() => setGroup(group.allNames, true)}
              class="rounded px-1.5 py-0.5 text-xs text-text-secondary hover:bg-surface-overlay hover:text-text-primary"
            >
              All
            </button>
            <button
              type="button"
              onclick={() => setGroup(group.allNames, false)}
              class="rounded px-1.5 py-0.5 text-xs text-text-secondary hover:bg-surface-overlay hover:text-text-primary"
            >
              None
            </button>
          </div>
        </div>

        {#each group.perms as perm (perm.name)}
          <button
            type="button"
            onclick={() => toggle(perm.name)}
            class="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface-overlay/60"
          >
            <span
              class="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border {selected.has(
                perm.name,
              )
                ? 'border-blurple bg-blurple text-white'
                : 'border-border'}"
            >
              {#if selected.has(perm.name)}
                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              {/if}
            </span>
            <span class="min-w-0">
              <span class="block text-sm text-text-primary">{perm.label}</span>
              <span class="block text-xs leading-snug text-text-secondary/80">{perm.description}</span>
            </span>
          </button>
        {/each}
      </div>
    {/each}

    {#if groups.length === 0}
      <p class="px-2 py-4 text-center text-xs text-text-secondary">No permissions match “{query}”.</p>
    {/if}
  </div>
</div>
