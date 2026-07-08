/**
 * Declarative metadata that drives the editor: labels, help text, constraints, enum
 * options, per-channel-type field applicability, and Discord limits.
 *
 * Same source of truth the zod schema validates against — kept dependency-free so the
 * browser editor can render self-documenting forms without duplicating knowledge.
 */

// ---------------------------------------------------------------------------
// Channel types
// ---------------------------------------------------------------------------

export type ChannelType = 'text' | 'voice' | 'forum' | 'stage' | 'announcement';

export interface ChannelTypeInfo {
  value: ChannelType;
  label: string;
  /** Single-glyph icon used in outline rows and the type picker. */
  icon: string;
  help: string;
  /** True if the type needs the server's Community feature (sync falls back otherwise). */
  community?: boolean;
}

export const CHANNEL_TYPES: ChannelTypeInfo[] = [
  { value: 'text', label: 'Text', icon: '#', help: 'A standard text channel for messages.' },
  { value: 'voice', label: 'Voice', icon: '🔊', help: 'A voice + video channel members join to talk.' },
  {
    value: 'forum',
    label: 'Forum',
    icon: '💬',
    help: 'A channel of threaded posts, optionally tagged and sorted.',
  },
  {
    value: 'announcement',
    label: 'Announcement',
    icon: '📣',
    help: 'A text channel others can follow. Requires the Community feature — falls back to Text without it.',
    community: true,
  },
  {
    value: 'stage',
    label: 'Stage',
    icon: '🎤',
    help: 'A moderated audio stage. Requires the Community feature — falls back to Voice without it.',
    community: true,
  },
];

export const CHANNEL_TYPE_BY_VALUE: Record<ChannelType, ChannelTypeInfo> = Object.fromEntries(
  CHANNEL_TYPES.map((t) => [t.value, t]),
) as Record<ChannelType, ChannelTypeInfo>;

// ---------------------------------------------------------------------------
// Field applicability — which channel fields are meaningful for which type.
// Mirrors the gating in src/sync/channels.ts so the inspector hides noise.
// ---------------------------------------------------------------------------

export type ChannelField =
  | 'topic'
  | 'slowmode'
  | 'nsfw'
  | 'bitrate'
  | 'user_limit'
  | 'forum';

export const CHANNEL_FIELD_APPLICABILITY: Record<ChannelField, ChannelType[]> = {
  topic: ['text', 'announcement', 'forum', 'stage'],
  slowmode: ['text', 'announcement'],
  nsfw: ['text', 'announcement', 'forum', 'voice', 'stage'],
  bitrate: ['voice', 'stage'],
  user_limit: ['voice', 'stage'],
  forum: ['forum'],
};

export function fieldAppliesTo(field: ChannelField, type: ChannelType): boolean {
  return CHANNEL_FIELD_APPLICABILITY[field].includes(type);
}

// ---------------------------------------------------------------------------
// Enum options
// ---------------------------------------------------------------------------

export interface Option<T extends string | number> {
  value: T;
  label: string;
  help?: string;
}

export const SORT_ORDERS: Option<string>[] = [
  { value: 'latest_activity', label: 'Latest Activity', help: 'Bump posts with recent replies to the top.' },
  { value: 'creation_date', label: 'Creation Date', help: 'Order posts by when they were created.' },
];

export const FORUM_LAYOUTS: Option<string>[] = [
  { value: 'list', label: 'List View', help: 'Compact, text-forward list of posts.' },
  { value: 'gallery', label: 'Gallery View', help: 'Media-forward grid of post thumbnails.' },
];

export const ARCHIVE_DURATIONS: Option<number>[] = [
  { value: 60, label: '1 hour' },
  { value: 1440, label: '1 day' },
  { value: 4320, label: '3 days' },
  { value: 10080, label: '1 week' },
];

// ---------------------------------------------------------------------------
// Per-field descriptors (labels, help, constraints) for the primitives.
// ---------------------------------------------------------------------------

export interface FieldMeta {
  label: string;
  help: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
}

