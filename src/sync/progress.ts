import type { ChatInputCommandInteraction } from 'discord.js';
import type { SyncPhase, SyncResult } from './sync-context.js';

export interface ProgressReporter {
  report(phase: SyncPhase, message: string): Promise<void>;
  reportSummary(result: SyncResult): Promise<void>;
}

const PHASE_LABELS: Record<SyncPhase, string> = {
  roles: 'Roles',
  categories: 'Categories',
  channels: 'Channels',
  permissions: 'Permissions',
  emoji: 'Emoji',
};

export function createProgressReporter(interaction: ChatInputCommandInteraction): ProgressReporter {
  return {
    async report(phase, message) {
      const label = PHASE_LABELS[phase];
      try {
        await interaction.followUp({
          content: `**[${label}]** ${message}`,
          ephemeral: true,
        });
      } catch {
        // Follow-up may fail if interaction expired; silently ignore
      }
    },

    async reportSummary(result) {
      const lines: string[] = [];
      const status = result.success ? 'Sync complete' : 'Sync completed with errors';
      lines.push(`**${status}** (${(result.durationMs / 1000).toFixed(1)}s)`);
      lines.push('');

      if (result.created.length > 0) {
        lines.push(`**Created (${result.created.length}):**`);
        for (const item of result.created) lines.push(`  + ${item}`);
      }
      if (result.updated.length > 0) {
        lines.push(`**Updated (${result.updated.length}):**`);
        for (const item of result.updated) lines.push(`  ~ ${item}`);
      }
      if (result.deleted.length > 0) {
        lines.push(`**Deleted (${result.deleted.length}):**`);
        for (const item of result.deleted) lines.push(`  - ${item}`);
      }
      if (result.errors.length > 0) {
        lines.push('');
        lines.push(`**Errors (${result.errors.length}):**`);
        for (const err of result.errors) {
          lines.push(`  x [${err.phase}] ${err.operation} ${err.entity}: ${err.message}`);
        }
      }

      if (result.created.length === 0 && result.updated.length === 0 &&
          result.deleted.length === 0 && result.errors.length === 0) {
        lines.push('No changes needed — server already matches template.');
      }

      const content = lines.join('\n');

      try {
        // Discord has a 2000 char limit; truncate if needed
        const truncated = content.length > 1950
          ? content.slice(0, 1950) + '\n... (truncated)'
          : content;
        await interaction.followUp({ content: truncated, ephemeral: true });
      } catch {
        // Interaction may have expired
      }
    },
  };
}
