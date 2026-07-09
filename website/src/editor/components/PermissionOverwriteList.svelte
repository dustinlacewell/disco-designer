<script lang="ts">
  import ListEditor from '../primitives/ListEditor.svelte';
  import Select from '../primitives/Select.svelte';
  import PermissionTriState from './PermissionTriState.svelte';
  import { store } from '../store.svelte.js';
  import { newOverwrite, cloneWithNewIds, type EOverwrite } from '../model.js';

  let { value = $bindable<EOverwrite[]>([]) }: { value?: EOverwrite[] } = $props();

  const roleOptions = $derived(store.roleNames.map((n) => ({ value: n, label: n })));
</script>

<ListEditor
  bind:items={value}
  create={() => newOverwrite(store.roleNames[0] ?? '@everyone')}
  clone={(o) => cloneWithNewIds(o)}
  addLabel="Add permission override"
  emptyLabel="No permission overrides. Members follow their role's server-wide permissions here."
  reorderable={false}
>
  {#snippet item(o: EOverwrite)}
    {@const options = !o.role || store.roleNames.includes(o.role)
      ? roleOptions
      : [...roleOptions, { value: o.role, label: `${o.role} (undefined)` }]}
    <div class="flex flex-col gap-2">
      <Select label="Role" bind:value={o.role} options={options} help="Who this override applies to." />
      <PermissionTriState bind:allow={o.allow} bind:deny={o.deny} />
    </div>
  {/snippet}
</ListEditor>
