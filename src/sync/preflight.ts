import {
  PermissionFlagsBits,
  GuildFeature,
  ChannelType,
  type Guild,
} from 'discord.js';
import type { ServerTemplate } from '../schema/types.js';
import { resolvePermissions } from '../utils/permission-map.js';

export type IssueSeverity = 'error' | 'warning';

export interface PreflightIssue {
  severity: IssueSeverity;
  message: string;
}

export interface PreflightResult {
  issues: PreflightIssue[];
  errors: PreflightIssue[];
  warnings: PreflightIssue[];
  canProceed: boolean;
}

/**
 * Analyzes a template against the current guild state and bot capabilities.
 * Returns all issues that would cause failures during sync, BEFORE any mutations.
 *
 * The guild caches (roles, channels, emojis) must be populated before calling this.
 */
export function runPreflight(guild: Guild, template: ServerTemplate): PreflightResult {
  const issues: PreflightIssue[] = [];

  const me = guild.members.me;
  if (!me) {
    issues.push({ severity: 'error', message: 'Cannot find the bot member in this guild.' });
    return buildResult(issues);
  }

  // --- Bot base permissions ---
  checkBotBasePermissions(me, issues);

  // --- Role hierarchy ---
  checkRoleHierarchy(guild, me, template, issues);

  // --- Role permission grants ---
  checkRolePermissionGrants(me, template, issues);

  // --- Announcement channels need Community ---
  checkCommunityFeature(guild, template, issues);

  // --- Channel limits ---
  checkChannelLimits(template, issues);

  // --- Emoji limits ---
  checkEmojiLimits(guild, template, issues);

  // --- Inaccessible channels that need deletion ---
  checkInaccessibleChannels(guild, me, template, issues);

  return buildResult(issues);
}

function error(message: string): PreflightIssue {
  return { severity: 'error', message };
}

function warning(message: string): PreflightIssue {
  return { severity: 'warning', message };
}

/**
 * Check that the bot has the base permissions needed for sync operations.
 */
function checkBotBasePermissions(
  me: NonNullable<Guild['members']['me']>,
  issues: PreflightIssue[],
): void {
  const required: Array<{ flag: bigint; name: string }> = [
    { flag: PermissionFlagsBits.ManageRoles, name: 'Manage Roles' },
    { flag: PermissionFlagsBits.ManageChannels, name: 'Manage Channels' },
    { flag: PermissionFlagsBits.ViewChannel, name: 'View Channels' },
  ];

  // ManageEmojisAndStickers only needed if template has emoji
  // (checked separately in checkEmojiLimits)

  for (const { flag, name } of required) {
    if (!me.permissions.has(flag)) {
      issues.push(error(`Bot is missing the **${name}** permission.`));
    }
  }
}

/**
 * Check that the bot's highest role is positioned above all roles it needs to manage.
 * Also checks that managed/integration roles won't be touched.
 */
function checkRoleHierarchy(
  guild: Guild,
  me: NonNullable<Guild['members']['me']>,
  template: ServerTemplate,
  issues: PreflightIssue[],
): void {
  const botHighest = me.roles.highest;
  const desiredRoleNames = new Set(template.roles.map((r) => r.name));

  // Check roles that need to be CREATED — bot needs its role above position 0
  // to create any roles at all
  if (botHighest.position <= 1 && template.roles.filter((r) => r.name !== '@everyone').length > 0) {
    issues.push(error(
      `Bot's highest role "${botHighest.name}" is at position ${botHighest.position}. ` +
      `Drag it higher in **Server Settings > Roles** so it's above the roles it needs to manage.`,
    ));
    return; // No point checking individual roles if the bot is at the bottom
  }

  // Check roles that currently exist and would be UPDATED or DELETED —
  // they must be below the bot's highest role
  for (const role of guild.roles.cache.values()) {
    if (role.managed || role.id === guild.id) continue; // Skip @everyone and bot/integration roles

    const willBeManaged = desiredRoleNames.has(role.name) || !desiredRoleNames.has(role.name);
    // ^ Every non-managed, non-@everyone role will be either updated or deleted

    if (role.position >= botHighest.position) {
      const action = desiredRoleNames.has(role.name) ? 'update' : 'delete';
      issues.push(error(
        `Cannot ${action} role "${role.name}" — it's at position ${role.position}, ` +
        `at or above the bot's role (position ${botHighest.position}). ` +
        `Move the bot's role above it in Server Settings > Roles.`,
      ));
    }
  }

  // Warn about managed roles that share a name with template roles
  for (const role of guild.roles.cache.values()) {
    if (role.managed && desiredRoleNames.has(role.name)) {
      issues.push(warning(
        `Role "${role.name}" is managed by an integration and cannot be modified. ` +
        `The template's definition for this role will be skipped.`,
      ));
    }
  }
}

/**
 * Check that every role in the template only requests permissions the bot itself has.
 * The Discord API rejects role creation/edits that grant permissions the caller lacks.
 */
function checkRolePermissionGrants(
  me: NonNullable<Guild['members']['me']>,
  template: ServerTemplate,
  issues: PreflightIssue[],
): void {
  const botPerms = me.permissions;

  for (const role of template.roles) {
    if (role.name === '@everyone') continue;

    for (const permName of role.permissions) {
      let permBit: bigint;
      try {
        permBit = resolvePermissions([permName]);
      } catch {
        continue; // Schema validation already catches invalid names
      }

      if (!botPerms.has(permBit)) {
        issues.push(error(
          `Cannot grant **${permName}** to role "${role.name}" — the bot doesn't have this permission itself. ` +
          `Grant it to the bot's role first, or remove it from the template.`,
        ));
      }
    }
  }
}

