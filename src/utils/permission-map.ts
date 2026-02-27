import { PermissionFlagsBits } from 'discord.js';

const PERMISSION_MAP: Record<string, bigint> = {
  CreateInstantInvite: PermissionFlagsBits.CreateInstantInvite,
  KickMembers: PermissionFlagsBits.KickMembers,
  BanMembers: PermissionFlagsBits.BanMembers,
  Administrator: PermissionFlagsBits.Administrator,
  ManageChannels: PermissionFlagsBits.ManageChannels,
  ManageGuild: PermissionFlagsBits.ManageGuild,
  AddReactions: PermissionFlagsBits.AddReactions,
  ViewAuditLog: PermissionFlagsBits.ViewAuditLog,
  PrioritySpeaker: PermissionFlagsBits.PrioritySpeaker,
  Stream: PermissionFlagsBits.Stream,
  ViewChannel: PermissionFlagsBits.ViewChannel,
  SendMessages: PermissionFlagsBits.SendMessages,
  SendTTSMessages: PermissionFlagsBits.SendTTSMessages,
  ManageMessages: PermissionFlagsBits.ManageMessages,
  EmbedLinks: PermissionFlagsBits.EmbedLinks,
  AttachFiles: PermissionFlagsBits.AttachFiles,
  ReadMessageHistory: PermissionFlagsBits.ReadMessageHistory,
  MentionEveryone: PermissionFlagsBits.MentionEveryone,
  UseExternalEmojis: PermissionFlagsBits.UseExternalEmojis,
  ViewGuildInsights: PermissionFlagsBits.ViewGuildInsights,
  Connect: PermissionFlagsBits.Connect,
  Speak: PermissionFlagsBits.Speak,
  MuteMembers: PermissionFlagsBits.MuteMembers,
  DeafenMembers: PermissionFlagsBits.DeafenMembers,
  MoveMembers: PermissionFlagsBits.MoveMembers,
  UseVAD: PermissionFlagsBits.UseVAD,
  ChangeNickname: PermissionFlagsBits.ChangeNickname,
  ManageNicknames: PermissionFlagsBits.ManageNicknames,
  ManageRoles: PermissionFlagsBits.ManageRoles,
  ManageWebhooks: PermissionFlagsBits.ManageWebhooks,
  ManageEmojisAndStickers: PermissionFlagsBits.ManageEmojisAndStickers,
  UseApplicationCommands: PermissionFlagsBits.UseApplicationCommands,
  RequestToSpeak: PermissionFlagsBits.RequestToSpeak,
  ManageEvents: PermissionFlagsBits.ManageEvents,
  ManageThreads: PermissionFlagsBits.ManageThreads,
  CreatePublicThreads: PermissionFlagsBits.CreatePublicThreads,
  CreatePrivateThreads: PermissionFlagsBits.CreatePrivateThreads,
  UseExternalStickers: PermissionFlagsBits.UseExternalStickers,
  SendMessagesInThreads: PermissionFlagsBits.SendMessagesInThreads,
  UseEmbeddedActivities: PermissionFlagsBits.UseEmbeddedActivities,
  ModerateMembers: PermissionFlagsBits.ModerateMembers,
  UseSoundboard: PermissionFlagsBits.UseSoundboard,
  UseExternalSounds: PermissionFlagsBits.UseExternalSounds,
  SendVoiceMessages: PermissionFlagsBits.SendVoiceMessages,
  SendPolls: PermissionFlagsBits.SendPolls,
};

export const VALID_PERMISSION_NAMES = Object.keys(PERMISSION_MAP);

/**
 * Resolves a permission name string to a PermissionFlagsBits bigint.
 * Throws if the name is not recognized.
 */
export function resolvePermission(name: string): bigint {
  const flag = PERMISSION_MAP[name];
  if (flag === undefined) {
    throw new Error(`Unknown permission: "${name}"`);
  }
  return flag;
}

/**
 * Resolves an array of permission name strings into a combined bigint bitmask.
 */
export function resolvePermissions(names: string[]): bigint {
  let bits = 0n;
  for (const name of names) {
    bits |= resolvePermission(name);
  }
  return bits;
}
