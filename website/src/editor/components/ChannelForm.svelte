<script lang="ts">
  import TextInput from '../primitives/TextInput.svelte';
  import TextArea from '../primitives/TextArea.svelte';
  import NumberInput from '../primitives/NumberInput.svelte';
  import Toggle from '../primitives/Toggle.svelte';
  import Select from '../primitives/Select.svelte';
  import SegmentedControl from '../primitives/SegmentedControl.svelte';
  import Field from '../primitives/Field.svelte';
  import ForumTagList from './ForumTagList.svelte';
  import PermissionOverwriteList from './PermissionOverwriteList.svelte';
  import {
    FIELDS,
    CHANNEL_TYPES,
    CHANNEL_TYPE_BY_VALUE,
    fieldAppliesTo,
    SORT_ORDERS,
    FORUM_LAYOUTS,
    ARCHIVE_DURATIONS,
    type ChannelType,
  } from '@disco/domain/descriptor';
  import type { EChannel } from '../model.js';

  let { channel }: { channel: EChannel } = $props();

  const typeInfo = $derived(CHANNEL_TYPE_BY_VALUE[channel.type]);
  const typeOptions = CHANNEL_TYPES.map((t) => ({ value: t.value, label: t.label, icon: t.icon }));
</script>

<TextInput
  label={FIELDS.channelName.label}
  help={FIELDS.channelName.help}
  bind:value={channel.name}
  maxlength={100}
  placeholder={FIELDS.channelName.placeholder}
/>

<SegmentedControl
  label="Type"
  help={typeInfo.help}
  value={channel.type}
  options={typeOptions}
  onselect={(v) => (channel.type = v as ChannelType)}
/>

{#if typeInfo.community}
  <div class="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs leading-relaxed text-text-secondary">
    Needs the server's <strong class="text-text-primary">Community</strong> feature. Without it, sync falls back to
    {channel.type === 'stage' ? 'a Voice channel' : 'a Text channel'}.
  </div>
{/if}

{#if fieldAppliesTo('topic', channel.type)}
  <TextArea label={FIELDS.channelTopic.label} help={FIELDS.channelTopic.help} bind:value={channel.topic} maxlength={1024} placeholder={FIELDS.channelTopic.placeholder} />
{/if}

{#if fieldAppliesTo('slowmode', channel.type)}
  <NumberInput label={FIELDS.channelSlowmode.label} help={FIELDS.channelSlowmode.help} bind:value={channel.slowmode} min={0} max={21600} unit="sec" />
{/if}

{#if fieldAppliesTo('bitrate', channel.type)}
  <NumberInput label={FIELDS.channelBitrate.label} help={FIELDS.channelBitrate.help} bind:value={channel.bitrate} min={8} max={384} step={8} unit="kbps" />
{/if}

{#if fieldAppliesTo('user_limit', channel.type)}
  <NumberInput label={FIELDS.channelUserLimit.label} help={FIELDS.channelUserLimit.help} bind:value={channel.user_limit} min={0} max={99} unit="users" />
{/if}

{#if fieldAppliesTo('nsfw', channel.type)}
  <Toggle label={FIELDS.channelNsfw.label} help={FIELDS.channelNsfw.help} bind:checked={channel.nsfw} />
{/if}

{#if fieldAppliesTo('forum', channel.type)}
  <div class="mb-4 rounded-xl border border-border bg-surface/40 p-3">
    <h4 class="mb-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">Forum settings</h4>
    <div class="grid gap-x-4 sm:grid-cols-2">
      <Select label={FIELDS.forumSortOrder.label} help={FIELDS.forumSortOrder.help} bind:value={channel.default_sort_order} options={SORT_ORDERS} allowEmpty emptyLabel="Default" />
      <Select label={FIELDS.forumLayout.label} help={FIELDS.forumLayout.help} bind:value={channel.default_forum_layout} options={FORUM_LAYOUTS} allowEmpty emptyLabel="Default" />
      <Select label={FIELDS.forumArchive.label} help={FIELDS.forumArchive.help} bind:value={channel.default_auto_archive_duration} options={ARCHIVE_DURATIONS} allowEmpty emptyLabel="Default" emptyValue={null} />
      <NumberInput label={FIELDS.forumThreadRate.label} help={FIELDS.forumThreadRate.help} bind:value={channel.default_thread_rate_limit} min={0} max={21600} unit="sec" />
      <div class="sm:col-span-2">
        <TextInput label={FIELDS.forumReactionEmoji.label} help={FIELDS.forumReactionEmoji.help} bind:value={channel.default_reaction_emoji} placeholder={FIELDS.forumReactionEmoji.placeholder} />
      </div>
    </div>
    <Field label="Available tags" help="Tags members can apply to posts (up to 20).">
      <ForumTagList bind:value={channel.available_tags} />
    </Field>
  </div>
{/if}

<Field
  label="Permission overrides"
  help="Override role permissions for this channel specifically. Leave empty to inherit from the category and server."
>
  <PermissionOverwriteList bind:value={channel.permissions} />
</Field>
