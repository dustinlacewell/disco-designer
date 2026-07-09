/**
 * The editor's single reactive store. Holds the document tree, the current selection, and
 * derived YAML + validation. Every mutation the UI performs goes through a method here so
 * selection stays coherent after add/remove/reorder.
 */
import type { ChannelType } from '@disco/domain/descriptor';
import { EVERYONE } from '@disco/domain/descriptor';
import {
  emptyDoc,
  newRole,
  newEveryone,
  newCategory,
  newChannel,
  newEmoji,
  cloneWithNewIds,
  syncCounterToDoc,
  type EDoc,
  type EOverwrite,
  type ERole,
  type ECategory,
  type EChannel,
  type EEmoji,
  type Id,
} from './model.js';
import { serialize } from './serialize.js';
import { validate, type Validation } from './validate.js';
import { deserialize, type ImportResult } from './deserialize.js';

export type Selection =
  | { kind: 'server' }
  | { kind: 'role'; id: Id }
  | { kind: 'category'; id: Id }
  | { kind: 'channel'; id: Id }
  | { kind: 'emoji'; id: Id };

/** Parent target for channel creation. */
export type ChannelParent = { kind: 'uncategorized' } | { kind: 'category'; id: Id };

export type OutputTab = 'yaml' | 'preview' | 'validation';

const STORAGE_KEY = 'disco.editor.v1';

type WithId = { _id: Id };

function idx<T extends WithId>(list: T[], id: Id): number {
  return list.findIndex((x) => x._id === id);
}

