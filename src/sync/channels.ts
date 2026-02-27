import {
  ChannelType,
  GuildFeature,
  SortOrderType,
  ForumLayoutType,
  type GuildChannel,
  type ForumChannel,
} from 'discord.js';
import type { ChannelTemplate } from '../schema/types.js';
import type { SyncContext } from './sync-context.js';
import { diff } from './diff.js';
import { applyPermissionOverwrites } from './permissions.js';
import { withRetry, apiThrottle } from '../utils/discord-helpers.js';
import { logger } from '../utils/logger.js';

const CHANNEL_TYPE_MAP: Record<string, ChannelType> = {
  text: ChannelType.GuildText,
  voice: ChannelType.GuildVoice,
  forum: ChannelType.GuildForum,
  stage: ChannelType.GuildStageVoice,
  announcement: ChannelType.GuildAnnouncement,
};

/**
 * Resolve the actual ChannelType, falling back to GuildText if the server
 * doesn't support announcement channels (requires Community feature).
 */
function resolveChannelType(type: string, ctx: SyncContext): ChannelType {
  const hasCommunity = ctx.guild.features.includes(GuildFeature.Community);
  if (type === 'announcement' && !hasCommunity) {
    logger.warn(
      `Server lacks Community feature — falling back to text channel for announcement. ` +
      `Enable Community in Server Settings to use announcement channels.`,
    );
    return ChannelType.GuildText;
  }
  if (type === 'stage' && !hasCommunity) {
    logger.warn(
      `Server lacks Community feature — falling back to voice channel for stage. ` +
      `Enable Community in Server Settings to use stage channels.`,
    );
    return ChannelType.GuildVoice;
  }
  return CHANNEL_TYPE_MAP[type]!;
}

const SORT_ORDER_MAP: Record<string, SortOrderType> = {
  latest_activity: SortOrderType.LatestActivity,
  creation_date: SortOrderType.CreationDate,
};

const FORUM_LAYOUT_MAP: Record<string, ForumLayoutType> = {
  list: ForumLayoutType.ListView,
  gallery: ForumLayoutType.GalleryView,
};

interface DesiredChannel {
  template: ChannelTemplate;
  parentId: string | null;
}

