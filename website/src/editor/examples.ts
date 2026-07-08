/**
 * The bundled example templates for the "Load example" menu. Sourced directly from the
 * repo's `examples/*.yaml` at build time (single source of truth) via Vite's glob import.
 */

const raw = import.meta.glob('../../../examples/*.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export interface Example {
  file: string;
  name: string;
  yaml: string;
}

/** Curated display names + order matching the site's Template Gallery. */
const DISPLAY: Record<string, string> = {
  'gaming-community.yaml': 'Gaming Community',
  'developer-community.yaml': 'Developer Community',
  'content-creator.yaml': 'Content Creator',
  'saas-business.yaml': 'SaaS Business',
  'study-group.yaml': 'Study Group',
  'community-server.yaml': 'Community Server',
  'solo-dev-patreon.yaml': 'Solo Dev Patreon',
};
const ORDER = Object.keys(DISPLAY);

function titleize(file: string): string {
  return file
    .replace(/\.ya?ml$/, '')
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export const EXAMPLES: Example[] = Object.entries(raw)
  .map(([path, yaml]) => {
    const file = path.split('/').pop() ?? path;
    return { file, name: DISPLAY[file] ?? titleize(file), yaml };
  })
  .sort((a, b) => {
    const ia = ORDER.indexOf(a.file);
    const ib = ORDER.indexOf(b.file);
    if (ia === -1 && ib === -1) return a.name.localeCompare(b.name);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
