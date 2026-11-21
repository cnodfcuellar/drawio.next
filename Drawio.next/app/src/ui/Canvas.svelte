<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { GraphController } from '../core/GraphController'
  import { activeGraph, zoomLevel } from '../stores/graph'
  import { selectMany, clearSelection } from '../stores/selection'

  let canvasEl: HTMLDivElement | null = null
  let controller: GraphController | null = null

  onMount(() => {
    if (!canvasEl) return

    // Inicializar GraphController si mxGraph está cargado
    if (typeof window !== 'undefined' && window.mxGraph) {
      controller = new GraphController(canvasEl)
      activeGraph.set(controller)

      // Sincronizar selección con el store
      controller.onSelectionChange((ids) => {
        if (ids.length === 0) {
          clearSelection()
        } else {
          selectMany(ids)
        }
      })

      // Nodos iniciales de bienvenida para verificar interactividad de inmediato
      const v1 = controller.addVertex({
        label: 'Inicio',
        x: 140,
        y: 120,
        width: 130,
        height: 60,
        style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontColor=#000000;fontSize=13;'
      })

      const v2 = controller.addVertex({
        label: 'Procesamiento',
        x: 360,
        y: 120,
        width: 140,
        height: 60,
        style: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontColor=#000000;fontSize=13;'
      })

      const v3 = controller.addVertex({
        label: 'Fin / Resultado',
        x: 580,
        y: 120,
        width: 140,
        height: 60,
        style: 'ellipse;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;fontColor=#000000;fontSize=13;'
      })

      controller.addEdge(v1.id, v2.id, 'Paso 1')
      controller.addEdge(v2.id, v3.id, 'Paso 2')

      zoomLevel.set(controller.getZoom())

      // Exponer globalmente para depuración rápida en consola del navegador
      window.__graphController = controller
    }
  })

  onDestroy(() => {
    activeGraph.set(null)
    controller?.destroy()
  })
</script>

<div class="canvas-wrapper" data-testid="canvas">
  <div class="canvas-container" bind:this={canvasEl}></div>
</div>

<style>
  .canvas-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    background-color: var(--bg-primary);
  }

  .canvas-container {
    width: 100%;
    height: 100%;
    position: relative;
    outline: none;
    cursor: default;
    /* Cuadrícula sutil de fondo */
    background-image:
      linear-gradient(var(--border) 1px, transparent 1px),
      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 20px 20px;
  }
</style>
