<script lang="ts">
  import { store } from '../store.svelte.js';

  const yaml = $derived(store.yaml);
  let copied = $state(false);

  function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Safe highlighter: escape first, then wrap tokens on the already-escaped text.
  function highlight(src: string): string {
    return src
      .split('\n')
      .map((line) => {
        const esc = escapeHtml(line);
        if (/^\s*#/.test(line)) return `<span class="yaml-comment">${esc}</span>`;
        return esc.replace(/^(\s*-?\s*)([A-Za-z0-9_]+)(:)/, '$1<span class="yaml-key">$2</span><span class="yaml-punct">$3</span>');
      })
      .join('\n');
  }

  const html = $derived(highlight(yaml));

  async function copy() {
    await navigator.clipboard.writeText(yaml);
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }

  const FILENAME = 'server-template.yaml';

  // Chromium: real "Save As" dialog (pick folder + name, write in place).
  // Firefox/Safari lack showSaveFilePicker, so fall back to an anchor download.
  async function save() {
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: FILENAME,
          types: [{ description: 'YAML', accept: { 'text/yaml': ['.yaml', '.yml'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(yaml);
        await writable.close();
      } catch (err) {
        // User dismissed the picker — not an error.
        if ((err as DOMException)?.name !== 'AbortError') throw err;
      }
      return;
    }
    downloadFallback();
  }

  function downloadFallback() {
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = FILENAME;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Chromium: native open dialog; elsewhere a programmatic file input.
  async function load() {
    if ('showOpenFilePicker' in window) {
      try {
        const [handle] = await (window as any).showOpenFilePicker({
          types: [{ description: 'YAML', accept: { 'text/yaml': ['.yaml', '.yml'] } }],
        });
        applyLoaded(await (await handle.getFile()).text());
      } catch (err) {
        if ((err as DOMException)?.name !== 'AbortError') throw err;
      }
      return;
    }
    loadFallback();
  }

  function loadFallback() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.yaml,.yml,text/yaml';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) file.text().then(applyLoaded);
    };
    input.click();
  }

  function applyLoaded(text: string) {
    const result = store.importYaml(text);
    if (!result.ok) alert('Could not load template:\n\n' + result.errors.join('\n'));
  }
</script>

<div class="flex h-full flex-col">
  <div class="flex items-center justify-end gap-2 border-b border-border px-3 py-2">
    <button
      type="button"
      onclick={copy}
      class="flex items-center gap-1.5 rounded-lg bg-surface-raised px-2.5 py-1 text-xs text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
    <button
      type="button"
      onclick={load}
      class="flex items-center gap-1.5 rounded-lg bg-surface-raised px-2.5 py-1 text-xs text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
    >
      Load
    </button>
    <button
      type="button"
      onclick={save}
      class="flex items-center gap-1.5 rounded-lg bg-surface-raised px-2.5 py-1 text-xs text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
    >
      Save As
    </button>
  </div>
  <pre class="flex-1 overflow-auto p-4 font-mono text-[0.8rem] leading-relaxed"><code>{@html html}</code></pre>
</div>
