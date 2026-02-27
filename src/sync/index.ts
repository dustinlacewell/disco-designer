import type { ChatInputCommandInteraction, Guild } from 'discord.js';
import type { ServerTemplate } from '../schema/types.js';
import { createSyncContext, type SyncResult } from './sync-context.js';
import { createProgressReporter } from './progress.js';
import { syncRoles } from './roles.js';
import { syncCategories, deleteOrphanedCategories } from './categories.js';
import { syncChannels } from './channels.js';
import { syncEmoji } from './emoji.js';
import { logger } from '../utils/logger.js';

/** Set of guild IDs currently being synced (prevents concurrent syncs). */
const activeSyncs = new Set<string>();

/**
 * Runs the full sync pipeline: roles → categories → channels → delete orphaned categories → emoji.
 */
export async function syncServer(
  guild: Guild,
  template: ServerTemplate,
  interaction: ChatInputCommandInteraction,
): Promise<SyncResult> {
  if (activeSyncs.has(guild.id)) {
    throw new Error('A sync is already in progress for this server.');
  }

  activeSyncs.add(guild.id);
  const start = Date.now();
  const progress = createProgressReporter(interaction);
  const ctx = createSyncContext(guild, template, interaction, progress);

  try {
    // Caches should already be populated by preflight in the command handler,
    // but re-fetch to ensure freshness right before mutations.
    await guild.roles.fetch();
    await guild.channels.fetch();
    await guild.emojis.fetch();

    // Phase 1: Roles
    logger.info('Phase 1: Syncing roles...');
    await syncRoles(ctx);

    // If roles phase failed catastrophically (no role mappings), abort
    if (ctx.roleNameToId.size <= 1) {
      // Only @everyone mapped
      const roleErrors = ctx.errors.filter((e) => e.phase === 'roles');
      if (roleErrors.length > 0) {
        logger.error('Role sync failed catastrophically, aborting remaining phases.');
        return buildResult(ctx, start);
      }
    }

    // Phase 2: Categories
    logger.info('Phase 2: Syncing categories...');
    await syncCategories(ctx);

    // Phase 3: Channels
    logger.info('Phase 3: Syncing channels...');
    await syncChannels(ctx);

    // Phase 4: Delete orphaned categories
    logger.info('Phase 4: Deleting orphaned categories...');
    await deleteOrphanedCategories(ctx);

    // Phase 5: Emoji
    logger.info('Phase 5: Syncing emoji...');
    await syncEmoji(ctx);

    logger.info('Sync complete.');
    return buildResult(ctx, start);
  } catch (error) {
    logger.error('Sync aborted with unexpected error:', error);
    const message = error instanceof Error ? error.message : String(error);
    ctx.errors.push({
      phase: 'roles',
      entity: 'sync',
      operation: 'update',
      message: `Sync aborted: ${message}`,
    });
    return buildResult(ctx, start);
  } finally {
    activeSyncs.delete(guild.id);
  }
}

function buildResult(ctx: ReturnType<typeof createSyncContext>, start: number): SyncResult {
  return {
    success: ctx.errors.length === 0,
    created: ctx.created,
    updated: ctx.updated,
    deleted: ctx.deleted,
    errors: ctx.errors,
    durationMs: Date.now() - start,
  };
}
