import { PermissionFlagsBits } from 'discord.js';
import { PERMISSION_NAMES } from '../domain/permissions.js';

/**
 * The name→bitflag map, derived from the dependency-free domain catalog. Every catalog
 * name is a valid `PermissionFlagsBits` key, so this stays a single source of truth: the
 * names live in `src/domain/permissions.ts`; only the discord.js binding lives here.
 */
const PERMISSION_MAP: Record<string, bigint> = Object.fromEntries(
  PERMISSION_NAMES.map((name) => {
    const flag = (PermissionFlagsBits as Record<string, bigint>)[name];
    if (flag === undefined) {
      throw new Error(`Permission "${name}" is not a known discord.js PermissionFlagsBits key`);
    }
    return [name, flag];
  }),
);

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

/**
 * Converts a permissions bitfield back to an array of permission name strings.
 */
export function reversePermissions(bitfield: bigint): string[] {
  const names: string[] = [];
  for (const [name, flag] of Object.entries(PERMISSION_MAP)) {
    if ((bitfield & flag) === flag) {
      names.push(name);
    }
  }
  return names;
}
