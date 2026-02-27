import { z } from 'zod';
import { VALID_PERMISSION_NAMES } from '../utils/permission-map.js';

const PermissionNameSchema = z.enum(VALID_PERMISSION_NAMES as [string, ...string[]]);

export const PermissionOverwriteSchema = z.object({
  role: z.string().min(1),
  allow: z.array(PermissionNameSchema).optional().default([]),
  deny: z.array(PermissionNameSchema).optional().default([]),
});

export const ForumTagSchema = z.object({
  name: z.string().min(1).max(20),
  moderated: z.boolean().optional().default(false),
  emoji: z.string().optional(),
});

export const ChannelSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['text', 'voice', 'forum', 'stage', 'announcement']),
  topic: z.string().max(1024).optional(),
  slowmode: z.number().int().min(0).max(21600).optional(),
  nsfw: z.boolean().optional().default(false),
  bitrate: z.number().int().min(8000).max(384000).optional(),
  user_limit: z.number().int().min(0).max(99).optional(),
  permissions: z.array(PermissionOverwriteSchema).optional().default([]),

  // Forum-only fields
  default_reaction_emoji: z.string().optional(),
  default_sort_order: z.enum(['latest_activity', 'creation_date']).optional(),
  default_forum_layout: z.enum(['list', 'gallery']).optional(),
  default_thread_rate_limit: z.number().int().min(0).max(21600).optional(),
  default_auto_archive_duration: z.number().refine(
    (v) => [60, 1440, 4320, 10080].includes(v),
    { message: 'Must be 60, 1440, 4320, or 10080 minutes' },
  ).optional(),
  available_tags: z.array(ForumTagSchema).max(20).optional(),
});

export const RoleSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color like #ff0000').optional().default('#000000'),
  hoist: z.boolean().optional().default(false),
  mentionable: z.boolean().optional().default(false),
  permissions: z.array(PermissionNameSchema).optional().default([]),
});

export const CategorySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(PermissionOverwriteSchema).optional().default([]),
  channels: z.array(ChannelSchema).optional().default([]),
});

export const EmojiSchema = z.object({
  name: z.string().min(2).max(32).regex(/^[a-zA-Z0-9_]+$/, 'Only alphanumeric and underscores'),
  image: z.string().url(),
});

export const ServerTemplateSchema = z.object({
  roles: z.array(RoleSchema).optional().default([]),
  categories: z.array(CategorySchema).optional().default([]),
  uncategorized: z.array(ChannelSchema).optional().default([]),
  emoji: z.array(EmojiSchema).optional().default([]),
});