export async function syncChannels(ctx: SyncContext): Promise<void> {
  await ctx.progress.report('channels', 'Starting channel sync...');

  // Build flat list of all desired channels with parent IDs
  const desired: DesiredChannel[] = [];

  for (const category of ctx.template.categories) {
    const parentId = ctx.categoryNameToId.get(category.name) ?? null;
    for (const ch of category.channels) {
      desired.push({ template: ch, parentId });
    }
  }

  for (const ch of ctx.template.uncategorized) {
    desired.push({ template: ch, parentId: null });
  }

  // Get all current non-category channels (excluding threads)
  const currentChannels = [...ctx.guild.channels.cache.values()].filter(
    (ch) =>
      ch.type !== ChannelType.GuildCategory &&
      !ch.isThread(),
  ) as GuildChannel[];

  // Diff by composite key: name + parentId
  const compositeKey = (name: string, parentId: string | null) =>
    `${parentId ?? 'null'}:${name}`;

  const result = diff<DesiredChannel, GuildChannel>(
    desired,
    currentChannels,
    (d) => compositeKey(d.template.name, d.parentId),
    (c) => compositeKey(c.name, c.parentId),
    () => false, // Always check for updates
  );

  // Delete channels not in template
  for (const channel of result.toDelete) {
    try {
      await withRetry(
        () => channel.delete('Template sync'),
        `delete channel #${channel.name}`,
      );
      ctx.deleted.push(`channel: #${channel.name}`);
      logger.info(`Deleted channel: #${channel.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.errors.push({ phase: 'channels', entity: `channel:${channel.name}`, operation: 'delete', message });
      logger.error(`Failed to delete channel #${channel.name}:`, error);
    }
    await apiThrottle();
  }

  // Create missing channels
  for (const { template: ch, parentId } of result.toCreate) {
    try {
      const options = buildChannelCreateOptions(ch, parentId, ctx);
      const created = await withRetry(
        () => ctx.guild.channels.create(options),
        `create channel #${ch.name}`,
      );
      ctx.created.push(`channel: #${ch.name}`);
      logger.info(`Created channel: #${ch.name}`);

      // Apply permission overwrites
      if (ch.permissions.length > 0) {
        await applyPermissionOverwrites(ctx, created, ch.permissions);
      }

      // Apply forum-specific settings after creation
      if (ch.type === 'forum' && created.type === ChannelType.GuildForum) {
        await applyForumSettings(ctx, created as ForumChannel, ch);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.errors.push({ phase: 'channels', entity: `channel:${ch.name}`, operation: 'create', message });
      logger.error(`Failed to create channel #${ch.name}:`, error);
    }
    await apiThrottle();
  }

  // Update existing channels
  for (const { desired: { template: ch, parentId }, current } of result.toUpdate) {
    try {
      const editOptions = buildChannelEditOptions(ch, parentId, ctx);
      await withRetry(
        () => current.edit(editOptions),
        `update channel #${ch.name}`,
      );
      ctx.updated.push(`channel: #${ch.name}`);
      logger.info(`Updated channel: #${ch.name}`);

      // Apply permission overwrites
      if (ch.permissions.length > 0) {
        await applyPermissionOverwrites(ctx, current, ch.permissions);
      } else {
        await withRetry(
          () => current.permissionOverwrites.set([], 'Template sync'),
          `clear permissions on #${ch.name}`,
        );
      }

      // Apply forum-specific settings
      if (ch.type === 'forum' && current.type === ChannelType.GuildForum) {
        await applyForumSettings(ctx, current as ForumChannel, ch);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.errors.push({ phase: 'channels', entity: `channel:${ch.name}`, operation: 'update', message });
      logger.error(`Failed to update channel #${ch.name}:`, error);
    }
    await apiThrottle();
  }

  // Reorder channels within each category
  await reorderChannels(ctx);

  const total = result.toCreate.length + result.toUpdate.length + result.toDelete.length;
  await ctx.progress.report('channels', `Done. ${total} change(s).`);
}

// Channel types that support the `topic` field
const SUPPORTS_TOPIC = new Set(['text', 'announcement', 'forum', 'stage']);

/** Max bitrate (bps) by server boost tier. */
const MAX_BITRATE_BY_TIER: Record<number, number> = { 0: 96_000, 1: 128_000, 2: 256_000, 3: 384_000 };

function clampBitrate(bitrate: number, ctx: SyncContext): number {
  const max = MAX_BITRATE_BY_TIER[ctx.guild.premiumTier] ?? 96_000;
  if (bitrate > max) {
    logger.warn(`Bitrate ${bitrate} exceeds server max ${max} (boost tier ${ctx.guild.premiumTier}), clamping.`);
    return max;
  }
  return bitrate;
}

function buildChannelCreateOptions(ch: ChannelTemplate, parentId: string | null, ctx: SyncContext): any {
  const options: any = {
    name: ch.name,
    type: resolveChannelType(ch.type, ctx),
    parent: parentId,
    reason: 'Template sync',
  };

  if (ch.topic !== undefined && SUPPORTS_TOPIC.has(ch.type)) options.topic = ch.topic;
  if (ch.slowmode !== undefined) options.rateLimitPerUser = ch.slowmode;
  if (ch.nsfw) options.nsfw = ch.nsfw;
  if (ch.bitrate !== undefined) options.bitrate = clampBitrate(ch.bitrate, ctx);
  if (ch.user_limit !== undefined) options.userLimit = ch.user_limit;

  return options;
}

function buildChannelEditOptions(ch: ChannelTemplate, parentId: string | null, ctx: SyncContext): any {
  const options: any = {
    name: ch.name,
    parent: parentId,
    reason: 'Template sync',
  };

  if (ch.topic !== undefined && SUPPORTS_TOPIC.has(ch.type)) options.topic = ch.topic;
  if (ch.slowmode !== undefined) options.rateLimitPerUser = ch.slowmode;
  if (ch.nsfw !== undefined) options.nsfw = ch.nsfw;
  if (ch.bitrate !== undefined) options.bitrate = clampBitrate(ch.bitrate, ctx);
  if (ch.user_limit !== undefined) options.userLimit = ch.user_limit;

  return options;
}

/**
 * Resolves an emoji string from YAML into the format Discord expects.
 * - Unicode emoji (e.g., "✅", "🐛") → { name: "✅" }
 * - Snowflake ID (e.g., "123456789") → { id: "123456789" }
 */
function resolveEmojiField(emoji: string): { name: string } | { id: string } {
  // If it looks like a snowflake ID (all digits), treat as custom emoji
  if (/^\d{17,20}$/.test(emoji)) {
    return { id: emoji };
  }
  // Otherwise treat as Unicode emoji character
  return { name: emoji };
}

async function applyForumSettings(
  ctx: SyncContext,
  channel: ForumChannel,
  ch: ChannelTemplate,
): Promise<void> {
  try {
    const editOptions: any = {};

    if (ch.default_sort_order !== undefined) {
      editOptions.defaultSortOrder = SORT_ORDER_MAP[ch.default_sort_order];
    }
    if (ch.default_forum_layout !== undefined) {
      editOptions.defaultForumLayout = FORUM_LAYOUT_MAP[ch.default_forum_layout];
    }
    if (ch.default_thread_rate_limit !== undefined) {
      editOptions.defaultThreadRateLimitPerUser = ch.default_thread_rate_limit;
    }
    if (ch.default_auto_archive_duration !== undefined) {
      editOptions.defaultAutoArchiveDuration = ch.default_auto_archive_duration;
    }
    if (ch.default_reaction_emoji !== undefined) {
      editOptions.defaultReactionEmoji = resolveEmojiField(ch.default_reaction_emoji);
    }
    if (ch.available_tags !== undefined) {
      editOptions.availableTags = ch.available_tags.map((tag) => ({
        name: tag.name,
        moderated: tag.moderated,
        emoji: tag.emoji ? resolveEmojiField(tag.emoji) : undefined,
      }));
    }

    if (Object.keys(editOptions).length > 0) {
      await withRetry(
        () => channel.edit(editOptions),
        `set forum settings on #${ch.name}`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.errors.push({ phase: 'channels', entity: `channel:${ch.name}`, operation: 'update', message: `Forum settings: ${message}` });
    logger.error(`Failed to set forum settings on #${ch.name}:`, error);
  }
}

async function reorderChannels(ctx: SyncContext): Promise<void> {
  const positions: Array<{ channel: string; position: number }> = [];

  // Channels within each category
  for (const [catIndex, category] of ctx.template.categories.entries()) {
    const parentId = ctx.categoryNameToId.get(category.name);
    if (!parentId) continue;

    for (const [chIndex, ch] of category.channels.entries()) {
      const channelObj = ctx.guild.channels.cache.find(
        (c) => c.name === ch.name && c.parentId === parentId,
      );
      if (channelObj) {
        positions.push({ channel: channelObj.id, position: chIndex });
      }
    }
  }

  // Uncategorized channels
  for (const [chIndex, ch] of ctx.template.uncategorized.entries()) {
    const channelObj = ctx.guild.channels.cache.find(
      (c) => c.name === ch.name && c.parentId === null,
    );
    if (channelObj) {
      positions.push({ channel: channelObj.id, position: chIndex });
    }
  }

  if (positions.length > 0) {
    try {
      await withRetry(
        () => ctx.guild.channels.setPositions(positions),
        'reorder channels',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.errors.push({ phase: 'channels', entity: 'channels', operation: 'reorder', message });
      logger.error('Failed to reorder channels:', error);
    }
  }
}
