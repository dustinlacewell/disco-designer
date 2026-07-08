<script lang="ts">
  let { onDrag }: { onDrag: (dx: number) => void } = $props();

  let dragging = $state(false);
  let lastX = 0;

  function down(e: PointerEvent) {
    dragging = true;
    lastX = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    onDrag(dx);
  }
  function up(e: PointerEvent) {
    dragging = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }
</script>

<div
  role="separator"
  aria-orientation="vertical"
  tabindex="-1"
  onpointerdown={down}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={up}
  class="hidden w-1.5 flex-shrink-0 cursor-col-resize touch-none bg-border/30 transition-colors hover:bg-blurple/60 md:block {dragging
    ? 'bg-blurple/70'
    : ''}"
></div>
