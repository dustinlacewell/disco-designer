<script lang="ts">
  import TextInput from '../primitives/TextInput.svelte';
  import Field from '../primitives/Field.svelte';
  import PermissionOverwriteList from './PermissionOverwriteList.svelte';
  import { FIELDS } from '@disco/domain/descriptor';
  import type { ECategory } from '../model.js';

  let { category }: { category: ECategory } = $props();
</script>

<TextInput
  label={FIELDS.categoryName.label}
  help={FIELDS.categoryName.help}
  bind:value={category.name}
  maxlength={100}
  placeholder={FIELDS.categoryName.placeholder}
/>

<Field
  label="Permission overrides"
  help="Overrides here cascade to every channel in the category that doesn't set its own. Add channels from the outline on the left."
>
  <PermissionOverwriteList bind:value={category.permissions} />
</Field>
