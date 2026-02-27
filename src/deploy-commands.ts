import { REST, Routes } from 'discord.js';
import { config } from './config.js';
import { commandData } from './commands/index.js';
import { logger } from './utils/logger.js';

const rest = new REST().setToken(config.token);

async function deploy() {
  try {
    logger.info(`Refreshing ${commandData.length} application command(s)...`);

    if (config.guildId) {
      // Dev: register to a specific guild (instant)
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commandData },
      );
      logger.info(`Registered commands to guild ${config.guildId}`);
    } else {
      // Production: register globally (can take up to 1 hour to propagate)
      await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commandData },
      );
      logger.info('Registered commands globally');
    }
  } catch (error) {
    logger.error('Failed to register commands:', error);
    process.exit(1);
  }
}

deploy();