export const FIELDS = {
  roleName: { label: 'Name', help: 'The role name shown in Discord.', max: 100, placeholder: 'Moderator' },
  roleColor: {
    label: 'Color',
    help: 'The role color. #000000 means "no color" (members inherit their next colored role).',
  },
  roleHoist: {
    label: 'Display separately',
    help: 'Show members with this role in their own section of the member list.',
  },
  roleMentionable: {
    label: 'Allow anyone to @mention',
    help: 'Let anyone ping this role, not just members who can mention everyone.',
  },

  categoryName: { label: 'Name', help: 'The category name. Usually UPPERCASE by convention.', max: 100, placeholder: 'GENERAL' },

  channelName: {
    label: 'Name',
    help: 'The channel name. Discord lowercases and hyphenates text channels automatically.',
    max: 100,
    placeholder: 'general',
  },
  channelTopic: {
    label: 'Topic',
    help: 'The channel topic shown in the header. Ignored on voice channels.',
    max: 1024,
    placeholder: 'What is this channel about?',
  },
  channelSlowmode: {
    label: 'Slowmode',
    help: 'Seconds a member must wait between messages. 0 disables slowmode.',
    min: 0,
    max: 21600,
    step: 1,
    unit: 'sec',
  },
  channelNsfw: { label: 'Age-restricted (NSFW)', help: 'Gate the channel behind an age-confirmation prompt.' },
  channelBitrate: {
    label: 'Bitrate',
    help: 'Audio quality in kbps. Auto-clamped to the max your server boost tier allows.',
    min: 8,
    max: 384,
    step: 8,
    unit: 'kbps',
  },
  channelUserLimit: {
    label: 'User limit',
    help: 'Maximum members in the voice channel. 0 means unlimited.',
    min: 0,
    max: 99,
    step: 1,
    unit: 'users',
  },

  forumReactionEmoji: {
    label: 'Default reaction',
    help: 'Emoji shown as the quick-reaction on posts. A Unicode emoji, or a custom-emoji ID.',
    placeholder: '⭐',
  },
  forumThreadRate: {
    label: 'Post slowmode',
    help: 'Seconds a member must wait between creating posts. 0 disables it.',
    min: 0,
    max: 21600,
    step: 1,
    unit: 'sec',
  },
  forumSortOrder: { label: 'Sort order', help: 'How posts are ordered by default.' },
  forumLayout: { label: 'Layout', help: 'How the post list is displayed by default.' },
  forumArchive: { label: 'Auto-archive after', help: 'How long a post stays active before auto-archiving.' },

  tagName: { label: 'Name', help: 'The tag label.', max: 20, placeholder: 'Solved' },
  tagModerated: { label: 'Moderator-only', help: 'Only moderators can apply or remove this tag.' },
  tagEmoji: { label: 'Emoji', help: 'A Unicode emoji, or a custom-emoji ID. Optional.', placeholder: '✅' },

  overwriteRole: { label: 'Role', help: 'The role this overwrite applies to.' },

  emojiName: {
    label: 'Name',
    help: 'The emoji name (2–32 chars, letters, numbers, and underscores).',
    max: 32,
    placeholder: 'pepe_thumbsup',
  },
  emojiImage: {
    label: 'Image URL',
    help: 'A direct URL to a PNG, GIF, or JPEG image.',
    placeholder: 'https://example.com/emoji.png',
  },
} as const satisfies Record<string, FieldMeta>;

// ---------------------------------------------------------------------------
// Discord limits (surfaced as soft warnings + helper text)
// ---------------------------------------------------------------------------

export const LIMITS = {
  channelsPerServer: 500,
  channelsPerCategory: 50,
  categories: 50,
  roles: 250,
  tagsPerForum: 20,
  nameMax: 100,
  topicMax: 1024,
  emojiNameMin: 2,
  emojiNameMax: 32,
  tagNameMax: 20,
  slowmodeMax: 21600,
  userLimitMax: 99,
  /** Custom-emoji slots by server boost tier (0/1/2/3). */
  emojiByTier: [50, 100, 150, 250],
  /** Max bitrate in kbps by boost tier (0/1/2/3). */
  bitrateByTier: [96, 128, 256, 384],
} as const;

export const EMOJI_NAME_PATTERN = /^[a-zA-Z0-9_]+$/;
export const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** The reserved server-default role name; only its permissions are applied on sync. */
export const EVERYONE = '@everyone';
