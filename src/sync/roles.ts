import type { Role } from 'discord.js';
import type { RoleTemplate } from '../schema/types.js';
import type { SyncContext } from './sync-context.js';
import { diff } from './diff.js';
import { parseColor } from '../utils/color.js';
import { resolvePermissions } from '../utils/permission-map.js';
import { withRetry, apiThrottle } from '../utils/discord-helpers.js';
import { logger } from '../utils/logger.js';

export async function syncRoles(ctx: SyncContext): Promise<void> {
  await ctx.progress.report('roles', 'Starting role sync...');

  // Always map @everyone
  ctx.roleNameToId.set('@everyone', ctx.guild.roles.everyone.id);

  // Pre-check: warn about bot role position
  const botMember = ctx.guild.members.me;
  if (botMember) {
    const botHighestRole = botMember.roles.highest;
    logger.info(`Bot's highest role: "${botHighestRole.name}" (position ${botHighestRole.position})`);
    if (botHighestRole.position <= 1) {
      logger.warn(
        'Bot role is at the bottom of the hierarchy. ' +
        'Drag the bot\'s role higher in Server Settings > Roles to manage other roles.',
      );
      await ctx.progress.report('roles',
        '**Warning:** Bot role is very low in the role hierarchy. ' +
        'Drag the bot\'s role higher in Server Settings > Roles, above any roles it needs to manage.',
      );
    }
  }

  const currentRoles = [...ctx.guild.roles.cache.values()].filter(
    (r) => !r.managed && r.id !== ctx.guild.id,
  );

  const desiredRoles = ctx.template.roles.filter((r) => r.name !== '@everyone');

  const result = diff<RoleTemplate, Role>(
    desiredRoles,
    currentRoles,
    (r) => r.name,
    (r) => r.name,
    (desired, current) => {
      return (
        parseColor(desired.color) === current.color &&
        desired.hoist === current.hoist &&
        desired.mentionable === current.mentionable &&
        resolvePermissions(desired.permissions) === current.permissions.bitfield
      );
    },
  );

  // Delete roles not in template
  for (const role of result.toDelete) {
    try {
      await withRetry(() => role.delete('Template sync'), `delete role "${role.name}"`);
      ctx.deleted.push(`role: ${role.name}`);
      logger.info(`Deleted role: ${role.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.errors.push({ phase: 'roles', entity: `role:${role.name}`, operation: 'delete', message });
      logger.error(`Failed to delete role "${role.name}":`, error);
    }
    await apiThrottle();
  }

  // Create missing roles
  for (const desired of result.toCreate) {
    try {
      const created = await withRetry(
        () =>
          ctx.guild.roles.create({
            name: desired.name,
            color: parseColor(desired.color),
            hoist: desired.hoist,
            mentionable: desired.mentionable,
            permissions: resolvePermissions(desired.permissions),
            reason: 'Template sync',
          }),
        `create role "${desired.name}"`,
      );
      ctx.roleNameToId.set(desired.name, created.id);
      ctx.created.push(`role: ${desired.name}`);
      logger.info(`Created role: ${desired.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.errors.push({ phase: 'roles', entity: `role:${desired.name}`, operation: 'create', message });
      logger.error(`Failed to create role "${desired.name}":`, error);
    }
    await apiThrottle();
  }

  // Update existing roles
  for (const { desired, current } of result.toUpdate) {
    try {
      await withRetry(
        () =>
          current.edit({
            name: desired.name,
            color: parseColor(desired.color),
            hoist: desired.hoist,
            mentionable: desired.mentionable,
            permissions: resolvePermissions(desired.permissions),
            reason: 'Template sync',
          }),
        `update role "${desired.name}"`,
      );
      ctx.roleNameToId.set(desired.name, current.id);
      ctx.updated.push(`role: ${desired.name}`);
      logger.info(`Updated role: ${desired.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.errors.push({ phase: 'roles', entity: `role:${desired.name}`, operation: 'update', message });
      logger.error(`Failed to update role "${desired.name}":`, error);
    }
    ctx.roleNameToId.set(desired.name, current.id);
    await apiThrottle();
  }

  // Map unchanged roles
  for (const role of currentRoles) {
    if (!ctx.roleNameToId.has(role.name)) {
      ctx.roleNameToId.set(role.name, role.id);
    }
  }

  // Handle @everyone permissions
  const everyoneTemplate = ctx.template.roles.find((r) => r.name === '@everyone');
  if (everyoneTemplate) {
    try {
      const everyone = ctx.guild.roles.everyone;
      const desiredPerms = resolvePermissions(everyoneTemplate.permissions);
      if (everyone.permissions.bitfield !== desiredPerms) {
        await withRetry(
          () => everyone.edit({ permissions: desiredPerms, reason: 'Template sync' }),
          'update @everyone',
        );
        ctx.updated.push('role: @everyone');
        logger.info('Updated @everyone permissions');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.errors.push({ phase: 'roles', entity: 'role:@everyone', operation: 'update', message });
    }
  }

  // Reorder roles to match template order (index 0 = highest priority).
  // All positions must be BELOW the bot's highest role — Discord enforces
  // this regardless of Administrator permission.
  if (desiredRoles.length > 0) {
    // Re-fetch roles AND the bot member so positions reflect creates/deletes we just did.
    await ctx.guild.roles.fetch();
    await ctx.guild.members.fetchMe();
    const botHighest = ctx.guild.members.me?.roles.highest;
    const ceiling = botHighest ? botHighest.position : desiredRoles.length + 1;
    logger.info(`Role reorder: bot highest role "${botHighest?.name}" at position ${botHighest?.position}, ceiling=${ceiling}`);

    try {
      // Stack roles just below the bot: first template role → ceiling-1, next → ceiling-2, etc.
      // Skip the bot's own role to avoid moving it.
      const botRoleIds = new Set(ctx.guild.members.me?.roles.cache.keys() ?? []);
      const positions = desiredRoles
        .map((r, i) => {
          const id = ctx.roleNameToId.get(r.name);
          if (!id || botRoleIds.has(id)) return null;
          return { role: id, position: Math.max(1, ceiling - 1 - i) };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);

      if (positions.length > 0) {
        await withRetry(
          () => ctx.guild.roles.setPositions(positions),
          'reorder roles',
        );
        logger.info(`Reordered ${positions.length} roles (ceiling: ${ceiling})`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.errors.push({ phase: 'roles', entity: 'roles', operation: 'reorder', message });
      logger.error('Failed to reorder roles:', error);
    }
  }

  const total = result.toCreate.length + result.toUpdate.length + result.toDelete.length;
  await ctx.progress.report('roles', `Done. ${total} change(s).`);
}
