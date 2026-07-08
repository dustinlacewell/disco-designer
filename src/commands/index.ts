import type { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { applyTemplateCommand } from './apply-template.js';
import { exportTemplateCommand } from './export-template.js';

export interface Command {
  data: SlashCommandBuilder;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

const commandList: Command[] = [
  applyTemplateCommand as Command,
  exportTemplateCommand as Command,
];

export const commands = new Map<string, Command>(
  commandList.map((cmd) => [cmd.data.name, cmd]),
);

export const commandData = commandList.map((cmd) => cmd.data.toJSON());
