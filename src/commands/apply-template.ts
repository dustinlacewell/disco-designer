import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { parseTemplate } from '../schema/parse.js';
import { syncServer } from '../sync/index.js';
import { runPreflight } from '../sync/preflight.js';
import { logger } from '../utils/logger.js';

export const applyTemplateCommand = {
  data: new SlashCommandBuilder()
    .setName('apply-template')
    .setDescription('Apply a YAML server template to this server (full sync)')
    .addAttachmentOption((opt) =>
      opt
        .setName('template')
        .setDescription('A .yaml or .yml file describing the desired server state')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    // Must be in a guild
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply('This command can only be used in a server.');
      return;
    }

    const attachment = interaction.options.getAttachment('template', true);

    // Validate file extension
    const name = attachment.name.toLowerCase();
    if (!name.endsWith('.yaml') && !name.endsWith('.yml')) {
      await interaction.editReply('File must be a `.yaml` or `.yml` file.');
      return;
    }

    // Validate file size (1 MB limit)
    if (attachment.size > 1_000_000) {
      await interaction.editReply('File is too large. Maximum size is 1 MB.');
      return;
    }

    // Download the file
    let yamlString: string;
    try {
      const response = await fetch(attachment.url);
      if (!response.ok) {
        await interaction.editReply('Failed to download the attachment.');
        return;
      }
      yamlString = await response.text();
    } catch (error) {
      logger.error('Failed to download attachment:', error);
      await interaction.editReply('Failed to download the attachment.');
      return;
    }

    // Parse and validate YAML schema
    const result = parseTemplate(yamlString);
    if (!result.success) {
      const errorList = result.errors.slice(0, 15).map((e) => `- ${e}`).join('\n');
      const truncated = result.errors.length > 15 ? `\n... and ${result.errors.length - 15} more` : '';
      await interaction.editReply(
        `**Template validation failed:**\n${errorList}${truncated}`,
      );
      return;
    }

    const template = result.data;

    // Ensure caches are populated for preflight
    await guild.roles.fetch();
    await guild.channels.fetch();
    await guild.emojis.fetch();

    // Run preflight checks
    const preflight = runPreflight(guild, template);

    if (!preflight.canProceed) {
      const lines = [
        `**Preflight check failed — cannot proceed.**`,
        '',
        ...preflight.errors.map((e) => `- ${e.message}`),
      ];
      if (preflight.warnings.length > 0) {
        lines.push('', '**Warnings:**');
        lines.push(...preflight.warnings.map((w) => `- ${w.message}`));
      }
      const content = lines.join('\n');
      await interaction.editReply(content.length > 1950 ? content.slice(0, 1950) + '\n...' : content);
      return;
    }

    // Build confirmation summary
    const roleCount = template.roles.length;
    const categoryCount = template.categories.length;
    const channelCount =
      template.categories.reduce((sum, c) => sum + c.channels.length, 0) +
      template.uncategorized.length;
    const emojiCount = template.emoji.length;

    const summaryLines = [
      `**This will fully sync the server to match the template:**`,
      `- ${roleCount} role(s)`,
      `- ${categoryCount} category/categories`,
      `- ${channelCount} channel(s)`,
      `- ${emojiCount} emoji`,
    ];

    // Show warnings in the confirmation prompt so the user can decide
    if (preflight.warnings.length > 0) {
      summaryLines.push('', '**Warnings:**');
      for (const w of preflight.warnings) {
        summaryLines.push(`- ${w.message}`);
      }
    }

    summaryLines.push(
      '',
      '**Warning:** Roles, channels, and emoji not in the template will be **deleted**.',
      'This cannot be undone. Are you sure?',
    );

    const summary = summaryLines.join('\n');

    // Confirmation buttons
    const confirmButton = new ButtonBuilder()
      .setCustomId('sync-confirm')
      .setLabel('Confirm Full Sync')
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId('sync-cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);

    const confirmMsg = await interaction.editReply({
      content: summary.length > 1950 ? summary.slice(0, 1950) + '\n...' : summary,
      components: [row],
    });

    // Wait for button click
    try {
      const buttonInteraction = await confirmMsg.awaitMessageComponent({
        filter: (i) => i.user.id === interaction.user.id,
        time: 60_000,
      });

      if (buttonInteraction.customId === 'sync-cancel') {
        await buttonInteraction.update({ content: 'Sync cancelled.', components: [] });
        return;
      }

      // Confirm pressed — start sync
      await buttonInteraction.update({ content: 'Sync in progress...', components: [] });
    } catch {
      // Timeout
      await interaction.editReply({ content: 'Confirmation timed out. Sync cancelled.', components: [] });
      return;
    }

    // Run the sync
    try {
      const syncResult = await syncServer(guild, template, interaction);

      const { createProgressReporter } = await import('../sync/progress.js');
      const progress = createProgressReporter(interaction);
      await progress.reportSummary(syncResult);
    } catch (error) {
      logger.error('Sync failed:', error);
      const message = error instanceof Error ? error.message : String(error);
      await interaction.followUp({
        content: `**Sync failed:** ${message}`,
        ephemeral: true,
      });
    }
  },
};
