<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { GraphController } from '../core/GraphController'
  import { activeGraph, zoomLevel, graphRevision, connectionMode, pendingConnectSource } from '../stores/graph'
  import { selectMany, clearSelection } from '../stores/selection'
  import { scheduleAutoSave, loadSavedDiagram, saveDiagram } from '../stores/persistence'

  let canvasEl: HTMLDivElement | null = null
  let controller: GraphController | null = null
  let isDragOver = $state(false)

  let isConnectActive = $derived(Boolean($connectionMode || $pendingConnectSource))
  let isWaitingTarget = $derived(Boolean($pendingConnectSource))

  function handleCancelConnect() {
    controller?.cancelInteractiveConnect()
    controller?.setConnectionMode(false)
  }

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

      // Sincronizar cambios en el modelo (mover, redimensionar, editar) con la UI y autoguardar
      controller.onModelChange(() => {
        graphRevision.update(n => n + 1)
        if (controller) {
          scheduleAutoSave(controller)
        }
      })

      // Sincronizar estado del modo conector con la barra de herramientas
      controller.onConnectionModeChange((enabled) => {
        connectionMode.set(enabled)
      })

      // Sincronizar estado del enlace pendiente
      controller.onPendingConnectChange((srcId) => {
        pendingConnectSource.set(srcId)
      })

      // 1. Restaurar diagrama persistido de la sesión anterior si existe
      const restored = loadSavedDiagram(controller)

      // 2. Si no había ningún diagrama guardado o si quedó vacío (0 formas), insertar nodos de bienvenida iniciales
      const currentCount = controller.getChildCount()
      if (!restored || currentCount === 0) {
        controller.insertWelcomeDiagram()
        saveDiagram(controller)
      }

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
  {#if isConnectActive}
    <div class="connection-toast" data-testid="connection-toast">
      <span class="toast-badge">⚡ MODO CONECTOR</span>
      <span class="toast-msg">
        {#if isWaitingTarget}
          <strong>Origen fijado:</strong> Haz clic en el bloque destino para trazar la flecha.
        {:else}
          Arrastra entre dos bloques, o haz clic en un bloque origen y luego en el destino.
        {/if}
      </span>
      <button class="toast-btn" onclick={handleCancelConnect} title="Cancelar conexión (Esc)">
        ✕ Cancelar (Esc)
      </button>
    </div>
  {/if}

  <div
    class="canvas-container"
    class:drag-active={isDragOver}
    role="application"
    aria-label="Lienzo de dibujo"
    tabindex="-1"
    bind:this={canvasEl}
    onmousedown={() => {
      if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement && document.activeElement !== canvasEl) {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.isContentEditable) {
          document.activeElement.blur()
        }
      }
      canvasEl?.focus()
    }}
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

  /* Banner flotante de conexión interactiva */
  .connection-toast {
    position: absolute;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-4);
    background: var(--bg-secondary);
    border: 1px solid var(--accent);
    box-shadow: var(--shadow-md);
    border-radius: var(--radius-full);
    pointer-events: auto;
    animation: slideDown 0.2s ease-out;
  }
  @keyframes slideDown {
    from { transform: translate(-50%, -10px); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
  }
  .toast-badge {
    font-size: var(--text-xs);
    font-weight: var(--font-bold);
    background: var(--accent);
    color: #ffffff;
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    letter-spacing: 0.5px;
  }
  .toast-msg {
    font-size: var(--text-sm);
    color: var(--text-primary);
    white-space: nowrap;
  }
  .toast-btn {
    background: none;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-size: var(--text-xs);
    padding: 3px 8px;
    cursor: pointer;
    transition: all var(--t-fast);
  }
  .toast-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
    border-color: var(--text-secondary);
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

  /* Estilos del editor de texto en lienzo (in-place) para que no se desplace ni ocupe espacio extra */
  :global(.mxCellEditor) {
    position: absolute !important;
    z-index: 50 !important;
    outline: none !important;
    box-sizing: content-box;
  }

  :global(.mxCellEditor.mxPlainTextEditor) {
    background: var(--bg-elevated) !important;
    color: var(--text-primary) !important;
    border: 1px solid var(--accent) !important;
    border-radius: var(--radius-sm);
    padding: 2px 6px !important;
    box-shadow: var(--shadow-md);
    min-width: 40px;
    text-align: center;
  }
</style>
