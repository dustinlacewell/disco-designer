<script lang="ts">
  let {
    label = '',
    help = '',
    checked = $bindable(false),
    disabled = false,
  }: { label?: string; help?: string; checked?: boolean; disabled?: boolean } = $props();
</script>

<div class="mb-4 flex items-start gap-3">
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    {disabled}
    onclick={() => (checked = !checked)}
    class="mt-0.5 h-6 w-11 flex-shrink-0 rounded-full p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 {checked
      ? 'bg-blurple'
      : 'bg-surface-overlay'}"
  >
    <span
      class="block h-5 w-5 rounded-full bg-white transition-transform {checked ? 'translate-x-5' : 'translate-x-0'}"
    ></span>
  </button>
  <div class="min-w-0">
    {#if label}<span class="block text-sm font-medium text-text-primary">{label}</span>{/if}
    {#if help}<span class="mt-0.5 block text-xs leading-relaxed text-text-secondary/80">{help}</span>{/if}
  </div>
</div>
