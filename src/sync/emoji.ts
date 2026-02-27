import type { GuildEmoji } from 'discord.js';
import type { EmojiTemplate } from '../schema/types.js';
import type { SyncContext } from './sync-context.js';
import { diff } from './diff.js';
import { withRetry, apiThrottle } from '../utils/discord-helpers.js';
import { logger } from '../utils/logger.js';

export async function syncEmoji(ctx: SyncContext): Promise<void> {
  await ctx.progress.report('emoji', 'Starting emoji sync...');

  const currentEmoji = [...ctx.guild.emojis.cache.values()].filter((e) => !e.managed);
  const desiredEmoji = ctx.template.emoji;

  const result = diff<EmojiTemplate, GuildEmoji>(
    desiredEmoji,
    currentEmoji,
    (e) => e.name,
    (e) => e.name ?? '',
    (desired, current) => {
      // We can't compare images, so if name matches we consider it equal
      return desired.name === current.name;
    },
  );

  // Delete emoji not in template
  for (const emoji of result.toDelete) {
    try {
      await withRetry(
        () => emoji.delete('Template sync'),
        `delete emoji :${emoji.name}:`,
      );
      ctx.deleted.push(`emoji: :${emoji.name}:`);
      logger.info(`Deleted emoji: :${emoji.name}:`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.errors.push({ phase: 'emoji', entity: `emoji:${emoji.name}`, operation: 'delete', message });
      logger.error(`Failed to delete emoji :${emoji.name}::`, error);
    }
    await apiThrottle();
  }

  // Create missing emoji
  for (const desired of result.toCreate) {
    try {
      await withRetry(
        () =>
          ctx.guild.emojis.create({
            name: desired.name,
            attachment: desired.image,
            reason: 'Template sync',
          }),
        `create emoji :${desired.name}:`,
      );
      ctx.created.push(`emoji: :${desired.name}:`);
      logger.info(`Created emoji: :${desired.name}:`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.errors.push({ phase: 'emoji', entity: `emoji:${desired.name}`, operation: 'create', message });
      logger.error(`Failed to create emoji :${desired.name}::`, error);
    }
    await apiThrottle();
  }

  const total = result.toCreate.length + result.toDelete.length;
  await ctx.progress.report('emoji', `Done. ${total} change(s).`);
}
