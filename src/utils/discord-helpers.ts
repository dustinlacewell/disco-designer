import { DiscordAPIError } from 'discord.js';
import { delay } from './delay.js';
import { logger } from './logger.js';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 300;
const RATE_LIMIT_BUFFER_MS = 100;

/**
 * Wraps a Discord API call with retry logic for rate limits and transient errors.
 * Returns the result on success, or throws after retries are exhausted.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  label: string,
): Promise<T> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof DiscordAPIError && error.status === 429) {
        const retryAfter = (error as any).retryAfter ?? 1;
        const waitMs = retryAfter * 1000 + RATE_LIMIT_BUFFER_MS;
        logger.warn(`Rate limited on "${label}", waiting ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await delay(waitMs);
        continue;
      }

      if (attempt < MAX_RETRIES && isTransientError(error)) {
        const waitMs = BASE_DELAY_MS * Math.pow(2, attempt);
        logger.warn(`Transient error on "${label}", retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await delay(waitMs);
        continue;
      }

      throw error;
    }
  }

  throw new Error(`Exhausted retries for "${label}"`);
}

function isTransientError(error: unknown): boolean {
  if (error instanceof DiscordAPIError) {
    return error.status >= 500;
  }
  if (error instanceof Error && error.message.includes('ECONNRESET')) {
    return true;
  }
  return false;
}

/**
 * Small delay between sequential API calls to avoid hitting rate limits.
 */
export async function apiThrottle(): Promise<void> {
  await delay(BASE_DELAY_MS);
}
