import {
  SlashCommandBuilder,
  AttachmentBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { stringify } from 'yaml';
import { exportGuildToTemplate } from '../export/export-template.js';
import { logger } from '../utils/logger.js';

export const exportTemplateCommand = {
  data: new SlashCommandBuilder()
    .setName('export-template')
    .setDescription('Export this server\'s structure as a YAML template file')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply('This command can only be used in a server.');
      return;
    }

    try {
      // Ensure caches are fresh
      await guild.roles.fetch();
      await guild.channels.fetch();
      await guild.emojis.fetch();

      const template = exportGuildToTemplate(guild);
      const yamlString = stringify(template, { lineWidth: 120 });

      const safeName = guild.name.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
      const filename = `${safeName}-template.yaml`;

      const attachment = new AttachmentBuilder(Buffer.from(yamlString, 'utf-8'), {
        name: filename,
      });

      await interaction.editReply({
        content: `Exported **${guild.name}** as a YAML template.`,
        files: [attachment],
      });
    } catch (error) {
      logger.error('Failed to export template:', error);
      const message = error instanceof Error ? error.message : String(error);
      await interaction.editReply(`**Export failed:** ${message}`);
    }
  },
};
