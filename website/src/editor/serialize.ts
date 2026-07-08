/**
 * EDoc → clean, canonical YAML. Emits keys in a stable order, gates channel fields by the
 * channel type's applicability (so switching type never leaks stale fields), and omits
 * empties/defaults so the output reads like the hand-written examples.
 */
import { stringify } from 'yaml';
import { fieldAppliesTo, EVERYONE } from '@disco/domain/descriptor';
import type { EDoc, ERole, ECategory, EChannel, EOverwrite, ETag, EEmoji } from './model.js';
import { DEFAULT_COLOR } from './model.js';

type Obj = Record<string, unknown>;

function overwrite(o: EOverwrite): Obj {
  const out: Obj = { role: o.role };
  if (o.allow.length) out.allow = [...o.allow];
  if (o.deny.length) out.deny = [...o.deny];
  return out;
}

function tag(t: ETag): Obj {
  const out: Obj = { name: t.name };
  if (t.moderated) out.moderated = true;
  if (t.emoji.trim()) out.emoji = t.emoji.trim();
  return out;
}

function channel(c: EChannel): Obj {
  const out: Obj = { name: c.name, type: c.type };

  if (fieldAppliesTo('topic', c.type) && c.topic.trim()) out.topic = c.topic.trim();
  if (fieldAppliesTo('slowmode', c.type) && c.slowmode != null) out.slowmode = c.slowmode;
  if (fieldAppliesTo('nsfw', c.type) && c.nsfw) out.nsfw = true;
  if (fieldAppliesTo('bitrate', c.type) && c.bitrate != null) out.bitrate = c.bitrate * 1000;
  if (fieldAppliesTo('user_limit', c.type) && c.user_limit != null) out.user_limit = c.user_limit;

  if (fieldAppliesTo('forum', c.type)) {
    if (c.default_sort_order) out.default_sort_order = c.default_sort_order;
    if (c.default_forum_layout) out.default_forum_layout = c.default_forum_layout;
    if (c.default_reaction_emoji.trim()) out.default_reaction_emoji = c.default_reaction_emoji.trim();
    if (c.default_thread_rate_limit != null) out.default_thread_rate_limit = c.default_thread_rate_limit;
    if (c.default_auto_archive_duration != null) out.default_auto_archive_duration = c.default_auto_archive_duration;
    if (c.available_tags.length) out.available_tags = c.available_tags.map(tag);
  }

  if (c.permissions.length) out.permissions = c.permissions.map(overwrite);
  return out;
}

function role(r: ERole): Obj {
  // The @everyone role only applies permissions; other fields are ignored on sync.
  if (r.name === EVERYONE) {
    const out: Obj = { name: r.name };
    if (r.permissions.length) out.permissions = [...r.permissions];
    return out;
  }
  const out: Obj = { name: r.name };
  if (r.color && r.color.toLowerCase() !== DEFAULT_COLOR) out.color = r.color;
  if (r.hoist) out.hoist = true;
  if (r.mentionable) out.mentionable = true;
  if (r.permissions.length) out.permissions = [...r.permissions];
  return out;
}

function category(c: ECategory): Obj {
  const out: Obj = { name: c.name };
  if (c.permissions.length) out.permissions = c.permissions.map(overwrite);
  if (c.channels.length) out.channels = c.channels.map(channel);
  return out;
}

function emoji(e: EEmoji): Obj {
  return { name: e.name, image: e.image };
}

/** Build the plain template object (no `_id`, no empties). */
export function toTemplate(doc: EDoc): Obj {
  const out: Obj = {};
  if (doc.roles.length) out.roles = doc.roles.map(role);
  if (doc.categories.length) out.categories = doc.categories.map(category);
  if (doc.uncategorized.length) out.uncategorized = doc.uncategorized.map(channel);
  if (doc.emoji.length) out.emoji = doc.emoji.map(emoji);
  return out;
}

export function serialize(doc: EDoc): string {
  const obj = toTemplate(doc);
  if (Object.keys(obj).length === 0) {
    return '# Empty template — add roles, categories, channels, or emoji to get started.\n';
  }
  return stringify(obj, { lineWidth: 0 });
}
