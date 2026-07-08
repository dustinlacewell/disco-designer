import {
  ChannelType,
  OverwriteType,
  SortOrderType,
  ForumLayoutType,
  type Guild,
  type GuildChannel,
  type Role,
  type CategoryChannel,
  type ForumChannel,
  type TextChannel,
  type VoiceChannel,
  type StageChannel,
  type NewsChannel,
} from 'discord.js';
import type {
  ServerTemplate,
  RoleTemplate,
  CategoryTemplate,
  ChannelTemplate,
  PermissionOverwriteTemplate,
  EmojiTemplate,
  ForumTagTemplate,
} from '../schema/types.js';
import { reversePermissions } from '../utils/permission-map.js';

const CHANNEL_TYPE_REVERSE: Partial<Record<ChannelType, ChannelTemplate['type']>> = {
  [ChannelType.GuildText]: 'text',
  [ChannelType.GuildVoice]: 'voice',
  [ChannelType.GuildForum]: 'forum',
  [ChannelType.GuildStageVoice]: 'stage',
  [ChannelType.GuildAnnouncement]: 'announcement',
};

const SORT_ORDER_REVERSE: Record<SortOrderType, string> = {
  [SortOrderType.LatestActivity]: 'latest_activity',
  [SortOrderType.CreationDate]: 'creation_date',
};

const FORUM_LAYOUT_REVERSE: Partial<Record<ForumLayoutType, string>> = {
  [ForumLayoutType.ListView]: 'list',
  [ForumLayoutType.GalleryView]: 'gallery',
};

/**
 * Reads a Discord guild's current state and produces a ServerTemplate object
 * that can be serialized to YAML and fed back to /apply-template.
 */
export function exportGuildToTemplate(guild: Guild): ServerTemplate {
  const idToRoleName = buildRoleIdMap(guild);

  return {
    roles: exportRoles(guild),
    categories: exportCategories(guild, idToRoleName),
    uncategorized: exportUncategorizedChannels(guild, idToRoleName),
    emoji: exportEmoji(guild),
  };
}

function buildRoleIdMap(guild: Guild): Map<string, string> {
  const map = new Map<string, string>();
  for (const role of guild.roles.cache.values()) {
    map.set(role.id, role.id === guild.id ? '@everyone' : role.name);
  }
  return map;
}

function colorToHex(color: number): string {
  if (color === 0) return '#000000';
  return `#${color.toString(16).padStart(6, '0')}`;
}

function exportRoles(guild: Guild): RoleTemplate[] {
  const roles: { role: Role; template: RoleTemplate }[] = [];

  for (const role of guild.roles.cache.values()) {
    // Skip managed roles (bots, integrations)
    if (role.managed) continue;

    const isEveryone = role.id === guild.id;
    const permissions = reversePermissions(role.permissions.bitfield);

    const template: RoleTemplate = {
      name: isEveryone ? '@everyone' : role.name,
      color: '#000000',
      hoist: false,
      mentionable: false,
      permissions,
    };

    if (!isEveryone) {
      const hex = colorToHex(role.color);
      if (hex !== '#000000') template.color = hex;
      if (role.hoist) template.hoist = true;
      if (role.mentionable) template.mentionable = true;
    }

    roles.push({ role, template });
  }

  // Sort by position descending (highest role first), @everyone last
  roles.sort((a, b) => {
    if (a.role.id === guild.id) return 1;
    if (b.role.id === guild.id) return -1;
    return b.role.position - a.role.position;
  });

  return roles.map((r) => r.template);
}

function exportCategories(
  guild: Guild,
  idToRoleName: Map<string, string>,
): CategoryTemplate[] {
  const categories = [...guild.channels.cache.values()]
    .filter((ch): ch is CategoryChannel => ch.type === ChannelType.GuildCategory)
    .sort((a, b) => a.position - b.position);

  return categories.map((cat) => {
    const permissions = exportPermissionOverwrites(cat, idToRoleName);
    const channels = exportChannelsInCategory(guild, cat.id, idToRoleName);

    const template: CategoryTemplate = {
      name: cat.name,
      permissions,
      channels,
    };

    return template;
  });
}

function getNonCategoryChannels(guild: Guild): GuildChannel[] {
  return ([...guild.channels.cache.values()] as GuildChannel[]).filter(
    (ch) =>
      ch.type !== ChannelType.GuildCategory &&
      !ch.isThread(),
  );
}

