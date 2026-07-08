<script lang="ts">
  import { PERMISSION_GROUPS, permissionsInGroup, type PermissionInfo } from '@disco/domain/permissions';

  let {
    allow = $bindable<string[]>([]),
    deny = $bindable<string[]>([]),
  }: { allow?: string[]; deny?: string[] } = $props();

  let query = $state('');
  let showAll = $state(false);

  const allowSet = $derived(new Set(allow));
  const denySet = $derived(new Set(deny));

  function stateOf(name: string): 'allow' | 'deny' | 'inherit' {
    if (allowSet.has(name)) return 'allow';
    if (denySet.has(name)) return 'deny';
    return 'inherit';
  }

  function set(name: string, next: 'allow' | 'deny' | 'inherit') {
    allow = allow.filter((n) => n !== name);
    deny = deny.filter((n) => n !== name);
    if (next === 'allow') allow = [...allow, name];
    else if (next === 'deny') deny = [...deny, name];
  }

  function matches(p: PermissionInfo): boolean {
    const configured = allowSet.has(p.name) || denySet.has(p.name);
    if (!showAll && !query.trim() && !configured) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return p.label.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
  }

  const groups = $derived(
    PERMISSION_GROUPS.map((g) => ({ name: g, perms: permissionsInGroup(g).filter(matches) })).filter(
      (g) => g.perms.length > 0,
    ),
  );

  const configuredCount = $derived(allow.length + deny.length);
</script>

<div class="rounded-lg border border-border bg-surface/40">
  <div class="flex items-center gap-2 border-b border-border px-2 py-1.5">
    <input
      bind:value={query}
      placeholder="Filter permissions…"
      class="flex-1 rounded border border-border bg-surface px-2 py-1 text-xs text-text-primary placeholder:text-text-secondary/40 focus:border-blurple focus:outline-none"
    />
    <button
      type="button"
      onclick={() => (showAll = !showAll)}
      class="whitespace-nowrap rounded px-2 py-1 text-xs text-text-secondary hover:bg-surface-overlay hover:text-text-primary"
    >
      {showAll ? 'Show set only' : 'Show all'}
    </button>
    <span class="whitespace-nowrap text-xs text-text-secondary/70">{allow.length}✓ {deny.length}✗</span>
  </div>

  <div class="max-h-72 overflow-y-auto p-1.5">
    {#if groups.length === 0}
      <p class="px-2 py-3 text-center text-xs text-text-secondary">
        {configuredCount === 0 ? 'No overrides set. Click “Show all” to configure.' : 'No matches.'}
      </p>
    {/if}
    {#each groups as group (group.name)}
      <div class="mb-2 last:mb-0">
        <div class="px-1 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-text-secondary/70">
          {group.name}
        </div>
        {#each group.perms as perm (perm.name)}
          {@const st = stateOf(perm.name)}
          <div class="flex items-center gap-2 rounded px-1 py-1 hover:bg-surface-overlay/40">
            <span class="min-w-0 flex-1 truncate text-xs text-text-primary" title={perm.description}>
              {perm.label}
            </span>
            <div class="flex flex-shrink-0 overflow-hidden rounded border border-border">
              <button
                type="button"
                onclick={() => set(perm.name, 'deny')}
                title="Deny"
                class="px-2 py-0.5 text-xs {st === 'deny'
                  ? 'bg-red-500/80 text-white'
                  : 'text-text-secondary hover:bg-surface-overlay'}">✗</button>
              <button
                type="button"
                onclick={() => set(perm.name, 'inherit')}
                title="Inherit"
                class="border-x border-border px-2 py-0.5 text-xs {st === 'inherit'
                  ? 'bg-surface-overlay text-text-primary'
                  : 'text-text-secondary hover:bg-surface-overlay'}">–</button>
              <button
                type="button"
                onclick={() => set(perm.name, 'allow')}
                title="Allow"
                class="px-2 py-0.5 text-xs {st === 'allow'
                  ? 'bg-green-500/80 text-white'
                  : 'text-text-secondary hover:bg-surface-overlay'}">✓</button>
            </div>
          </div>
        {/each}
      </div>
    {/each}
  </div>
</div>
