<script lang="ts">
  import { onMount } from 'svelte'

  let canvasEl: HTMLDivElement

  onMount(() => {
    // El GraphController (Mes 2) tomará control de este div
    // Por ahora mostramos el canvas vacío con cuadrícula
  })
</script>

<div class="canvas-wrapper" data-testid="canvas">
  <div class="canvas-container" bind:this={canvasEl}>
    <!-- mxGraph se monta aquí en Mes 2 -->
    <div class="canvas-placeholder">
      <div class="grid-bg"></div>
      <div class="canvas-hint">
        <span class="hint-icon">✦</span>
        <p>Canvas ready</p>
        <p class="hint-sub">Graph engine will be initialized here (Month 2)</p>
      </div>
    </div>
  </div>
</div>

<style>
  .canvas-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  .canvas-container {
    width: 100%;
    height: 100%;
  }

  .canvas-placeholder {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Cuadrícula de fondo via CSS */
  .grid-bg {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(var(--border) 1px, transparent 1px),
      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 20px 20px;
    opacity: 0.4;
  }

  .canvas-hint {
    position: relative;
    text-align: center;
    color: var(--text-disabled);
    pointer-events: none;
  }
  .hint-icon { font-size: 32px; display: block; margin-bottom: var(--space-4); opacity: 0.3; }
  .canvas-hint p { font-size: var(--text-md); margin-bottom: var(--space-2); }
  .hint-sub { font-size: var(--text-sm); opacity: 0.7; }
</style>