/**
 * Check if the server has Community features enabled when the template uses announcement channels.
 */
function checkCommunityFeature(
  guild: Guild,
  template: ServerTemplate,
  issues: PreflightIssue[],
): void {
  const hasCommunity = guild.features.includes(GuildFeature.Community);
  if (hasCommunity) return;

  const allChannels = [
    ...template.categories.flatMap((c) => c.channels),
    ...template.uncategorized,
  ];

  const announcementChannels = allChannels.filter((ch) => ch.type === 'announcement');
  if (announcementChannels.length > 0) {
    const names = announcementChannels.map((ch) => `#${ch.name}`).join(', ');
    issues.push(warning(
      `Template uses announcement channels (${names}) but this server doesn't have **Community** enabled. ` +
      `They'll be created as regular text channels instead. ` +
      `Enable Community in Server Settings to use announcement channels.`,
    ));
  }

  const stageChannels = allChannels.filter((ch) => ch.type === 'stage');
  if (stageChannels.length > 0) {
    const names = stageChannels.map((ch) => `#${ch.name}`).join(', ');
    issues.push(warning(
      `Template uses stage channels (${names}) but this server doesn't have **Community** enabled. ` +
      `They'll be created as regular voice channels instead. ` +
      `Enable Community in Server Settings to use stage channels.`,
    ));
  }
}

/**
 * Check Discord's channel limits.
 */
function checkChannelLimits(
  template: ServerTemplate,
  issues: PreflightIssue[],
): void {
  // 500 channels per server
  const totalChannels =
    template.categories.length +
    template.categories.reduce((sum, c) => sum + c.channels.length, 0) +
    template.uncategorized.length;

  if (totalChannels > 500) {
    issues.push(error(
      `Template defines ${totalChannels} channels, exceeding Discord's limit of 500 per server.`,
    ));
  }

  // 50 channels per category
  for (const cat of template.categories) {
    if (cat.channels.length > 50) {
      issues.push(error(
        `Category "${cat.name}" has ${cat.channels.length} channels, exceeding Discord's limit of 50 per category.`,
      ));
    }
  }

  // 50 categories
  if (template.categories.length > 50) {
    issues.push(error(
      `Template defines ${template.categories.length} categories, exceeding Discord's limit of 50.`,
    ));
  }
}

/**
 * Check emoji limits and permissions.
 */
function checkEmojiLimits(
  guild: Guild,
  template: ServerTemplate,
  issues: PreflightIssue[],
): void {
  if (template.emoji.length === 0) return;

  const me = guild.members.me;
  if (me && !me.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
    issues.push(error(
      `Template defines emoji but the bot is missing the **Manage Emojis and Stickers** permission.`,
    ));
  }

  // Emoji slots depend on boost tier
  const slotsByTier: Record<number, number> = { 0: 50, 1: 100, 2: 150, 3: 250 };
  const maxSlots = slotsByTier[guild.premiumTier] ?? 50;

  if (template.emoji.length > maxSlots) {
    issues.push(error(
      `Template defines ${template.emoji.length} emoji but this server (boost tier ${guild.premiumTier}) ` +
      `only supports ${maxSlots}. Boost the server or reduce emoji count.`,
    ));
  }
}

/**
 * Check for existing channels the bot can't see/access that would need to be deleted in full sync.
 */
function checkInaccessibleChannels(
  guild: Guild,
  me: NonNullable<Guild['members']['me']>,
  template: ServerTemplate,
  issues: PreflightIssue[],
): void {
  const desiredCategoryNames = new Set(template.categories.map((c) => c.name));
  const desiredChannelKeys = new Set<string>();

  for (const cat of template.categories) {
    const catId = guild.channels.cache.find(
      (ch) => ch.type === ChannelType.GuildCategory && ch.name === cat.name,
    )?.id ?? null;
    for (const ch of cat.channels) {
      desiredChannelKeys.add(`${catId}:${ch.name}`);
    }
  }
  for (const ch of template.uncategorized) {
    desiredChannelKeys.add(`null:${ch.name}`);
  }

  // Check channels that exist but aren't in template (will be deleted)
  for (const channel of guild.channels.cache.values()) {
    if (channel.isThread()) continue;
    if (channel.type === ChannelType.GuildCategory) {
      if (!desiredCategoryNames.has(channel.name)) {
        // Check if bot can delete this category
        if (!channel.permissionsFor(me)?.has(PermissionFlagsBits.ViewChannel)) {
          issues.push(warning(
            `Category "${channel.name}" is not in the template and will be deleted, ` +
            `but the bot can't currently view it. It may fail to delete — ` +
            `grant the bot access or delete it manually.`,
          ));
        }
      }
    } else {
      const key = `${channel.parentId}:${channel.name}`;
      if (!desiredChannelKeys.has(key)) {
        if (!channel.permissionsFor(me)?.has(PermissionFlagsBits.ViewChannel)) {
          issues.push(warning(
            `Channel "#${channel.name}" is not in the template and will be deleted, ` +
            `but the bot can't currently view it. It may fail to delete — ` +
            `grant the bot access or delete it manually.`,
          ));
        }
      }
    }
  }
}

function buildResult(issues: PreflightIssue[]): PreflightResult {
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  return {
    issues,
    errors,
    warnings,
    canProceed: errors.length === 0,
  };
}
