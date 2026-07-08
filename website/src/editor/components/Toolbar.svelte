<script lang="ts">
  import Modal from '../primitives/Modal.svelte';
  import { store } from '../store.svelte.js';
  import { EXAMPLES } from '../examples.js';

  let importOpen = $state(false);
  let importText = $state('');
  let importErrors = $state<string[]>([]);
  let examplesOpen = $state(false);

  function doImport() {
    const result = store.importYaml(importText);
    if (result.ok) {
      importOpen = false;
      importText = '';
      importErrors = [];
    } else {
      importErrors = result.errors;
    }
  }

  function onFile(e: Event) {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    file.text().then((text) => {
      importText = text;
    });
  }

  function loadExample(yaml: string) {
    store.importYaml(yaml);
    examplesOpen = false;
  }
</script>

<div class="flex items-center justify-between gap-3 border-b border-border bg-surface-raised/40 px-4 py-2.5">
  <div class="flex items-center gap-2">
    <span class="font-mono text-sm font-bold"><span class="text-blurple">Disco</span> Editor</span>
  </div>

  <div class="flex items-center gap-1.5">
    <!-- Examples -->
    <details bind:open={examplesOpen} class="relative">
      <summary
        class="flex cursor-pointer list-none items-center gap-1.5 rounded-lg bg-surface-raised px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
      >
        Examples
        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div class="absolute right-0 top-full z-50 mt-1 w-60 rounded-xl border border-border bg-surface-raised p-1.5 shadow-xl">
        {#each EXAMPLES as ex (ex.file)}
          <button
            type="button"
            onclick={() => loadExample(ex.yaml)}
            class="flex w-full flex-col rounded-lg px-3 py-1.5 text-left transition-colors hover:bg-surface-overlay"
          >
            <span class="text-sm text-text-primary">{ex.name}</span>
            <span class="font-mono text-[0.65rem] text-text-secondary/60">{ex.file}</span>
          </button>
        {/each}
      </div>
    </details>

    <button
      type="button"
      onclick={() => (importOpen = true)}
      class="rounded-lg bg-surface-raised px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
    >
      Import
    </button>

    <button
      type="button"
      onclick={() => {
        if (confirm('Start a new, empty template? Unsaved changes will be lost.')) store.reset();
      }}
      class="rounded-lg bg-surface-raised px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
    >
      New
    </button>
  </div>
</div>

<Modal bind:open={importOpen} title="Import YAML">
  <p class="mb-3 text-sm text-text-secondary">
    Paste a Disco Designer template, or upload a <span class="font-mono text-text-primary">.yaml</span> file. It replaces
    the current template.
  </p>
  <input
    type="file"
    accept=".yaml,.yml,text/yaml"
    onchange={onFile}
    class="mb-3 block w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-surface-overlay file:px-3 file:py-1.5 file:text-sm file:text-text-primary"
  />
  <textarea
    bind:value={importText}
    rows="12"
    spellcheck="false"
    placeholder="roles:&#10;  - name: Admin&#10;    permissions:&#10;      - Administrator"
    class="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-secondary/40 focus:border-blurple focus:outline-none"
  ></textarea>
  {#if importErrors.length}
    <ul class="mt-3 space-y-1">
      {#each importErrors as err}
        <li class="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 font-mono text-xs text-red-300">{err}</li>
      {/each}
    </ul>
  {/if}
  {#snippet footer()}
    <button
      type="button"
      onclick={() => (importOpen = false)}
      class="rounded-lg px-3 py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
    >
      Cancel
    </button>
    <button
      type="button"
      onclick={doImport}
      disabled={!importText.trim()}
      class="rounded-lg bg-blurple px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blurple-dark disabled:opacity-40"
    >
      Import
    </button>
  {/snippet}
</Modal>