function exportChannelsInCategory(
  guild: Guild,
  categoryId: string,
  idToRoleName: Map<string, string>,
): ChannelTemplate[] {
  const channels = getNonCategoryChannels(guild)
    .filter((ch) => ch.parentId === categoryId)
    .sort((a, b) => a.position - b.position);

  return channels.map((ch) => exportChannel(ch, idToRoleName));
}

function exportUncategorizedChannels(
  guild: Guild,
  idToRoleName: Map<string, string>,
): ChannelTemplate[] {
  const channels = getNonCategoryChannels(guild)
    .filter((ch) => ch.parentId === null)
    .sort((a, b) => a.position - b.position);

  return channels.map((ch) => exportChannel(ch, idToRoleName));
}

function exportChannel(
  channel: GuildChannel,
  idToRoleName: Map<string, string>,
): ChannelTemplate {
  const typeName = CHANNEL_TYPE_REVERSE[channel.type];
  if (!typeName) {
    // Fallback for unknown channel types
    return { name: channel.name, type: 'text', nsfw: false, permissions: [] };
  }

  const template: ChannelTemplate = {
    name: channel.name,
    type: typeName,
    nsfw: false,
    permissions: exportPermissionOverwrites(channel, idToRoleName),
  };

  // Text-like channels (text, announcement, forum, stage)
  if ('topic' in channel && (channel as TextChannel).topic) {
    template.topic = (channel as TextChannel).topic!;
  }

  if ('rateLimitPerUser' in channel) {
    const slowmode = (channel as TextChannel).rateLimitPerUser;
    if (slowmode > 0) template.slowmode = slowmode;
  }

  if ('nsfw' in channel) {
    template.nsfw = (channel as TextChannel).nsfw;
  }

  // Voice/stage channels
  if ('bitrate' in channel) {
    template.bitrate = (channel as VoiceChannel).bitrate;
  }

  if ('userLimit' in channel) {
    const limit = (channel as VoiceChannel).userLimit;
    if (limit !== undefined) template.user_limit = limit;
  }

  // Forum-specific
  if (channel.type === ChannelType.GuildForum) {
    const forum = channel as ForumChannel;

    if (forum.defaultSortOrder !== null) {
      template.default_sort_order = SORT_ORDER_REVERSE[forum.defaultSortOrder] as ChannelTemplate['default_sort_order'];
    }
    const layoutName = FORUM_LAYOUT_REVERSE[forum.defaultForumLayout];
    if (layoutName) {
      template.default_forum_layout = layoutName as ChannelTemplate['default_forum_layout'];
    }
    if (forum.defaultThreadRateLimitPerUser) {
      template.default_thread_rate_limit = forum.defaultThreadRateLimitPerUser;
    }
    if (forum.defaultAutoArchiveDuration) {
      template.default_auto_archive_duration = forum.defaultAutoArchiveDuration as ChannelTemplate['default_auto_archive_duration'];
    }
    if (forum.defaultReactionEmoji) {
      template.default_reaction_emoji = forum.defaultReactionEmoji.id ?? forum.defaultReactionEmoji.name ?? undefined;
    }
    if (forum.availableTags.length > 0) {
      template.available_tags = forum.availableTags.map((tag): ForumTagTemplate => {
        const t: ForumTagTemplate = {
          name: tag.name,
          moderated: tag.moderated,
        };
        if (tag.emoji) {
          t.emoji = tag.emoji.id ?? tag.emoji.name ?? undefined;
        }
        return t;
      });
    }
  }

  return template;
}

function exportPermissionOverwrites(
  channel: GuildChannel | CategoryChannel,
  idToRoleName: Map<string, string>,
): PermissionOverwriteTemplate[] {
  const overwrites: PermissionOverwriteTemplate[] = [];

  for (const overwrite of channel.permissionOverwrites.cache.values()) {
    // Only export role-based overwrites, not member-specific ones
    if (overwrite.type !== OverwriteType.Role) continue;

    const roleName = idToRoleName.get(overwrite.id);
    if (!roleName) continue;

    const allow = reversePermissions(overwrite.allow.bitfield);
    const deny = reversePermissions(overwrite.deny.bitfield);

    // Skip if no actual overwrites
    if (allow.length === 0 && deny.length === 0) continue;

    overwrites.push({ role: roleName, allow, deny });
  }

  return overwrites;
}

function exportEmoji(guild: Guild): EmojiTemplate[] {
  const emoji: EmojiTemplate[] = [];

  for (const e of guild.emojis.cache.values()) {
    if (e.managed) continue;
    if (!e.name || !e.url) continue;

    emoji.push({
      name: e.name,
      image: e.url,
    });
  }

  return emoji;
}
