/**
 * The permission catalog — the single source of truth for the 45 Discord permission
 * names Disco Designer supports, plus the human labels, descriptions, and grouping the
 * editor UI needs to be self-documenting.
 *
 * Deliberately dependency-free (no discord.js): the browser editor imports this directly.
 * `src/utils/permission-map.ts` binds these names to discord.js bitflags; the zod schema
 * derives its enum from `PERMISSION_NAMES` here.
 */

export type PermissionGroup = 'General' | 'Text' | 'Threads' | 'Voice' | 'Moderation';

export interface PermissionInfo {
  /** PascalCase name, identical to the discord.js `PermissionFlagsBits` key. */
  name: string;
  /** Human label as shown in the Discord client. */
  label: string;
  /** One-line, plain-language description of what the permission grants. */
  description: string;
  group: PermissionGroup;
}

export const PERMISSIONS: PermissionInfo[] = [
  // ---- General ----
  {
    name: 'ViewChannel',
    label: 'View Channels',
    description: 'See channels and read their content. The foundation of channel access.',
    group: 'General',
  },
  {
    name: 'ManageChannels',
    label: 'Manage Channels',
    description: 'Create, edit, and delete channels.',
    group: 'General',
  },
  {
    name: 'ManageRoles',
    label: 'Manage Roles',
    description: 'Create, edit, and delete roles below their own highest role.',
    group: 'General',
  },
  {
    name: 'ManageGuild',
    label: 'Manage Server',
    description: 'Change the server name, region, icon, and other server-wide settings.',
    group: 'General',
  },
  {
    name: 'ManageWebhooks',
    label: 'Manage Webhooks',
    description: 'Create, edit, and delete webhooks.',
    group: 'General',
  },
  {
    name: 'ManageEmojisAndStickers',
    label: 'Manage Expressions',
    description: 'Add, edit, and remove custom emoji, stickers, and soundboard sounds.',
    group: 'General',
  },
  {
    name: 'ManageEvents',
    label: 'Manage Events',
    description: 'Create, edit, and cancel scheduled events.',
    group: 'General',
  },
  {
    name: 'CreateInstantInvite',
    label: 'Create Invite',
    description: 'Create invite links to the server.',
    group: 'General',
  },
  {
    name: 'ViewAuditLog',
    label: 'View Audit Log',
    description: "Read the server's audit log of administrative actions.",
    group: 'General',
  },
  {
    name: 'ViewGuildInsights',
    label: 'View Server Insights',
    description: 'View analytics about server growth and engagement.',
    group: 'General',
  },
  {
    name: 'Administrator',
    label: 'Administrator',
    description: 'Grants every permission and bypasses all channel overwrites. Assign sparingly.',
    group: 'General',
  },

  // ---- Text ----
  {
    name: 'SendMessages',
    label: 'Send Messages',
    description: 'Send messages in text channels.',
    group: 'Text',
  },
  {
    name: 'SendMessagesInThreads',
    label: 'Send Messages in Threads',
    description: 'Send messages inside threads and forum posts.',
    group: 'Text',
  },
  {
    name: 'SendTTSMessages',
    label: 'Send Text-to-Speech Messages',
    description: 'Send /tts messages that are read aloud to everyone in the channel.',
    group: 'Text',
  },
  {
    name: 'ManageMessages',
    label: 'Manage Messages',
    description: "Delete other people's messages and pin any message.",
    group: 'Text',
  },
  {
    name: 'EmbedLinks',
    label: 'Embed Links',
    description: 'Links posted by this role show a rich preview embed.',
    group: 'Text',
  },
  {
    name: 'AttachFiles',
    label: 'Attach Files',
    description: 'Upload files and media to messages.',
    group: 'Text',
  },
  {
    name: 'AddReactions',
    label: 'Add Reactions',
    description: 'Add new emoji reactions to messages.',
    group: 'Text',
  },
  {
    name: 'UseExternalEmojis',
    label: 'Use External Emoji',
    description: 'Use custom emoji from other servers.',
    group: 'Text',
  },
  {
    name: 'UseExternalStickers',
    label: 'Use External Stickers',
    description: 'Use stickers from other servers.',
    group: 'Text',
  },
  {
    name: 'MentionEveryone',
    label: 'Mention @everyone, @here, and All Roles',
    description: 'Ping @everyone / @here and any role, even non-mentionable ones.',
    group: 'Text',
  },
  {
    name: 'ReadMessageHistory',
    label: 'Read Message History',
    description: 'Read messages posted before joining or opening the channel.',
    group: 'Text',
  },
  {
    name: 'UseApplicationCommands',
    label: 'Use Application Commands',
    description: 'Use slash commands and context-menu commands from bots and apps.',
    group: 'Text',
  },
  {
    name: 'SendPolls',
    label: 'Create Polls',
    description: 'Create polls in messages.',
    group: 'Text',
  },

  // ---- Threads ----
  {
    name: 'CreatePublicThreads',
    label: 'Create Public Threads',
    description: 'Create threads everyone in the channel can see.',
    group: 'Threads',
  },
  {
    name: 'CreatePrivateThreads',
    label: 'Create Private Threads',
    description: 'Create threads visible only to invited members.',
    group: 'Threads',
  },
  {
    name: 'ManageThreads',
    label: 'Manage Threads',
    description: 'Rename, archive, unarchive, lock, and delete threads.',
    group: 'Threads',
  },

  // ---- Voice ----
  {
    name: 'Connect',
    label: 'Connect',
    description: 'Join voice and stage channels.',
    group: 'Voice',
  },
  {
    name: 'Speak',
    label: 'Speak',
    description: 'Talk in voice channels.',
    group: 'Voice',
  },
  {
    name: 'Stream',
    label: 'Video',
    description: 'Share video, screen share, and go live in voice channels.',
    group: 'Voice',
  },
  {
    name: 'UseVAD',
    label: 'Use Voice Activity',
    description: 'Talk using voice activity detection instead of push-to-talk.',
    group: 'Voice',
  },
  {
    name: 'PrioritySpeaker',
    label: 'Priority Speaker',
    description: 'Lower the volume of others while this role speaks.',
    group: 'Voice',
  },
  {
    name: 'MuteMembers',
    label: 'Mute Members',
    description: 'Mute other members in voice channels.',
    group: 'Voice',
  },
  {
    name: 'DeafenMembers',
    label: 'Deafen Members',
    description: 'Deafen other members in voice channels.',
    group: 'Voice',
  },
  {
    name: 'MoveMembers',
    label: 'Move Members',
    description: 'Drag members between voice channels or disconnect them.',
    group: 'Voice',
  },
  {
    name: 'UseEmbeddedActivities',
    label: 'Use Activities',
    description: 'Launch Activities (games and apps) in voice channels.',
    group: 'Voice',
  },
  {
    name: 'UseSoundboard',
    label: 'Use Soundboard',
    description: 'Play soundboard sounds in voice channels.',
    group: 'Voice',
  },
  {
    name: 'UseExternalSounds',
    label: 'Use External Sounds',
    description: 'Play soundboard sounds from other servers.',
    group: 'Voice',
  },
  {
    name: 'SendVoiceMessages',
    label: 'Send Voice Messages',
    description: 'Record and send voice messages.',
    group: 'Voice',
  },
  {
    name: 'RequestToSpeak',
    label: 'Request to Speak',
    description: 'Raise a hand to request to speak in stage channels.',
    group: 'Voice',
  },

  // ---- Moderation ----
  {
    name: 'KickMembers',
    label: 'Kick Members',
    description: 'Remove members from the server. They can rejoin with a new invite.',
    group: 'Moderation',
  },
  {
    name: 'BanMembers',
    label: 'Ban Members',
    description: 'Permanently remove members and block them from rejoining.',
    group: 'Moderation',
  },
  {
    name: 'ModerateMembers',
    label: 'Timeout Members',
    description: 'Temporarily restrict members from chatting, reacting, and speaking.',
    group: 'Moderation',
  },
  {
    name: 'ManageNicknames',
    label: 'Manage Nicknames',
    description: "Change other members' nicknames.",
    group: 'Moderation',
  },
  {
    name: 'ChangeNickname',
    label: 'Change Nickname',
    description: 'Change their own nickname.',
    group: 'Moderation',
  },
];

/** The 45 valid permission names, in catalog order. Replaces the old VALID_PERMISSION_NAMES. */
export const PERMISSION_NAMES: string[] = PERMISSIONS.map((p) => p.name);

/** Group display order for the editor. */
export const PERMISSION_GROUPS: PermissionGroup[] = [
  'General',
  'Text',
  'Threads',
  'Voice',
  'Moderation',
];

/** Lookup a permission's metadata by name. */
export const PERMISSION_BY_NAME: Record<string, PermissionInfo> = Object.fromEntries(
  PERMISSIONS.map((p) => [p.name, p]),
);

/** Permissions belonging to a group, in catalog order. */
export function permissionsInGroup(group: PermissionGroup): PermissionInfo[] {
  return PERMISSIONS.filter((p) => p.group === group);
}
