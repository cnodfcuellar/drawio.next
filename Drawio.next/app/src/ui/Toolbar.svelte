<script lang="ts">
  import { hasSelection, selectedIds } from '../stores/selection'
  import { activeGraph, zoomLevel, connectionMode } from '../stores/graph'
  import { layout, showSidebar, showInspector, zenMode } from '../stores/layout'
  import { pluginRegistry } from '../plugins/PluginRegistry'
  import { toggleLayersPanel, showLayersPanel } from '../stores/layers'

  const pluginToolbarItems = pluginRegistry.toolbarItemsStore

  interface ToolGroup {
    tools: Tool[]
  }
  interface Tool {
    id: string
    icon: string
    label: string
    shortcut?: string
    active?: boolean
    disabled?: boolean
    action: () => void
  }

  let isConnect = $derived($connectionMode)
  let selCount = $derived($selectedIds.size)

  let groups: ToolGroup[] = $derived([
    {
      tools: [
        {
          id: 'selectMode',
          icon: '↖',
          label: 'Puntero / Selección',
          shortcut: 'V',
          active: !isConnect,
          action: () => $activeGraph?.setConnectionMode(false)
        },
        {
          id: 'connectMode',
          icon: '⤹',
          label: 'Modo Conector (arrastra entre formas o mantén Alt)',
          shortcut: 'C',
          active: isConnect,
          action: () => $activeGraph?.toggleConnectionMode()
        },
        {
          id: 'quickConnect',
          icon: '🔗',
          label: selCount >= 2 ? 'Enlazar 2 nodos seleccionados' : 'Enlazar nodo con otro...',
          shortcut: 'L',
          disabled: selCount === 0,
          action: () => {
            if (!$activeGraph) return
            if (selCount >= 2) {
              $activeGraph.connectSelected()
            } else if (selCount === 1) {
              const sel = $activeGraph.getSelectedCells().filter(c => !c.edge)
              if (sel.length > 0) {
                $activeGraph.startInteractiveConnect(sel[0].id)
              }
            }
          }
        }
      ]
    },
    {
      tools: [
        {
          id: 'undo',
          icon: '↩',
          label: 'Undo',
          shortcut: 'Ctrl+Z',
          action: () => $activeGraph?.undo()
        },
        {
          id: 'redo',
          icon: '↪',
          label: 'Redo',
          shortcut: 'Ctrl+Y',
          action: () => $activeGraph?.redo()
        },
      ]
    },
    {
      tools: [
        {
          id: 'delete',
          icon: '🗑',
          label: 'Delete',
          shortcut: 'Del',
          disabled: !$hasSelection,
          action: () => $activeGraph?.removeSelected()
        },
        {
          id: 'duplicate',
          icon: '⧉',
          label: 'Duplicar Selección',
          shortcut: 'Ctrl+D',
          disabled: !$hasSelection,
          action: () => $activeGraph?.duplicateSelected()
        },
        {
          id: 'group',
          icon: '⛶',
          label: 'Agrupar Formas',
          shortcut: 'Ctrl+G',
          disabled: selCount < 2,
          action: () => $activeGraph?.groupSelected()
        },
        {
          id: 'ungroup',
          icon: '⛿',
          label: 'Desagrupar',
          shortcut: 'Ctrl+Shift+U',
          disabled: !$hasSelection,
          action: () => $activeGraph?.ungroupSelected()
        },
        {
          id: 'addNode',
          icon: '✚',
          label: 'Nuevo Nodo',
          shortcut: 'N',
          action: () => {
            if ($activeGraph) {
              $activeGraph.addVertex({
                label: 'Nuevo Bloque',
                x: 200 + Math.floor(Math.random() * 200),
                y: 220 + Math.floor(Math.random() * 100),
                width: 120,
                height: 60
              })
            }
          }
        }
      ]
    },
    {
      tools: [
        {
          id: 'zoomIn',
          icon: '+',
          label: 'Zoom In',
          shortcut: 'Ctrl+=',
          action: () => {
            $activeGraph?.zoomIn()
            if ($activeGraph) zoomLevel.set($activeGraph.getZoom())
          }
        },
        {
          id: 'zoomOut',
          icon: '−',
          label: 'Zoom Out',
          shortcut: 'Ctrl+-',
          action: () => {
            $activeGraph?.zoomOut()
            if ($activeGraph) zoomLevel.set($activeGraph.getZoom())
          }
        },
        {
          id: 'resetZoom',
          icon: '1:1',
          label: 'Reset Zoom (100%)',
          action: () => {
            $activeGraph?.resetZoom()
            if ($activeGraph) zoomLevel.set($activeGraph.getZoom())
          }
        },
        {
          id: 'fit',
          icon: '⊡',
          label: 'Ajustar a Pantalla',
          shortcut: 'Ctrl+Shift+H',
          action: () => {
            $activeGraph?.fit()
            if ($activeGraph) zoomLevel.set($activeGraph.getZoom())
          }
        },
      ]
    },
  ])
