import type { z } from 'zod';
import type {
  ServerTemplateSchema,
  RoleSchema,
  CategorySchema,
  ChannelSchema,
  PermissionOverwriteSchema,
  EmojiSchema,
  ForumTagSchema,
} from './server-template.schema.js';

export type ServerTemplate = z.infer<typeof ServerTemplateSchema>;
export type RoleTemplate = z.infer<typeof RoleSchema>;
export type CategoryTemplate = z.infer<typeof CategorySchema>;
export type ChannelTemplate = z.infer<typeof ChannelSchema>;
export type PermissionOverwriteTemplate = z.infer<typeof PermissionOverwriteSchema>;
export type EmojiTemplate = z.infer<typeof EmojiSchema>;
export type ForumTagTemplate = z.infer<typeof ForumTagSchema>;
