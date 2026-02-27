import type { GuildChannel } from 'discord.js';
import { PermissionsBitField } from 'discord.js';
import type { PermissionOverwriteTemplate } from '../schema/types.js';
import type { SyncContext } from './sync-context.js';
import { resolvePermissions } from '../utils/permission-map.js';
import { withRetry } from '../utils/discord-helpers.js';
import { logger } from '../utils/logger.js';

/**
 * Replaces all permission overwrites on a channel with the desired set.
 */
export async function applyPermissionOverwrites(
  ctx: SyncContext,
  channel: GuildChannel,
  overwrites: PermissionOverwriteTemplate[],
): Promise<void> {
  const resolved: Array<{
    id: string;
    allow: PermissionsBitField;
    deny: PermissionsBitField;
  }> = [];

  for (const ow of overwrites) {
    const roleId = ctx.roleNameToId.get(ow.role);
    if (!roleId) {
      ctx.errors.push({
        phase: 'permissions',
        entity: `${channel.name}/role:${ow.role}`,
        operation: 'update',
        message: `Role "${ow.role}" not found`,
      });
      continue;
    }
    resolved.push({
      id: roleId,
      allow: new PermissionsBitField(resolvePermissions(ow.allow)),
      deny: new PermissionsBitField(resolvePermissions(ow.deny)),
    });
  }

  try {
    await withRetry(
      () => channel.permissionOverwrites.set(resolved, 'Template sync'),
      `set permissions on #${channel.name}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.errors.push({
      phase: 'permissions',
      entity: `channel:${channel.name}`,
      operation: 'update',
      message,
    });
    logger.error(`Failed to set permissions on #${channel.name}:`, error);
  }
}
