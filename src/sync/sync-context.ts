import type { ChatInputCommandInteraction, Guild } from 'discord.js';
import type { ServerTemplate } from '../schema/types.js';
import type { ProgressReporter } from './progress.js';

export type SyncPhase = 'roles' | 'categories' | 'channels' | 'permissions' | 'emoji';

export interface SyncError {
  phase: SyncPhase;
  entity: string;
  operation: 'create' | 'update' | 'delete' | 'reorder';
  message: string;
}

export interface SyncResult {
  success: boolean;
  created: string[];
  updated: string[];
  deleted: string[];
  errors: SyncError[];
  durationMs: number;
}

export interface SyncContext {
  guild: Guild;
  template: ServerTemplate;
  interaction: ChatInputCommandInteraction;

  roleNameToId: Map<string, string>;
  categoryNameToId: Map<string, string>;

  created: string[];
  updated: string[];
  deleted: string[];
  errors: SyncError[];

  progress: ProgressReporter;
}

export function createSyncContext(
  guild: Guild,
  template: ServerTemplate,
  interaction: ChatInputCommandInteraction,
  progress: ProgressReporter,
): SyncContext {
  return {
    guild,
    template,
    interaction,
    roleNameToId: new Map(),
    categoryNameToId: new Map(),
    created: [],
    updated: [],
    deleted: [],
    errors: [],
    progress,
  };
}