</script>

<div class="toolbar" data-testid="toolbar">
  {#each groups as group, gi}
    {#if gi > 0}<div class="separator"></div>{/if}
    <div class="tool-group">
      {#each group.tools as tool}
        <button
          class="tool-btn"
          class:active={tool.active}
          title="{tool.label}{tool.shortcut ? ` (${tool.shortcut})` : ''}"
          onclick={tool.action}
          disabled={tool.disabled}
          data-testid="tool-{tool.id}"
        >
          <span class="tool-icon">{tool.icon}</span>
        </button>
      {/each}
    </div>
  {/each}

  {#if $pluginToolbarItems.length > 0}
    <div class="separator"></div>
    <div class="tool-group plugin-tools">
      {#each $pluginToolbarItems as item}
        <button
          class="tool-btn"
          title={item.tooltip || item.label}
          onclick={item.action}
          data-testid="tool-{item.id}"
        >
          <span class="tool-icon">{item.icon}</span>
        </button>
      {/each}
    </div>
  {/if}

  <div class="flex-spacer"></div>
  <div class="separator"></div>

  <div class="tool-group layout-tools">
    <button
      class="tool-btn"
      class:active={$showSidebar}
      title="Mostrar/Ocultar Paleta Izquierda (F7 o Ctrl+Shift+L)"
      onclick={() => layout.toggleSidebar()}
      data-testid="toggle-sidebar"
    >
      <span class="tool-icon">◧</span>
    </button>
    <button
      class="tool-btn"
      class:active={$showInspector}
      title="Mostrar/Ocultar Inspector de Propiedades (F8 o Ctrl+Shift+R)"
      onclick={() => layout.toggleInspector()}
      data-testid="toggle-inspector"
    >
      <span class="tool-icon">◨</span>
    </button>
    <button
      class="tool-btn"
      class:active={$zenMode}
      title="Modo Enfoque / Zen (F9 o Ctrl+\)"
      onclick={() => layout.toggleZenMode()}
      data-testid="toggle-zen"
    >
      <span class="tool-icon">🗖</span>
    </button>
    <button
      class="tool-btn"
      class:active={$showLayersPanel}
      title="Gestor de Capas (F4)"
      onclick={() => toggleLayersPanel()}
      data-testid="toggle-layers"
    >
      <span class="tool-icon">📑</span>
    </button>
  </div>
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 var(--space-4);
    gap: var(--space-2);
  }

  .tool-group { display: flex; align-items: center; gap: var(--space-1); }

  .flex-spacer { flex: 1; }

  .separator {
    width: var(--border-w);
    height: 20px;
    background: var(--border);
    margin: 0 var(--space-2);
  }

  .tool-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    padding: 0 var(--space-2);
    background: none;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: var(--text-md);
    cursor: pointer;
    transition: background var(--t-fast);
  }
  .tool-btn:hover    { background: var(--bg-hover); }
  .tool-btn:active   { background: var(--bg-active); }
  .tool-btn.active   { background: var(--accent); color: #ffffff; }
  .tool-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .tool-icon { line-height: 1; font-size: 13px; }
</style>