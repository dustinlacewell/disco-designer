<script lang="ts">
  import Toolbar from './components/Toolbar.svelte';
  import OutlineTree from './components/OutlineTree.svelte';
  import Inspector from './components/Inspector.svelte';
  import OutputPanel from './components/OutputPanel.svelte';
  import Resizer from './primitives/Resizer.svelte';
  import { store } from './store.svelte.js';
  import { EXAMPLES } from './examples.js';

  type View = 'outline' | 'edit' | 'output';
  let view = $state<View>('edit');

  const mobileTabs: { id: View; label: string }[] = [
    { id: 'outline', label: 'Outline' },
    { id: 'edit', label: 'Edit' },
    { id: 'output', label: 'YAML' },
  ];

  const LEFT_MIN = 220;
  const LEFT_MAX = 560;
  const RIGHT_MIN = 300;
  const RIGHT_MAX = 720;

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  let leftWidth = $state(300);
  let rightWidth = $state(440);

  // Restore layout (widths + active mobile pane) once on mount. Runs untracked so it doesn't
  // re-fire on every width change (client-only island, so localStorage is safe).
  $effect(() => {
    const l = Number(localStorage.getItem('disco.leftWidth'));
    const r = Number(localStorage.getItem('disco.rightWidth'));
    const v = localStorage.getItem('disco.view');
    if (l) leftWidth = clamp(l, LEFT_MIN, LEFT_MAX);
    if (r) rightWidth = clamp(r, RIGHT_MIN, RIGHT_MAX);
    if (v === 'outline' || v === 'edit' || v === 'output') view = v;
  });

  // Persist layout.
  $effect(() => {
    localStorage.setItem('disco.leftWidth', String(leftWidth));
    localStorage.setItem('disco.rightWidth', String(rightWidth));
    localStorage.setItem('disco.view', view);
  });

  // Persist the full editor state (document, selection, output tab) on any change.
  $effect(() => {
    store.save();
  });

  // Load a template linked from the homepage (?template=<file>), then drop the param so a
  // later refresh doesn't clobber the user's in-progress edits.
  $effect(() => {
    const url = new URL(window.location.href);
    const templateFile = url.searchParams.get('template');
    if (!templateFile) return;
    const example = EXAMPLES.find((e) => e.file === templateFile);
    if (example) store.importYaml(example.yaml);
    url.searchParams.delete('template');
    history.replaceState(null, '', url);
  });
</script>

<div class="flex h-full flex-col bg-surface">
  <Toolbar />

  <!-- Mobile pane switcher -->
  <div class="flex border-b border-border md:hidden">
    {#each mobileTabs as tab (tab.id)}
      <button
        type="button"
        onclick={() => (view = tab.id)}
        class="flex-1 border-b-2 py-2 text-sm font-medium transition-colors {view === tab.id
          ? 'border-blurple text-text-primary'
          : 'border-transparent text-text-secondary'}"
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <div class="flex min-h-0 flex-1">
    <aside
      style={`--w:${leftWidth}px`}
      class="{view === 'outline' ? 'block' : 'hidden'} h-full w-full border-r border-border md:block md:w-[var(--w)] md:flex-shrink-0"
    >
      <OutlineTree />
    </aside>

    <Resizer onDrag={(dx) => (leftWidth = clamp(leftWidth + dx, LEFT_MIN, LEFT_MAX))} />

    <main class="{view === 'edit' ? 'block' : 'hidden'} h-full w-full min-w-0 md:block md:flex-1">
      <Inspector />
    </main>

    <Resizer onDrag={(dx) => (rightWidth = clamp(rightWidth - dx, RIGHT_MIN, RIGHT_MAX))} />

    <aside
      style={`--w:${rightWidth}px`}
      class="{view === 'output' ? 'block' : 'hidden'} h-full w-full border-l border-border md:block md:w-[var(--w)] md:flex-shrink-0"
    >
      <OutputPanel />
    </aside>
  </div>
</div>
