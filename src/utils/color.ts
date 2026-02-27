/**
 * Parses a hex color string like "#e74c3c" to an integer.
 * Returns 0 (black/default) if the input is invalid.
 */
export function parseColor(hex: string | undefined): number {
  if (!hex || hex === '#000000') return 0;
  const match = hex.match(/^#([0-9a-fA-F]{6})$/);
  if (!match) return 0;
  return parseInt(match[1]!, 16);
}
