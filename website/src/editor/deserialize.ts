/**
 * YAML text → EDoc. Validates with the exact shared zod schema the bot uses, then maps the
 * validated (defaulted) data into editor nodes with fresh ids. On validation failure returns
 * the human error list and loads nothing.
 */
import { parse as parseYaml } from 'yaml';
import { ServerTemplateSchema } from '@disco/schema/server-template.schema';
import type {
  ServerTemplate,
  RoleTemplate,
  CategoryTemplate,
  ChannelTemplate,
  PermissionOverwriteTemplate,
  EmojiTemplate,
  ForumTagTemplate,
} from '@disco/schema/types';
import type { ChannelType } from '@disco/domain/descriptor';
import {
  newId,
  type EDoc,
  type ERole,
  type ECategory,
  type EChannel,
  type EOverwrite,
  type ETag,
  type EEmoji,
} from './model.js';

export type ImportResult = { ok: true; doc: EDoc } | { ok: false; errors: string[] };

export function deserialize(yamlText: string): ImportResult {
  let raw: unknown;
  try {
    raw = parseYaml(yamlText);
  } catch (err) {
    return { ok: false, errors: [`YAML syntax error: ${err instanceof Error ? err.message : String(err)}`] };
  }

  const result = ServerTemplateSchema.safeParse(raw ?? {});
  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    });
    return { ok: false, errors };
  }

  return { ok: true, doc: fromTemplate(result.data) };
}

function overwrite(o: PermissionOverwriteTemplate): EOverwrite {
  return { _id: newId(), role: o.role, allow: [...(o.allow ?? [])], deny: [...(o.deny ?? [])] };
}

function tag(t: ForumTagTemplate): ETag {
  return { _id: newId(), name: t.name, moderated: t.moderated ?? false, emoji: t.emoji ?? '' };
}

function channel(c: ChannelTemplate): EChannel {
  return {
    _id: newId(),
    name: c.name,
    type: c.type as ChannelType,
    topic: c.topic ?? '',
    slowmode: c.slowmode ?? null,
    nsfw: c.nsfw ?? false,
    bitrate: c.bitrate != null ? Math.round(c.bitrate / 1000) : null,
    user_limit: c.user_limit ?? null,
    permissions: (c.permissions ?? []).map(overwrite),
    default_reaction_emoji: c.default_reaction_emoji ?? '',
    default_sort_order: c.default_sort_order ?? '',
    default_forum_layout: c.default_forum_layout ?? '',
    default_thread_rate_limit: c.default_thread_rate_limit ?? null,
    default_auto_archive_duration: c.default_auto_archive_duration ?? null,
    available_tags: (c.available_tags ?? []).map(tag),
  };
}

function role(r: RoleTemplate): ERole {
  return {
    _id: newId(),
    name: r.name,
    color: r.color ?? '#000000',
    hoist: r.hoist ?? false,
    mentionable: r.mentionable ?? false,
    permissions: [...(r.permissions ?? [])],
  };
}

function category(c: CategoryTemplate): ECategory {
  return {
    _id: newId(),
    name: c.name,
    permissions: (c.permissions ?? []).map(overwrite),
    channels: (c.channels ?? []).map(channel),
  };
}

function emoji(e: EmojiTemplate): EEmoji {
  return { _id: newId(), name: e.name, image: e.image };
}

export function fromTemplate(t: ServerTemplate): EDoc {
  return {
    roles: (t.roles ?? []).map(role),
    categories: (t.categories ?? []).map(category),
    uncategorized: (t.uncategorized ?? []).map(channel),
    emoji: (t.emoji ?? []).map(emoji),
  };
}
