/**
 * Editor-local document model. Mirrors the shared `ServerTemplate` schema but adds a stable
 * client `_id` to every node (for keyed rendering, selection, and reorder) and keeps every
 * field present (empty string / null) so form inputs bind without undefined churn.
 *
 * `serialize.ts` collapses this back to clean YAML (omitting empties/defaults); the shared
 * zod schema in `@disco/schema` remains the sole validator.
 */
import type { ChannelType } from '@disco/domain/descriptor';

export type Id = string;

let counter = 0;
/** Monotonic, session-local id. Never serialized. */
export function newId(): Id {
  counter += 1;
  return `n${counter}`;
}

/**
 * Advance the id counter past every `_id` already present in a hydrated tree, so ids minted
 * after restoring from localStorage never collide with restored ones.
 */
export function syncCounterToDoc(root: unknown): void {
  let max = counter;
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) {
      for (const x of v) walk(x);
      return;
    }
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      if (typeof o._id === 'string' && o._id[0] === 'n') {
        const n = Number(o._id.slice(1));
        if (Number.isFinite(n) && n > max) max = n;
      }
      for (const val of Object.values(o)) walk(val);
    }
  };
  walk(root);
  counter = max;
}

export interface EOverwrite {
  _id: Id;
  role: string;
  allow: string[];
  deny: string[];
}

export interface ETag {
  _id: Id;
  name: string;
  moderated: boolean;
  emoji: string;
}

export interface EChannel {
  _id: Id;
  name: string;
  type: ChannelType;
  topic: string;
  slowmode: number | null;
  nsfw: boolean;
  bitrate: number | null;
  user_limit: number | null;
  permissions: EOverwrite[];
  // Forum-only
  default_reaction_emoji: string;
  default_sort_order: string;
  default_forum_layout: string;
  default_thread_rate_limit: number | null;
  default_auto_archive_duration: number | null;
  available_tags: ETag[];
}

export interface ERole {
  _id: Id;
  name: string;
  color: string;
  hoist: boolean;
  mentionable: boolean;
  permissions: string[];
}

export interface ECategory {
  _id: Id;
  name: string;
  permissions: EOverwrite[];
  channels: EChannel[];
}

export interface EEmoji {
  _id: Id;
  name: string;
  image: string;
}

export interface EDoc {
  roles: ERole[];
  categories: ECategory[];
  uncategorized: EChannel[];
  emoji: EEmoji[];
}

export const DEFAULT_COLOR = '#000000';

// ---------------------------------------------------------------------------
// Factories — new nodes with friendly defaults
// ---------------------------------------------------------------------------

export function newRole(name = 'New Role'): ERole {
  return { _id: newId(), name, color: DEFAULT_COLOR, hoist: false, mentionable: false, permissions: [] };
}

export function newEveryone(): ERole {
  return { _id: newId(), name: '@everyone', color: DEFAULT_COLOR, hoist: false, mentionable: false, permissions: [] };
}

export function newOverwrite(role = '@everyone'): EOverwrite {
  return { _id: newId(), role, allow: [], deny: [] };
}

export function newTag(name = 'New Tag'): ETag {
  return { _id: newId(), name, moderated: false, emoji: '' };
}

export function newChannel(type: ChannelType = 'text', name = 'new-channel'): EChannel {
  return {
    _id: newId(),
    name,
    type,
    topic: '',
    slowmode: null,
    nsfw: false,
    bitrate: null,
    user_limit: null,
    permissions: [],
    default_reaction_emoji: '',
    default_sort_order: '',
    default_forum_layout: '',
    default_thread_rate_limit: null,
    default_auto_archive_duration: null,
    available_tags: [],
  };
}

export function newCategory(name = 'NEW CATEGORY'): ECategory {
  return { _id: newId(), name, permissions: [], channels: [] };
}

export function newEmoji(name = 'new_emoji'): EEmoji {
  return { _id: newId(), name, image: '' };
}

export function emptyDoc(): EDoc {
  return { roles: [], categories: [], uncategorized: [], emoji: [] };
}

/**
 * Deep clone a node and assign it (and every descendant) fresh ids.
 *
 * Uses a JSON round-trip rather than `structuredClone`: nodes handed in are Svelte `$state`
 * proxies, which `structuredClone` rejects with a DataCloneError. The model is pure JSON
 * (strings/numbers/booleans/null/arrays), so JSON cloning is lossless and drops the proxy.
 */
export function cloneWithNewIds<T>(node: T): T {
  const copy = JSON.parse(JSON.stringify(node)) as unknown;
  reassignIds(copy);
  return copy as T;
}

function reassignIds(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) reassignIds(item);
    return;
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if ('_id' in obj) obj._id = newId();
    for (const key of Object.keys(obj)) reassignIds(obj[key]);
  }
}
