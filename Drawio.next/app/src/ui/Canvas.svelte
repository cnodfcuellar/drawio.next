<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { GraphController } from '../core/GraphController'
  import { activeGraph, zoomLevel, graphRevision, connectionMode } from '../stores/graph'
  import { selectMany, clearSelection } from '../stores/selection'

  let canvasEl: HTMLDivElement | null = null
  let controller: GraphController | null = null
  let isDragOver = $state(false)

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  function handleDragEnter(e: DragEvent) {
    e.preventDefault()
    isDragOver = true
  }

  function handleDragLeave(e: DragEvent) {
    if (!canvasEl?.contains(e.relatedTarget as Node)) {
      isDragOver = false
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    isDragOver = false
    if (!e.dataTransfer || !controller) return

    // 1. Soporte para arrastrar y soltar archivos .drawio o .xml desde el explorador
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.name.endsWith('.drawio') || file.name.endsWith('.xml')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const content = event.target?.result as string
          if (content && controller) {
            controller.importXml(content)
          }
        }
        reader.readAsText(file)
        return
      }
    }

    // 2. Soporte para formas de la paleta lateral
    try {
      const rawData = e.dataTransfer.getData('application/json')
      if (!rawData) return
      const shape = JSON.parse(rawData)
      controller.insertShapeAtEvent(e, shape)
    } catch (err) {
      console.error('Error al insertar forma soltada:', err)
    }
  }

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

      // Sincronizar cambios en el modelo (mover, redimensionar, editar) con la UI
      controller.onModelChange(() => {
        graphRevision.update(n => n + 1)
      })

      // Sincronizar estado del modo conector con la barra de herramientas
      controller.onConnectionModeChange((enabled) => {
        connectionMode.set(enabled)
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
  <div
    class="canvas-container"
    class:drag-active={isDragOver}
    role="region"
    aria-label="Lienzo de dibujo"
    bind:this={canvasEl}
    ondragover={handleDragOver}
    ondragenter={handleDragEnter}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
  ></div>
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
    user-select: none;
    -webkit-user-select: none;
    /* Cuadrícula sutil de fondo */
    background-image:
      linear-gradient(var(--border) 1px, transparent 1px),
      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 20px 20px;
    transition: outline var(--t-fast);
  }

  .canvas-container.drag-active {
    outline: 2px dashed var(--accent);
    outline-offset: -2px;
  }
</style>
