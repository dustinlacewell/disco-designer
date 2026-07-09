<script lang="ts">
  import TextInput from '../primitives/TextInput.svelte';
  import ColorInput from '../primitives/ColorInput.svelte';
  import Toggle from '../primitives/Toggle.svelte';
  import Field from '../primitives/Field.svelte';
  import PermissionPicker from './PermissionPicker.svelte';
  import { FIELDS, EVERYONE } from '@disco/domain/descriptor';
  import { store } from '../store.svelte.js';
  import type { ERole } from '../model.js';

  let { role }: { role: ERole } = $props();

  const isEveryone = $derived(role.name === EVERYONE);
</script>

{#if isEveryone}
  <div class="mb-4 rounded-lg border border-blurple/30 bg-blurple/5 px-3 py-2 text-xs leading-relaxed text-text-secondary">
    <strong class="text-text-primary">@everyone</strong> is the server-wide default role. Only its
    <strong class="text-text-primary">permissions</strong> are applied on sync — color, hoist, and mention
    settings are ignored. It can't be reordered or deleted.
  </div>
{:else}
  <TextInput label={FIELDS.roleName.label} help={FIELDS.roleName.help} value={role.name} oninput={(v) => store.renameRole(role._id, v)} maxlength={100} placeholder={FIELDS.roleName.placeholder} />
  <ColorInput label={FIELDS.roleColor.label} help={FIELDS.roleColor.help} bind:value={role.color} />
  <Toggle label={FIELDS.roleHoist.label} help={FIELDS.roleHoist.help} bind:checked={role.hoist} />
  <Toggle label={FIELDS.roleMentionable.label} help={FIELDS.roleMentionable.help} bind:checked={role.mentionable} />
{/if}

<Field
  label="Permissions"
  help="Server-wide permissions granted to everyone with this role. Channel-level overrides can narrow these per channel."
>
  <PermissionPicker bind:value={role.permissions} />
</Field>
