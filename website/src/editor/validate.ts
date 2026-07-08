/**
 * Live validation for the current editor doc: schema errors (from the shared zod schema)
 * plus cross-entity soft warnings (limits, dangling role references, duplicate names) that
 * the per-field schema can't express.
 */
import { ServerTemplateSchema } from '@disco/schema/server-template.schema';
import { LIMITS, EVERYONE } from '@disco/domain/descriptor';
import { toTemplate } from './serialize.js';
import type { EDoc, EChannel, EOverwrite } from './model.js';

export interface Validation {
  errors: string[];
  warnings: string[];
}

export function validate(doc: EDoc): Validation {
  const res = ServerTemplateSchema.safeParse(toTemplate(doc));
  const errors = res.success
    ? []
    : res.error.issues.map((i) => {
        const path = i.path.join('.');
        return path ? `${path}: ${i.message}` : i.message;
      });

  return { errors, warnings: warnings(doc) };
}

function warnings(doc: EDoc): string[] {
  const out: string[] = [];

  // ---- Counts against Discord limits ----
  if (doc.roles.length > LIMITS.roles) out.push(`${doc.roles.length} roles exceeds the limit of ${LIMITS.roles}.`);
  if (doc.categories.length > LIMITS.categories)
    out.push(`${doc.categories.length} categories exceeds the limit of ${LIMITS.categories}.`);

  const allChannels: EChannel[] = [...doc.uncategorized, ...doc.categories.flatMap((c) => c.channels)];
  const totalChannels = allChannels.length + doc.categories.length;
  if (totalChannels > LIMITS.channelsPerServer)
    out.push(`${totalChannels} channels (incl. categories) exceeds the limit of ${LIMITS.channelsPerServer}.`);

  for (const cat of doc.categories) {
    if (cat.channels.length > LIMITS.channelsPerCategory)
      out.push(`Category "${cat.name}" has ${cat.channels.length} channels (limit ${LIMITS.channelsPerCategory}).`);
  }

  for (const ch of allChannels) {
    if (ch.type === 'forum' && ch.available_tags.length > LIMITS.tagsPerForum)
      out.push(`Forum "${ch.name}" has ${ch.available_tags.length} tags (limit ${LIMITS.tagsPerForum}).`);
  }

  // ---- Dangling permission-overwrite role references ----
  const roleNames = new Set(doc.roles.map((r) => r.name));
  roleNames.add(EVERYONE);
  const checkOverwrites = (owner: string, list: EOverwrite[]) => {
    for (const o of list) {
      if (o.role && !roleNames.has(o.role))
        out.push(`${owner}: permission overwrite references undefined role "${o.role}".`);
    }
  };
  for (const cat of doc.categories) {
    checkOverwrites(`Category "${cat.name}"`, cat.permissions);
    for (const ch of cat.channels) checkOverwrites(`Channel "${ch.name}"`, ch.permissions);
  }
  for (const ch of doc.uncategorized) checkOverwrites(`Channel "${ch.name}"`, ch.permissions);

  // ---- Duplicate names ----
  dupes(doc.roles.map((r) => r.name)).forEach((n) => out.push(`Duplicate role name "${n}".`));
  dupes(doc.categories.map((c) => c.name)).forEach((n) => out.push(`Duplicate category name "${n}".`));
  dupes(doc.emoji.map((e) => e.name)).forEach((n) => out.push(`Duplicate emoji name "${n}".`));

  return out;
}

function dupes(names: string[]): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const n of names) {
    if (seen.has(n)) dup.add(n);
    seen.add(n);
  }
  return [...dup];
}
