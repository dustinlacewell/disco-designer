import { ChannelType, type CategoryChannel } from 'discord.js';
import type { CategoryTemplate } from '../schema/types.js';
import type { SyncContext } from './sync-context.js';
import { diff } from './diff.js';
import { applyPermissionOverwrites } from './permissions.js';
import { withRetry, apiThrottle } from '../utils/discord-helpers.js';
import { logger } from '../utils/logger.js';

export async function syncCategories(ctx: SyncContext): Promise<void> {
  await ctx.progress.report('categories', 'Starting category sync...');

  const currentCategories = [...ctx.guild.channels.cache.values()].filter(
    (ch): ch is CategoryChannel => ch.type === ChannelType.GuildCategory,
  );

  const desiredCategories = ctx.template.categories;

  const result = diff<CategoryTemplate, CategoryChannel>(
    desiredCategories,
    currentCategories,
    (c) => c.name,
    (c) => c.name,
    () => false, // Always check for updates (permissions may have changed)
  );

  // Create missing categories
  for (const desired of result.toCreate) {
    try {
      const created = await withRetry(
        () =>
          ctx.guild.channels.create({
            name: desired.name,
            type: ChannelType.GuildCategory,
            reason: 'Template sync',
          }),
        `create category "${desired.name}"`,
      );
      ctx.categoryNameToId.set(desired.name, created.id);
      ctx.created.push(`category: ${desired.name}`);
      logger.info(`Created category: ${desired.name}`);

      // Apply category permissions
      if (desired.permissions.length > 0) {
        await applyPermissionOverwrites(ctx, created, desired.permissions);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.errors.push({ phase: 'categories', entity: `category:${desired.name}`, operation: 'create', message });
      logger.error(`Failed to create category "${desired.name}":`, error);
    }
    await apiThrottle();
  }

  // Update existing categories (apply permissions)
  for (const { desired, current } of result.toUpdate) {
    try {
      // Update name if different
      if (current.name !== desired.name) {
        await withRetry(
          () => current.edit({ name: desired.name, reason: 'Template sync' }),
          `update category "${desired.name}"`,
        );
        ctx.updated.push(`category: ${desired.name}`);
        logger.info(`Updated category: ${desired.name}`);
      }

      // Apply permissions
      if (desired.permissions.length > 0) {
        await applyPermissionOverwrites(ctx, current, desired.permissions);
      } else {
        // Clear all overwrites if none specified
        await withRetry(
          () => current.permissionOverwrites.set([], 'Template sync'),
          `clear permissions on category "${desired.name}"`,
        );
      }

      ctx.categoryNameToId.set(desired.name, current.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.errors.push({ phase: 'categories', entity: `category:${desired.name}`, operation: 'update', message });
      logger.error(`Failed to update category "${desired.name}":`, error);
    }
    ctx.categoryNameToId.set(desired.name, current.id);
    await apiThrottle();
  }

  // Reorder categories
  const categoryPositions = desiredCategories
    .map((cat, index) => {
      const id = ctx.categoryNameToId.get(cat.name);
      if (!id) return null;
      return { channel: id, position: index };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  if (categoryPositions.length > 0) {
    try {
      await withRetry(
        () => ctx.guild.channels.setPositions(categoryPositions),
        'reorder categories',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.errors.push({ phase: 'categories', entity: 'categories', operation: 'reorder', message });
    }
  }

  const total = result.toCreate.length + result.toUpdate.length;
  await ctx.progress.report('categories', `Done. ${total} change(s).`);
}

/**
 * Delete categories that exist on the server but not in the template.
 * Called AFTER channels have been synced (so children are already handled).
 */
export async function deleteOrphanedCategories(ctx: SyncContext): Promise<void> {
  const currentCategories = [...ctx.guild.channels.cache.values()].filter(
    (ch): ch is CategoryChannel => ch.type === ChannelType.GuildCategory,
  );

  const desiredNames = new Set(ctx.template.categories.map((c) => c.name));

  for (const cat of currentCategories) {
    if (!desiredNames.has(cat.name)) {
      try {
        await withRetry(
          () => cat.delete('Template sync — orphaned category'),
          `delete category "${cat.name}"`,
        );
        ctx.deleted.push(`category: ${cat.name}`);
        logger.info(`Deleted orphaned category: ${cat.name}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.errors.push({ phase: 'categories', entity: `category:${cat.name}`, operation: 'delete', message });
        logger.error(`Failed to delete category "${cat.name}":`, error);
      }
      await apiThrottle();
    }
  }
}