function moveInList<T extends WithId>(list: T[], id: Id, dir: -1 | 1): void {
  const i = idx(list, id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
}

class EditorStore {
  doc = $state<EDoc>(emptyDoc());
  selection = $state<Selection>({ kind: 'server' });
  outputTab = $state<OutputTab>('yaml');

  yaml = $derived(serialize(this.doc));
  validation = $derived<Validation>(validate(this.doc));

  constructor() {
    this.hydrate();
  }

  /** Restore the full editor state from localStorage (browser only). */
  private hydrate() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { doc?: EDoc; selection?: Selection; outputTab?: OutputTab };
      if (data.doc) {
        this.doc = data.doc;
        syncCounterToDoc(this.doc);
      }
      if (data.outputTab) this.outputTab = data.outputTab;
      if (data.selection) {
        this.selection = data.selection;
        this.afterRemove(); // drop a selection whose node no longer exists
      }
    } catch {
      /* ignore corrupt persisted state */
    }
  }

  /** Persist the full editor state. Called from a Svelte effect so it tracks every change. */
  save() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ v: 1, doc: this.doc, selection: this.selection, outputTab: this.outputTab }),
      );
    } catch {
      /* quota or serialization failure — non-fatal */
    }
  }

  // -- selection helpers ---------------------------------------------------
  select(sel: Selection) {
    this.selection = sel;
  }

  isSelected(kind: Selection['kind'], id?: Id): boolean {
    if (this.selection.kind !== kind) return false;
    if (id === undefined) return true;
    return 'id' in this.selection && this.selection.id === id;
  }

  get hasEveryone(): boolean {
    return this.doc.roles.some((r) => r.name === EVERYONE);
  }

  /** All role names usable as overwrite targets (defined roles + @everyone). */
  get roleNames(): string[] {
    const names = this.doc.roles.map((r) => r.name).filter((n) => n !== EVERYONE);
    return [EVERYONE, ...names];
  }

  // -- lookups -------------------------------------------------------------
  role(id: Id): ERole | undefined {
    return this.doc.roles.find((r) => r._id === id);
  }
  category(id: Id): ECategory | undefined {
    return this.doc.categories.find((c) => c._id === id);
  }
  emojiNode(id: Id): EEmoji | undefined {
    return this.doc.emoji.find((e) => e._id === id);
  }
  /** Find a channel and the array that holds it (category channels or uncategorized). */
  channelWithList(id: Id): { channel: EChannel; list: EChannel[] } | undefined {
    if (idx(this.doc.uncategorized, id) >= 0)
      return { channel: this.doc.uncategorized[idx(this.doc.uncategorized, id)], list: this.doc.uncategorized };
    for (const cat of this.doc.categories) {
      const i = idx(cat.channels, id);
      if (i >= 0) return { channel: cat.channels[i], list: cat.channels };
    }
    return undefined;
  }
  channel(id: Id): EChannel | undefined {
    return this.channelWithList(id)?.channel;
  }

  // -- roles ---------------------------------------------------------------
  addRole() {
    const r = newRole();
    this.doc.roles.push(r);
    this.select({ kind: 'role', id: r._id });
  }
  addEveryone() {
    if (this.hasEveryone) return;
    const r = newEveryone();
    this.doc.roles.push(r);
    this.select({ kind: 'role', id: r._id });
  }
  duplicateRole(id: Id) {
    const i = idx(this.doc.roles, id);
    if (i < 0 || this.doc.roles[i].name === EVERYONE) return;
    const copy = cloneWithNewIds(this.doc.roles[i]);
    copy.name = `${copy.name} copy`;
    this.doc.roles.splice(i + 1, 0, copy);
    this.select({ kind: 'role', id: copy._id });
  }
  removeRole(id: Id) {
    const i = idx(this.doc.roles, id);
    if (i < 0) return;
    const { name } = this.doc.roles[i];
    this.doc.roles.splice(i, 1);
    if (name !== EVERYONE) this.dropOverwritesForRole(name);
    this.afterRemove();
  }
  /** Rename a role and retarget every overwrite that referenced its old name. */
  renameRole(id: Id, name: string) {
    const role = this.role(id);
    if (!role || role.name === name) return;
    const prev = role.name;
    role.name = name;
    if (prev !== EVERYONE) this.retargetOverwrites(prev, name);
  }
  moveRole(id: Id, dir: -1 | 1) {
    moveInList(this.doc.roles, id, dir);
  }

  // -- categories ----------------------------------------------------------
  addCategory() {
    const c = newCategory();
    this.doc.categories.push(c);
    this.select({ kind: 'category', id: c._id });
  }
  duplicateCategory(id: Id) {
    const i = idx(this.doc.categories, id);
    if (i < 0) return;
    const copy = cloneWithNewIds(this.doc.categories[i]);
    copy.name = `${copy.name} COPY`;
    this.doc.categories.splice(i + 1, 0, copy);
    this.select({ kind: 'category', id: copy._id });
  }
  removeCategory(id: Id) {
    const i = idx(this.doc.categories, id);
    if (i < 0) return;
    this.doc.categories.splice(i, 1);
    this.afterRemove();
  }
  moveCategory(id: Id, dir: -1 | 1) {
    moveInList(this.doc.categories, id, dir);
  }

  // -- channels ------------------------------------------------------------
  addChannel(parent: ChannelParent, type: ChannelType = 'text') {
    const ch = newChannel(type);
    const list = parent.kind === 'uncategorized' ? this.doc.uncategorized : this.category(parent.id)?.channels;
    if (!list) return;
    list.push(ch);
    this.select({ kind: 'channel', id: ch._id });
  }
  duplicateChannel(id: Id) {
    const found = this.channelWithList(id);
    if (!found) return;
    const i = idx(found.list, id);
    const copy = cloneWithNewIds(found.channel);
    copy.name = `${copy.name}-copy`;
    found.list.splice(i + 1, 0, copy);
    this.select({ kind: 'channel', id: copy._id });
  }
  removeChannel(id: Id) {
    const found = this.channelWithList(id);
    if (!found) return;
    found.list.splice(idx(found.list, id), 1);
    this.afterRemove();
  }
  moveChannel(id: Id, dir: -1 | 1) {
    const found = this.channelWithList(id);
    if (found) moveInList(found.list, id, dir);
  }

  // -- emoji ---------------------------------------------------------------
  addEmoji() {
    const e = newEmoji();
    this.doc.emoji.push(e);
    this.select({ kind: 'emoji', id: e._id });
  }
  duplicateEmoji(id: Id) {
    const i = idx(this.doc.emoji, id);
    if (i < 0) return;
    const copy = cloneWithNewIds(this.doc.emoji[i]);
    copy.name = `${copy.name}_copy`;
    this.doc.emoji.splice(i + 1, 0, copy);
    this.select({ kind: 'emoji', id: copy._id });
  }
  removeEmoji(id: Id) {
    const i = idx(this.doc.emoji, id);
    if (i < 0) return;
    this.doc.emoji.splice(i, 1);
    this.afterRemove();
  }
  moveEmoji(id: Id, dir: -1 | 1) {
    moveInList(this.doc.emoji, id, dir);
  }

  private afterRemove() {
    // If the selected node no longer exists, fall back to the server node.
    const sel = this.selection;
    if (sel.kind === 'server') return;
    const exists =
      (sel.kind === 'role' && this.role(sel.id)) ||
      (sel.kind === 'category' && this.category(sel.id)) ||
      (sel.kind === 'channel' && this.channel(sel.id)) ||
      (sel.kind === 'emoji' && this.emojiNode(sel.id));
    if (!exists) this.selection = { kind: 'server' };
  }

  /** Run `fn` over every permission-overwrite list in the document. */
  private forEachOverwriteList(fn: (list: EOverwrite[]) => void) {
    for (const cat of this.doc.categories) {
      fn(cat.permissions);
      for (const ch of cat.channels) fn(ch.permissions);
    }
    for (const ch of this.doc.uncategorized) fn(ch.permissions);
  }

  /** Drop every overwrite targeting `role` (referential cleanup on role delete). */
  private dropOverwritesForRole(role: string) {
    this.forEachOverwriteList((list) => {
      for (let i = list.length - 1; i >= 0; i--) if (list[i].role === role) list.splice(i, 1);
    });
  }

  /** Point every overwrite targeting `from` at `to` (referential cleanup on role rename). */
  private retargetOverwrites(from: string, to: string) {
    this.forEachOverwriteList((list) => {
      for (const o of list) if (o.role === from) o.role = to;
    });
  }

  // -- document-level ------------------------------------------------------
  reset() {
    this.doc = emptyDoc();
    this.selection = { kind: 'server' };
  }

  load(doc: EDoc) {
    this.doc = doc;
    this.selection = { kind: 'server' };
  }

  importYaml(text: string): ImportResult {
    const result = deserialize(text);
    if (result.ok) this.load(result.doc);
    return result;
  }
}

export const store = new EditorStore();
