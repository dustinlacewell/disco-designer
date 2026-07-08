<script lang="ts">
  import TextInput from '../primitives/TextInput.svelte';
  import { FIELDS, EMOJI_NAME_PATTERN } from '@disco/domain/descriptor';
  import type { EEmoji } from '../model.js';

  let { emoji }: { emoji: EEmoji } = $props();

  const nameError = $derived(
    emoji.name && !EMOJI_NAME_PATTERN.test(emoji.name)
      ? 'Only letters, numbers, and underscores allowed.'
      : emoji.name.length === 1
        ? 'Must be at least 2 characters.'
        : '',
  );
  const looksLikeUrl = $derived(/^https?:\/\//.test(emoji.image.trim()));
</script>

<TextInput
  label={FIELDS.emojiName.label}
  help={FIELDS.emojiName.help}
  bind:value={emoji.name}
  maxlength={32}
  placeholder={FIELDS.emojiName.placeholder}
  error={nameError}
/>

<TextInput
  label={FIELDS.emojiImage.label}
  help={FIELDS.emojiImage.help}
  bind:value={emoji.image}
  placeholder={FIELDS.emojiImage.placeholder}
  mono
/>

{#if looksLikeUrl}
  <div class="flex items-center gap-3 rounded-lg border border-border bg-surface/50 p-3">
    <img src={emoji.image} alt={emoji.name} class="h-12 w-12 rounded object-contain" />
    <div class="text-sm text-text-secondary">
      Preview of <span class="font-mono text-text-primary">:{emoji.name}:</span>
    </div>
  </div>
{/if}
