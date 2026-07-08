<script lang="ts">
  import ListEditor from '../primitives/ListEditor.svelte';
  import TextInput from '../primitives/TextInput.svelte';
  import Toggle from '../primitives/Toggle.svelte';
  import { FIELDS } from '@disco/domain/descriptor';
  import { newTag, cloneWithNewIds, type ETag } from '../model.js';

  let { value = $bindable<ETag[]>([]) }: { value?: ETag[] } = $props();
</script>

<ListEditor
  bind:items={value}
  create={() => newTag()}
  clone={(t) => cloneWithNewIds(t)}
  addLabel="Add tag"
  emptyLabel="No tags. Add tags members can apply to categorize posts."
>
  {#snippet item(t: ETag)}
    <div class="grid gap-2 sm:grid-cols-2">
      <TextInput label={FIELDS.tagName.label} help={FIELDS.tagName.help} bind:value={t.name} maxlength={20} />
      <TextInput
        label={FIELDS.tagEmoji.label}
        help={FIELDS.tagEmoji.help}
        placeholder={FIELDS.tagEmoji.placeholder}
        bind:value={t.emoji}
      />
      <div class="sm:col-span-2">
        <Toggle label={FIELDS.tagModerated.label} help={FIELDS.tagModerated.help} bind:checked={t.moderated} />
      </div>
    </div>
  {/snippet}
</ListEditor>
